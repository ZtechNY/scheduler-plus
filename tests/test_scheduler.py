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
from unittest.mock import AsyncMock, patch
import asyncio

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import ATTR_TEMPERATURE, EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import Context, CoreState, Event, HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.scheduler_plus.const import (
    DOMAIN,
    DayConditionType,
    DeviceType,
    EVENT_RULE_TRIGGERED,
    TimeProviderType,
)
from custom_components.scheduler_plus.coordinator import SchedulerPlusCoordinator
from custom_components.scheduler_plus.day_conditions import DEFAULT_DAY_CONDITIONS
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


@pytest.mark.parametrize("turning_on", [True, False])
@pytest.mark.parametrize("error", [RuntimeError("Honeywell could not set system mode"), TimeoutError()])
async def test_device_failure_notifies_and_allows_next_device(
    engine: SchedulerEngine, turning_on: bool, error: Exception,
) -> None:
    """A failed action produces a useful notice and does not escape dispatch."""
    handler = FakeDeviceHandler()
    method = "async_turn_on" if turning_on else "async_turn_off"
    rule = _make_rule()
    with (
        patch.object(handler, method, new=AsyncMock(side_effect=[error, None])),
        patch("custom_components.scheduler_plus.scheduler.persistent_notification.async_create") as notify,
    ):
        for entity_id in ("light.failed", "light.healthy"):
            if turning_on:
                await engine._issue_turn_on(handler, entity_id, {}, rule=rule, schedule_name="Morning")
            else:
                await engine._issue_turn_off(handler, entity_id, rule=rule, schedule_name="Morning")
        notify.assert_called_once()
        message = notify.call_args.args[1]
        assert "Morning" in message
        assert rule.name in message
        assert "light.failed" in message
        assert (str(error) or "TimeoutError") in message
        assert "Time:" in message


async def test_repeated_failures_use_same_notification(engine: SchedulerEngine) -> None:
    """Repeated failures update one notice; success does not hide the failure."""
    handler = FakeDeviceHandler()
    rule = _make_rule()
    with (
        patch.object(handler, "async_turn_off", new=AsyncMock(side_effect=[TimeoutError(), TimeoutError(), None])),
        patch("custom_components.scheduler_plus.scheduler.persistent_notification.async_create") as notify,
        patch("custom_components.scheduler_plus.scheduler.persistent_notification.async_dismiss") as dismiss,
    ):
        for _ in range(3):
            await engine._issue_turn_off(handler, "light.test", rule=rule, schedule_name="Morning")
        assert notify.call_count == 2
        assert notify.call_args_list[0].kwargs["notification_id"] == notify.call_args_list[1].kwargs["notification_id"]
        dismiss.assert_not_called()


async def test_action_cancellation_is_not_reported_as_failure(engine: SchedulerEngine) -> None:
    """Integration shutdown must still be able to cancel a running action."""
    handler = FakeDeviceHandler()
    with (
        patch.object(handler, "async_turn_off", new=AsyncMock(side_effect=asyncio.CancelledError())),
        patch("custom_components.scheduler_plus.scheduler.persistent_notification.async_create") as notify,
        pytest.raises(asyncio.CancelledError),
    ):
        await engine._issue_turn_off(handler, "light.test", rule=_make_rule(), schedule_name="Morning")
    notify.assert_not_called()


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
    time_plan: dict[str, Any] | None = None,
    manual_auto_off_minutes: int | None = None,
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
        time_plan=time_plan,
        manual_auto_off_minutes=manual_auto_off_minutes,
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
    # async_config_entry_first_refresh() requires a config entry in current
    # HA; this bare coordinator has none, so load it with a plain refresh.
    await coordinator.async_refresh()

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


async def test_resolve_time_plan_uses_minute_durations_and_exact_boundaries(
    engine: SchedulerEngine,
) -> None:
    """A Time plan supports arbitrary minute durations and an overnight end."""
    rule = _make_rule(
        on_time="20:44",
        off_time="00:16",
        time_plan={"enabled": True, "on_minutes": 32, "off_minutes": 17},
    )

    transitions = await engine._async_resolve_time_plan(rule, _MONDAY)

    assert transitions is not None
    assert [(at.strftime("%H:%M"), action) for at, action in transitions] == [
        ("20:44", "on"),
        ("21:16", "off"),
        ("21:33", "on"),
        ("22:05", "off"),
        ("22:22", "on"),
        ("22:54", "off"),
        ("23:11", "on"),
        ("23:43", "off"),
        ("00:00", "on"),
        ("00:16", "off"),
    ]


