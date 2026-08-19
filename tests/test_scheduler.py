"""Unit tests for the Scheduler+ scheduling engine.

Exercises SchedulerEngine's occurrence-resolution logic (weekday matching,
overnight-rule shifting, unresolvable/unregistered plugin handling) and its
catch-up decision (immediate turn-on vs scheduled turn-on) directly, using
fake/HA-independent plugins instead of real sun calculations or service
calls. async_start() is never invoked here: firing scheduled callbacks at
the right wall-clock time is Home Assistant's own tested machinery, not
logic Scheduler+ needs to re-verify. _async_refresh_rule's explicit `now`
parameter is used instead to control "the current time" deterministically,
without mocking the global clock.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import date, datetime, timedelta
from typing import Any

import math

import pytest
from homeassistant.const import ATTR_TEMPERATURE
from homeassistant.core import Context, Event, HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.scheduler_plus.const import (
    DayConditionType,
    DeviceType,
    EVENT_RULE_TRIGGERED,
    TimeProviderType,
)
from custom_components.scheduler_plus.coordinator import SchedulerPlusCoordinator
from custom_components.scheduler_plus.day_conditions.base import (
    DayCondition,
    DayConditionRegistry,
)
from custom_components.scheduler_plus.device_handlers.base import (
    DeviceHandler,
    DeviceHandlerRegistry,
)
from custom_components.scheduler_plus.models import (
    Rule,
    RuleDateMode,
    Schedule,
    TimeSpec,
    Weekday,
)
from custom_components.scheduler_plus.scheduler import SchedulerEngine
from custom_components.scheduler_plus.storage import SchedulerPlusStore
from custom_components.scheduler_plus.time_providers.base import (
    TimeProvider,
    TimeProviderRegistry,
)
from custom_components.scheduler_plus.time_providers.fixed import FixedTimeProvider

# A known Monday, used as a deterministic reference date throughout.
_MONDAY = date(2024, 1, 1)


class UnresolvableTimeProvider(TimeProvider):
    """A time provider that never resolves, simulating e.g. a missing astral event."""

    async def async_resolve(
        self, hass: HomeAssistant, reference_date: date, params: dict[str, Any]
    ) -> datetime | None:
        """Always report the time as unresolvable."""
        return None


class FakeDayCondition(DayCondition):
    """A day condition that matches only one fixed date, for deterministic tests."""

    def __init__(self, matches_date: date) -> None:
        """Initialize with the single date this condition considers a match."""
        self._matches_date = matches_date

    async def async_check(self, hass: HomeAssistant, reference_date: date) -> bool:
        """Match only the fixed date this instance was built with."""
        return reference_date == self._matches_date


class FakeDeviceHandler(DeviceHandler):
    """A device handler recording calls instead of touching real entities."""

    def __init__(self) -> None:
        """Initialize with empty call logs."""
        self.turn_on_calls: list[tuple[str, dict[str, Any]]] = []
        self.turn_off_calls: list[str] = []

    async def async_turn_on(
        self,
        hass: HomeAssistant,
        entity_id: str,
        action: dict[str, Any],
        context: Context | None = None,
    ) -> None:
        """Record the call instead of applying it."""
        self.turn_on_calls.append((entity_id, action))

    async def async_turn_off(
        self, hass: HomeAssistant, entity_id: str, context: Context | None = None
    ) -> None:
        """Record the call instead of applying it."""
        self.turn_off_calls.append(entity_id)

    def matches_action(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> bool:
        """Not exercised by any test using this fake - always report a match."""
        return True


class FakeClimateDeviceHandler(DeviceHandler):
    """A climate device handler that reflects calls into real hass.states.

    Unlike FakeDeviceHandler (which only records calls), override
    enforcement tests need hass.states.get(entity_id) to actually reflect
    what was last applied, since matches_action reads real state - this
    writes a real state for the entity on every call (carrying `context`
    through, exactly like the real ClimateDeviceHandler), and delegates
    matches_action to the same comparison logic.
    """

    def __init__(self) -> None:
        """Initialize with empty call logs."""
        self.turn_on_calls: list[tuple[str, dict[str, Any]]] = []
        self.turn_off_calls: list[str] = []

    async def async_turn_on(
        self,
        hass: HomeAssistant,
        entity_id: str,
        action: dict[str, Any],
        context: Context | None = None,
    ) -> None:
        """Record the call and reflect it into hass.states."""
        self.turn_on_calls.append((entity_id, action))
        attributes: dict[str, Any] = {}
        if "target_temperature" in action:
            attributes[ATTR_TEMPERATURE] = action["target_temperature"]
        hass.states.async_set(entity_id, action["hvac_mode"], attributes, context=context)

    async def async_turn_off(
        self, hass: HomeAssistant, entity_id: str, context: Context | None = None
    ) -> None:
        """Record the call and reflect it into hass.states."""
        self.turn_off_calls.append(entity_id)
        hass.states.async_set(entity_id, "off", {}, context=context)

    def matches_action(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> bool:
        """Compare the entity's real (test) state against `action`, like ClimateDeviceHandler."""
        state = hass.states.get(entity_id)
        if state is None:
            return True
        if state.state != action["hvac_mode"]:
            return False
        if "target_temperature" in action:
            current = state.attributes.get(ATTR_TEMPERATURE)
            if current is None or not math.isclose(
                current, action["target_temperature"], abs_tol=0.5
            ):
                return False
        return True


def _make_rule(
    *,
    id: str = "rule-1",  # noqa: A002 - matches the Rule field name, kept local to this helper
    name: str = "Test rule",
    on_time: str = "06:00",
    off_time: str = "21:00",
    on_provider: TimeProviderType = TimeProviderType.FIXED,
    off_provider: TimeProviderType = TimeProviderType.FIXED,
    days: frozenset[Weekday] = frozenset(Weekday),
    date_mode: RuleDateMode = RuleDateMode.ALWAYS,
    dates: frozenset[str] = frozenset(),
    date_ranges: frozenset[tuple[str, str]] = frozenset(),
    day_conditions: frozenset[DayConditionType] = frozenset(),
    enabled: bool = True,
    on_enabled: bool = True,
    off_enabled: bool = True,
    allow_override: bool = True,
    override_grace_minutes: int = 15,
    action: dict[str, Any] | None = None,
) -> Rule:
    """Build a Rule, defaulting to a FIXED-time rule active every day."""
    return Rule(
        id=id,
        name=name,
        enabled=enabled,
        days=days,
        date_mode=date_mode,
        dates=dates,
        date_ranges=date_ranges,
        day_conditions=day_conditions,
        on_time=TimeSpec(provider=on_provider, params={"time": on_time}),
        off_time=TimeSpec(provider=off_provider, params={"time": off_time}),
        on_enabled=on_enabled,
        off_enabled=off_enabled,
        allow_override=allow_override,
        override_grace_minutes=override_grace_minutes,
        action=action if action is not None else {},
    )


