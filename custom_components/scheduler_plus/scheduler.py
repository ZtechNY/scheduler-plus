"""Scheduling engine for Scheduler+.

Resolves each enabled Rule's on/off times for the current day (and, for
overnight rules, the previous day) via the TimeProviderRegistry, schedules
Home Assistant callbacks to fire at those moments, and dispatches the
resulting on/off actions to the appropriate DeviceHandler. This module has
no knowledge of what a "light" or "climate" entity is beyond the
DeviceType key used to look up its handler - all device- and time-specific
behavior lives behind the two plugin registries.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.event import (
    async_track_point_in_time,
    async_track_time_change,
)
from homeassistant.util import dt as dt_util

from .coordinator import SchedulerPlusCoordinator
from .device_handlers import (
    DEFAULT_DEVICE_HANDLERS,
    DeviceHandler,
    DeviceHandlerRegistry,
)
from .models import Rule, Schedule, Weekday
from .time_providers import DEFAULT_TIME_PROVIDERS, TimeProviderRegistry

_LOGGER = logging.getLogger(__name__)

# Index i holds the Weekday for date.weekday() == i (0 = Monday ... 6 = Sunday).
_WEEKDAY_BY_ISO_INDEX: tuple[Weekday, ...] = (
    Weekday.MONDAY,
    Weekday.TUESDAY,
    Weekday.WEDNESDAY,
    Weekday.THURSDAY,
    Weekday.FRIDAY,
    Weekday.SATURDAY,
    Weekday.SUNDAY,
)


class SchedulerEngine:
    """Evaluates schedules and drives entities via device-handler plugins.

    Owns no persistent state of its own: schedule/rule data always comes
    from the coordinator, which the engine treats as read-only and
    re-reads on every refresh. Only the set of currently pending
    async_track_point_in_time callbacks is engine-local state, so a
    refresh can safely cancel and replace it.
    """

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: SchedulerPlusCoordinator,
        *,
        time_providers: TimeProviderRegistry = DEFAULT_TIME_PROVIDERS,
        device_handlers: DeviceHandlerRegistry = DEFAULT_DEVICE_HANDLERS,
    ) -> None:
        """Initialize the engine.

        `time_providers`/`device_handlers` default to the production
        registries but can be overridden, so the engine can be unit tested
        with fake plugins instead of real sun calculations or service
        calls.
        """
        self.hass = hass
        self._coordinator = coordinator
        self._time_providers = time_providers
        self._device_handlers = device_handlers
        self._unsub_rules: dict[str, list[CALLBACK_TYPE]] = {}
        self._unsub_midnight: CALLBACK_TYPE | None = None
        self._unsub_coordinator: CALLBACK_TYPE | None = None

    async def async_start(self) -> None:
        """Start the engine: scan now, then rescan at every local midnight.

        Also rescans whenever the coordinator's data changes, so schedule
        edits made through the websocket API take effect immediately.
        """
        self._unsub_midnight = async_track_time_change(
            self.hass, self._async_handle_midnight, hour=0, minute=0, second=0
        )
        self._unsub_coordinator = self._coordinator.async_add_listener(
            self._handle_coordinator_update
        )
        await self._async_refresh_all()

    @callback
    def async_stop(self) -> None:
        """Stop the engine, cancelling all pending callbacks."""
        if self._unsub_midnight is not None:
            self._unsub_midnight()
            self._unsub_midnight = None
        if self._unsub_coordinator is not None:
            self._unsub_coordinator()
            self._unsub_coordinator = None
        for unsub_list in self._unsub_rules.values():
            for unsub in unsub_list:
                unsub()
        self._unsub_rules.clear()

    async def async_get_next_event(
        self, schedule: Schedule
    ) -> tuple[datetime, str] | None:
        """Return the soonest upcoming (when, "on" | "off") for `schedule`.

        Read-only: reuses _async_resolve_occurrence but never schedules or
        fires anything. Returns None if the schedule is disabled, has no
        enabled rules, or none of them resolve to a future occurrence.

        Unlike _async_refresh_all (which only ever needs today and
        yesterday, since it re-runs every midnight to pick up each new
        day), this looks from yesterday through 7 days ahead - enough to
        guarantee checking every day-of-week at least once, so a rule
        that e.g. only runs on Saturdays still reports its next occurrence
        instead of appearing to have none just because today isn't Saturday.
        """
        if not schedule.enabled:
            return None

        now = dt_util.now()
        soonest: tuple[datetime, str] | None = None

        for rule in schedule.rules:
            if not rule.enabled:
                continue

            for days_offset in range(-1, 8):
                reference_date = (now + timedelta(days=days_offset)).date()
                occurrence = await self._async_resolve_occurrence(
                    rule, reference_date
                )
                if occurrence is None:
                    continue

                on_at, off_at = occurrence
                for when, label in ((on_at, "on"), (off_at, "off")):
                    if when <= now:
                        continue
                    if soonest is None or when < soonest[0]:
                        soonest = (when, label)

        return soonest

    @callback
    def _handle_coordinator_update(self) -> None:
        """Re-scan schedules whenever the coordinator's data changes."""
        self.hass.async_create_task(self._async_refresh_all())

    async def _async_handle_midnight(self, _now: datetime) -> None:
        """Re-scan schedules at local midnight, when daily times shift."""
        await self._async_refresh_all()

    async def _async_refresh_all(self) -> None:
        """Recompute and reschedule every enabled rule in every enabled schedule."""
        now = dt_util.now()
        for raw_schedule in self._coordinator.data["schedules"]:
            schedule = Schedule.from_dict(raw_schedule)
            if not schedule.enabled:
                continue

            try:
                device_handler = self._device_handlers.get(schedule.device_type)
            except LookupError:
                _LOGGER.error(
                    "Schedule '%s' uses unsupported device type '%s'",
                    schedule.name,
                    schedule.device_type.value,
                )
                continue

            for rule in schedule.rules:
                try:
                    await self._async_refresh_rule(
                        schedule, rule, device_handler, now
                    )
                except Exception:  # noqa: BLE001 - isolate one rule's failure
                    _LOGGER.exception(
                        "Failed to refresh rule '%s' in schedule '%s'",
                        rule.name,
                        schedule.name,
                    )

    async def _async_refresh_rule(
        self,
        schedule: Schedule,
        rule: Rule,
        device_handler: DeviceHandler,
        now: datetime,
    ) -> None:
        """Cancel a rule's pending callbacks and reschedule its next occurrence(s)."""
        self._cancel_rule(rule.id)

        if not rule.enabled:
            return

        unsub_list: list[CALLBACK_TYPE] = []

        # An overnight rule that started yesterday can still be active right
        # now, so both yesterday's and today's occurrences are candidates.
        for days_ago in (1, 0):
            reference_date = (now - timedelta(days=days_ago)).date()
            occurrence = await self._async_resolve_occurrence(rule, reference_date)
            if occurrence is None:
                continue

            on_at, off_at = occurrence
            if off_at <= now:
                continue

            for entity_id in schedule.entities:
                if on_at <= now:
                    # Restarted/reloaded mid-window: catch the device up now.
                    # Caught broadly and isolated per entity (e.g. an entity
                    # still unavailable right after HA startup) so one
                    # failure can't abort scheduling for other entities,
                    # rules, or schedules in the same refresh pass.
                    try:
                        await device_handler.async_turn_on(
                            self.hass, entity_id, rule.action
                        )
                    except Exception:  # noqa: BLE001
                        _LOGGER.exception(
                            "Failed to catch up '%s' to on for rule '%s'",
                            entity_id,
                            rule.name,
                        )
                else:
                    unsub_list.append(
                        self._schedule_turn_on(
                            device_handler, entity_id, rule.action, on_at
                        )
                    )
                unsub_list.append(
                    self._schedule_turn_off(device_handler, entity_id, off_at)
                )

        if unsub_list:
            self._unsub_rules[rule.id] = unsub_list

    async def _async_resolve_occurrence(
        self, rule: Rule, reference_date: date
    ) -> tuple[datetime, datetime] | None:
        """Resolve a rule's on/off datetimes for `reference_date`.

        Returns None if the rule does not apply on that date, either time
        could not be resolved, or a referenced plugin is not registered. If
        off resolves to a clock time at or before on, this is an overnight
        rule and off is shifted to the following day.
        """
        if _WEEKDAY_BY_ISO_INDEX[reference_date.weekday()] not in rule.days:
            return None

        try:
            on_provider = self._time_providers.get(rule.on_time.provider)
            off_provider = self._time_providers.get(rule.off_time.provider)
        except LookupError:
            _LOGGER.error("Rule '%s' uses an unsupported time provider", rule.name)
            return None

        on_at = await on_provider.async_resolve(
            self.hass, reference_date, rule.on_time.params
        )
        off_at = await off_provider.async_resolve(
            self.hass, reference_date, rule.off_time.params
        )

        if on_at is None or off_at is None:
            return None

        if off_at <= on_at:
            off_at += timedelta(days=1)

        return on_at, off_at

    def _schedule_turn_on(
        self,
        device_handler: DeviceHandler,
        entity_id: str,
        action: dict[str, Any],
        when: datetime,
    ) -> CALLBACK_TYPE:
        """Schedule a single turn-on call at `when`."""

        async def _fire(_now: datetime) -> None:
            await device_handler.async_turn_on(self.hass, entity_id, action)

        return async_track_point_in_time(self.hass, _fire, when)

    def _schedule_turn_off(
        self, device_handler: DeviceHandler, entity_id: str, when: datetime
    ) -> CALLBACK_TYPE:
        """Schedule a single turn-off call at `when`."""

        async def _fire(_now: datetime) -> None:
            await device_handler.async_turn_off(self.hass, entity_id)

        return async_track_point_in_time(self.hass, _fire, when)

    def _cancel_rule(self, rule_id: str) -> None:
        """Cancel any callbacks previously scheduled for `rule_id`."""
        for unsub in self._unsub_rules.pop(rule_id, []):
            unsub()
