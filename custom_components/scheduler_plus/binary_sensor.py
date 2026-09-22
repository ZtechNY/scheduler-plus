"""Binary sensor platform for Scheduler+.

Exposes one binary_sensor per schedule reflecting whether it is enabled,
and one per operating mode reflecting whether that mode is on today. Both
appear and disappear live as schedules and modes are created or deleted
through the websocket API.

The mode sensors are what make modes usable outside the card: an
automation can wait on binary_sensor.no_school, a template can read it,
and every toggle lands in the logbook and in history.
"""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.const import EntityCategory
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from . import SchedulerPlusConfigEntry
from .coordinator import SchedulerPlusCoordinator
from .entity import (
    ModeEntity,
    ScheduleEntity,
    async_setup_mode_entities,
    async_setup_schedule_entities,
)


class ScheduleEnabledBinarySensor(ScheduleEntity, BinarySensorEntity):
    """Reflects whether a schedule is currently enabled."""

    _attr_translation_key = "schedule_enabled"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(
        self, coordinator: SchedulerPlusCoordinator, schedule_id: str
    ) -> None:
        """Initialize the binary sensor for one schedule."""
        super().__init__(coordinator, schedule_id)
        self._attr_unique_id = f"{schedule_id}_enabled"

    @property
    def is_on(self) -> bool | None:
        """Return whether the schedule is currently enabled and not paused."""
        schedule = self._get_schedule()
        if schedule is None:
            return None
        return schedule.enabled and not schedule.is_overridden(dt_util.now().date())


class ModeActiveBinarySensor(ModeEntity, BinarySensorEntity):
    """Reflects whether an operating mode is on today.

    Unlike ScheduleEnabledBinarySensor, this value changes from wall-clock
    time passing as well as from edits: a mode that repeats on Fridays
    turns itself on and off at midnight with nothing written to storage.
    It therefore tracks local midnight in addition to coordinator updates.
    """

    _attr_translation_key = "mode_active"

    def __init__(
        self, coordinator: SchedulerPlusCoordinator, mode_id: str
    ) -> None:
        """Initialize the binary sensor for one mode."""
        super().__init__(coordinator, mode_id)
        self._attr_unique_id = f"mode_{mode_id}_active"
        self._unsub_midnight: CALLBACK_TYPE | None = None

    @property
    def is_on(self) -> bool | None:
        """Return whether this mode is on for today."""
        return self._is_active(dt_util.now().date())

    @property
    def extra_state_attributes(self) -> dict[str, object] | None:
        """Expose why the mode is on, and what it does while it is.

        Templates and automations get at the same three facts the card
        shows - whether today was chosen explicitly or came from the
        weekly repeat, and which schedules this mode runs or skips.
        """
        mode = self._get_mode()
        if mode is None:
            return None
        today = dt_util.now().date().isoformat()
        return {
            "source": "date" if today in mode.get("dates", {}) else "weekly",
            "weekdays": mode.get("weekdays", []),
            "run_schedules": mode.get("run_schedules", []),
            "skip_schedules": mode.get("skip_schedules", []),
        }

    async def async_added_to_hass(self) -> None:
        """Start tracking local midnight once the entity is registered."""
        await super().async_added_to_hass()
        self._unsub_midnight = async_track_time_change(
            self.hass, self._handle_midnight, hour=0, minute=0, second=0
        )

    async def async_will_remove_from_hass(self) -> None:
        """Stop tracking midnight."""
        if self._unsub_midnight is not None:
            self._unsub_midnight()
            self._unsub_midnight = None
        await super().async_will_remove_from_hass()

    @callback
    def _handle_midnight(self, _now: datetime) -> None:
        """Re-evaluate at local midnight, when "today" changes underneath us."""
        self.async_write_ha_state()


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SchedulerPlusConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Scheduler+ binary sensors for this config entry."""
    coordinator = entry.runtime_data.coordinator
    entry.async_on_unload(
        async_setup_schedule_entities(
            coordinator,
            async_add_entities,
            lambda coordinator, schedule_id: ScheduleEnabledBinarySensor(
                coordinator, schedule_id
            ),
        )
    )
    entry.async_on_unload(
        async_setup_mode_entities(
            coordinator,
            async_add_entities,
            lambda coordinator, mode_id: ModeActiveBinarySensor(coordinator, mode_id),
        )
    )
