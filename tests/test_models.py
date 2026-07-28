"""Unit tests for Scheduler+ domain models."""

from __future__ import annotations

from datetime import date

from custom_components.scheduler_plus.const import (
    DayConditionType,
    DeviceType,
    TimeProviderType,
)
from custom_components.scheduler_plus.models import (
    Rule,
    RuleDateMode,
    Schedule,
    TimeSpec,
    Weekday,
)


def test_time_spec_round_trip() -> None:
    """TimeSpec should survive a to_dict/from_dict round trip unchanged."""
    spec = TimeSpec(provider=TimeProviderType.SUNSET, params={"offset_minutes": -15})

    restored = TimeSpec.from_dict(spec.to_dict())

    assert restored == spec


def test_time_spec_to_dict_defaults_to_empty_params() -> None:
    """A TimeSpec with no params should serialize to an empty params dict."""
    spec = TimeSpec(provider=TimeProviderType.FIXED)

    assert spec.to_dict() == {"provider": "fixed", "params": {}}


def test_rule_round_trip() -> None:
    """Rule should survive a to_dict/from_dict round trip unchanged."""
    rule = Rule(
        id="rule-1",
        name="Weekdays",
        enabled=True,
        days=frozenset({Weekday.MONDAY, Weekday.TUESDAY}),
        on_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "06:00"}),
        off_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "21:00"}),
        action={"brightness": 255},
    )

    restored = Rule.from_dict(rule.to_dict())

    assert restored == rule


def test_rule_round_trip_on_only() -> None:
    """An on-only rule's on_enabled/off_enabled should survive a round trip."""
    rule = Rule(
        id="rule-1",
        name="Porch light",
        days=frozenset(Weekday),
        on_time=TimeSpec(provider=TimeProviderType.SUNSET, params={"offset_minutes": 0}),
        off_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "21:00"}),
        on_enabled=True,
        off_enabled=False,
    )

    restored = Rule.from_dict(rule.to_dict())

    assert restored == rule
    assert restored.on_enabled is True
    assert restored.off_enabled is False


def test_rule_from_dict_defaults_on_off_enabled_for_legacy_data() -> None:
    """A stored rule from before this field existed loads as both enabled."""
    legacy_data = {
        "id": "rule-1",
        "name": "Weekdays",
        "enabled": True,
        "days": ["mon"],
        "on_time": {"provider": "fixed", "params": {"time": "06:00"}},
        "off_time": {"provider": "fixed", "params": {"time": "21:00"}},
        "action": {},
    }

    rule = Rule.from_dict(legacy_data)

    assert rule.on_enabled is True
    assert rule.off_enabled is True


def test_rule_round_trip_with_date_filter() -> None:
    """Rule's date_mode/dates should survive a to_dict/from_dict round trip."""
    rule = Rule(
        id="rule-1",
        name="Every Monday, except this one",
        days=frozenset({Weekday.MONDAY}),
        date_mode=RuleDateMode.EXCLUDE,
        dates=frozenset({"2024-01-08", "2024-03-04"}),
        on_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "06:00"}),
        off_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "21:00"}),
    )

    restored = Rule.from_dict(rule.to_dict())

    assert restored == rule


def test_rule_round_trip_with_date_ranges() -> None:
    """Rule's date_ranges should survive a to_dict/from_dict round trip."""
    rule = Rule(
        id="rule-1",
        name="Away for vacation",
        days=frozenset(Weekday),
        date_mode=RuleDateMode.EXCLUDE,
        date_ranges=frozenset({("2024-07-01", "2024-07-15")}),
        on_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "06:00"}),
        off_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "21:00"}),
    )

    restored = Rule.from_dict(rule.to_dict())

    assert restored == rule


def test_rule_round_trip_with_day_conditions() -> None:
    """Rule's day_conditions should survive a to_dict/from_dict round trip."""
    rule = Rule(
        id="rule-1",
        name="Every day, except Yom Tov",
        days=frozenset(Weekday),
        date_mode=RuleDateMode.EXCLUDE,
        day_conditions=frozenset({DayConditionType.YOM_TOV}),
        on_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "06:00"}),
        off_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "21:00"}),
    )

    restored = Rule.from_dict(rule.to_dict())

    assert restored == rule


def test_rule_from_dict_defaults_date_mode_for_legacy_data() -> None:
    """A stored rule from before date filtering existed still loads cleanly."""
    legacy_data = {
        "id": "rule-1",
        "name": "Weekdays",
        "enabled": True,
        "days": ["mon"],
        "on_time": {"provider": "fixed", "params": {"time": "06:00"}},
        "off_time": {"provider": "fixed", "params": {"time": "21:00"}},
        "action": {},
    }

    rule = Rule.from_dict(legacy_data)

    assert rule.date_mode is RuleDateMode.ALWAYS
    assert rule.dates == frozenset()
    assert rule.date_ranges == frozenset()
    assert rule.day_conditions == frozenset()


