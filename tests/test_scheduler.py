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
from datetime import date, datetime
from typing import Any

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from custom_components.scheduler_plus.const import DeviceType, TimeProviderType
from custom_components.scheduler_plus.coordinator import SchedulerPlusCoordinator
from custom_components.scheduler_plus.device_handlers.base import (
    DeviceHandler,
    DeviceHandlerRegistry,
)
from custom_components.scheduler_plus.models import Rule, Schedule, TimeSpec, Weekday
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


class FakeDeviceHandler(DeviceHandler):
    """A device handler recording calls instead of touching real entities."""

    def __init__(self) -> None:
        """Initialize with empty call logs."""
        self.turn_on_calls: list[tuple[str, dict[str, Any]]] = []
        self.turn_off_calls: list[str] = []

    async def async_turn_on(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> None:
        """Record the call instead of applying it."""
        self.turn_on_calls.append((entity_id, action))

    async def async_turn_off(self, hass: HomeAssistant, entity_id: str) -> None:
        """Record the call instead of applying it."""
        self.turn_off_calls.append(entity_id)


def _make_rule(
    *,
    on_time: str = "06:00",
    off_time: str = "21:00",
    on_provider: TimeProviderType = TimeProviderType.FIXED,
    off_provider: TimeProviderType = TimeProviderType.FIXED,
    days: frozenset[Weekday] = frozenset(Weekday),
    enabled: bool = True,
) -> Rule:
    """Build a Rule, defaulting to a FIXED-time rule active every day."""
    return Rule(
        id="rule-1",
        name="Test rule",
        enabled=enabled,
        days=days,
        on_time=TimeSpec(provider=on_provider, params={"time": on_time}),
        off_time=TimeSpec(provider=off_provider, params={"time": off_time}),
    )


def _make_schedule(rule: Rule, *, entities: list[str] | None = None) -> Schedule:
    """Build a single-rule Schedule targeting `entities` (default: one light)."""
    return Schedule(
        id="sched-1",
        name="Test schedule",
        device_type=DeviceType.LIGHT,
        entities=entities or ["light.test"],
        rules=[rule],
    )


@pytest.fixture
def fake_device_handler() -> FakeDeviceHandler:
    """A fresh FakeDeviceHandler for each test."""
    return FakeDeviceHandler()


@pytest.fixture
async def engine(
    hass: HomeAssistant, fake_device_handler: FakeDeviceHandler
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
    device_handlers = DeviceHandlerRegistry({DeviceType.LIGHT: fake_device_handler})

    scheduler_engine = SchedulerEngine(
        hass,
        coordinator,
        time_providers=time_providers,
        device_handlers=device_handlers,
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

    await engine._async_refresh_rule(schedule, rule, fake_device_handler, now)

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

    await engine._async_refresh_rule(schedule, rule, fake_device_handler, now)

    assert fake_device_handler.turn_on_calls == []
    assert fake_device_handler.turn_off_calls == []
    assert len(engine._unsub_rules[rule.id]) == 2


async def test_refresh_rule_disabled_rule_schedules_nothing(
    engine: SchedulerEngine, fake_device_handler: FakeDeviceHandler
) -> None:
    """A disabled rule is skipped entirely, even if it would otherwise be active."""
    rule = _make_rule(enabled=False)
    schedule = _make_schedule(rule)
    now = datetime(2024, 1, 1, 12, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)

    await engine._async_refresh_rule(schedule, rule, fake_device_handler, now)

    assert fake_device_handler.turn_on_calls == []
    assert rule.id not in engine._unsub_rules


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