def _make_schedule(
    rule: Rule,
    *,
    id: str = "sched-1",  # noqa: A002 - matches the Schedule field name, kept local to this helper
    name: str = "Test schedule",
    entities: list[str] | None = None,
    device_type: DeviceType = DeviceType.LIGHT,
    active_date_mode: RuleDateMode = RuleDateMode.ALWAYS,
    active_date_ranges: frozenset[tuple[str, str]] = frozenset(),
    override_until: str | None = None,
) -> Schedule:
    """Build a single-rule Schedule targeting `entities` (default: one light)."""
    return Schedule(
        id=id,
        name=name,
        device_type=device_type,
        entities=entities or ["light.test"],
        rules=[rule],
        active_date_mode=active_date_mode,
        active_date_ranges=active_date_ranges,
        override_until=override_until,
    )


@pytest.fixture
def fake_device_handler() -> FakeDeviceHandler:
    """A fresh FakeDeviceHandler for each test, registered for DeviceType.LIGHT."""
    return FakeDeviceHandler()


@pytest.fixture
def fake_switch_handler() -> FakeDeviceHandler:
    """A second, independent FakeDeviceHandler, registered for DeviceType.SWITCH.

    Kept separate from fake_device_handler so a DeviceType.LIGHT_SWITCH
    schedule's per-entity dispatch can be checked precisely: each handler's
    own call log should only ever contain entities of its own domain.
    """
    return FakeDeviceHandler()


@pytest.fixture
def fake_climate_handler() -> FakeClimateDeviceHandler:
    """A FakeClimateDeviceHandler for override-enforcement tests, registered for DeviceType.CLIMATE."""
    return FakeClimateDeviceHandler()


@pytest.fixture
async def engine(
    hass: HomeAssistant,
    fake_device_handler: FakeDeviceHandler,
    fake_switch_handler: FakeDeviceHandler,
    fake_climate_handler: FakeClimateDeviceHandler,
) -> AsyncGenerator[SchedulerEngine, None]:
    """A SchedulerEngine wired to fake/HA-independent plugins.

    Yields without calling async_start() - tests drive _async_resolve_occurrence/
    _async_refresh_rule/_async_refresh_all directly to control "now"
    deterministically. Still calls async_stop() on teardown, since
    individual _schedule_turn_on/_schedule_turn_off calls register real
    async_track_point_in_time listeners on `hass` that must be cancelled to
    avoid leaking them past the end of the test.
    """
    store = SchedulerPlusStore(hass)
    coordinator = SchedulerPlusCoordinator(hass, store)
    await coordinator.async_config_entry_first_refresh()

    time_providers = TimeProviderRegistry(
        {
            TimeProviderType.FIXED: FixedTimeProvider(),
            TimeProviderType.SUNRISE: UnresolvableTimeProvider(),
            # SUNSET is deliberately left unregistered.
        }
    )
    device_handlers = DeviceHandlerRegistry(
        {
            DeviceType.LIGHT: fake_device_handler,
            DeviceType.SWITCH: fake_switch_handler,
            DeviceType.CLIMATE: fake_climate_handler,
        }
    )
    day_conditions = DayConditionRegistry(
        {
            DayConditionType.SHABBOS: FakeDayCondition(matches_date=_MONDAY),
            # YOM_TOV is deliberately left unregistered.
        }
    )

    scheduler_engine = SchedulerEngine(
        hass,
        coordinator,
        time_providers=time_providers,
        device_handlers=device_handlers,
        day_conditions=day_conditions,
    )
    yield scheduler_engine
    scheduler_engine.async_stop()


async def test_resolve_occurrence_inactive_weekday(engine: SchedulerEngine) -> None:
    """A rule whose days don't include reference_date's weekday resolves to None."""
    rule = _make_rule(days=frozenset({Weekday.TUESDAY}))

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is None


async def test_resolve_occurrence_same_day(engine: SchedulerEngine) -> None:
    """A same-day rule resolves on/off on reference_date, off after on."""
    rule = _make_rule(on_time="06:00", off_time="21:00")

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is not None
    on_at, off_at = occurrence
    assert on_at.date() == _MONDAY
    assert off_at.date() == _MONDAY
    assert on_at < off_at


async def test_resolve_occurrence_overnight_shifts_off_to_next_day(
    engine: SchedulerEngine,
) -> None:
    """When off resolves at/before on, off is shifted to the following day."""
    rule = _make_rule(on_time="22:00", off_time="06:00")

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is not None
    on_at, off_at = occurrence
    assert on_at.date() == _MONDAY
    assert off_at.date() == date(2024, 1, 2)
    assert on_at < off_at


async def test_resolve_occurrence_exclude_mode_skips_listed_date(
    engine: SchedulerEngine,
) -> None:
    """An EXCLUDE rule is skipped on a listed date even though days match."""
    rule = _make_rule(
        date_mode=RuleDateMode.EXCLUDE, dates=frozenset({_MONDAY.isoformat()})
    )

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is None


async def test_resolve_occurrence_exclude_mode_runs_on_other_dates(
    engine: SchedulerEngine,
) -> None:
    """An EXCLUDE rule still runs on days matching `days` that aren't excluded."""
    other_monday = date(2024, 1, 8)
    rule = _make_rule(
        date_mode=RuleDateMode.EXCLUDE, dates=frozenset({_MONDAY.isoformat()})
    )

    occurrence = await engine._async_resolve_occurrence(rule, other_monday)

    assert occurrence is not None


async def test_resolve_occurrence_include_mode_ignores_days(
    engine: SchedulerEngine,
) -> None:
    """An INCLUDE rule fires on a listed date even if `days` wouldn't match."""
    rule = _make_rule(
        days=frozenset({Weekday.SUNDAY}),  # _MONDAY is a Monday, not Sunday
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_MONDAY.isoformat()}),
    )

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is not None


async def test_resolve_occurrence_include_mode_skips_unlisted_date(
    engine: SchedulerEngine,
) -> None:
    """An INCLUDE rule does not fire on a date that isn't in `dates`."""
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({date(2024, 1, 8).isoformat()}),
    )

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is None


async def test_resolve_occurrence_exclude_mode_skips_date_within_range(
    engine: SchedulerEngine,
) -> None:
    """An EXCLUDE rule is skipped on any date within a listed range."""
    rule = _make_rule(
        date_mode=RuleDateMode.EXCLUDE,
        date_ranges=frozenset({("2023-12-25", "2024-01-05")}),
    )

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)  # 2024-01-01

    assert occurrence is None


async def test_resolve_occurrence_exclude_mode_runs_outside_range(
    engine: SchedulerEngine,
) -> None:
    """An EXCLUDE rule still runs on a date outside any listed range."""
    other_monday = date(2024, 1, 8)
    rule = _make_rule(
        date_mode=RuleDateMode.EXCLUDE,
        date_ranges=frozenset({("2023-12-25", "2024-01-05")}),
    )

    occurrence = await engine._async_resolve_occurrence(rule, other_monday)

    assert occurrence is not None


