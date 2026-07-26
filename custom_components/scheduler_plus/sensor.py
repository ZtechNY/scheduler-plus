"""Sensor platform for Scheduler+.

Exposes one "next event" timestamp sensor per schedule, appearing and
disappearing live as schedules are created or deleted through the
websocket API.
"""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.const import EntityCategory
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_point_in_time

from . import SchedulerPlusConfigEntry
from .coordinator import SchedulerPlusCoordinator
from .entity import ScheduleEntity, async_setup_schedule_entities
from .scheduler import SchedulerEngine


class ScheduleNextEventSensor(ScheduleEntity, SensorEntity):
    """Shows the next upcoming on/off moment for a schedule.

    Unlike ScheduleEnabledBinarySensor, this value changes purely from
    wall-clock time passing, not just from schedule edits. It therefore
    schedules its own async_track_point_in_time callback to recompute and
    reschedule itself each time the current "next event" arrives.
    """

    _attr_translation_key = "schedule_next_event"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(
        self,
        coordinator: SchedulerPlusCoordinator,
        schedule_id: str,
        engine: SchedulerEngine,
    ) -> None:
        """Initialize the sensor for one schedule."""
        super().__init__(coordinator, schedule_id)
        self._engine = engine
        self._attr_unique_id = f"{schedule_id}_next_event"
        self._next_when: datetime | None = None
        self._next_action: str | None = None
        self._unsub_next: CALLBACK_TYPE | None = None

    @property
    def native_value(self) -> datetime | None:
        """Return the next event's datetime."""
        return self._next_when

    @property
    def extra_state_attributes(self) -> dict[str, str] | None:
        """Return whether the next event is an "on" or "off" action."""
        if self._next_action is None:
            return None
        return {"action": self._next_action}

    async def async_added_to_hass(self) -> None:
        """Start tracking the next event once the entity is registered."""
        await super().async_added_to_hass()
        await self._async_refresh_next_event()

    async def async_will_remove_from_hass(self) -> None:
        """Cancel any pending recompute callback."""
        self._cancel_next()
        await super().async_will_remove_from_hass()

    @callback
    def _handle_coordinator_update(self) -> None:
        """Recompute the next event whenever the schedule's data changes."""
        self.hass.async_create_task(self._async_refresh_next_event())

    async def _async_refresh_next_event(self) -> None:
        """Recompute the next event and schedule a callback to refresh again then."""
        self._cancel_next()

        schedule = self._get_schedule()
        if schedule is None:
            self._next_when = None
            self._next_action = None
            self.async_write_ha_state()
            return

        next_event = await self._engine.async_get_next_event(schedule)
        self._next_when, self._next_action = (
            next_event if next_event is not None else (None, None)
        )
        self.async_write_ha_state()

        if self._next_when is not None:
            self._unsub_next = async_track_point_in_time(
                self.hass, self._handle_next_event_time, self._next_when
            )

    async def _handle_next_event_time(self, _now: datetime) -> None:
        """Recompute once the previously-known next event arrives."""
        await self._async_refresh_next_event()

    def _cancel_next(self) -> None:
        """Cancel any pending recompute callback."""
        if self._unsub_next is not None:
            self._unsub_next()
            self._unsub_next = None


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SchedulerPlusConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Scheduler+ sensors for this config entry."""
    engine = entry.runtime_data.engine
    unsub = async_setup_schedule_entities(
        entry.runtime_data.coordinator,
        async_add_entities,
        lambda coordinator, schedule_id: ScheduleNextEventSensor(
            coordinator, schedule_id, engine
        ),
    )
    entry.async_on_unload(unsub)