def test_rule_to_dict_sorts_days() -> None:
    """Serialized days must be sorted, since frozenset iteration order is not."""
    rule = Rule(
        id="rule-1",
        name="Weekend",
        days=frozenset({Weekday.SUNDAY, Weekday.SATURDAY}),
        on_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "08:00"}),
        off_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "22:00"}),
    )

    assert rule.to_dict()["days"] == ["sat", "sun"]


def test_schedule_round_trip() -> None:
    """Schedule should survive a to_dict/from_dict round trip, including nested rules."""
    rule = Rule(
        id="rule-1",
        name="Weekdays",
        days=frozenset({Weekday.MONDAY}),
        on_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "06:00"}),
        off_time=TimeSpec(provider=TimeProviderType.FIXED, params={"time": "21:00"}),
    )
    schedule = Schedule(
        id="sched-1",
        name="Office Lights",
        device_type=DeviceType.LIGHT,
        entities=["light.office"],
        rules=[rule],
    )

    restored = Schedule.from_dict(schedule.to_dict())

    assert restored == schedule


def test_schedule_defaults_enabled_and_rules() -> None:
    """A Schedule constructed without enabled/rules should default to True/[]."""
    schedule = Schedule(
        id="sched-1",
        name="Lobby Lights",
        device_type=DeviceType.LIGHT,
        entities=["light.lobby"],
    )

    assert schedule.enabled is True
    assert schedule.rules == []


def test_schedule_round_trip_with_active_window_and_override() -> None:
    """Schedule's active_date_mode/active_date_ranges/override_until round-trip."""
    schedule = Schedule(
        id="sched-1",
        name="Summer Hours",
        device_type=DeviceType.LIGHT,
        entities=["light.gym"],
        active_date_mode=RuleDateMode.INCLUDE,
        active_date_ranges=frozenset({("2024-07-01", "2024-08-31")}),
        override_until="2024-07-10",
    )

    restored = Schedule.from_dict(schedule.to_dict())

    assert restored == schedule


def test_schedule_from_dict_defaults_active_window_and_override_for_legacy_data() -> None:
    """A stored schedule from before these fields existed loads cleanly."""
    legacy_data = {
        "id": "sched-1",
        "name": "Office Lights",
        "enabled": True,
        "device_type": "light",
        "entities": ["light.office"],
        "rules": [],
    }

    schedule = Schedule.from_dict(legacy_data)

    assert schedule.active_date_mode is RuleDateMode.ALWAYS
    assert schedule.active_date_ranges == frozenset()
    assert schedule.override_until is None


def test_schedule_is_active_on_always() -> None:
    """ALWAYS mode ignores active_date_ranges entirely."""
    schedule = Schedule(
        id="sched-1",
        name="Regular Hours",
        device_type=DeviceType.LIGHT,
        entities=["light.office"],
    )

    assert schedule.is_active_on(date(2024, 1, 1)) is True
    assert schedule.is_active_on(date(2024, 12, 31)) is True


def test_schedule_is_active_on_include() -> None:
    """INCLUDE mode is only active while reference_date falls in a range."""
    schedule = Schedule(
        id="sched-1",
        name="Summer Hours",
        device_type=DeviceType.LIGHT,
        entities=["light.gym"],
        active_date_mode=RuleDateMode.INCLUDE,
        active_date_ranges=frozenset({("2024-07-01", "2024-08-31")}),
    )

    assert schedule.is_active_on(date(2024, 7, 15)) is True
    assert schedule.is_active_on(date(2024, 7, 1)) is True
    assert schedule.is_active_on(date(2024, 8, 31)) is True
    assert schedule.is_active_on(date(2024, 6, 30)) is False
    assert schedule.is_active_on(date(2024, 9, 1)) is False


def test_schedule_is_active_on_exclude() -> None:
    """EXCLUDE mode is active everywhere except the listed ranges."""
    schedule = Schedule(
        id="sched-1",
        name="Regular Hours",
        device_type=DeviceType.LIGHT,
        entities=["light.office"],
        active_date_mode=RuleDateMode.EXCLUDE,
        active_date_ranges=frozenset({("2024-07-01", "2024-08-31")}),
    )

    assert schedule.is_active_on(date(2024, 7, 15)) is False
    assert schedule.is_active_on(date(2024, 6, 30)) is True
    assert schedule.is_active_on(date(2024, 9, 1)) is True


def test_schedule_is_overridden() -> None:
    """A schedule is overridden through and including override_until, never after."""
    schedule = Schedule(
        id="sched-1",
        name="AC",
        device_type=DeviceType.CLIMATE,
        entities=["climate.gym"],
        override_until="2024-07-10",
    )

    assert schedule.is_overridden(date(2024, 7, 5)) is True
    assert schedule.is_overridden(date(2024, 7, 10)) is True
    assert schedule.is_overridden(date(2024, 7, 11)) is False


def test_schedule_is_overridden_none_when_unset() -> None:
    """A schedule with no override_until is never overridden."""
    schedule = Schedule(
        id="sched-1",
        name="AC",
        device_type=DeviceType.CLIMATE,
        entities=["climate.gym"],
    )

    assert schedule.is_overridden(date(2024, 7, 5)) is False