async def test_resolve_occurrence_include_mode_matches_date_within_range(
    engine: SchedulerEngine,
) -> None:
    """An INCLUDE rule fires on a date within a listed range, ignoring `days`."""
    rule = _make_rule(
        days=frozenset({Weekday.SUNDAY}),  # _MONDAY is a Monday, not Sunday
        date_mode=RuleDateMode.INCLUDE,
        date_ranges=frozenset({("2023-12-25", "2024-01-05")}),
    )

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is not None


async def test_resolve_occurrence_exclude_mode_skips_matching_day_condition(
    engine: SchedulerEngine,
) -> None:
    """An EXCLUDE rule is skipped when a day condition currently matches.

    The `engine` fixture registers FakeDayCondition(matches_date=_MONDAY)
    for SHABBOS, standing in for "today happens to be Shabbos" without
    depending on real YidCal sensor state.
    """
    rule = _make_rule(
        date_mode=RuleDateMode.EXCLUDE, day_conditions=frozenset({DayConditionType.SHABBOS})
    )

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is None


async def test_resolve_occurrence_exclude_mode_day_condition_not_matching(
    engine: SchedulerEngine,
) -> None:
    """An EXCLUDE rule still runs when its day condition doesn't match today."""
    other_monday = date(2024, 1, 8)
    rule = _make_rule(
        date_mode=RuleDateMode.EXCLUDE, day_conditions=frozenset({DayConditionType.SHABBOS})
    )

    occurrence = await engine._async_resolve_occurrence(rule, other_monday)

    assert occurrence is not None


async def test_resolve_occurrence_include_mode_day_condition_matches(
    engine: SchedulerEngine,
) -> None:
    """An INCLUDE rule fires when a day condition matches, ignoring `days`."""
    rule = _make_rule(
        days=frozenset({Weekday.SUNDAY}),  # _MONDAY is a Monday, not Sunday
        date_mode=RuleDateMode.INCLUDE,
        day_conditions=frozenset({DayConditionType.SHABBOS}),
    )

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is not None


async def test_resolve_occurrence_unregistered_day_condition_logs_and_continues(
    engine: SchedulerEngine,
) -> None:
    """A rule referencing an unregistered day condition resolves to None, not an error.

    YOM_TOV is deliberately left unregistered in the `engine` fixture,
    mirroring how an unregistered TimeProvider is already handled.
    """
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE, day_conditions=frozenset({DayConditionType.YOM_TOV})
    )

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is None


async def test_resolve_occurrence_unregistered_provider_returns_none(
    engine: SchedulerEngine,
) -> None:
    """A rule referencing an unregistered time provider resolves to None, not an error."""
    rule = _make_rule(on_provider=TimeProviderType.SUNSET)

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is None


async def test_resolve_occurrence_unresolvable_time_returns_none(
    engine: SchedulerEngine,
) -> None:
    """A rule whose provider can't resolve a time for this date returns None."""
    rule = _make_rule(on_provider=TimeProviderType.SUNRISE)

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is None


