"""Scheduling engine for Scheduler+.

Resolves each enabled Rule's on/off times for the current day (and, for
overnight rules, the previous day) via the TimeProviderRegistry, schedules
Home Assistant callbacks to fire at those moments, and dispatches the
resulting on/off actions to the appropriate DeviceHandler. This module has
no knowledge of what a "light" or "climate" entity is beyond each entity's
own domain being used to look up its handler - all device- and time-
specific behavior lives behind the two plugin registries.

Device-handler dispatch is resolved per *entity* (_handler_for_entity),
not once per schedule: a DeviceType.LIGHT_SWITCH schedule mixes light.*
and switch.* entities together, and light.turn_on/switch.turn_on are not
interchangeable services, so each entity needs its own handler lookup
based on its actual domain.
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

from .const import DeviceType
from .coordinator import SchedulerPlusCoordinator
from .day_conditions import DEFAULT_DAY_CONDITIONS, DayConditionRegistry
from .device_handlers import (
    DEFAULT_DEVICE_HANDLERS,
    DeviceHandler,
    DeviceHandlerRegistry,
)
from .models import Rule, RuleDateMode, Schedule, Weekday
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
        day_conditions: DayConditionRegistry = DEFAULT_DAY_CONDITIONS,
    ) -> None:
        """Initialize the engine.

        `time_providers`/`device_handlers`/`day_conditions` default to the
        production registries but can be overridden, so the engine can be
        unit tested with fake plugins instead of real sun calculations,
        service calls, or YidCal sensor state.
        """
        self.hass = hass
        self._coordinator = coordinator
        self._time_providers = time_providers
        self._device_handlers = device_handlers
        self._day_conditions = day_conditions
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
        day), this needs to look further ahead to answer "what's next" -
        see _candidate_dates for how far, which depends on the rule's
        RuleDateMode.
        """
        now = dt_util.now()
        if not schedule.enabled or schedule.is_overridden(now.date()):
            return None

        soonest: tuple[datetime, str] | None = None

        for rule in schedule.rules:
            if not rule.enabled:
                continue

            for reference_date in self._candidate_dates(rule, now):
                if not schedule.is_active_on(reference_date):
                    continue
                occurrence = await self._async_resolve_occurrence(
                    rule, reference_date
                )
                if occurrence is None:
                    continue

                on_at, off_at = occurrence
                candidates: list[tuple[datetime, str]] = []
                if rule.on_enabled:
                    candidates.append((on_at, "on"))
                if rule.off_enabled:
                    candidates.append((off_at, "off"))
                for when, label in candidates:
                    if when <= now:
                        continue
                    if soonest is None or when < soonest[0]:
                        soonest = (when, label)

        return soonest

    async def async_get_day_events(
        self, schedule: Schedule, reference_date: date
    ) -> list[tuple[Rule, datetime | None, datetime | None]]:
        """Return (rule, on_at, off_at) for every enabled rule firing on `reference_date`.

        Read-only, like async_get_next_event - resolves without scheduling
        or firing anything. Powers the card's read-only day-agenda report:
        unlike the engine's own scheduling decisions, this only ever
        resolves exactly the requested date, not yesterday/tomorrow - a
        report for a specific day should show exactly that day's
        occurrences, not an overnight rule's bookkeeping window.

        on_at/off_at are None when the corresponding side is disabled
        (rule.on_enabled/off_enabled) - an on-only or off-only rule only
        ever reports the side it actually acts on.
        """
        if (
            not schedule.enabled
            or not schedule.is_active_on(reference_date)
            or schedule.is_overridden(reference_date)
        ):
            return []

        events: list[tuple[Rule, datetime | None, datetime | None]] = []
        for rule in schedule.rules:
            if not rule.enabled:
                continue
            occurrence = await self._async_resolve_occurrence(rule, reference_date)
            if occurrence is not None:
                on_at, off_at = occurrence
                events.append(
                    (
                        rule,
                        on_at if rule.on_enabled else None,
                        off_at if rule.off_enabled else None,
                    )
                )
        return events

    @staticmethod
    def _candidate_dates(rule: Rule, now: datetime) -> list[date]:
        """Reference dates worth resolving `rule` against for async_get_next_event.

        A RuleDateMode.INCLUDE rule can name a literal date (or a range)
        arbitrarily far in the future - a fixed day window could miss it
        entirely - so candidates are built directly from the rule's own
        `dates`/`date_ranges` instead. For a range, only its earliest
        not-yet-past day is needed: whatever on/off times resolve for that
        day are necessarily the range's soonest occurrence, so there's no
        need to enumerate every day in a (potentially very long) range. If
        the rule also has day_conditions, today is added too: a
        day-condition's current-state-only sensor (see DayCondition) can
        only ever confirm *today*, so that's the furthest such a rule can
        be previewed, even though it will still fire correctly on some
        future date once that date actually arrives.

        Weekday-recurring rules (ALWAYS/EXCLUDE) only need yesterday
        through 7 days ahead: enough to guarantee hitting every day-of-week
        at least once, so e.g. a Saturday-only rule still reports its next
        occurrence even when today isn't Saturday.
        """
        if rule.date_mode is RuleDateMode.INCLUDE:
            yesterday = (now - timedelta(days=1)).date()
            candidates = {
                d for raw in rule.dates if (d := date.fromisoformat(raw)) >= yesterday
            }
            for start_str, end_str in rule.date_ranges:
                end = date.fromisoformat(end_str)
                if end < yesterday:
                    continue
                candidates.add(max(date.fromisoformat(start_str), yesterday))
            if rule.day_conditions:
                candidates.add(now.date())
            return sorted(candidates)
        return [(now + timedelta(days=offset)).date() for offset in range(-1, 8)]

    @callback
    def _handle_coordinator_update(self) -> None:
        """Re-scan schedules whenever the coordinator's data changes."""
        self.hass.async_create_task(self._async_refresh_all())

    async def _async_handle_midnight(self, _now: datetime) -> None:
        """Re-scan schedules at local midnight, when daily times shift."""
        await self._async_refresh_all()

    async def _async_refresh_all(self) -> None:
        """Recompute and reschedule every enabled, non-overridden rule in every schedule.

        A schedule that's disabled or paused (Schedule.is_overridden) is
        never handed to _async_refresh_rule, so its rules' callbacks are
        cancelled explicitly here instead - _async_refresh_rule's own
        _cancel_rule call never runs for them otherwise, which would
        silently leave an already-scheduled on/off pending even though the
        schedule was just disabled or paused.
        """
        now = dt_util.now()
        today = now.date()
        for raw_schedule in self._coordinator.data["schedules"]:
            schedule = Schedule.from_dict(raw_schedule)
            if not schedule.enabled or schedule.is_overridden(today):
                for rule in schedule.rules:
                    self._cancel_rule(rule.id)
                continue

            for rule in schedule.rules:
                try:
                    await self._async_refresh_rule(schedule, rule, now)
                except Exception:  # noqa: BLE001 - isolate one rule's failure
                    _LOGGER.exception(
                        "Failed to refresh rule '%s' in schedule '%s'",
                        rule.name,
                        schedule.name,
                    )

    def _handler_for_entity(self, entity_id: str) -> DeviceHandler | None:
        """Return the device handler for `entity_id`, based on its own domain.

        Resolved per entity rather than once per schedule, so a
        DeviceType.LIGHT_SWITCH schedule can mix light.* and switch.*
        entities and still dispatch each one to the right service. Returns
        None (logged by the caller) if the entity's domain has no
        registered handler - e.g. stale data referencing a since-removed
        device type, since normal validation at the websocket boundary
        already prevents this for newly saved schedules.
        """
        domain = entity_id.split(".", 1)[0]
        try:
            device_type = DeviceType(domain)
        except ValueError:
            return None
        try:
            return self._device_handlers.get(device_type)
        except LookupError:
            return None

    async def _async_refresh_rule(
        self,
        schedule: Schedule,
        rule: Rule,
        now: datetime,
    ) -> None:
        """Cancel a rule's pending callbacks and reschedule its next occurrence(s)."""
        self._cancel_rule(rule.id)

        if not rule.enabled:
            return

        unsub_list: list[CALLBACK_TYPE] = []

        # An overnight rule that started yesterday can still be active right
        # now, so both yesterday's and today's occurrences are candidates -
        # but only when the rule has a genuine on->off window. An on-only
        # or off-only rule has no window to carry over: it's a same-day
        # fire-and-forget action, so only today is ever considered (this
        # also avoids re-firing off a stale "yesterday" occurrence on every
        # refresh, since there's no off/on boundary to close it out).
        both_enabled = rule.on_enabled and rule.off_enabled
        for days_ago in (1, 0) if both_enabled else (0,):
            reference_date = (now - timedelta(days=days_ago)).date()
            if not schedule.is_active_on(reference_date):
                continue
            occurrence = await self._async_resolve_occurrence(rule, reference_date)
            if occurrence is None:
                continue

            on_at, off_at = occurrence
            if rule.off_enabled and off_at <= now:
                continue

            for entity_id in schedule.entities:
                device_handler = self._handler_for_entity(entity_id)
                if device_handler is None:
                    _LOGGER.error(
                        "No device handler for entity '%s' in schedule '%s'",
                        entity_id,
                        schedule.name,
                    )
                    continue

                if rule.on_enabled:
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
                if rule.off_enabled:
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

        RuleDateMode.INCLUDE rules ignore `days` entirely - they fire only
        when _matches_date_filter matches (a listed date, or a currently-
        true day condition, e.g. "only on Shabbos"). ALWAYS/EXCLUDE rules
        follow `days` as always; EXCLUDE additionally skips a date matched
        by _matches_date_filter, letting a normally-recurring rule be
        overridden for a one-off date - or every Yom Tov - without
        touching the rule's regular days/times.
        """
        if rule.date_mode is RuleDateMode.INCLUDE:
            if not await self._matches_date_filter(rule, reference_date):
                return None
        else:
            if _WEEKDAY_BY_ISO_INDEX[reference_date.weekday()] not in rule.days:
                return None
            if rule.date_mode is RuleDateMode.EXCLUDE and await self._matches_date_filter(
                rule, reference_date
            ):
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

    async def _matches_date_filter(self, rule: Rule, reference_date: date) -> bool:
        """Return whether `reference_date` matches rule.dates/date_ranges/day_conditions.

        All three are combined with OR: a rule can mix a literal blackout
        date, a vacation date range, and e.g. "every Yom Tov", and any one
        of them alone is enough to match. date_ranges are stored as
        "YYYY-MM-DD" string pairs, which sort identically to their actual
        dates, so a plain string comparison is enough - no need to parse
        `reference_date` back and forth.
        """
        date_str = reference_date.isoformat()

        if date_str in rule.dates:
            return True

        if any(start <= date_str <= end for start, end in rule.date_ranges):
            return True

        for condition_type in rule.day_conditions:
            try:
                condition = self._day_conditions.get(condition_type)
            except LookupError:
                _LOGGER.error(
                    "Rule '%s' uses an unsupported day condition '%s'",
                    rule.name,
                    condition_type.value,
                )
                continue
            if await condition.async_check(self.hass, reference_date):
                return True

        return False

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