async def test_resolve_time_plan_supports_separate_periods(
    engine: SchedulerEngine,
) -> None:
    """A Time plan can contain unrelated start/end pairs."""
    rule = _make_rule(
        on_time="08:00",
        off_time="10:55",
        time_plan={
            "enabled": True,
            "periods": [
                {"start": "08:00", "end": "08:20"},
                {"start": "10:32", "end": "10:55"},
            ],
        },
    )

    transitions = await engine._async_resolve_time_plan(rule, _MONDAY)

    assert transitions is not None
    assert [(at.strftime("%H:%M"), action) for at, action in transitions] == [
        ("08:00", "on"),
        ("08:20", "off"),
        ("10:32", "on"),
        ("10:55", "off"),
    ]


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


async def test_refresh_rule_off_only_catches_up_missed_off(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """An off-only rule whose off already passed today is caught up to off.

    Nothing is left to schedule for today, so no callback stays pending.
    """
    rule = _make_rule(on_time="06:00", off_time="21:00", on_enabled=False)
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 23, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, now)

    assert fake_device_handler.turn_off_calls == ["light.test"]
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
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
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
    freezer.move_to(now)

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
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """A genuine external mismatch reapplies the rule's action after the grace period."""
    rule = _make_climate_rule(
        on_time="06:00", off_time="21:00", allow_override=False, override_grace_minutes=1
    )
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    freezer.move_to(now)

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
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """A second override before the grace period elapses resets the countdown."""
    rule = _make_climate_rule(
        on_time="06:00", off_time="21:00", allow_override=False, override_grace_minutes=2
    )
    schedule = _make_schedule(rule, entities=["climate.test"], device_type=DeviceType.CLIMATE)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    freezer.move_to(now)

    await engine._async_refresh_rule(schedule, rule, now)
    assert len(fake_climate_handler.turn_on_calls) == 1

    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 75})
    await hass.async_block_till_done()

    # A second override before the first 2-minute countdown would elapse.
    # Time moves with the frozen clock, so timers set later are set later.
    freezer.tick(timedelta(minutes=1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 80})
    await hass.async_block_till_done()

    # Just past the FIRST change's original deadline (t=2min) - if the
    # countdown hadn't reset, this would already have reapplied.
    freezer.tick(timedelta(minutes=1, seconds=30))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(fake_climate_handler.turn_on_calls) == 1

    # Past the SECOND change's deadline (t=1min + 2min = t=3min).
    freezer.tick(timedelta(minutes=1))
    async_fire_time_changed(hass)
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
    # Midnight refresh/shutdown can call the saved teardown after off-time.
    teardown()

    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 75})
    await hass.async_block_till_done()
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(minutes=2))
    await hass.async_block_till_done()

    assert fake_climate_handler.turn_on_calls == []