async def test_refresh_rule_catches_up_when_inside_window(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """If `now` falls inside the on/off window, turn_on fires immediately."""
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == [("light.test", rule.action)]
    # The off callback for the caught-up occurrence should still be pending.
    assert len(engine._unsub_rules[rule.id]) == 1


async def test_refresh_rule_schedules_future_on_and_off(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """If `now` is before on_time, both on and off are scheduled, not fired."""
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 3, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == []
    assert fake_device_handler.turn_off_calls == []
    assert len(engine._unsub_rules[rule.id]) == 2


async def test_refresh_rule_dispatches_per_entity_domain(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    fake_switch_handler: FakeDeviceHandler,
) -> None:
    """A LIGHT_SWITCH schedule sends each entity to its own domain's handler.

    The whole point of DeviceType.LIGHT_SWITCH: light.* and switch.*
    entities mixed in one schedule must each reach the correct HA service
    (light.turn_on vs switch.turn_on aren't interchangeable), not whichever
    single handler the schedule's device_type would have picked before.
    """
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(
        rule,
        entities=["light.test", "switch.test"],
        device_type=DeviceType.LIGHT_SWITCH,
    )
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == [("light.test", rule.action)]
    assert fake_switch_handler.turn_on_calls == [("switch.test", rule.action)]


async def test_refresh_rule_disabled_rule_schedules_nothing(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """A disabled rule is skipped entirely, even if it would otherwise be active."""
    rule = _make_rule(enabled=False)
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == []
    assert rule.id not in engine._unsub_rules


async def test_refresh_rule_on_only_schedules_future_on_only(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """An on-only rule schedules a future on and never touches off."""
    rule = _make_rule(on_time="06:00", off_time="21:00", off_enabled=False)
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 3, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == []
    assert fake_device_handler.turn_off_calls == []
    assert len(engine._unsub_rules[rule.id]) == 1


async def test_refresh_rule_on_only_catches_up_and_never_schedules_off(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """An on-only rule catches up turn_on if already past, and schedules nothing else."""
    rule = _make_rule(on_time="06:00", off_time="21:00", off_enabled=False)
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == [("light.test", rule.action)]
    # Off is never scheduled, and the catch-up itself isn't a pending
    # callback, so nothing is left to track for this rule.
    assert rule.id not in engine._unsub_rules


async def test_refresh_rule_on_only_ignores_stale_yesterday_occurrence(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """An on-only rule doesn't re-catch-up off a carried-over yesterday occurrence.

    Regression test: unlike a BOTH-mode rule (where a stale yesterday
    window is filtered out by `off_at <= now`), an on-only rule has no off
    boundary to filter on - so yesterday's occurrence must be excluded from
    consideration entirely, or every refresh would re-fire turn_on for it.
    """
    rule = _make_rule(on_time="06:00", off_time="21:00", off_enabled=False)
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 8, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == [("light.test", rule.action)]


async def test_refresh_rule_off_only_schedules_future_off_only(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """An off-only rule schedules a future off and never touches on."""
    rule = _make_rule(on_time="06:00", off_time="21:00", on_enabled=False)
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 15, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == []
    assert fake_device_handler.turn_off_calls == []
    assert len(engine._unsub_rules[rule.id]) == 1


async def test_refresh_rule_off_only_skips_when_already_past(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """An off-only rule does not catch up a missed off - it just skips it.

    Mirrors a BOTH-mode rule's existing off-side behavior: off is only ever
    scheduled forward, never fired as an immediate catch-up.
    """
    rule = _make_rule(on_time="06:00", off_time="21:00", on_enabled=False)
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 23, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_off_calls == []
    assert rule.id not in engine._unsub_rules


def _make_climate_rule(**kwargs: Any) -> Rule:
    """_make_rule with a climate-shaped action, for override enforcement tests."""
    kwargs.setdefault("action", {"hvac_mode": "heat", "target_temperature": 69})
    return _make_rule(**kwargs)


async def test_refresh_rule_catchup_arms_enforcement_when_override_disabled(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler
) -> None:
    """Catch-up arms override enforcement when allow_override=False and both enabled."""
    rule = _make_climate_rule(on_time="06:00", off_time="21:00", allow_override=False)
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert "climate.test" in engine._active_enforcement


async def test_refresh_rule_catchup_does_not_arm_when_override_allowed(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler
) -> None:
    """Catch-up does not arm enforcement when allow_override=True (the default)."""
    rule = _make_climate_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert "climate.test" not in engine._active_enforcement


async def test_refresh_rule_on_only_never_arms_enforcement(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler
) -> None:
    """An on-only rule never arms enforcement, even with allow_override=False.

    Enforcement needs a defined on->off window; an on-only rule has none.
    """
    rule = _make_climate_rule(
        on_time="06:00", off_time="21:00", off_enabled=False, allow_override=False
    )
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert "climate.test" not in engine._active_enforcement


async def test_catchup_turn_on_fires_rule_triggered_event(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """Catching up a rule's on-action fires EVENT_RULE_TRIGGERED.

    It fires under the same Context passed to the resulting service call -
    this is what lets logbook.py (and Home Assistant's Logbook) attribute
    the entity's own "turned on" entry to Scheduler+ instead of showing no
    cause at all.
    """
    rule = _make_climate_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(
        rule, name="Kitchen heat", entities=["climate.test"], device_type=DeviceType.CLIMATE
    )
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    events: list[Event] = []
    hass.bus.async_listen(EVENT_RULE_TRIGGERED, events.append)

    await engine._async_refresh_rule(schedule, rule, now)
    await hass.async_block_till_done()

    assert len(events) == 1
    assert events[0].data == {
        "entity_id": "climate.test",
        "rule_id": rule.id,
        "rule_name": rule.name,
        "schedule_name": "Kitchen heat",
        "turning_on": True,
    }

    state = hass.states.get("climate.test")
    assert state is not None
    assert state.context.id == events[0].context.id


async def test_scheduled_turn_off_fires_rule_triggered_event(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """The scheduled (point-in-time) turn-off also fires the event, with turning_on=False.

    Uses real current time (like test_scheduled_turn_on_arms_enforcement_and_
    lands_in_unsub_rules) since it needs the real scheduled callback to
    actually fire, via async_fire_time_changed.
    """
    real_now = dt_util.now()
    off_time = (real_now + timedelta(minutes=2)).strftime("%H:%M")
    rule = _make_climate_rule(on_time="00:00", off_time=off_time)
    schedule = _make_schedule(
        rule, name="Kitchen heat", entities=["climate.test"], device_type=DeviceType.CLIMATE
    )

    events: list[Event] = []
    hass.bus.async_listen(EVENT_RULE_TRIGGERED, events.append)

    await engine._async_refresh_rule(schedule, rule, real_now)
    assert [event.data["turning_on"] for event in events] == [True]  # the on-catch-up

    async_fire_time_changed(hass, real_now + timedelta(minutes=3))
    await hass.async_block_till_done()

    assert [event.data["turning_on"] for event in events] == [True, False]
    state = hass.states.get("climate.test")
    assert state is not None
    assert state.state == "off"
    assert state.context.id == events[-1].context.id


async def test_override_enforcement_reapplies_after_grace_period(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """A genuine external mismatch reapplies the rule's action after the grace period."""
    rule = _make_climate_rule(
        on_time="06:00", off_time="21:00", allow_override=False, override_grace_minutes=1
    )
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    events: list[Event] = []
    hass.bus.async_listen(EVENT_RULE_TRIGGERED, events.append)

    await engine._async_refresh_rule(schedule, rule, now)
    assert len(fake_climate_handler.turn_on_calls) == 1  # the initial catch-up

    # Someone changes the thermostat manually - a distinct, auto-generated
    # context, simulating an external change rather than our own call.
    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 75})
    await hass.async_block_till_done()

    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(minutes=2))
    await hass.async_block_till_done()

    assert len(fake_climate_handler.turn_on_calls) == 2
    state = hass.states.get("climate.test")
    assert state is not None
    assert state.attributes[ATTR_TEMPERATURE] == 69

    # The reapply (like the initial catch-up) fires EVENT_RULE_TRIGGERED,
    # with schedule_name threaded all the way through _arm_override_enforcement.
    assert [event.data["schedule_name"] for event in events] == ["Test schedule"] * 2
    assert events[-1].context.id == state.context.id


async def test_override_enforcement_debounce_resets_on_further_change(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """A second override before the grace period elapses resets the countdown."""
    rule = _make_climate_rule(
        on_time="06:00", off_time="21:00", allow_override=False, override_grace_minutes=2
    )
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)
    assert len(fake_climate_handler.turn_on_calls) == 1

    start = dt_util.utcnow()

    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 75})
    await hass.async_block_till_done()

    # A second override before the first 2-minute countdown would elapse.
    async_fire_time_changed(hass, start + timedelta(minutes=1))
    await hass.async_block_till_done()
    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 80})
    await hass.async_block_till_done()

    # Just past the FIRST change's original deadline (t=2min) - if the
    # countdown hadn't reset, this would already have reapplied.
    async_fire_time_changed(hass, start + timedelta(minutes=2, seconds=30))
    await hass.async_block_till_done()
    assert len(fake_climate_handler.turn_on_calls) == 1

    # Past the SECOND change's deadline (t=1min + 2min = t=3min).
    async_fire_time_changed(hass, start + timedelta(minutes=3, seconds=30))
    await hass.async_block_till_done()
    assert len(fake_climate_handler.turn_on_calls) == 2


async def test_override_enforcement_ignores_already_matching_change(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """A state change that already matches rule.action doesn't arm a reapply."""
    rule = _make_climate_rule(
        on_time="06:00", off_time="21:00", allow_override=False, override_grace_minutes=1
    )
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)
    assert len(fake_climate_handler.turn_on_calls) == 1

    # A benign ripple that happens to already match the rule's action.
    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 69})
    await hass.async_block_till_done()

    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(minutes=2))
    await hass.async_block_till_done()

    assert len(fake_climate_handler.turn_on_calls) == 1


async def test_override_enforcement_ignores_our_own_context(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """A state change carrying our own last-issued context isn't treated as an override."""
    rule = _make_climate_rule(
        on_time="06:00", off_time="21:00", allow_override=False, override_grace_minutes=1
    )
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)
    assert len(fake_climate_handler.turn_on_calls) == 1

    our_context = Context(id=engine._last_self_context["climate.test"])
    # Doesn't match rule.action, but carries our own last context id, so it
    # must be ignored, as if we caused it ourselves.
    hass.states.async_set(
        "climate.test", "heat", {ATTR_TEMPERATURE: 75}, context=our_context
    )
    await hass.async_block_till_done()

    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(minutes=2))
    await hass.async_block_till_done()

    assert len(fake_climate_handler.turn_on_calls) == 1


