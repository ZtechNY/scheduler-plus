"""Binary sensor platform for Scheduler+.

Exposes one binary_sensor per schedule reflecting whether it is enabled,
appearing and disappearing live as schedules are created or deleted
through the websocket API.
"""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from . import SchedulerPlusConfigEntry
from .coordinator import SchedulerPlusCoordinator
from .entity import ScheduleEntity, async_setup_schedule_entities


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


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SchedulerPlusConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Scheduler+ binary sensors for this config entry."""
    unsub = async_setup_schedule_entities(
        entry.runtime_data.coordinator,
        async_add_entities,
        lambda coordinator, schedule_id: ScheduleEnabledBinarySensor(
            coordinator, schedule_id
        ),
    )
    entry.async_on_unload(unsub)
