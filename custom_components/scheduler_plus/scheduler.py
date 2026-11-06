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

import asyncio
import json
import logging
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.core import CALLBACK_TYPE, Context, Event, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import (
    EventStateChangedData,
    async_call_later,
    async_track_point_in_time,
    async_track_state_change_event,
    async_track_time_change,
)
from homeassistant.helpers.start import async_at_started
from homeassistant.util import dt as dt_util

from .modes import schedule_allowed
from .const import DeviceType, EVENT_RULE_TRIGGERED
from .coordinator import SchedulerPlusCoordinator
from .day_conditions import DEFAULT_DAY_CONDITIONS, DayConditionRegistry
from .device_handlers import (
    DEFAULT_DEVICE_HANDLERS,
    DeviceHandler,
    DeviceHandlerRegistry,
)
from .issues import async_clear_missing_entity, async_report_missing_entity
from .models import Rule, RuleDateMode, Schedule, TimeSpec, Weekday
from .time_providers import (
    DEFAULT_TIME_PROVIDERS,
    TimeProvider,
    TimeProviderRegistry,
)

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

# How far ahead async_find_conflicts checks a recurring (ALWAYS/EXCLUDE) rule
# for overlaps with other schedules - a bounded preview, not an unbounded
# scan; see async_find_conflicts' own docstring for what this misses.
_DEFAULT_CONFLICT_LOOKAHEAD_DAYS = 14

# Cap on how many days of an INCLUDE rule's date_range get checked at once
# (see _dates_in_range, used by both _candidate_dates and
# _conflict_check_dates), so a long-running range (e.g. a 90-day summer
# window) doesn't resolve an unbounded number of dates in one pass.
_MAX_INCLUDE_RANGE_CHECK_DAYS = 31

# Upper bound on one device service call, so an unresponsive device can't
# hold up the action (or catch-up) behind it. A device handler can set its
# own (DeviceHandler.service_call_timeout), e.g. for cloud thermostats.
_SERVICE_CALL_TIMEOUT_SECONDS = 15

# How many device calls run at once per integration, unless the device
# handler sets its own (DeviceHandler.max_concurrent_calls). A startup
# catch-up or a busy minute can send dozens of calls together; most
# integrations only process one at a time (PARALLEL_UPDATES), and cloud
# services throttle bursts. Waiting for a slot does not count toward the
# call's timeout, so queued calls no longer time out before they start.
_MAX_CONCURRENT_CALLS_PER_INTEGRATION = 1

# A scheduled event that fails is retried (see _RETRY_DELAYS_MINUTES);
# the failure notification and error log wait until this many attempts
# have failed, so a blip a retry fixes a minute later leaves no notice.
_NOTIFY_AFTER_FAILED_ATTEMPTS = 3

# The startup catch-up runs once Home Assistant has started and again this
# long after, for devices whose integrations finish loading late.
_SECOND_STARTUP_PASS_DELAY_SECONDS = 60

# How far back a missed event still sets its entity's state on catch-up.
_CATCH_UP_HORIZON = timedelta(hours=24)

# How many days after its on time a window's off may be found, for an off
# time that doesn't exist on the on day itself (e.g. candle lighting to
# motzei Shabbos, up to a three-day Yom Tov + Shabbos block). Refreshes
# look back as far, so a window still open from then is caught up.
_MAX_WINDOW_DAYS = 3

# How long a fired event is remembered (see SchedulerEngine._fired); longer
# than any event a refresh compares against it.
_FIRED_EVENT_RETENTION = timedelta(days=_MAX_WINDOW_DAYS + 1)

# A failed on/off is retried after these many minutes, the last one
# repeating, until it succeeds, a newer event for its entity is sent, or
# _RETRY_GIVE_UP_AFTER has passed since the first failure.
_RETRY_DELAYS_MINUTES = (1, 2, 5, 10)
_RETRY_GIVE_UP_AFTER = timedelta(hours=6)

# How long a "time could not be resolved" warning is remembered, so each
# rule warns once per day.
_UNRESOLVED_WARNING_RETENTION = timedelta(days=_MAX_WINDOW_DAYS + 7)


@dataclass(slots=True, kw_only=True, frozen=True)
class _DueEvent:
    """One scheduled on/off for one entity whose moment has already passed.

    Collected by a refresh so the entity can be caught up to its most
    recent scheduled state - see SchedulerEngine._async_refresh_all.
    """

    when: datetime
    turning_on: bool
    rule: Rule
    schedule_name: str
    entity_id: str
    device_handler: DeviceHandler


@dataclass(slots=True, kw_only=True)
class _Retry:
    """An event being sent, or waiting to be sent again after a failure.

    `unsub` cancels the pending retry timer; it is None while an attempt
    is in flight.
    """

    event: _DueEvent
    unsub: CALLBACK_TYPE | None = None


@dataclass(slots=True, kw_only=True, frozen=True)
class ScheduleConflict:
    """One detected overlap between a candidate schedule's rule and another schedule's.

    A transient computed result (never persisted - unlike models.py's
    round-tripping domain shapes), returned by SchedulerEngine.async_find_
    conflicts and serialized to a plain dict by the websocket layer.

    `entity_ids` is the *schedule-level* entity intersection between the
    two schedules (entities live on Schedule, not per-rule) - so a
    conflict spanning three shared entities is one record listing all
    three, not three separate records, and fixing it (see websocket.py's
    check_schedule_conflicts docstring) resolves it for all of them at
    once.
    """

    entity_ids: tuple[str, ...]
    candidate_rule_id: str
    candidate_rule_name: str
    conflicting_schedule_id: str
    conflicting_schedule_name: str
    conflicting_rule_id: str
    conflicting_rule_name: str
    date: date
    candidate_on_at: datetime
    candidate_off_at: datetime
    conflicting_on_at: datetime
    conflicting_off_at: datetime
    fixable: bool