async def test_stale_teardown_preserves_replacement_enforcement(
    engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler, hass: HomeAssistant
) -> None:
    """Refreshing an old rule must not cancel its replacement's grace timer."""
    rule = _make_climate_rule(allow_override=False, override_grace_minutes=1)
    old_teardown = engine._arm_override_enforcement(
        rule, "climate.test", fake_climate_handler, "Old schedule"
    )
    new_teardown = engine._arm_override_enforcement(
        rule, "climate.test", fake_climate_handler, "New schedule"
    )
    hass.states.async_set("climate.test", "off")
    await hass.async_block_till_done()
    pending = engine._pending_reapply_at["climate.test"]

    old_teardown()

    assert engine._active_enforcement["climate.test"] is new_teardown
    assert engine._pending_reapply_at["climate.test"] == pending
    new_teardown()


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
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Pausing a schedule cancels its already-scheduled callbacks, not just future refreshes.

    Regression test for the pre-existing bug this feature's cancellation
    fix addresses: _async_refresh_all used to `continue` past a
    disabled/overridden schedule without ever calling _cancel_rule, so an
    already-scheduled on/off would still fire despite the schedule being
    paused in the meantime.
    """
    now = datetime(2024, 1, 1, 3, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    freezer.move_to(now)
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


async def test_refresh_all_cancels_callbacks_for_deleted_schedule(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """Deleting a schedule must cancel callbacks that were already queued."""
    now = datetime(2024, 1, 1, 3, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule)

    await engine._async_refresh_rule(schedule, rule, now)
    assert len(engine._unsub_rules[rule.id]) == 2

    # The schedule is gone from persistent data. There is no schedule loop
    # iteration that could call _cancel_rule for it, so _async_refresh_all
    # must explicitly remove orphaned rule callback entries.
    engine._coordinator.async_set_updated_data({"version": 1, "schedules": []})
    await engine._async_refresh_all()

    assert engine._unsub_rules == {}
    assert fake_device_handler.turn_on_calls == []


async def test_refresh_all_cancels_callbacks_for_deleted_rule(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """Removing a rule from an existing schedule must cancel its callbacks."""
    now = datetime(2024, 1, 1, 3, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    rule = _make_rule(on_time="06:00", off_time="21:00")
    schedule = _make_schedule(rule)

    await engine._async_refresh_rule(schedule, rule, now)
    assert len(engine._unsub_rules[rule.id]) == 2

    schedule.rules = []
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [schedule.to_dict()]}
    )
    await engine._async_refresh_all()

    assert engine._unsub_rules == {}
    assert fake_device_handler.turn_on_calls == []


async def test_refresh_all_skips_overridden_schedule(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    """An overridden schedule's rules are never evaluated, like a disabled one."""
    freezer.move_to(datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE))
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

async def test_mode_gates_live_execution_and_preview(engine, fake_device_handler, freezer):
    """A Run assignment makes the schedule exclusive to that mode's dates."""
    rule = _make_rule()
    schedule = _make_schedule(rule)
    engine._coordinator.data["modes"] = [{"weekdays": [], "dates": {}, "run_schedules": [schedule.id]}]
    now = datetime(2026, 7, 27, 12, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    freezer.move_to(now)
    await engine._async_refresh_rule(schedule, rule, now)
    assert not fake_device_handler.turn_on_calls
    assert not await engine.async_get_day_events(schedule, now.date())
    engine._coordinator.data["modes"][0]["dates"][now.date().isoformat()] = True
    await engine._async_refresh_rule(schedule, rule, now)
    assert fake_device_handler.turn_on_calls
    assert await engine.async_get_day_events(schedule, now.date())


async def test_overnight_mode_keeps_next_morning_off(engine, fake_device_handler, freezer):
    """Gating is by the occurrence's START date, so the off action survives.

    This is the whole reason modes gate on the starting date rather than on
    the date the action falls: a Tish that runs 20:00-05:00 must still shut
    off at 5am, on a morning its mode is no longer on.
    """
    rule = _make_rule(on_time="20:00", off_time="05:00")
    schedule = _make_schedule(rule)
    now = datetime(2026, 7, 28, 1, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    freezer.move_to(now)
    yesterday = (now - timedelta(days=1)).date()
    engine._coordinator.data["modes"] = [{"weekdays": [], "dates": {yesterday.isoformat(): True}, "run_schedules": [schedule.id]}]
    with patch.object(engine, "_schedule_turn_off", return_value=lambda: None) as off:
        await engine._async_refresh_rule(schedule, rule, now)
    assert fake_device_handler.turn_on_calls
    off.assert_called_once()
    assert off.call_args.args[2].date() == now.date()
    assert not await engine.async_get_day_events(schedule, now.date())


async def test_mode_skip_wins_over_a_run_assignment(engine, fake_device_handler):
    """Two modes disagreeing about one schedule resolves to "don't run"."""
    rule = _make_rule()
    schedule = _make_schedule(rule)
    now = dt_util.as_local(datetime(2026, 7, 27, 12, tzinfo=dt_util.UTC))
    today = now.date().isoformat()
    engine._coordinator.data["modes"] = [
        {"weekdays": [], "dates": {today: True}, "run_schedules": [schedule.id]},
        {"weekdays": [], "dates": {today: True}, "skip_schedules": [schedule.id]},
    ]

    await engine._async_refresh_rule(schedule, rule, now)

    assert not fake_device_handler.turn_on_calls
    assert not await engine.async_get_day_events(schedule, now.date())


async def test_mode_blocked_schedule_is_not_reported_as_conflicting(engine):
    """Schedules that can never run on the same day don't overlap.

    Conflicts are previewed per checked date, so a mode that keeps one of
    the pair off that day means there's nothing to warn about - see the
    caveat the editor shows alongside the conflict list.
    """
    candidate = _make_schedule(_make_rule(id="candidate-rule"), id="candidate")
    other = _make_schedule(_make_rule(id="other-rule"), id="other")
    engine._coordinator.data["schedules"] = [other.to_dict()]
    engine._coordinator.data["modes"] = [
        {"weekdays": [], "dates": {}, "run_schedules": [other.id]}
    ]

    assert await engine.async_find_conflicts(candidate) == []

    engine._coordinator.data["modes"] = []

    assert await engine.async_find_conflicts(candidate)


# --- v0.5.3 reliability fixes -------------------------------------------------


def _set_schedules(engine: SchedulerEngine, *schedules: Schedule) -> None:
    """Store `schedules` in the engine's coordinator, as the websocket API would."""
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [schedule.to_dict() for schedule in schedules]}
    )