async def test_override_enforcement_teardown_disarms_it(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """Invoking the teardown (as _schedule_turn_off's _fire does on off) disarms enforcement.

    A later external change must then be ignored entirely - this is what
    keeps enforcement from outliving a rule's on-window.
    """
    rule = _make_climate_rule(allow_override=False, override_grace_minutes=1)

    teardown = engine._arm_override_enforcement(
        rule, "climate.test", fake_climate_handler, "Test schedule"
    )
    assert "climate.test" in engine._active_enforcement

    teardown()
    assert "climate.test" not in engine._active_enforcement

    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 75})
    await hass.async_block_till_done()
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(minutes=2))
    await hass.async_block_till_done()

    assert fake_climate_handler.turn_on_calls == []


async def test_cancel_rule_tears_down_override_enforcement(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler
) -> None:
    """_cancel_rule tears down an already-armed enforcement, like any other pending callback."""
    rule = _make_climate_rule(on_time="06:00", off_time="21:00", allow_override=False)
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)
    assert "climate.test" in engine._active_enforcement

    engine._cancel_rule(rule.id)

    assert "climate.test" not in engine._active_enforcement


async def test_scheduled_turn_on_arms_enforcement_and_lands_in_unsub_rules(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """The scheduled (non-catch-up) on-path also arms enforcement correctly.

    Its teardown must land in _unsub_rules[rule.id] (appended by key, after
    _async_refresh_rule already returned) so _cancel_rule still tears it
    down - regardless of exactly when _fire runs relative to the refresh
    that scheduled it. Uses real current time throughout (unlike most of
    this file's tests) since it needs the real scheduled callback to
    actually fire, via async_fire_time_changed.
    """
    real_now = dt_util.now()
    on_time = (real_now + timedelta(minutes=2)).strftime("%H:%M")
    rule = _make_climate_rule(on_time=on_time, off_time="23:59", allow_override=False)
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)

    await engine._async_refresh_rule(schedule, rule, real_now)
    assert len(engine._unsub_rules[rule.id]) == 2  # on + off scheduled, nothing fired yet
    assert fake_climate_handler.turn_on_calls == []

    async_fire_time_changed(hass, real_now + timedelta(minutes=3))
    await hass.async_block_till_done()

    assert fake_climate_handler.turn_on_calls  # the scheduled on fired
    assert "climate.test" in engine._active_enforcement
    assert engine._active_enforcement["climate.test"] in engine._unsub_rules[rule.id]

    engine._cancel_rule(rule.id)
    assert "climate.test" not in engine._active_enforcement


async def test_get_day_events_returns_occurrence_for_matching_rule(
    engine: SchedulerEngine,
) -> None:
    """A schedule's enabled rule that applies on the date is included."""
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule)

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert len(events) == 1
    found_rule, on_at, off_at = events[0]
    assert found_rule is rule
    assert on_at.date() == _MONDAY
    assert off_at.date() == _MONDAY


async def test_get_day_events_skips_inactive_weekday(
    engine: SchedulerEngine,
) -> None:
    """A rule whose days don't include the requested date contributes nothing."""
    rule = _make_rule(days=frozenset({Weekday.SUNDAY}))
    schedule = _make_schedule(rule)

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert events == []


async def test_get_day_events_on_only_reports_none_for_off(
    engine: SchedulerEngine,
) -> None:
    """An on-only rule's day-view occurrence has off_at=None."""
    rule = _make_rule(on_time="06:00", off_time="21:00", off_enabled=False)
    schedule = _make_schedule(rule)

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert len(events) == 1
    _, on_at, off_at = events[0]
    assert on_at is not None
    assert off_at is None


async def test_get_day_events_off_only_reports_none_for_on(
    engine: SchedulerEngine,
) -> None:
    """An off-only rule's day-view occurrence has on_at=None."""
    rule = _make_rule(on_time="06:00", off_time="21:00", on_enabled=False)
    schedule = _make_schedule(rule)

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert len(events) == 1
    _, on_at, off_at = events[0]
    assert on_at is None
    assert off_at is not None


async def test_get_day_events_skips_disabled_rule(engine: SchedulerEngine) -> None:
    """A disabled rule contributes nothing, even if its days would otherwise match."""
    rule = _make_rule(enabled=False)
    schedule = _make_schedule(rule)

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert events == []


async def test_get_day_events_skips_disabled_schedule(engine: SchedulerEngine) -> None:
    """A disabled schedule contributes nothing, even with enabled rules."""
    rule = _make_rule()
    schedule = _make_schedule(rule)
    schedule.enabled = False

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert events == []


async def test_get_next_event_disabled_schedule_returns_none(
    engine: SchedulerEngine,
) -> None:
    """A disabled schedule reports no next event, even with enabled rules."""
    rule = _make_rule()
    schedule = _make_schedule(rule)
    schedule.enabled = False

    next_event = await engine.async_get_next_event(schedule)

    assert next_event is None


async def test_get_next_event_finds_occurrence_later_in_week(
    engine: SchedulerEngine,
) -> None:
    """A rule active only a few days from now is still found.

    Regression test: async_get_next_event previously only checked today and
    yesterday (copying _async_refresh_all's window, which is fine there
    since it re-runs every midnight) - a rule active on a day that isn't
    today or yesterday would incorrectly report no next event at all.
    """
    now = dt_util.now()
    future_date = (now + timedelta(days=3)).date()
    future_weekday = list(Weekday)[future_date.weekday()]
    rule = _make_rule(days=frozenset({future_weekday}))
    schedule = _make_schedule(rule)

    next_event = await engine.async_get_next_event(schedule)

    assert next_event is not None
    when, label = next_event
    assert when.date() == future_date
    assert label == "on"


async def test_get_next_event_on_only_reports_only_on(
    engine: SchedulerEngine,
) -> None:
    """An on-only rule's next event is always labeled 'on', never 'off'."""
    rule = _make_rule(on_time="06:00", off_time="21:00", off_enabled=False)
    schedule = _make_schedule(rule)

    next_event = await engine.async_get_next_event(schedule)

    assert next_event is not None
    _, label = next_event
    assert label == "on"


async def test_get_next_event_off_only_reports_only_off(
    engine: SchedulerEngine,
) -> None:
    """An off-only rule's next event is always labeled 'off', never 'on'."""
    rule = _make_rule(on_time="06:00", off_time="21:00", on_enabled=False)
    schedule = _make_schedule(rule)

    next_event = await engine.async_get_next_event(schedule)

    assert next_event is not None
    _, label = next_event
    assert label == "off"


async def test_get_next_event_include_mode_finds_date_beyond_week_window(
    engine: SchedulerEngine,
) -> None:
    """An INCLUDE rule's next event is found even weeks in the future.

    Regression test: the generic weekday-window lookahead used for
    ALWAYS/EXCLUDE rules only spans about a week, which would miss an
    INCLUDE rule's one-off date further out than that - _candidate_dates
    has to use the rule's own `dates` directly for INCLUDE rules instead.
    """
    now = dt_util.now()
    far_future_date = (now + timedelta(days=20)).date()
    rule = _make_rule(
        days=frozenset(),  # ignored in INCLUDE mode
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({far_future_date.isoformat()}),
    )
    schedule = _make_schedule(rule)

    next_event = await engine.async_get_next_event(schedule)

    assert next_event is not None
    when, label = next_event
    assert when.date() == far_future_date
    assert label == "on"