class SchedulerEngine:
    """Evaluates schedules and drives entities via device-handler plugins.

    Owns no persistent state of its own: schedule/rule data always comes
    from the coordinator, which the engine treats as read-only and
    re-reads on every refresh. Only the set of currently pending
    async_track_point_in_time callbacks - plus, for climate rules with
    override enforcement active, a per-entity state-change subscription
    and the context id of our own last service call to that entity - is
    engine-local state, so a refresh can safely cancel and replace it. The
    record of which scheduled events were already sent (for catch-up) is
    in-memory too, so a restart catches every device up again.
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
        # entity_id -> context id of our own most recent service call to it,
        # so override enforcement can recognize "that state change was us".
        self._last_self_context: dict[str, str] = {}
        # entity_id -> teardown for that entity's currently-armed override
        # enforcement (state-change subscription + any pending reapply
        # timer), if any rule with allow_override=False is in its window.
        self._active_enforcement: dict[str, CALLBACK_TYPE] = {}
        # entity_id -> when a currently-pending reapply timer will fire, for
        # entities with a manual change awaiting reversion right now - a
        # side channel onto the same timer _arm_override_enforcement already
        # tracks in `unsub_timer`, purely so callers like the websocket API
        # can answer "is this overridden right now, and when does it
        # revert" without reaching into that closure. Populated/cleared
        # alongside the real timer; see _arm_override_enforcement.
        self._pending_reapply_at: dict[str, datetime] = {}
        # Serializes refreshes: each one cancels and re-creates rule
        # callbacks across awaits, so two interleaved refreshes could leave
        # callbacks behind for a rule that has since been deleted.
        self._refresh_lock = asyncio.Lock()
        # (rule_id, entity_id, timestamp, turning_on) -> when, for every
        # scheduled event already sent, so a rescan never re-sends one.
        self._fired: dict[tuple[str, str, int, bool], datetime] = {}
        # rule_id -> serialized rule as last refreshed; a change re-arms
        # that rule's catch-up.
        self._rule_fingerprints: dict[str, str] = {}
        self._started = False
        self._unsub_started: CALLBACK_TYPE | None = None
        self._unsub_second_pass: CALLBACK_TYPE | None = None
        self._unsub_watched: CALLBACK_TYPE | None = None
        self._catch_up_tasks: set[asyncio.Task[None]] = set()
        # entity_id -> the event being sent to it until it succeeds; at most
        # one per entity, since a newer event supersedes it.
        self._retries: dict[str, _Retry] = {}
        # integration (entity platform) -> limit on concurrent device calls;
        # see _MAX_CONCURRENT_CALLS_PER_INTEGRATION.
        self._call_slots: dict[str, asyncio.Semaphore] = {}
        # (rule_id, date) already warned about as unresolvable.
        self._unresolved_warned: set[tuple[str, date]] = set()

    async def async_start(self) -> None:
        """Start the engine once Home Assistant has started.

        The first scan waits for EVENT_HOMEASSISTANT_STARTED (or runs now if
        Home Assistant is already running), so the devices it catches up
        exist by then, and runs once more a minute later for late ones.
        After that it rescans at every local midnight, whenever the
        coordinator's data changes (so websocket edits apply immediately),
        and whenever an entity a time provider or day condition reads
        changes state.
        """
        self._unsub_midnight = async_track_time_change(
            self.hass, self._async_handle_midnight, hour=0, minute=0, second=0
        )
        self._unsub_coordinator = self._coordinator.async_add_listener(
            self._handle_coordinator_update
        )
        watched = (
            self._time_providers.watched_entity_ids
            | self._day_conditions.watched_entity_ids
        )
        if watched:
            self._unsub_watched = async_track_state_change_event(
                self.hass, sorted(watched), self._handle_watched_entity_change
            )
        self._unsub_started = async_at_started(self.hass, self._async_handle_started)

    async def _async_handle_started(self, _hass: HomeAssistant) -> None:
        """Run the startup catch-up, then schedule the second one."""
        self._unsub_started = None
        self._started = True
        await self._async_refresh_all(startup=True)
        if self._started:  # not stopped while that ran
            self._unsub_second_pass = async_call_later(
                self.hass, _SECOND_STARTUP_PASS_DELAY_SECONDS, self._async_second_pass
            )

    async def _async_second_pass(self, _now: datetime) -> None:
        """Repeat the startup catch-up for devices that appeared late."""
        self._unsub_second_pass = None
        await self._async_refresh_all(startup=True)

    @callback
    def async_stop(self) -> None:
        """Stop the engine, cancelling all pending callbacks."""
        self._started = False
        for unsub_attr in (
            "_unsub_midnight",
            "_unsub_coordinator",
            "_unsub_started",
            "_unsub_second_pass",
            "_unsub_watched",
        ):
            if (unsub := getattr(self, unsub_attr)) is not None:
                unsub()
                setattr(self, unsub_attr, None)
        for task in self._catch_up_tasks:
            task.cancel()
        self._catch_up_tasks.clear()
        for entity_id in list(self._retries):
            self._cancel_retry(entity_id)
        for unsub_list in self._unsub_rules.values():
            for unsub in unsub_list:
                unsub()
        self._unsub_rules.clear()
        # Defensive: enforcement teardowns above already self-remove from
        # these dicts, so both should already be empty by this point.
        self._active_enforcement.clear()
        self._pending_reapply_at.clear()

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
                if not schedule.is_active_on(reference_date) or not self.mode_allows(schedule.id, reference_date):
                    continue
                candidates: list[tuple[datetime, str]] = []
                if rule.time_plan and rule.time_plan.get("enabled"):
                    transitions = await self._async_resolve_time_plan(
                        rule, reference_date
                    )
                    if transitions is None:
                        continue
                    candidates.extend(transitions)
                else:
                    occurrence = await self._async_resolve_occurrence(
                        rule, reference_date
                    )
                    if occurrence is None:
                        continue
                    on_at, off_at = occurrence
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

    def mode_allows(self, schedule_id: str, day: date) -> bool:
        """Whether modes allow an occurrence starting on this date."""
        return schedule_allowed(self._coordinator.data.get("modes", []), schedule_id, day)

    def pending_override_revert_at(self, entity_ids: Sequence[str]) -> datetime | None:
        """Soonest pending override-reapply time among `entity_ids`, if any.

        None when none of the given entities currently has a manual change
        awaiting reversion. Read-only, like async_get_next_event: reflects
        exactly what _arm_override_enforcement's _on_state_change/_reapply
        have recorded in `_pending_reapply_at`, with no resolution work of
        its own - so unlike async_get_next_event this needs no await.
        """
        pending = [
            self._pending_reapply_at[entity_id]
            for entity_id in entity_ids
            if entity_id in self._pending_reapply_at
        ]
        return min(pending) if pending else None

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
            or not self.mode_allows(schedule.id, reference_date)
            or not schedule.is_active_on(reference_date)
            or schedule.is_overridden(reference_date)
        ):
            return []

        events: list[tuple[Rule, datetime | None, datetime | None]] = []
        for rule in schedule.rules:
            if not rule.enabled:
                continue
            if rule.time_plan and rule.time_plan.get("enabled") and rule.time_plan.get(
                "periods"
            ):
                windows = await self._async_resolve_time_plan_windows(
                    rule, reference_date
                )
                for on_at, off_at in windows or []:
                    events.append(
                        (
                            rule,
                            on_at if rule.on_enabled else None,
                            off_at if rule.off_enabled else None,
                        )
                    )
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

    async def async_find_conflicts(
        self,
        candidate: Schedule,
        *,
        exclude_schedule_id: str | None = None,
        lookahead_days: int = _DEFAULT_CONFLICT_LOOKAHEAD_DAYS,
    ) -> list[ScheduleConflict]:
        """Find overlaps between `candidate`'s rules and OTHER schedules' rules.

        Read-only, like async_get_next_event/async_get_day_events - never
        schedules or fires anything, and never persists `candidate` itself
        (it may not even be saved yet - see websocket.py's
        check_schedule_conflicts, which calls this before create/update to
        preview conflicts). A conflict is a pair of rules (one from
        `candidate`, one from a *different*, enabled schedule) that target
        a shared entity and whose resolved on/off windows overlap on some
        checked date - candidate rules are never compared against each
        other (same-schedule conflicts are out of scope; the ask was
        cross-schedule specifically).

        Checked dates are bounded, not an unbounded future scan: INCLUDE-
        mode rules are checked on their own literal dates/date_ranges
        (ranges clamped to start no earlier than today and capped at
        _MAX_INCLUDE_RANGE_CHECK_DAYS days), ALWAYS/EXCLUDE-mode rules over
        the next `lookahead_days` days. This can miss a conflict that only
        manifests in a different season for a sunrise/sunset/YidCal-timed
        rule - an accepted scope limit for a preview, not a guarantee of
        "no conflicts ever". A YidCal-timed rule in particular will resolve
        to None for nearly every date beyond today regardless, since that
        plugin only ever confirms its own *current* state (see
        _candidate_dates' docstring) - not a limitation introduced here.
        """
        if not candidate.enabled:
            return []

        now = dt_util.now()
        today = now.date()
        others = [
            other
            for raw in self._coordinator.data["schedules"]
            if (other := Schedule.from_dict(raw)).id != candidate.id
            and other.id != exclude_schedule_id
            and other.enabled
        ]
        candidate_entities = set(candidate.entities)
        relevant_others = [
            other for other in others if candidate_entities & set(other.entities)
        ]
        if not relevant_others:
            return []

        conflicts: list[ScheduleConflict] = []
        for candidate_rule in candidate.rules:
            if not candidate_rule.enabled:
                continue
            for check_date in self._conflict_check_dates(
                candidate_rule, now, lookahead_days
            ):
                if not candidate.is_active_on(
                    check_date
                ) or candidate.is_overridden(check_date) or not self.mode_allows(candidate.id, check_date):
                    continue
                candidate_occurrence = await self._async_resolve_occurrence(
                    candidate_rule, check_date
                )
                if candidate_occurrence is None:
                    continue
                candidate_start, candidate_end = self._effective_window(
                    *candidate_occurrence,
                    candidate_rule.on_enabled,
                    candidate_rule.off_enabled,
                )

                for other in relevant_others:
                    if not other.is_active_on(
                        check_date
                    ) or other.is_overridden(check_date) or not self.mode_allows(other.id, check_date):
                        continue
                    entity_ids = tuple(
                        sorted(candidate_entities & set(other.entities))
                    )
                    for other_rule in other.rules:
                        if not other_rule.enabled:
                            continue
                        other_occurrence = await self._async_resolve_occurrence(
                            other_rule, check_date
                        )
                        if other_occurrence is None:
                            continue
                        other_start, other_end = self._effective_window(
                            *other_occurrence,
                            other_rule.on_enabled,
                            other_rule.off_enabled,
                        )
                        if not (
                            candidate_start < other_end
                            and other_start < candidate_end
                        ):
                            continue
                        conflicts.append(
                            ScheduleConflict(
                                entity_ids=entity_ids,
                                candidate_rule_id=candidate_rule.id,
                                candidate_rule_name=candidate_rule.name,
                                conflicting_schedule_id=other.id,
                                conflicting_schedule_name=other.name,
                                conflicting_rule_id=other_rule.id,
                                conflicting_rule_name=other_rule.name,
                                date=check_date,
                                candidate_on_at=candidate_occurrence[0],
                                candidate_off_at=candidate_occurrence[1],
                                conflicting_on_at=other_occurrence[0],
                                conflicting_off_at=other_occurrence[1],
                                fixable=self._is_exclusion_fixable(
                                    other_rule, check_date
                                ),
                            )
                        )

        return self._dedupe_conflicts(conflicts)

    @staticmethod
    def _dates_in_range(start_str: str, end_str: str, floor: date) -> list[date]:
        """Every day of [start, end] from `floor` onward, capped at _MAX_INCLUDE_RANGE_CHECK_DAYS.

        Shared by _candidate_dates and _conflict_check_dates - both need
        "which days of this date_ranges entry are still worth resolving",
        differing only in what `floor` means to each caller (yesterday vs.
        today). Naturally returns [] for a range that already ended before
        `floor`, so callers don't need a separate "already past" guard.
        """
        start = date.fromisoformat(start_str)
        end = date.fromisoformat(end_str)
        d = max(start, floor)
        result: list[date] = []
        count = 0
        while d <= end and count < _MAX_INCLUDE_RANGE_CHECK_DAYS:
            result.append(d)
            d += timedelta(days=1)
            count += 1
        return result

    @staticmethod
    def _conflict_check_dates(
        rule: Rule, now: datetime, lookahead_days: int
    ) -> list[date]:
        """Dates worth resolving `rule` against for async_find_conflicts.

        INCLUDE-mode: every literal date in `dates`, plus every day of each
        date_ranges entry (via _dates_in_range) - anchored to today, since a
        conflict preview only cares about the live remainder of an
        in-progress range, not days already past.

        ALWAYS/EXCLUDE-mode: the next `lookahead_days` days from today.
        """
        today = now.date()
        if rule.date_mode is RuleDateMode.INCLUDE:
            dates: set[date] = {
                d for raw in rule.dates if (d := date.fromisoformat(raw)) >= today
            }
            for start_str, end_str in rule.date_ranges:
                dates.update(
                    SchedulerEngine._dates_in_range(start_str, end_str, today)
                )
            return sorted(dates)
        return [(now + timedelta(days=offset)).date() for offset in range(lookahead_days)]

    @staticmethod
    def _effective_window(
        on_at: datetime, off_at: datetime, on_enabled: bool, off_enabled: bool
    ) -> tuple[datetime, datetime]:
        """A comparable (start, end) interval for overlap testing.

        `on_at`/`off_at` are always populated by _async_resolve_occurrence
        regardless of on_enabled/off_enabled - the disabled side's raw time
        is a meaningless leftover value, not a real boundary, so it can't
        be compared directly.

        Both enabled: the real window, unchanged.
        On-only: approximated as extending through the rest of that
        calendar day - the rule never turns the entity off, so its
        influence is genuinely open-ended; this is a bounded, documented
        approximation for a day-by-day preview, not an exact simulation
        (it won't detect the rule's effect carrying into a later checked
        day if that day's own on_at is later in the clock).
        Off-only: a momentary action, modeled as a ~1-minute window right
        at off_at, so the same overlap test naturally answers "does this
        off command land inside another rule's on-window".
        """
        if on_enabled and off_enabled:
            return on_at, off_at
        if on_enabled:
            midnight_after = on_at.replace(
                hour=0, minute=0, second=0, microsecond=0
            ) + timedelta(days=1)
            return on_at, midnight_after
        return off_at, off_at + timedelta(minutes=1)

    @staticmethod
    def _is_exclusion_fixable(rule: Rule, check_date: date) -> bool:
        """Whether `rule` can cleanly gain a date exclusion for `check_date`.

        ALWAYS: fixable only if there's no dormant date_ranges/day_conditions
        left over to reactivate alongside the new EXCLUDE - flipping the
        mode would otherwise silently exclude more than just this one date
        (see rule-editor-dialog.ts's mode-switch handling, which now clears
        these on transition to ALWAYS; this is a defensive backend check
        independent of whether the frontend ever produced messy data).
        EXCLUDE: always fixable - adding one more date is always safe.
        INCLUDE: only fixable if check_date is a literal `dates` entry with
        no *other* way the rule could still match that date (a date_ranges
        entry or a day_condition) - _matches_date_filter ORs all three, so
        removing it from `dates` alone wouldn't actually stop the rule from
        firing that day otherwise.
        """
        if rule.date_mode is RuleDateMode.ALWAYS:
            return not rule.date_ranges and not rule.day_conditions
        if rule.date_mode is RuleDateMode.EXCLUDE:
            return True
        if rule.day_conditions:
            return False
        date_str = check_date.isoformat()
        if date_str not in rule.dates:
            return False
        if any(start <= date_str <= end for start, end in rule.date_ranges):
            return False
        return True

    @staticmethod
    def _dedupe_conflicts(
        conflicts: list[ScheduleConflict],
    ) -> list[ScheduleConflict]:
        """Keep only the earliest-dated conflict per (candidate_rule, other_rule) pair.

        The same rule pair can conflict on multiple dates within the
        lookahead window (a recurring-vs-recurring overlap checked over 14
        days, say) - reporting every one of those would bury the single
        underlying conflict under repeats of itself.
        """
        best: dict[tuple[str, str], ScheduleConflict] = {}
        for conflict in conflicts:
            key = (conflict.candidate_rule_id, conflict.conflicting_rule_id)
            if key not in best or conflict.date < best[key].date:
                best[key] = conflict
        return sorted(
            best.values(), key=lambda c: (c.date, c.conflicting_schedule_name)
        )

    @staticmethod
    def _candidate_dates(rule: Rule, now: datetime) -> list[date]:
        """Reference dates worth resolving `rule` against for async_get_next_event.

        A RuleDateMode.INCLUDE rule can name a literal date (or a range)
        arbitrarily far in the future - a fixed day window could miss it
        entirely - so candidates are built directly from the rule's own
        `dates`/`date_ranges` instead, via _dates_in_range (every day of
        each range from yesterday onward, capped). Every day is checked,
        not just a range's first day: once "now" has moved past a range's
        start but is still inside it (a multi-day date_ranges entry, e.g. a
        4-day event), the first day's on/off has already passed and gets
        filtered out by async_get_next_event - if only that one day were
        offered as a candidate, the remaining in-progress days (including
        today/tomorrow) would never be considered, and the next real
        occurrence would be missed entirely in favor of a later range. If
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
                candidates.update(
                    SchedulerEngine._dates_in_range(start_str, end_str, yesterday)
                )
            if rule.day_conditions:
                candidates.add(now.date())
            return sorted(candidates)
        return [(now + timedelta(days=offset)).date() for offset in range(-1, 8)]

    @callback
    def _handle_coordinator_update(self) -> None:
        """Re-scan schedules whenever the coordinator's data changes.

        Changes before the startup scan are left to that scan.
        """
        if self._started:
            self.hass.async_create_task(self._async_refresh_all())

    @callback
    def _handle_watched_entity_change(self, event: Event[EventStateChangedData]) -> None:
        """Re-scan when a zman or calendar sensor changes value."""
        old_state = event.data["old_state"]
        new_state = event.data["new_state"]
        if not self._started or (
            old_state is not None
            and new_state is not None
            and old_state.state == new_state.state
        ):
            return
        self.hass.async_create_task(self._async_refresh_all())

    async def _async_handle_midnight(self, _now: datetime) -> None:
        """Re-scan schedules at local midnight, when daily times shift."""
        if self._started:
            await self._async_refresh_all()

    async def _async_refresh_all(self, *, startup: bool = False) -> None:
        """Recompute and reschedule every enabled, non-overridden rule in every schedule.

        Runs under _refresh_lock, so overlapping triggers (a burst of edits,
        an edit landing during the midnight scan) queue up rather than
        interleave - each pass then sees the latest data and cancels
        whatever the previous one scheduled.

        A schedule that's disabled or paused (Schedule.is_overridden) is
        never handed to _async_refresh_rule, so its rules' callbacks are
        cancelled explicitly here instead - _async_refresh_rule's own
        _cancel_rule call never runs for them otherwise, which would
        silently leave an already-scheduled on/off pending even though the
        schedule was just disabled or paused. The same applies to a schedule
        or rule removed from storage: it is not present in the loop below at
        all, so clean up any callback entry that is no longer represented by
        the coordinator data before refreshing the remaining rules. A stored
        schedule that fails to parse is logged and skipped, without stopping
        the others.

        Each entity is then caught up to its most recent scheduled event
        (on or off) - on `startup` unconditionally, otherwise only if that
        event hasn't already been sent. So a rescan never repeats an action
        and undoes a manual change, but an edited rule (whose fired events
        are forgotten), or an event that came due without its callback
        firing, still takes effect.
        """
        async with self._refresh_lock:
            await self._async_refresh_all_locked(startup)

    async def _async_refresh_all_locked(self, startup: bool) -> None:
        """Body of _async_refresh_all, run while holding _refresh_lock."""
        now = dt_util.now()
        today = now.date()
        schedules: list[Schedule] = []
        for raw_schedule in self._coordinator.data["schedules"]:
            try:
                schedules.append(Schedule.from_dict(raw_schedule))
            except Exception:  # noqa: BLE001 - isolate one bad stored schedule
                _LOGGER.exception(
                    "Skipping stored Scheduler+ schedule that could not be read: %r",
                    raw_schedule.get("name")
                    if isinstance(raw_schedule, dict)
                    else raw_schedule,
                )
        current_rule_ids = {
            rule.id for schedule in schedules for rule in schedule.rules
        }
        orphaned_rule_ids = set(self._unsub_rules) - current_rule_ids
        if orphaned_rule_ids:
            _LOGGER.debug(
                "Canceling callbacks for removed Scheduler+ rules: %s",
                sorted(orphaned_rule_ids),
            )
        for rule_id in orphaned_rule_ids:
            self._cancel_rule(rule_id)
        for rule_id in set(self._rule_fingerprints) - current_rule_ids:
            del self._rule_fingerprints[rule_id]
            self._forget_fired(rule_id)
            self._cancel_retries(rule_id)
        self._fired = {
            key: when
            for key, when in self._fired.items()
            if when > now - _FIRED_EVENT_RETENTION
        }
        self._unresolved_warned = {
            (rule_id, day)
            for rule_id, day in self._unresolved_warned
            if day > today - _UNRESOLVED_WARNING_RETENTION
        }

        due_by_entity: dict[str, list[_DueEvent]] = {}
        for schedule in schedules:
            if not schedule.enabled or schedule.is_overridden(today):
                for rule in schedule.rules:
                    self._cancel_rule(rule.id)
                continue

            for entity_id in schedule.entities:
                if self.hass.states.get(entity_id) is None:
                    async_report_missing_entity(
                        self.hass, entity_id, f"schedule '{schedule.name}'"
                    )
                else:
                    async_clear_missing_entity(self.hass, entity_id)

            for rule in schedule.rules:
                fingerprint = json.dumps(
                    [rule.to_dict(), schedule.entities], sort_keys=True, default=str
                )
                if self._rule_fingerprints.get(rule.id) != fingerprint:
                    self._rule_fingerprints[rule.id] = fingerprint
                    self._forget_fired(rule.id)
                    self._cancel_retries(rule.id)
                try:
                    due = await self._async_refresh_rule(
                        schedule, rule, now, catch_up=False
                    )
                except Exception:  # noqa: BLE001 - isolate one rule's failure
                    _LOGGER.exception(
                        "Failed to refresh rule '%s' in schedule '%s'",
                        rule.name,
                        schedule.name,
                    )
                    continue
                for event in due:
                    due_by_entity.setdefault(event.entity_id, []).append(event)

        for events in due_by_entity.values():
            latest = max(events, key=lambda event: event.when)
            if startup or not self._is_fired(latest):
                self._start_catch_up(latest)

    @staticmethod
    def _fired_key(
        rule_id: str, entity_id: str, when: datetime, turning_on: bool
    ) -> tuple[str, str, int, bool]:
        return (rule_id, entity_id, int(when.timestamp()), turning_on)

    def _mark_fired(
        self, rule_id: str, entity_id: str, when: datetime, turning_on: bool
    ) -> None:
        """Remember that a scheduled event was sent - see _async_refresh_all."""
        self._fired[self._fired_key(rule_id, entity_id, when, turning_on)] = when

    def _is_fired(self, event: _DueEvent) -> bool:
        """Whether `event` was sent, or is still being sent (see _async_send)."""
        key = self._fired_key(
            event.rule.id, event.entity_id, event.when, event.turning_on
        )
        retry = self._retries.get(event.entity_id)
        return key in self._fired or (
            retry is not None
            and self._fired_key(
                retry.event.rule.id,
                retry.event.entity_id,
                retry.event.when,
                retry.event.turning_on,
            )
            == key
        )

    def _forget_fired(self, rule_id: str) -> None:
        self._fired = {
            key: when for key, when in self._fired.items() if key[0] != rule_id
        }

    def _start_catch_up(self, event: _DueEvent) -> None:
        """Send a due event in the background, so a slow device holds up nothing else."""
        task = self.hass.async_create_background_task(
            self._async_send(event),
            name=f"Scheduler+ catch-up {event.entity_id}",
        )
        if not task.done():
            self._catch_up_tasks.add(task)
            task.add_done_callback(self._catch_up_tasks.discard)

    async def _async_send(
        self, event: _DueEvent, attempt: int = 0, first_failed: datetime | None = None
    ) -> None:
        """Send `event`, marking it fired once it succeeds or retrying it later.

        Sending supersedes any event still being retried for the same
        entity. A failure is retried after each of _RETRY_DELAYS_MINUTES
        (the last repeating) until _RETRY_GIVE_UP_AFTER has passed since
        the first failure. _cancel_retry stops it at any point.
        """
        self._cancel_retry(event.entity_id)
        retry = _Retry(event=event)
        self._retries[event.entity_id] = retry
        succeeded = await self._async_apply_due(
            event, report_failure=attempt + 1 >= _NOTIFY_AFTER_FAILED_ATTEMPTS
        )
        if self._retries.get(event.entity_id) is not retry:
            return  # cancelled or superseded while sending
        if succeeded:
            del self._retries[event.entity_id]
            self._mark_fired(
                event.rule.id, event.entity_id, event.when, event.turning_on
            )
            return

        now = dt_util.utcnow()
        first_failed = first_failed or now
        if now - first_failed >= _RETRY_GIVE_UP_AFTER:
            del self._retries[event.entity_id]
            self._mark_fired(
                event.rule.id, event.entity_id, event.when, event.turning_on
            )
            _LOGGER.error(
                "Giving up on rule '%s' turning %s %s after %s of failures",
                event.rule.name,
                "on" if event.turning_on else "off",
                event.entity_id,
                _RETRY_GIVE_UP_AFTER,
            )
            return

        delay = _RETRY_DELAYS_MINUTES[min(attempt, len(_RETRY_DELAYS_MINUTES) - 1)]

        async def _retry_now(_now: datetime) -> None:
            retry.unsub = None
            await self._async_send(event, attempt + 1, first_failed)

        retry.unsub = async_call_later(self.hass, delay * 60, _retry_now)

    def _cancel_retry(self, entity_id: str) -> None:
        """Stop sending (or retrying) the pending event for `entity_id`."""
        retry = self._retries.pop(entity_id, None)
        if retry is not None and retry.unsub is not None:
            retry.unsub()

    def _cancel_retries(self, rule_id: str) -> None:
        """Stop retrying every event of `rule_id`."""
        for entity_id, retry in list(self._retries.items()):
            if retry.event.rule.id == rule_id:
                self._cancel_retry(entity_id)

    async def _async_apply_due(
        self, event: _DueEvent, *, report_failure: bool = True
    ) -> bool:
        """Bring one entity to the state its due event would have set.

        Returns whether the device call succeeded. `report_failure` is
        passed to _issue_turn_on/_issue_turn_off.
        """
        rule = event.rule
        if event.turning_on:
            return await self._issue_turn_on(
                event.device_handler,
                event.entity_id,
                rule.action,
                rule=rule,
                schedule_name=event.schedule_name,
                report_failure=report_failure,
            )
        if rule.off_action is not None:
            return await self._issue_turn_on(
                event.device_handler,
                event.entity_id,
                rule.off_action,
                rule=rule,
                schedule_name=event.schedule_name,
                report_failure=report_failure,
            )
        return await self._issue_turn_off(
            event.device_handler,
            event.entity_id,
            rule=rule,
            schedule_name=event.schedule_name,
            report_failure=report_failure,
        )

    @staticmethod
    def _is_relevant_due(
        when: datetime, now: datetime, window_end: datetime | None
    ) -> bool:
        """Whether a past event still defines its entity's state for catch-up.

        Events in the last _CATCH_UP_HORIZON count - so an outage across
        midnight still catches up the evening's off - plus earlier events
        inside a window that is still open.
        """
        now_utc = dt_util.as_utc(now)
        return when > now_utc - _CATCH_UP_HORIZON or (
            window_end is not None and window_end > now_utc
        )

    def _catch_up_latest(self, due: list[_DueEvent]) -> None:
        """Send each entity's most recent event out of `due`."""
        latest: dict[str, _DueEvent] = {}
        for event in due:
            if (
                event.entity_id not in latest
                or event.when > latest[event.entity_id].when
            ):
                latest[event.entity_id] = event
        for event in latest.values():
            self._start_catch_up(event)

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
        *,
        catch_up: bool = True,
    ) -> list[_DueEvent]:
        """Cancel a rule's pending callbacks and reschedule its next occurrence(s).

        Returns the rule's events that are already due (see _is_relevant_due).
        With `catch_up`, each entity is also sent its latest one right away;
        _async_refresh_all passes False and decides across all rules itself.
        """
        self._cancel_rule(rule.id, retries=not rule.enabled)

        if not rule.enabled:
            return []

        if rule.time_plan and rule.time_plan.get("enabled"):
            due = await self._async_refresh_time_plan_rule(schedule, rule, now)
            if catch_up:
                self._catch_up_latest(due)
            return due

        unsub_list: list[CALLBACK_TYPE] = []
        due: list[_DueEvent] = []

        # Yesterday's occurrence can still matter: its events may be the
        # latest an entity missed (an outage across midnight), and an
        # overnight window may still be open. A window can run up to
        # _MAX_WINDOW_DAYS, so a rule with one looks back that far. Only
        # future events are ever scheduled, and _fired keeps rescans from
        # re-sending an older one.
        both_enabled = rule.on_enabled and rule.off_enabled
        # Moments are compared in UTC: two local times sharing a tzinfo
        # compare by wall clock, which misorders the repeated DST hour.
        now_utc = dt_util.as_utc(now)
        lookback = _MAX_WINDOW_DAYS if both_enabled else 1
        for days_ago in range(lookback, -1, -1):
            reference_date = (now - timedelta(days=days_ago)).date()
            if not schedule.is_active_on(reference_date) or not self.mode_allows(schedule.id, reference_date):
                continue
            occurrence = await self._async_resolve_occurrence(rule, reference_date)
            if occurrence is None:
                continue

            on_at, off_at = occurrence
            window_end = off_at if both_enabled else None

            for entity_id in schedule.entities:
                device_handler = self._handler_for_entity(entity_id)
                if device_handler is None:
                    _LOGGER.error(
                        "No device handler for entity '%s' in schedule '%s'",
                        entity_id,
                        schedule.name,
                    )
                    continue

                for enabled, turning_on, when in (
                    (rule.on_enabled, True, on_at),
                    (rule.off_enabled, False, off_at),
                ):
                    if not enabled:
                        continue
                    if when > now_utc:
                        unsub_list.append(
                            self._schedule_turn_on(
                                rule,
                                both_enabled,
                                device_handler,
                                entity_id,
                                rule.action,
                                when,
                                schedule.name,
                            )
                            if turning_on
                            else self._schedule_turn_off(
                                device_handler, entity_id, when, rule, schedule.name
                            )
                        )
                    elif self._is_relevant_due(when, now, window_end):
                        due.append(
                            _DueEvent(
                                when=when,
                                turning_on=turning_on,
                                rule=rule,
                                schedule_name=schedule.name,
                                entity_id=entity_id,
                                device_handler=device_handler,
                            )
                        )

                window_open = both_enabled and on_at <= now_utc < off_at
                if window_open and not rule.allow_override:
                    # Restarted/rescanned mid-window: keep enforcing it.
                    unsub_list.append(
                        self._arm_override_enforcement(
                            rule, entity_id, device_handler, schedule.name
                        )
                    )
                if rule.manual_auto_off_minutes and both_enabled and off_at > now_utc:
                    unsub_list.append(
                        self._schedule_manual_auto_off_window(
                            device_handler,
                            entity_id,
                            rule,
                            schedule.name,
                            on_at,
                            off_at,
                            rule.manual_auto_off_minutes,
                        )
                    )

        if unsub_list:
            self._unsub_rules[rule.id] = unsub_list
        if catch_up:
            self._catch_up_latest(due)
        return due

    async def _async_refresh_time_plan_rule(
        self, schedule: Schedule, rule: Rule, now: datetime
    ) -> list[_DueEvent]:
        """Schedule all transitions for a minute-based Time plan window.

        Returns the transitions already due, like _async_refresh_rule.
        """
        unsub_list: list[CALLBACK_TYPE] = []
        due: list[_DueEvent] = []
        now_utc = dt_util.as_utc(now)  # see _async_refresh_rule
        for days_ago in (1, 0):
            reference_date = (now - timedelta(days=days_ago)).date()
            if not schedule.is_active_on(reference_date) or not self.mode_allows(
                schedule.id, reference_date
            ):
                continue
            windows = await self._async_resolve_time_plan_windows(rule, reference_date)
            transitions = await self._async_resolve_time_plan(rule, reference_date)
            if not windows or not transitions:
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

                for when, action in transitions:
                    if when <= now_utc:
                        window_end = max(
                            (end for start, end in windows if start <= when),
                            default=None,
                        )
                        if self._is_relevant_due(when, now, window_end):
                            due.append(
                                _DueEvent(
                                    when=when,
                                    turning_on=action == "on",
                                    rule=rule,
                                    schedule_name=schedule.name,
                                    entity_id=entity_id,
                                    device_handler=device_handler,
                                )
                            )
                        continue
                    if action == "on":
                        unsub_list.append(
                            self._schedule_turn_on(
                                rule,
                                False,
                                device_handler,
                                entity_id,
                                rule.action,
                                when,
                                schedule.name,
                            )
                        )
                    else:
                        unsub_list.append(
                            self._schedule_turn_off(
                                device_handler, entity_id, when, rule, schedule.name
                            )
                        )

                if rule.manual_auto_off_minutes:
                    for start_at, end_at in windows:
                        if end_at > now_utc:
                            unsub_list.append(
                                self._schedule_manual_auto_off_window(
                                    device_handler,
                                    entity_id,
                                    rule,
                                    schedule.name,
                                    start_at,
                                    end_at,
                                    rule.manual_auto_off_minutes,
                                )
                            )

        if unsub_list:
            self._unsub_rules[rule.id] = unsub_list
        return due

    async def _async_resolve_occurrence(
        self, rule: Rule, reference_date: date, *, both_sides: bool = False
    ) -> tuple[datetime, datetime] | None:
        """Resolve a rule's on/off datetimes for `reference_date`.

        Returns None if the rule does not apply on that date, an enabled
        side's time could not be resolved, or a referenced plugin is not
        registered. Only enabled sides are resolved (unless `both_sides`):
        a disabled side's slot is filled with the enabled side's time, so an
        on-only rule never fails on an off time it doesn't use. If both
        sides are enabled and off resolves at or before on, this is an
        overnight rule and off is shifted to the following day.

        RuleDateMode.INCLUDE rules ignore `days` entirely - they fire only
        when _matches_date_filter matches (a listed date, or a day
        condition, e.g. "only on Shabbos"). ALWAYS/EXCLUDE rules follow
        `days` as always; EXCLUDE additionally skips a date matched by
        _matches_date_filter, letting a normally-recurring rule be
        overridden for a one-off date - or every Yom Tov - without touching
        the rule's regular days/times. Day conditions are judged at the
        occurrence's start (its on time, or off time for an off-only rule),
        and that one decision covers the whole occurrence, off included.
        """
        if rule.date_mode is not RuleDateMode.INCLUDE and (
            _WEEKDAY_BY_ISO_INDEX[reference_date.weekday()] not in rule.days
        ):
            return None

        resolve_on = rule.on_enabled or both_sides or not rule.off_enabled
        resolve_off = rule.off_enabled or both_sides or not rule.on_enabled
        try:
            on_provider = (
                self._time_providers.get(rule.on_time.provider) if resolve_on else None
            )
            off_provider = (
                self._time_providers.get(rule.off_time.provider) if resolve_off else None
            )
        except LookupError:
            _LOGGER.error("Rule '%s' uses an unsupported time provider", rule.name)
            return None

        on_at = (
            await on_provider.async_resolve(
                self.hass, reference_date, rule.on_time.params
            )
            if on_provider is not None
            else None
        )
        off_at = (
            await off_provider.async_resolve(
                self.hass, reference_date, rule.off_time.params
            )
            if off_provider is not None
            else None
        )

        shift_overnight = True
        if (
            rule.on_enabled
            and rule.off_enabled
            and on_at is not None
            and off_at is None
            and off_provider is not None
        ):
            # An off time that only exists on a later day (candle lighting
            # to motzei Shabbos): the window ends at its next occurrence.
            for days_ahead in range(1, _MAX_WINDOW_DAYS + 1):
                later = await off_provider.async_resolve(
                    self.hass,
                    reference_date + timedelta(days=days_ahead),
                    rule.off_time.params,
                )
                if later is not None and later > on_at:
                    off_at = later
                    shift_overnight = False
                    break

        if (resolve_on and on_at is None) or (resolve_off and off_at is None):
            await self._async_warn_unresolved(
                rule,
                reference_date,
                [
                    (side, provider, spec)
                    for side, provider, spec, resolved in (
                        ("on", on_provider, rule.on_time, on_at),
                        ("off", off_provider, rule.off_time, off_at),
                    )
                    if provider is not None and resolved is None
                ],
            )
            return None
        on_at = on_at or off_at
        off_at = off_at or on_at

        if shift_overnight and resolve_on and resolve_off and off_at <= on_at:
            off_at += timedelta(days=1)

        start = on_at if rule.on_enabled or not rule.off_enabled else off_at
        if rule.date_mode is RuleDateMode.INCLUDE:
            if not await self._matches_date_filter(rule, reference_date, start):
                return None
        elif rule.date_mode is RuleDateMode.EXCLUDE and await self._matches_date_filter(
            rule, reference_date, start
        ):
            return None

        return on_at, off_at

    async def _async_warn_unresolved(
        self,
        rule: Rule,
        reference_date: date,
        failed: list[tuple[str, TimeProvider, TimeSpec]],
    ) -> None:
        """Warn, once per rule per day, that a day the rule should run is skipped.

        Quiet when the time isn't expected that day anyway (see
        TimeProvider.expects_time) or the rule's date filter excludes it.
        """
        if not rule.enabled or (rule.id, reference_date) in self._unresolved_warned:
            return
        sides = [
            side
            for side, provider, spec in failed
            if provider.expects_time(self.hass, reference_date, spec.params)
        ]
        if not sides:
            return
        if rule.date_mode is not RuleDateMode.ALWAYS:
            matches = await self._matches_date_filter(rule, reference_date)
            if matches is (rule.date_mode is RuleDateMode.EXCLUDE):
                return
        self._unresolved_warned.add((rule.id, reference_date))
        _LOGGER.warning(
            "Rule '%s' should run on %s but its %s time could not be resolved; "
            "it will not run that day",
            rule.name,
            reference_date.isoformat(),
            " and ".join(sides),
        )

    async def _async_resolve_time_plan(
        self, rule: Rule, reference_date: date
    ) -> list[tuple[datetime, str]] | None:
        """Resolve a Time plan into (moment, action) transitions.

        New plans contain separate fixed-clock periods. The old duration
        shape is still understood for plans saved by v0.5.0.
        """
        windows = await self._async_resolve_time_plan_windows(rule, reference_date)
        if windows is None:
            return None
        plan = rule.time_plan or {}

        if plan.get("periods"):
            transitions: list[tuple[datetime, str]] = []
            for start_at, end_at in windows:
                transitions.extend(((start_at, "on"), (end_at, "off")))
            return sorted(transitions)

        start_at, end_at = windows[0]
        try:
            on_minutes = max(1, int(plan.get("on_minutes", 60)))
            off_minutes = max(1, int(plan.get("off_minutes", 60)))
        except (TypeError, ValueError):
            _LOGGER.error("Rule '%s' has invalid Time plan durations", rule.name)
            return None

        transitions: list[tuple[datetime, str]] = [(start_at, "on")]
        cursor = start_at
        action = "on"
        while True:
            duration = on_minutes if action == "on" else off_minutes
            next_at = cursor + timedelta(minutes=duration)
            if next_at >= end_at:
                # Keep the outer window boundary even when the regular
                # durations land in an off phase. The duplicate off is
                # harmless and ensures the manual auto-off listener and
                # previews use the real end of the window.
                if transitions[-1][0] < end_at:
                    transitions.append((end_at, "off"))
                break
            action = "off" if action == "on" else "on"
            transitions.append((next_at, action))
            cursor = next_at
        return transitions

    async def _async_resolve_time_plan_windows(
        self, rule: Rule, reference_date: date
    ) -> list[tuple[datetime, datetime]] | None:
        """Resolve a Time plan into independent start/end windows."""
        if not rule.time_plan or not rule.time_plan.get("enabled"):
            return None

        raw_periods = rule.time_plan.get("periods") or []
        if raw_periods:
            windows: list[tuple[datetime, datetime]] = []
            for period in raw_periods:
                try:
                    start_time = datetime.strptime(
                        str(period["start"]), "%H:%M"
                    ).time()
                    end_time = datetime.strptime(str(period["end"]), "%H:%M").time()
                except (KeyError, TypeError, ValueError):
                    _LOGGER.error("Rule '%s' has an invalid Time plan period", rule.name)
                    return None
                start_at = datetime.combine(
                    reference_date, start_time, tzinfo=dt_util.DEFAULT_TIME_ZONE
                )
                end_at = datetime.combine(
                    reference_date, end_time, tzinfo=dt_util.DEFAULT_TIME_ZONE
                )
                if end_at <= start_at:
                    end_at += timedelta(days=1)
                windows.append((start_at, end_at))
            windows.sort()
            if rule.date_mode is not RuleDateMode.INCLUDE and (
                _WEEKDAY_BY_ISO_INDEX[reference_date.weekday()] not in rule.days
            ):
                return None
            # Like _async_resolve_occurrence: judged once, at the plan's start.
            matches = await self._matches_date_filter(
                rule, reference_date, windows[0][0] if windows else None
            )
            if (rule.date_mode is RuleDateMode.INCLUDE and not matches) or (
                rule.date_mode is RuleDateMode.EXCLUDE and matches
            ):
                return None
            return windows

        occurrence = await self._async_resolve_occurrence(
            rule, reference_date, both_sides=True
        )
        return [occurrence] if occurrence is not None else None

    async def _matches_date_filter(
        self, rule: Rule, reference_date: date, start: datetime | None = None
    ) -> bool:
        """Return whether `reference_date` matches rule.dates/date_ranges/day_conditions.

        `start` is the occurrence's start, for day conditions that depend on
        the time of day (see DayCondition.async_check_at).

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
            if await condition.async_check_at(self.hass, reference_date, start):
                return True

        return False

    async def _issue_turn_on(
        self,
        device_handler: DeviceHandler,
        entity_id: str,
        action: dict[str, Any],
        *,
        rule: Rule,
        schedule_name: str,
        report_failure: bool = True,
    ) -> bool:
        """Call async_turn_on with a fresh Context, remembered for override detection.

        Each service call goes through _async_call_device (a per-integration
        concurrency slot, then a timeout); a timeout is reported like any
        other failure. Returns whether every call succeeded. With
        `report_failure` False (an early attempt that will be retried), a
        failure is only logged as a one-line warning.

        Every turn-on the engine itself performs goes through here (never
        device_handler.async_turn_on directly), so _arm_override_enforcement
        can always recognize a resulting state_changed event as "us" via
        the context id, regardless of which code path issued it. Also fires
        EVENT_RULE_TRIGGERED under that same context before dispatching -
        see _fire_rule_triggered.
        """
        context = Context()
        self._last_self_context[entity_id] = context.id
        self._fire_rule_triggered(
            entity_id, rule, schedule_name, turning_on=True, context=context
        )
        try:
            for action_item in (rule.actions or [action]):
                await self._async_call_device(
                    device_handler,
                    entity_id,
                    lambda item=action_item: device_handler.async_turn_on(
                        self.hass, entity_id, item, context=context
                    ),
                )
        except Exception as err:
            self._report_action_failure(
                entity_id, rule, schedule_name, "on", err, report_failure
            )
            return False
        return True

    async def _issue_turn_off(
        self,
        device_handler: DeviceHandler,
        entity_id: str,
        *,
        rule: Rule,
        schedule_name: str,
        report_failure: bool = True,
    ) -> bool:
        """Call async_turn_off with a fresh Context - see _issue_turn_on."""
        context = Context()
        self._last_self_context[entity_id] = context.id
        self._fire_rule_triggered(
            entity_id, rule, schedule_name, turning_on=False, context=context
        )
        try:
            await self._async_call_device(
                device_handler,
                entity_id,
                lambda: device_handler.async_turn_off(
                    self.hass, entity_id, context=context
                ),
            )
        except Exception as err:
            self._report_action_failure(
                entity_id, rule, schedule_name, "off", err, report_failure
            )
            return False
        return True

    def _call_slot(
        self, device_handler: DeviceHandler, entity_id: str
    ) -> asyncio.Semaphore:
        """Return the concurrency limit shared by `entity_id`'s integration.

        Keyed by the entity registry's platform (e.g. "honeywell", "lutron"),
        so a slow cloud integration never holds up calls to another one;
        entities not in the registry share a limit per domain.
        """
        entry = er.async_get(self.hass).async_get(entity_id)
        key = entry.platform if entry is not None else entity_id.split(".", 1)[0]
        slot = self._call_slots.get(key)
        if slot is None:
            slot = self._call_slots[key] = asyncio.Semaphore(
                getattr(device_handler, "max_concurrent_calls", None)
                or _MAX_CONCURRENT_CALLS_PER_INTEGRATION
            )
        return slot

    async def _async_call_device(
        self,
        device_handler: DeviceHandler,
        entity_id: str,
        call: Callable[[], Awaitable[None]],
    ) -> None:
        """Run one device call in its integration's slot, bounded by a timeout.

        The timeout starts once the slot is acquired, so time spent queued
        behind other calls to the same integration never counts against it.
        """
        timeout = (
            getattr(device_handler, "service_call_timeout", None)
            or _SERVICE_CALL_TIMEOUT_SECONDS
        )
        async with self._call_slot(device_handler, entity_id):
            async with asyncio.timeout(timeout):
                await call()

    def _report_action_failure(
        self,
        entity_id: str,
        rule: Rule,
        schedule_name: str,
        action: str,
        error: Exception,
        report_failure: bool,
    ) -> None:
        """Notify about a failure, or just log a warning if it will be retried."""
        if report_failure:
            self._notify_action_failure(entity_id, rule, schedule_name, action, error)
            return
        _LOGGER.warning(
            "Schedule '%s', rule '%s': %s action failed for %s (%s); will retry",
            schedule_name,
            rule.name,
            action,
            entity_id,
            str(error).strip() or type(error).__name__,
        )

    def _notify_action_failure(
        self,
        entity_id: str,
        rule: Rule,
        schedule_name: str,
        action: str,
        error: Exception,
    ) -> None:
        """Keep a dismissible failure notice without interrupting other devices.

        Repeated failures replace the same rule/device notice. Successful
        calls do not dismiss it: users should still know a prior action failed.
        Cancellation is deliberately not caught by the dispatch wrappers.
        """
        detail = str(error).strip() or type(error).__name__
        _LOGGER.exception(
            "Schedule '%s', rule '%s': %s action failed for %s: %s",
            schedule_name, rule.name, action, entity_id, detail,
        )
        persistent_notification.async_create(
            self.hass,
            f"Schedule: {schedule_name}\n\n"
            f"Rule: {rule.name}\n\n"
            f"Device: {entity_id}\n\n"
            f"Action: {action}\n\n"
            f"Time: {dt_util.now().isoformat(timespec='seconds')}\n\n"
            f"Error: {detail}\n\n"
            "The device action did not complete successfully. "
            "Check the device's current state. This notice records a past "
            "failure and stays until you dismiss it.",
            title="Scheduler+: device action failed",
            notification_id=f"scheduler_plus_action_failed_{rule.id}_{entity_id}",
        )

    def _fire_rule_triggered(
        self,
        entity_id: str,
        rule: Rule,
        schedule_name: str,
        *,
        turning_on: bool,
        context: Context,
    ) -> None:
        """Fire EVENT_RULE_TRIGGERED under `context`, for logbook.py to describe.

        `context` is the same Context object about to be passed to the
        light/switch/climate service call - sharing it is what lets Home
        Assistant's Logbook link the entity's own "turned on/off" entry back
        to this event and show it as the cause, rather than the change
        looking like it came from nowhere.
        """
        self.hass.bus.async_fire(
            EVENT_RULE_TRIGGERED,
            {
                "entity_id": entity_id,
                "rule_id": rule.id,
                "rule_name": rule.name,
                "schedule_name": schedule_name,
                "turning_on": turning_on,
            },
            context=context,
        )

    def _schedule_turn_on(
        self,
        rule: Rule,
        both_enabled: bool,
        device_handler: DeviceHandler,
        entity_id: str,
        action: dict[str, Any],
        when: datetime,
        schedule_name: str,
    ) -> CALLBACK_TYPE:
        """Schedule a single turn-on call at `when`.

        If the on-call succeeds and this rule has override enforcement
        active (both_enabled and not rule.allow_override), arms it -
        folded into _unsub_rules[rule.id] by key rather than by closure
        reference, so it's torn down correctly by _cancel_rule regardless
        of exactly when this fires relative to the refresh that scheduled
        it.
        """

        async def _fire(_now: datetime) -> None:
            # `action` is always rule.action, which _async_apply_due sends.
            await self._async_send(
                _DueEvent(
                    when=when,
                    turning_on=True,
                    rule=rule,
                    schedule_name=schedule_name,
                    entity_id=entity_id,
                    device_handler=device_handler,
                )
            )
            if both_enabled and not rule.allow_override:
                teardown = self._arm_override_enforcement(
                    rule, entity_id, device_handler, schedule_name
                )
                self._unsub_rules.setdefault(rule.id, []).append(teardown)

        return async_track_point_in_time(self.hass, _fire, when)

    def _schedule_turn_off(
        self,
        device_handler: DeviceHandler,
        entity_id: str,
        when: datetime,
        rule: Rule,
        schedule_name: str,
    ) -> CALLBACK_TYPE:
        """Schedule a single turn-off (or eco-setback) call at `when`.

        When `rule.off_action` is set, off_time applies that action (via
        async_turn_on) instead of actually turning the entity off - see
        Rule.off_action's docstring. This is otherwise identical to a plain
        off: no enforcement is armed for a setback window, same as a plain
        off never has been.

        Disarms any override enforcement for this entity once this fires -
        essential, not optional: otherwise the state-change listener would
        outlive the window, and a legitimate later change (e.g. someone
        turning heat back on that evening) would be wrongly treated as an
        override needing reversion to a stale setpoint.
        """

        async def _fire(_now: datetime) -> None:
            await self._async_send(
                _DueEvent(
                    when=when,
                    turning_on=False,
                    rule=rule,
                    schedule_name=schedule_name,
                    entity_id=entity_id,
                    device_handler=device_handler,
                )
            )
            teardown = self._active_enforcement.get(entity_id)
            if teardown is not None:
                teardown()

        return async_track_point_in_time(self.hass, _fire, when)

    def _schedule_manual_auto_off_window(
        self,
        device_handler: DeviceHandler,
        entity_id: str,
        rule: Rule,
        schedule_name: str,
        start_at: datetime,
        end_at: datetime,
        minutes: int,
    ) -> CALLBACK_TYPE:
        """Watch a rule window and arm a timer for manual light turn-ons."""
        active_teardown: CALLBACK_TYPE | None = None
        start_unsub: CALLBACK_TYPE | None = None
        end_unsub: CALLBACK_TYPE | None = None
        torn_down = False

        @callback
        def _arm(_now: datetime | None = None) -> None:
            nonlocal active_teardown, end_unsub
            if torn_down or active_teardown is not None:
                return
            active_teardown = self._arm_manual_auto_off(
                device_handler, entity_id, rule, schedule_name, minutes
            )
            end_unsub = async_track_point_in_time(self.hass, _end, end_at)

        @callback
        def _end(_now: datetime) -> None:
            nonlocal active_teardown
            if active_teardown is not None:
                active_teardown()
                active_teardown = None

        if start_at <= dt_util.now() < end_at:
            _arm()
        elif start_at > dt_util.now():
            start_unsub = async_track_point_in_time(self.hass, _arm, start_at)

        @callback
        def _teardown() -> None:
            nonlocal torn_down, active_teardown, start_unsub, end_unsub
            if torn_down:
                return
            torn_down = True
            if start_unsub is not None:
                start_unsub()
                start_unsub = None
            if end_unsub is not None:
                end_unsub()
                end_unsub = None
            if active_teardown is not None:
                active_teardown()
                active_teardown = None

        return _teardown

    def _arm_manual_auto_off(
        self,
        device_handler: DeviceHandler,
        entity_id: str,
        rule: Rule,
        schedule_name: str,
        minutes: int,
    ) -> CALLBACK_TYPE:
        """Arm a manual-only delayed off listener for one rule/entity pair."""
        pending_timer: CALLBACK_TYPE | None = None
        torn_down = False

        @callback
        def _cancel_timer() -> None:
            nonlocal pending_timer
            if pending_timer is not None:
                pending_timer()
                pending_timer = None

        async def _turn_off(_now: datetime) -> None:
            nonlocal pending_timer
            pending_timer = None
            await self._issue_turn_off(
                device_handler, entity_id, rule=rule, schedule_name=schedule_name
            )

        @callback
        def _on_state_change(event: Event[EventStateChangedData]) -> None:
            nonlocal pending_timer
            if event.context.id == self._last_self_context.get(entity_id):
                return
            old_state = event.data.get("old_state")
            new_state = event.data.get("new_state")
            if new_state is None:
                return
            _cancel_timer()
            if new_state.state == "on" and (
                old_state is None or old_state.state != "on"
            ):
                pending_timer = async_call_later(
                    self.hass, max(1, minutes) * 60, _turn_off
                )

        unsub_state = async_track_state_change_event(
            self.hass, entity_id, _on_state_change
        )

        @callback
        def _teardown() -> None:
            nonlocal torn_down
            if torn_down:
                return
            torn_down = True
            unsub_state()
            _cancel_timer()

        return _teardown

    def _arm_override_enforcement(
        self, rule: Rule, entity_id: str, device_handler: DeviceHandler, schedule_name: str
    ) -> CALLBACK_TYPE:
        """Watch `entity_id` for manual overrides during `rule`'s on-window.

        A genuine external change (not caused by our own last service
        call, and not already matching rule.action) arms a debounced
        reapply timer sized by rule.override_grace_minutes - reset on each
        further external change. If the entity still doesn't match
        rule.action when the timer elapses, it's reapplied.

        Tears down any enforcement already active for this entity first,
        so arming again (e.g. a second overlapping rule on the same
        entity, or a re-triggered catch-up) never leaks the previous
        subscription - "last rule to arm wins" for enforcement, matching
        the engine's existing "last writer wins" semantics for the actual
        device state in that scenario.

        A restart/reload mid-grace-period loses the pending timer (this is
        all in-memory, like everything else _unsub_rules tracks); if `now`
        is still inside the window on the next refresh, the catch-up
        branch re-fires and re-arms a fresh grace period rather than
        resuming the old countdown - consistent with the engine's existing
        restart behavior for on/off, just extended to enforcement.
        """
        if (existing := self._active_enforcement.get(entity_id)) is not None:
            existing()

        unsub_timer: CALLBACK_TYPE | None = None

        def _cancel_pending_reapply() -> None:
            nonlocal unsub_timer
            if unsub_timer is not None:
                unsub_timer()
                unsub_timer = None
            self._pending_reapply_at.pop(entity_id, None)

        async def _reapply(_now: datetime) -> None:
            nonlocal unsub_timer
            unsub_timer = None
            self._pending_reapply_at.pop(entity_id, None)
            if device_handler.matches_action(self.hass, entity_id, rule.action):
                return
            await self._issue_turn_on(
                device_handler,
                entity_id,
                rule.action,
                rule=rule,
                schedule_name=schedule_name,
            )

        @callback
        def _on_state_change(event: Event[EventStateChangedData]) -> None:
            nonlocal unsub_timer
            if event.context.id == self._last_self_context.get(entity_id):
                return  # our own call, not a manual override
            if device_handler.matches_action(self.hass, entity_id, rule.action):
                return  # already matches - nothing to correct
            _cancel_pending_reapply()
            grace = timedelta(minutes=rule.override_grace_minutes)
            self._pending_reapply_at[entity_id] = dt_util.now() + grace
            unsub_timer = async_call_later(self.hass, grace.total_seconds(), _reapply)

        unsub_state = async_track_state_change_event(
            self.hass, entity_id, _on_state_change
        )
        torn_down = False

        @callback
        def _teardown() -> None:
            nonlocal torn_down
            # Off-time or a replacement rule can disarm this listener before
            # the original rule's next refresh calls its saved teardown again.
            if torn_down:
                return
            torn_down = True
            unsub_state()
            _cancel_pending_reapply()
            if self._active_enforcement.get(entity_id) is _teardown:
                del self._active_enforcement[entity_id]

        self._active_enforcement[entity_id] = _teardown
        return _teardown

    def _cancel_rule(self, rule_id: str, *, retries: bool = True) -> None:
        """Cancel any callbacks previously scheduled for `rule_id`.

        Pending retries go too, unless `retries` is False - as when a
        refresh merely reschedules the rule, which must not drop a failed
        event still being retried.
        """
        for unsub in self._unsub_rules.pop(rule_id, []):
            unsub()
        if retries:
            self._cancel_retries(rule_id)