def _at(day: date, hour: int, minute: int = 0, second: int = 0) -> datetime:
    return datetime(
        day.year, day.month, day.day, hour, minute, second,
        tzinfo=dt_util.DEFAULT_TIME_ZONE,
    )


async def _advance_to(hass: HomeAssistant, freezer: FrozenDateTimeFactory, when: datetime) -> None:
    """Move the frozen clock to `when` and run every callback now due."""
    freezer.move_to(when)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


async def test_off_only_rule_before_default_on_time_fires_same_day(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 1: an off-only 05:00 rule isn't pushed past its hidden 06:00 on time."""
    rule = _make_rule(on_time="06:00", off_time="05:00", on_enabled=False)
    schedule = _make_schedule(rule)

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)
    assert occurrence is not None
    assert occurrence[1] == _at(_MONDAY, 5)

    freezer.move_to(_at(_MONDAY, 3))
    await engine._async_refresh_rule(schedule, rule, _at(_MONDAY, 3))
    await _advance_to(hass, freezer, _at(_MONDAY, 5, 0, 1))

    assert fake_device_handler.turn_off_calls == ["light.test"]


@pytest.mark.parametrize(
    "off_provider",
    [TimeProviderType.SUNRISE, TimeProviderType.SUNSET],
    ids=["unresolvable", "unregistered"],
)
async def test_on_only_rule_ignores_its_unused_off_time(
    engine: SchedulerEngine, off_provider: TimeProviderType
) -> None:
    """Fix 1: an on-only rule resolves even if its unused off time can't."""
    rule = _make_rule(on_time="06:00", off_provider=off_provider, off_enabled=False)

    occurrence = await engine._async_resolve_occurrence(rule, _MONDAY)

    assert occurrence is not None
    assert occurrence[0] == _at(_MONDAY, 6)


