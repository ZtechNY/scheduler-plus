"""Shared entity infrastructure for Scheduler+ platforms.

sensor.py and binary_sensor.py expose one entity per schedule, and
binary_sensor.py additionally exposes one per operating mode. All of them
need to react live as schedules and modes are created or deleted through
the websocket API. This module holds that "one entity per record, added
and removed dynamically as the coordinator's data changes" logic once, so
no platform has to duplicate it.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import date
from typing import Any

from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import SchedulerPlusCoordinator
from .models import Schedule
from .modes import mode_active
from .storage import SchedulerPlusStoreData


class ScheduleEntity(CoordinatorEntity[SchedulerPlusCoordinator]):
    """Base class for entities that represent a single schedule.

    Each schedule is exposed as its own Home Assistant device (via
    device_info below), with its diagnostic entities (enabled, next event,
    ...) grouped underneath it, rather than as flat entities with manually
    concatenated names.
    """

    _attr_has_entity_name = True

    def __init__(
        self, coordinator: SchedulerPlusCoordinator, schedule_id: str
    ) -> None:
        """Initialize with the id of the schedule this entity represents."""
        super().__init__(coordinator)
        self.schedule_id = schedule_id

    def _get_schedule(self) -> Schedule | None:
        """Return the current Schedule this entity represents, if it still exists."""
        for raw in self.coordinator.data["schedules"]:
            if raw["id"] == self.schedule_id:
                return Schedule.from_dict(raw)
        return None

    @property
    def available(self) -> bool:
        """Become unavailable once the schedule has been deleted.

        Guards the brief window between a schedule's deletion (which
        updates coordinator data synchronously) and the owning platform
        actually removing this entity (an async operation).
        """
        return super().available and self._get_schedule() is not None

    @property
    def device_info(self) -> DeviceInfo | None:
        """Group this entity under a device representing its schedule."""
        schedule = self._get_schedule()
        if schedule is None:
            return None
        return DeviceInfo(
            identifiers={(DOMAIN, self.schedule_id)},
            name=schedule.name,
            manufacturer="Scheduler+",
            entry_type=DeviceEntryType.SERVICE,
        )


class ModeEntity(CoordinatorEntity[SchedulerPlusCoordinator]):
    """Base class for entities that represent a single operating mode.

    Modes get their own device, like schedules do, so "No school" reads as
    one thing in the UI with its state underneath it rather than as a
    loose entity named after a concatenation.
    """

    _attr_has_entity_name = True

    def __init__(
        self, coordinator: SchedulerPlusCoordinator, mode_id: str
    ) -> None:
        """Initialize with the id of the mode this entity represents."""
        super().__init__(coordinator)
        self.mode_id = mode_id

    def _get_mode(self) -> dict[str, Any] | None:
        """Return the current mode this entity represents, if it still exists."""
        for mode in self.coordinator.data.get("modes", []):
            if mode["id"] == self.mode_id:
                return mode
        return None

    def _is_active(self, day: date) -> bool | None:
        """Whether this mode is on for `day`, or None once it's been deleted."""
        mode = self._get_mode()
        return None if mode is None else mode_active(mode, day)

    @property
    def available(self) -> bool:
        """Become unavailable once the mode has been deleted."""
        return super().available and self._get_mode() is not None

    @property
    def device_info(self) -> DeviceInfo | None:
        """Group this entity under a device representing its mode."""
        mode = self._get_mode()
        if mode is None:
            return None
        return DeviceInfo(
            identifiers={(DOMAIN, f"mode_{self.mode_id}")},
            name=mode["name"],
            manufacturer="Scheduler+",
            model="Operating mode",
            entry_type=DeviceEntryType.SERVICE,
        )


def async_setup_mode_entities(
    coordinator: SchedulerPlusCoordinator,
    async_add_entities: AddEntitiesCallback,
    entity_factory: Callable[[SchedulerPlusCoordinator, str], Entity],
) -> Callable[[], None]:
    """Create one entity per mode via `entity_factory`, live-tracking changes.

    The mode equivalent of async_setup_schedule_entities, and identical in
    shape - modes are created and deleted through the same coordinator
    updates schedules are.
    """
    return _async_setup_keyed_entities(
        coordinator,
        async_add_entities,
        entity_factory,
        lambda data: {mode["id"] for mode in data.get("modes", [])},
    )


def async_setup_schedule_entities(
    coordinator: SchedulerPlusCoordinator,
    async_add_entities: AddEntitiesCallback,
    entity_factory: Callable[[SchedulerPlusCoordinator, str], Entity],
) -> Callable[[], None]:
    """Create one entity per schedule via `entity_factory`, live-tracking changes.

    Adds entities for schedules that appear after setup and removes
    entities for schedules that are deleted, reacting to the same
    coordinator updates the SchedulerEngine reacts to. Returns an unsub
    callable; the caller is responsible for passing it to
    entry.async_on_unload().
    """
    return _async_setup_keyed_entities(
        coordinator,
        async_add_entities,
        entity_factory,
        lambda data: {raw["id"] for raw in data["schedules"]},
    )


def _async_setup_keyed_entities(
    coordinator: SchedulerPlusCoordinator,
    async_add_entities: AddEntitiesCallback,
    entity_factory: Callable[[SchedulerPlusCoordinator, str], Entity],
    current_ids: Callable[[SchedulerPlusStoreData], set[str]],
) -> Callable[[], None]:
    """Add/remove one entity per id returned by `current_ids`, live.

    Shared by schedules and modes: both are lists of id-keyed dicts in the
    same coordinator payload, and both need entities that appear and
    disappear as those lists change.
    """
    known_ids: set[str] = set()
    entities: dict[str, Entity] = {}

    @callback
    def _sync() -> None:
        ids = current_ids(coordinator.data)

        new_ids = list(ids - known_ids)
        if new_ids:
            new_entities = [entity_factory(coordinator, key) for key in new_ids]
            entities.update(zip(new_ids, new_entities, strict=True))
            known_ids.update(new_ids)
            async_add_entities(new_entities)

        removed_ids = known_ids - ids
        for key in removed_ids:
            removed_entity = entities.pop(key)
            coordinator.hass.async_create_task(removed_entity.async_remove())
        known_ids.difference_update(removed_ids)

    unsub = coordinator.async_add_listener(_sync)
    _sync()
    return unsub
