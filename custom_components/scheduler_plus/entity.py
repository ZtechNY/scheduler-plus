"""Shared entity infrastructure for Scheduler+ platforms.

Both sensor.py and binary_sensor.py expose one entity per schedule and need
to react live as schedules are created or deleted through the websocket
API. This module holds that "one entity per schedule, added and removed
dynamically as the coordinator's data changes" logic once, so neither
platform has to duplicate it.
"""

from __future__ import annotations

from collections.abc import Callable

from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import SchedulerPlusCoordinator
from .models import Schedule


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
    known_ids: set[str] = set()
    entities: dict[str, Entity] = {}

    @callback
    def _sync() -> None:
        current_ids = {raw["id"] for raw in coordinator.data["schedules"]}

        new_ids = list(current_ids - known_ids)
        if new_ids:
            new_entities = [
                entity_factory(coordinator, schedule_id) for schedule_id in new_ids
            ]
            entities.update(zip(new_ids, new_entities, strict=True))
            known_ids.update(new_ids)
            async_add_entities(new_entities)

        removed_ids = known_ids - current_ids
        for schedule_id in removed_ids:
            removed_entity = entities.pop(schedule_id)
            coordinator.hass.async_create_task(removed_entity.async_remove())
        known_ids.difference_update(removed_ids)

    unsub = coordinator.async_add_listener(_sync)
    _sync()
    return unsub