def test_candidate_dates_include_mode_adds_today_for_day_conditions() -> None:
    """An INCLUDE rule with a day condition includes today as a candidate.

    A pure unit test of _candidate_dates (a @staticmethod, no hass needed):
    day conditions can only ever be confirmed for *today* (see
    DayCondition.async_check), so unlike literal dates, today has to be
    added explicitly even though it's never actually listed in `dates`.
    """
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        day_conditions=frozenset({DayConditionType.SHABBOS}),
    )

    candidates = SchedulerEngine._candidate_dates(rule, now)

    assert now.date() in candidates


def test_candidate_dates_include_mode_without_day_conditions_excludes_today() -> None:
    """An INCLUDE rule with only literal (non-matching) dates doesn't add today."""
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    rule = _make_rule(date_mode=RuleDateMode.INCLUDE, dates=frozenset({"2024-06-01"}))

    candidates = SchedulerEngine._candidate_dates(rule, now)

    assert now.date() not in candidates


def test_candidate_dates_include_mode_range_not_yet_started() -> None:
    """An INCLUDE rule's future range contributes every one of its days, starting at day one."""
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        date_ranges=frozenset({("2024-06-01", "2024-06-15")}),
    )

    candidates = SchedulerEngine._candidate_dates(rule, now)

    assert candidates == [date(2024, 6, 1) + timedelta(days=i) for i in range(15)]


def test_candidate_dates_include_mode_range_already_started() -> None:
    """An INCLUDE rule's in-progress range contributes every remaining day, not just its start.

    Regression test: the range's first day (June 1) is in the past by
    June 5, so it must not be the *only* candidate offered - every day from
    yesterday (June 4) through the range's end has to be checked, or
    async_get_next_event would miss a real future occurrence later in the
    same range (e.g. tomorrow) and incorrectly skip ahead to a later,
    unrelated range instead.
    """
    now = datetime(2024, 6, 5, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        date_ranges=frozenset({("2024-06-01", "2024-06-15")}),
    )

    candidates = SchedulerEngine._candidate_dates(rule, now)

    assert candidates == [date(2024, 6, 4) + timedelta(days=i) for i in range(12)]


def test_candidate_dates_include_mode_mid_range_still_offers_later_days() -> None:
    """Checking from the middle of a multi-day range still offers its later days.

    Directly mirrors the reported bug: a 4-day event range where "now" has
    already moved past day one (and day one's own on/off has since passed)
    - day three and four must still show up as candidates, not just
    whichever range happens to start soonest after today.
    """
    now = datetime(2024, 8, 19, 23, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)  # day 3 of 4
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        date_ranges=frozenset({("2024-08-17", "2024-08-20")}),
    )

    candidates = SchedulerEngine._candidate_dates(rule, now)

    assert date(2024, 8, 19) in candidates
    assert date(2024, 8, 20) in candidates


def test_dates_in_range_clamps_to_floor_and_end() -> None:
    """_dates_in_range returns every day from max(start, floor) through end, inclusive."""
    result = SchedulerEngine._dates_in_range("2024-06-01", "2024-06-05", date(2024, 6, 3))

    assert result == [date(2024, 6, 3), date(2024, 6, 4), date(2024, 6, 5)]


def test_dates_in_range_empty_when_already_ended() -> None:
    """A range that ended before `floor` contributes nothing."""
    result = SchedulerEngine._dates_in_range("2024-06-01", "2024-06-05", date(2024, 6, 10))

    assert result == []


def test_dates_in_range_caps_at_max_days() -> None:
    """A range longer than the cap is truncated, not fully enumerated."""
    result = SchedulerEngine._dates_in_range("2024-01-01", "2024-12-31", date(2024, 1, 1))

    assert len(result) == 31
    assert result[0] == date(2024, 1, 1)
    assert result[-1] == date(2024, 1, 31)


def test_candidate_dates_include_mode_ignores_past_range() -> None:
    """An INCLUDE rule's already-ended range contributes no candidate at all."""
    now = datetime(2024, 6, 20, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        date_ranges=frozenset({("2024-06-01", "2024-06-15")}),
    )

    candidates = SchedulerEngine._candidate_dates(rule, now)

    assert candidates == []


async def test_refresh_all_skips_disabled_schedule(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """A disabled schedule's rules are never evaluated."""
    rule = _make_rule()
    schedule = _make_schedule(rule)
    schedule.enabled = False
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [schedule.to_dict()]}
    )

    await engine._async_refresh_all()

    assert fake_device_handler.turn_on_calls == []
    assert engine._unsub_rules == {}


async def test_refresh_rule_skips_seasonally_inactive_date(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """A schedule outside its active_date_ranges window schedules nothing.

    _MONDAY (2024-01-01) falls outside the INCLUDE window below, so even
    though the rule itself would otherwise match every day, the
    schedule-level seasonal gate should suppress it entirely.
    """
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(
        rule,
        active_date_mode=RuleDateMode.INCLUDE,
        active_date_ranges=frozenset({("2024-07-01", "2024-08-31")}),
    )
    now = datetime(2024, 1, 1, 3, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_on_calls == []
    assert fake_device_handler.turn_off_calls == []
    assert rule.id not in engine._unsub_rules


async def test_refresh_rule_runs_during_seasonally_active_date(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """A schedule inside its active_date_ranges window schedules as normal."""
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(
        rule,
        active_date_mode=RuleDateMode.INCLUDE,
        active_date_ranges=frozenset({("2024-01-01", "2024-01-31")}),
    )
    now = datetime(2024, 1, 1, 3, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert len(engine._unsub_rules[rule.id]) == 2


async def test_get_day_events_skips_seasonally_inactive_date(
    engine: SchedulerEngine,
) -> None:
    """The day-view report respects a schedule's seasonal active window."""
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(
        rule,
        active_date_mode=RuleDateMode.EXCLUDE,
        active_date_ranges=frozenset({(_MONDAY.isoformat(), _MONDAY.isoformat())}),
    )

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert events == []


async def test_refresh_all_cancels_pending_callbacks_when_overridden(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """Pausing a schedule cancels its already-scheduled callbacks, not just future refreshes.

    Regression test for the pre-existing bug this feature's cancellation
    fix addresses: _async_refresh_all used to `continue` past a
    disabled/overridden schedule without ever calling _cancel_rule, so an
    already-scheduled on/off would still fire despite the schedule being
    paused in the meantime.
    """
    now = datetime(2024, 1, 1, 3, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule)
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [schedule.to_dict()]}
    )

    await engine._async_refresh_all()
    assert len(engine._unsub_rules[rule.id]) == 2

    schedule.override_until = "2024-01-02"
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [schedule.to_dict()]}
    )
    await engine._async_refresh_all()

    assert rule.id not in engine._unsub_rules
    assert fake_device_handler.turn_on_calls == []


async def test_refresh_all_skips_overridden_schedule(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """An overridden schedule's rules are never evaluated, like a disabled one."""
    rule = _make_rule()
    schedule = _make_schedule(rule, override_until="2024-01-02")
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [schedule.to_dict()]}
    )

    await engine._async_refresh_all()

    assert fake_device_handler.turn_on_calls == []
    assert engine._unsub_rules == {}