async def test_startup_catches_up_off_for_window_that_already_ended(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 2: after an outage spanning a window's off, startup turns it off."""
    freezer.move_to(_at(_MONDAY, 12))
    _set_schedules(engine, _make_schedule(_make_rule(on_time="06:00", off_time="09:00")))

    await engine.async_start()
    await hass.async_block_till_done()

    assert fake_device_handler.turn_off_calls == ["light.test"]
    assert fake_device_handler.turn_on_calls == []


async def test_startup_applies_latest_event_across_rules(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 2: each target ends up in the state of its last scheduled event today."""
    freezer.move_to(_at(_MONDAY, 12))
    schedule = _make_schedule(
        _make_rule(id="morning-on", on_time="06:00", off_enabled=False)
    )
    schedule.rules.append(
        _make_rule(id="mid-morning-off", off_time="09:00", on_enabled=False)
    )
    _set_schedules(engine, schedule)

    await engine.async_start()
    await hass.async_block_till_done()

    assert fake_device_handler.turn_on_calls == []
    assert fake_device_handler.turn_off_calls == ["light.test"]


async def test_startup_pass_waits_for_home_assistant_started(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 3: no catch-up until other integrations' entities exist, then again 60s on."""
    freezer.move_to(_at(_MONDAY, 12))
    _set_schedules(engine, _make_schedule(_make_rule(on_time="06:00", off_time="21:00")))
    hass.set_state(CoreState.starting)

    await engine.async_start()
    await hass.async_block_till_done()
    assert fake_device_handler.turn_on_calls == []

    hass.set_state(CoreState.running)
    hass.bus.async_fire(EVENT_HOMEASSISTANT_STARTED)
    await hass.async_block_till_done()
    assert len(fake_device_handler.turn_on_calls) == 1

    await _advance_to(hass, freezer, _at(_MONDAY, 12, 1, 1))
    assert len(fake_device_handler.turn_on_calls) == 2


@pytest.fixture
def calendar_engine(engine: SchedulerEngine) -> SchedulerEngine:
    """The fake-plugin engine, but with the real Shabbos/Yom Tov day conditions."""
    engine._day_conditions = DEFAULT_DAY_CONDITIONS
    return engine


# A plain week: Friday 2026-11-06, Shabbos 2026-11-07.
_FRIDAY = date(2026, 11, 6)
_SATURDAY = date(2026, 11, 7)


async def test_shabbos_rule_fires_on_friday_night(
    calendar_engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 4: Friday night counts as Shabbos, though it isn't yet at midnight."""
    hass.states.async_set("sensor.yidcal_zman_erev", _at(_FRIDAY, 16, 25).isoformat())
    hass.states.async_set("binary_sensor.yidcal_no_melucha_regular_shabbos", "off")
    rule = _make_rule(
        on_time="19:00",
        off_time="23:00",
        date_mode=RuleDateMode.INCLUDE,
        day_conditions=frozenset({DayConditionType.SHABBOS}),
    )
    freezer.move_to(_at(_FRIDAY, 0, 0, 30))
    _set_schedules(calendar_engine, _make_schedule(rule))

    await calendar_engine._async_refresh_all()
    await _advance_to(hass, freezer, _at(_FRIDAY, 19, 0, 1))

    assert len(fake_device_handler.turn_on_calls) == 1


async def test_shabbos_window_crossing_midnight_keeps_its_off(
    calendar_engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 4: the midnight rescan keeps Friday night's 01:00 off - the end follows the start."""
    hass.states.async_set("sensor.yidcal_zman_erev", _at(_FRIDAY, 16, 25).isoformat())
    hass.states.async_set("binary_sensor.yidcal_no_melucha_regular_shabbos", "on")
    rule = _make_rule(
        on_time="20:00",
        off_time="01:00",
        date_mode=RuleDateMode.INCLUDE,
        day_conditions=frozenset({DayConditionType.SHABBOS}),
    )
    freezer.move_to(_at(_SATURDAY, 0, 0, 30))
    _set_schedules(calendar_engine, _make_schedule(rule))

    await calendar_engine._async_refresh_all()
    await _advance_to(hass, freezer, _at(_SATURDAY, 1, 0, 1))

    assert fake_device_handler.turn_off_calls == ["light.test"]


async def test_skip_yom_tov_overnight_rule_stays_off_on_second_day(
    calendar_engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 4: midnight into Pesach's second day doesn't revive day one's skipped window."""
    hass.states.async_set("binary_sensor.yidcal_no_melucha_yomtov", "on")
    rule = _make_rule(
        on_time="18:00",
        off_time="02:00",
        date_mode=RuleDateMode.EXCLUDE,
        day_conditions=frozenset({DayConditionType.YOM_TOV}),
    )
    freezer.move_to(_at(date(2027, 4, 23), 0, 0, 30))
    _set_schedules(calendar_engine, _make_schedule(rule))

    await calendar_engine._async_refresh_all()
    await hass.async_block_till_done()

    assert fake_device_handler.turn_on_calls == []


async def test_yidcal_sensor_change_triggers_rescan(
    calendar_engine: SchedulerEngine, hass: HomeAssistant
) -> None:
    """Fix 4: a new zman value re-evaluates rules without waiting for midnight."""
    await calendar_engine.async_start()
    await hass.async_block_till_done()

    with patch.object(calendar_engine, "_async_refresh_all", new=AsyncMock()) as refresh:
        hass.states.async_set(
            "sensor.yidcal_zman_erev", _at(_FRIDAY, 16, 25).isoformat()
        )
        await hass.async_block_till_done()

    refresh.assert_called_once()


async def test_missing_schedule_entity_raises_repairs_issue(
    engine: SchedulerEngine,
    hass: HomeAssistant,
    issue_registry: ir.IssueRegistry,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 5: a scheduled light that doesn't exist is surfaced, then cleared."""
    freezer.move_to(_at(_MONDAY, 3))
    _set_schedules(engine, _make_schedule(_make_rule(), entities=["light.gone"]))

    await engine._async_refresh_all()
    assert issue_registry.async_get_issue(DOMAIN, "missing_entity_light.gone") is not None

    hass.states.async_set("light.gone", "off")
    await engine._async_refresh_all()
    assert issue_registry.async_get_issue(DOMAIN, "missing_entity_light.gone") is None


class GatedTimeProvider(TimeProvider):
    """A fixed-time provider that waits for `gate`, to interleave refreshes."""

    def __init__(self) -> None:
        """Initialize closed."""
        self.gate = asyncio.Event()

    async def async_resolve(
        self, hass: HomeAssistant, reference_date: date, params: dict[str, Any]
    ) -> datetime | None:
        """Resolve like FixedTimeProvider once the gate opens."""
        await self.gate.wait()
        return await FixedTimeProvider().async_resolve(hass, reference_date, params)


async def test_overlapping_refreshes_leave_no_timers_for_deleted_rule(
    engine: SchedulerEngine, hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Fix 6: a rule deleted mid-refresh can't keep the timers that refresh creates."""
    provider = GatedTimeProvider()
    engine._time_providers = TimeProviderRegistry({TimeProviderType.FIXED: provider})
    freezer.move_to(_at(_MONDAY, 3))
    _set_schedules(engine, _make_schedule(_make_rule()))

    first = hass.async_create_task(engine._async_refresh_all())
    await asyncio.sleep(0)
    engine._coordinator.async_set_updated_data({"version": 1, "schedules": []})
    second = hass.async_create_task(engine._async_refresh_all())
    await asyncio.sleep(0)
    provider.gate.set()
    await first
    await second

    assert engine._unsub_rules == {}


async def test_rescan_does_not_resend_until_that_rule_changes(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Fix 7: rescans keep manual changes; editing the rule catches up again."""
    freezer.move_to(_at(_MONDAY, 12))
    other = _make_schedule(_make_rule(id="other-rule"), id="other", entities=["light.other"])
    _set_schedules(engine, _make_schedule(_make_rule()), other)
    await engine._async_refresh_all()
    await hass.async_block_till_done()
    assert [call[0] for call in fake_device_handler.turn_on_calls] == ["light.test", "light.other"]

    # Midnight-style rescan, then an edit to a different schedule.
    await engine._async_refresh_all()
    other.name = "Renamed"
    _set_schedules(engine, _make_schedule(_make_rule()), other)
    await engine._async_refresh_all()
    await hass.async_block_till_done()
    assert len(fake_device_handler.turn_on_calls) == 2

    _set_schedules(engine, _make_schedule(_make_rule(on_time="07:00")), other)
    await engine._async_refresh_all()
    await hass.async_block_till_done()
    assert [call[0] for call in fake_device_handler.turn_on_calls[2:]] == ["light.test"]


async def test_unreadable_stored_schedule_does_not_block_the_rest(
    engine: SchedulerEngine, freezer: FrozenDateTimeFactory
) -> None:
    """Fix 8: one corrupt schedule is skipped; the others are still scheduled."""
    freezer.move_to(_at(_MONDAY, 3))
    good = _make_schedule(_make_rule())
    engine._coordinator.async_set_updated_data(
        {"version": 1, "schedules": [{"id": "broken"}, good.to_dict()]}
    )

    await engine._async_refresh_all()

    assert len(engine._unsub_rules["rule-1"]) == 2


async def _hang(*_args: Any, **_kwargs: Any) -> None:
    """A device call that never returns."""
    await asyncio.Event().wait()


async def test_service_call_times_out_and_is_reported(engine: SchedulerEngine) -> None:
    """Fix 9: an unresponsive device call is abandoned and reported as a failure."""
    handler = FakeDeviceHandler()
    with (
        patch.object(handler, "async_turn_on", new=AsyncMock(side_effect=_hang)),
        patch(
            "custom_components.scheduler_plus.scheduler._SERVICE_CALL_TIMEOUT_SECONDS",
            0.05,
            create=True,
        ),
        patch(
            "custom_components.scheduler_plus.scheduler.persistent_notification.async_create"
        ) as notify,
    ):
        await asyncio.wait_for(
            engine._issue_turn_on(
                handler, "light.test", {}, rule=_make_rule(), schedule_name="Morning"
            ),
            timeout=5,
        )

    notify.assert_called_once()


async def test_slow_device_does_not_block_other_catch_ups(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    fake_switch_handler: FakeDeviceHandler,
) -> None:
    """Fix 9: catch-ups run concurrently in the background, not one after another."""
    # On-only at midnight: due at any time of day the test runs.
    rule = _make_rule(on_time="00:00", off_enabled=False)
    _set_schedules(
        engine,
        _make_schedule(
            rule,
            entities=["light.slow", "switch.fast"],
            device_type=DeviceType.LIGHT_SWITCH,
        ),
    )

    with patch.object(fake_device_handler, "async_turn_on", new=AsyncMock(side_effect=_hang)):
        await asyncio.wait_for(engine._async_refresh_all(), timeout=5)

    assert [call[0] for call in fake_switch_handler.turn_on_calls] == ["switch.fast"]


async def test_dst_fall_back_repeated_time_fires_once(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Nov 1 2026: 01:30 happens twice on the wall clock but fires once."""
    await hass.config.async_set_time_zone("America/New_York")
    freezer.move_to(_at(date(2026, 11, 1), 0, 0, 30))
    _set_schedules(engine, _make_schedule(_make_rule(on_time="01:30", off_enabled=False)))
    await engine._async_refresh_all()

    first_0130 = datetime(2026, 11, 1, 5, 30, tzinfo=dt_util.UTC)  # 01:30 EDT
    await _advance_to(hass, freezer, first_0130 + timedelta(seconds=1))
    assert len(fake_device_handler.turn_on_calls) == 1

    # A rescan during the repeated hour, then the second 01:30 (EST).
    freezer.move_to(first_0130 + timedelta(minutes=45))
    await engine._async_refresh_all()
    await _advance_to(hass, freezer, first_0130 + timedelta(hours=1, seconds=1))
    assert len(fake_device_handler.turn_on_calls) == 1


async def test_dst_spring_forward_skipped_time_fires_once_after_jump(
    engine: SchedulerEngine,
    fake_device_handler: FakeDeviceHandler,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Mar 14 2027: 02:30 never happens; it fires once, at 03:00 right after the jump."""
    await hass.config.async_set_time_zone("America/New_York")
    freezer.move_to(_at(date(2027, 3, 14), 0, 0, 30))
    _set_schedules(engine, _make_schedule(_make_rule(on_time="02:30", off_enabled=False)))
    await engine._async_refresh_all()

    jump = datetime(2027, 3, 14, 7, 0, tzinfo=dt_util.UTC)  # 02:00 EST -> 03:00 EDT
    await _advance_to(hass, freezer, jump - timedelta(minutes=1))
    assert fake_device_handler.turn_on_calls == []

    await _advance_to(hass, freezer, jump + timedelta(seconds=1))
    assert len(fake_device_handler.turn_on_calls) == 1

    await _advance_to(hass, freezer, jump + timedelta(hours=1))
    assert len(fake_device_handler.turn_on_calls) == 1