async def test_get_day_events_skips_overridden_date(engine: SchedulerEngine) -> None:
    """The day-view report respects an active pause through the requested date."""
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule, override_until=_MONDAY.isoformat())

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert events == []


async def test_get_day_events_runs_after_override_expires(engine: SchedulerEngine) -> None:
    """The day-view report resumes reporting normally past override_until."""
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule, override_until=date(2023, 12, 31).isoformat())

    events = await engine.async_get_day_events(schedule, _MONDAY)

    assert len(events) == 1


async def test_get_next_event_skips_overridden_schedule(engine: SchedulerEngine) -> None:
    """A currently-paused schedule reports no next event."""
    rule = _make_rule()
    today = dt_util.now().date()
    schedule = _make_schedule(rule, override_until=(today + timedelta(days=1)).isoformat())

    next_event = await engine.async_get_next_event(schedule)

    assert next_event is None


async def test_get_next_event_skips_seasonally_inactive_candidates(
    engine: SchedulerEngine,
) -> None:
    """async_get_next_event only reports occurrences inside the active window.

    A rule active every day would otherwise report "next event" as soon as
    tomorrow - the seasonal gate should push that out to the window's start.
    Kept within _candidate_dates' ~week-long lookahead for an ALWAYS-mode
    rule (a schedule whose seasonal window starts further out than that
    is a separate, known reporting gap covered by next_active_date in
    websocket.py, not by extending the candidate-date search here).
    """
    now = dt_util.now()
    window_start = (now + timedelta(days=3)).date()
    window_end = (now + timedelta(days=5)).date()
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(
        rule,
        active_date_mode=RuleDateMode.INCLUDE,
        active_date_ranges=frozenset({(window_start.isoformat(), window_end.isoformat())}),
    )

    next_event = await engine.async_get_next_event(schedule)

    assert next_event is not None
    when, _ = next_event
    assert when.date() >= window_start


# --- async_find_conflicts / _is_exclusion_fixable ---
#
# Unlike _async_resolve_occurrence (which takes an explicit reference_date),
# async_find_conflicts computes "today" internally via dt_util.now() - so
# every date used here is anchored to the real current time (a few days out
# via INCLUDE mode, not the fixed historical _MONDAY constant used above),
# to stay inside the date-enumeration window regardless of when the test
# suite actually runs.


def _iso(value: date) -> str:
    return value.isoformat()


async def test_find_conflicts_detects_overlapping_both_enabled_rules(
    engine: SchedulerEngine,
) -> None:
    """Two both-enabled rules with overlapping windows on a shared entity conflict."""
    check_date = dt_util.now().date() + timedelta(days=3)
    candidate_rule = _make_rule(
        id="candidate-rule",
        on_time="09:00",
        off_time="16:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    candidate = _make_schedule(candidate_rule, id="candidate-sched", entities=["light.gym"])

    other_rule = _make_rule(
        id="other-rule",
        on_time="14:00",
        off_time="18:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    other = _make_schedule(other_rule, id="other-sched", entities=["light.gym"])
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [other.to_dict()]}
    )

    conflicts = await engine.async_find_conflicts(candidate)

    assert len(conflicts) == 1
    conflict = conflicts[0]
    assert conflict.entity_ids == ("light.gym",)
    assert conflict.candidate_rule_id == "candidate-rule"
    assert conflict.conflicting_schedule_id == "other-sched"
    assert conflict.conflicting_rule_id == "other-rule"
    assert conflict.date == check_date


async def test_find_conflicts_off_only_baseline_conflicts_with_stay_on_event(
    engine: SchedulerEngine,
) -> None:
    """An off-only baseline rule's off moment landing inside a temp event's window conflicts.

    The motivating scenario: a daily off-only rule (lights off at 4pm) and
    a one-off event wanting lights on until 11pm - the off-only rule's
    meaningless on_time must not corrupt the comparison (see
    _effective_window).
    """
    check_date = dt_util.now().date() + timedelta(days=3)
    baseline_rule = _make_rule(
        id="baseline-rule",
        on_time="06:00",  # stale/meaningless - only off_enabled matters
        off_time="16:00",
        on_enabled=False,
        off_enabled=True,
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    baseline = _make_schedule(baseline_rule, id="baseline-sched", entities=["light.gym"])
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [baseline.to_dict()]}
    )

    event_rule = _make_rule(
        id="event-rule",
        on_time="09:00",
        off_time="23:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    event = _make_schedule(event_rule, id="event-sched", entities=["light.gym"])

    conflicts = await engine.async_find_conflicts(event)

    assert len(conflicts) == 1
    assert conflicts[0].conflicting_rule_id == "baseline-rule"


async def test_find_conflicts_on_only_rule_extends_through_rest_of_day(
    engine: SchedulerEngine,
) -> None:
    """An on-only rule's effective window is approximated through the rest of that day."""
    check_date = dt_util.now().date() + timedelta(days=3)
    on_only_rule = _make_rule(
        id="on-only-rule",
        on_time="18:00",
        off_time="06:00",  # stale/meaningless - only on_enabled matters
        on_enabled=True,
        off_enabled=False,
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    on_only = _make_schedule(on_only_rule, id="on-only-sched", entities=["light.gym"])
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [on_only.to_dict()]}
    )

    other_rule = _make_rule(
        id="other-rule",
        on_time="20:00",
        off_time="23:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    other = _make_schedule(other_rule, id="other-sched", entities=["light.gym"])

    conflicts = await engine.async_find_conflicts(other)

    assert len(conflicts) == 1
    assert conflicts[0].conflicting_rule_id == "on-only-rule"


async def test_find_conflicts_no_overlap_returns_empty(engine: SchedulerEngine) -> None:
    """Two rules with disjoint windows on a shared entity don't conflict."""
    check_date = dt_util.now().date() + timedelta(days=3)
    candidate_rule = _make_rule(
        id="candidate-rule",
        on_time="06:00",
        off_time="09:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    candidate = _make_schedule(candidate_rule, id="candidate-sched", entities=["light.gym"])
    other_rule = _make_rule(
        id="other-rule",
        on_time="18:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    other = _make_schedule(other_rule, id="other-sched", entities=["light.gym"])
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [other.to_dict()]}
    )

    conflicts = await engine.async_find_conflicts(candidate)

    assert conflicts == []


async def test_find_conflicts_different_entities_no_conflict(
    engine: SchedulerEngine,
) -> None:
    """Overlapping windows on DIFFERENT entities don't conflict."""
    check_date = dt_util.now().date() + timedelta(days=3)
    candidate_rule = _make_rule(
        id="candidate-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    candidate = _make_schedule(candidate_rule, id="candidate-sched", entities=["light.gym"])
    other_rule = _make_rule(
        id="other-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    other = _make_schedule(other_rule, id="other-sched", entities=["light.office"])
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [other.to_dict()]}
    )

    conflicts = await engine.async_find_conflicts(candidate)

    assert conflicts == []


async def test_find_conflicts_excludes_own_schedule_id(engine: SchedulerEngine) -> None:
    """A schedule being edited never conflicts with its own prior stored version."""
    check_date = dt_util.now().date() + timedelta(days=3)
    rule = _make_rule(
        id="rule-a",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    stored = _make_schedule(rule, id="sched-a", entities=["light.gym"])
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [stored.to_dict()]}
    )

    candidate = _make_schedule(rule, id="sched-a", entities=["light.gym"])

    conflicts = await engine.async_find_conflicts(candidate, exclude_schedule_id="sched-a")

    assert conflicts == []


async def test_find_conflicts_skips_disabled_candidate(engine: SchedulerEngine) -> None:
    """A disabled candidate schedule can't conflict - it won't run."""
    check_date = dt_util.now().date() + timedelta(days=3)
    candidate_rule = _make_rule(
        id="candidate-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    candidate = _make_schedule(candidate_rule, id="candidate-sched", entities=["light.gym"])
    candidate.enabled = False
    other_rule = _make_rule(
        id="other-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    other = _make_schedule(other_rule, id="other-sched", entities=["light.gym"])
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [other.to_dict()]}
    )

    conflicts = await engine.async_find_conflicts(candidate)

    assert conflicts == []


async def test_find_conflicts_skips_disabled_other_schedule(engine: SchedulerEngine) -> None:
    check_date = dt_util.now().date() + timedelta(days=3)
    candidate_rule = _make_rule(
        id="candidate-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    candidate = _make_schedule(candidate_rule, id="candidate-sched", entities=["light.gym"])
    other_rule = _make_rule(
        id="other-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    other = _make_schedule(other_rule, id="other-sched", entities=["light.gym"])
    other.enabled = False
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [other.to_dict()]}
    )

    conflicts = await engine.async_find_conflicts(candidate)

    assert conflicts == []


async def test_find_conflicts_skips_seasonally_inactive_other_schedule(
    engine: SchedulerEngine,
) -> None:
    check_date = dt_util.now().date() + timedelta(days=3)
    candidate_rule = _make_rule(
        id="candidate-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    candidate = _make_schedule(candidate_rule, id="candidate-sched", entities=["light.gym"])
    other_rule = _make_rule(
        id="other-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    # Active only far in the future - not on check_date.
    far_future = check_date + timedelta(days=100)
    other = _make_schedule(
        other_rule,
        id="other-sched",
        entities=["light.gym"],
        active_date_mode=RuleDateMode.INCLUDE,
        active_date_ranges=frozenset({(_iso(far_future), _iso(far_future))}),
    )
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [other.to_dict()]}
    )

    conflicts = await engine.async_find_conflicts(candidate)

    assert conflicts == []


async def test_find_conflicts_skips_overridden_other_schedule(
    engine: SchedulerEngine,
) -> None:
    check_date = dt_util.now().date() + timedelta(days=3)
    candidate_rule = _make_rule(
        id="candidate-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    candidate = _make_schedule(candidate_rule, id="candidate-sched", entities=["light.gym"])
    other_rule = _make_rule(
        id="other-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(check_date)}),
    )
    other = _make_schedule(
        other_rule,
        id="other-sched",
        entities=["light.gym"],
        override_until=_iso(check_date + timedelta(days=5)),
    )
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [other.to_dict()]}
    )

    conflicts = await engine.async_find_conflicts(candidate)

    assert conflicts == []


async def test_find_conflicts_dedupes_to_earliest_date(engine: SchedulerEngine) -> None:
    """The same rule pair conflicting on multiple dates reports only the earliest."""
    earlier = dt_util.now().date() + timedelta(days=2)
    later = dt_util.now().date() + timedelta(days=5)
    candidate_rule = _make_rule(
        id="candidate-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(earlier), _iso(later)}),
    )
    candidate = _make_schedule(candidate_rule, id="candidate-sched", entities=["light.gym"])
    other_rule = _make_rule(
        id="other-rule",
        on_time="06:00",
        off_time="22:00",
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_iso(earlier), _iso(later)}),
    )
    other = _make_schedule(other_rule, id="other-sched", entities=["light.gym"])
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [other.to_dict()]}
    )

    conflicts = await engine.async_find_conflicts(candidate)

    assert len(conflicts) == 1
    assert conflicts[0].date == earlier


def test_is_exclusion_fixable_always_with_no_dormant_fields() -> None:
    rule = _make_rule(date_mode=RuleDateMode.ALWAYS)

    assert SchedulerEngine._is_exclusion_fixable(rule, _MONDAY) is True


def test_is_exclusion_fixable_always_with_dormant_date_ranges() -> None:
    """An ALWAYS rule with leftover date_ranges isn't cleanly fixable by flipping to EXCLUDE.

    Flipping the mode would reactivate the dormant range alongside the new
    exclusion date, excluding more than intended.
    """
    rule = _make_rule(
        date_mode=RuleDateMode.ALWAYS,
        date_ranges=frozenset({("2024-06-01", "2024-06-15")}),
    )

    assert SchedulerEngine._is_exclusion_fixable(rule, _MONDAY) is False


def test_is_exclusion_fixable_exclude_always_fixable() -> None:
    rule = _make_rule(date_mode=RuleDateMode.EXCLUDE)

    assert SchedulerEngine._is_exclusion_fixable(rule, _MONDAY) is True


def test_is_exclusion_fixable_include_literal_date_only() -> None:
    rule = _make_rule(date_mode=RuleDateMode.INCLUDE, dates=frozenset({_MONDAY.isoformat()}))

    assert SchedulerEngine._is_exclusion_fixable(rule, _MONDAY) is True


def test_is_exclusion_fixable_include_date_also_in_range() -> None:
    """Removing the date from `dates` alone wouldn't stop the rule matching via the range."""
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_MONDAY.isoformat()}),
        date_ranges=frozenset({("2023-12-25", "2024-01-05")}),
    )

    assert SchedulerEngine._is_exclusion_fixable(rule, _MONDAY) is False


def test_is_exclusion_fixable_include_not_a_literal_date() -> None:
    """A date matched only via a range (never a literal `dates` entry) isn't fixable."""
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        date_ranges=frozenset({("2023-12-25", "2024-01-05")}),
    )

    assert SchedulerEngine._is_exclusion_fixable(rule, _MONDAY) is False


def test_is_exclusion_fixable_include_with_day_conditions() -> None:
    """A day_conditions match can't be safely predicted/cleared, so it's never fixable."""
    rule = _make_rule(
        date_mode=RuleDateMode.INCLUDE,
        dates=frozenset({_MONDAY.isoformat()}),
        day_conditions=frozenset({DayConditionType.SHABBOS}),
    )

    assert SchedulerEngine._is_exclusion_fixable(rule, _MONDAY) is False
