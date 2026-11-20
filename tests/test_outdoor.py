"""Tests for outdoor-temperature rule conditions (Rule.outdoor_condition)."""

from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timedelta
from typing import Any

import pytest
import voluptuous as vol
from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.scheduler_plus.const import DeviceType
from custom_components.scheduler_plus.models import Rule
from custom_components.scheduler_plus.outdoor import condition_met, read_temperature
from custom_components.scheduler_plus.scheduler import SchedulerEngine
from custom_components.scheduler_plus.websocket import _RULE_SCHEMA

from .test_scheduler import (  # noqa: F401 - fixtures are used by name
    FakeClimateDeviceHandler,
    _make_climate_rule,
    _make_schedule,
    engine,
    fake_climate_handler,
    fake_device_handler,
    fake_switch_handler,
)

_SENSOR = "sensor.outdoor_temperature"
_CLIMATE = "climate.unit_1"


def _at(hour: int, minute: int = 0, second: int = 0) -> datetime:
    """A time on the test Monday, in Home Assistant's (test-configured) zone."""
    return datetime(2024, 1, 1, hour, minute, second, tzinfo=dt_util.DEFAULT_TIME_ZONE)

_HEAT = {"hvac_mode": "heat", "target_temperature": 70}


def _outdoor_rule(**condition: Any) -> Rule:
    """A 06:00-21:00 heating rule gated on outside <= 45 (2 degree buffer)."""
    allow_override = condition.pop("allow_override", True)
    rule = _make_climate_rule(
        on_time="06:00", off_time="21:00", action=_HEAT, allow_override=allow_override
    )
    return replace(
        rule,
        outdoor_condition={
            "operator": "below",
            "threshold": 45,
            "hysteresis": 2,
            "watch": False,
            "entity_id": None,
            **condition,
        },
    )


def _schedule(rule: Rule):
    return _make_schedule(rule, entities=[_CLIMATE], device_type=DeviceType.CLIMATE)


async def _refresh_at(
    hass: HomeAssistant,
    engine: SchedulerEngine,
    freezer: FrozenDateTimeFactory,
    rule: Rule,
    now: datetime | None = None,
) -> None:
    now = now or _at(12)
    freezer.move_to(now)
    await engine._async_refresh_rule(_schedule(rule), rule, now)
    await hass.async_block_till_done()


async def _set_outside(hass: HomeAssistant, value: Any) -> None:
    hass.states.async_set(_SENSOR, str(value), {"device_class": "temperature"})
    await hass.async_block_till_done()


# --- pure helpers -------------------------------------------------------------


@pytest.mark.parametrize(
    ("operator", "temperature", "active", "expected"),
    [
        ("below", 45, False, True),
        ("below", 46, False, False),
        ("below", 46, True, True),  # inside the buffer: stays on
        ("below", 47, True, True),
        ("below", 47.5, True, False),
        ("above", 80, False, True),
        ("above", 79, False, False),
        ("above", 78, True, True),
        ("above", 77.5, True, False),
    ],
)
def test_condition_met(operator: str, temperature: float, active: bool, expected: bool) -> None:
    threshold = 45 if operator == "below" else 80
    condition = {"operator": operator, "threshold": threshold, "hysteresis": 2}
    assert condition_met(condition, temperature, active=active) is expected


async def test_read_temperature(hass: HomeAssistant) -> None:
    hass.states.async_set("sensor.out", "41.5")
    hass.states.async_set("weather.home", "sunny", {"temperature": 38})
    hass.states.async_set("sensor.down", "unavailable")
    hass.states.async_set("sensor.bad", "n/a")
    assert read_temperature(hass, "sensor.out") == 41.5
    assert read_temperature(hass, "weather.home") == 38
    assert read_temperature(hass, "sensor.down") is None
    assert read_temperature(hass, "sensor.bad") is None
    assert read_temperature(hass, "sensor.missing") is None


def test_rule_round_trip_keeps_outdoor_condition() -> None:
    rule = _outdoor_rule(watch=True)
    assert Rule.from_dict(rule.to_dict()).outdoor_condition == rule.outdoor_condition
    legacy = rule.to_dict()
    del legacy["outdoor_condition"]
    assert Rule.from_dict(legacy).outdoor_condition is None


def test_schema_rejects_watch_without_window() -> None:
    base = {
        "name": "Heat",
        "days": ["mon"],
        "on_time": {"provider": "fixed", "params": {"time": "06:00"}},
        "off_time": {"provider": "fixed", "params": {"time": "21:00"}},
        "outdoor_condition": {"operator": "below", "threshold": 45, "watch": True},
    }
    validated = _RULE_SCHEMA(base)
    assert validated["outdoor_condition"]["hysteresis"] == 2
    with pytest.raises(vol.Invalid):
        _RULE_SCHEMA({**base, "off_enabled": False})
    with pytest.raises(vol.Invalid):
        _RULE_SCHEMA({**base, "time_plan": {"enabled": True, "periods": [{"start": "06:00", "end": "07:00"}]}})
    with pytest.raises(vol.Invalid):
        _RULE_SCHEMA({**base, "outdoor_condition": {"operator": "sideways", "threshold": 45}})


# --- gate on the on side --------------------------------------------------------


async def test_warm_outside_skips_turn_on(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    await _refresh_at(hass, engine, freezer, _outdoor_rule())
    assert fake_climate_handler.turn_on_calls == []


async def test_cold_outside_turns_on(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 40)
    await _refresh_at(hass, engine, freezer, _outdoor_rule())
    assert fake_climate_handler.turn_on_calls == [(_CLIMATE, _HEAT)]


async def test_rule_entity_overrides_default(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 40)
    hass.states.async_set("sensor.unit_2_outdoor", "60")
    await _refresh_at(hass, engine, freezer, _outdoor_rule(entity_id="sensor.unit_2_outdoor"))
    assert fake_climate_handler.turn_on_calls == []


@pytest.mark.parametrize("sensor_state", [None, "unavailable", "unknown"])
async def test_no_reading_runs_as_scheduled(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory, sensor_state: str | None,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    if sensor_state is not None:
        await _set_outside(hass, sensor_state)
    await _refresh_at(hass, engine, freezer, _outdoor_rule())
    assert fake_climate_handler.turn_on_calls == [(_CLIMATE, _HEAT)]


async def test_no_sensor_configured_runs_as_scheduled(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    await _refresh_at(hass, engine, freezer, _outdoor_rule())
    assert fake_climate_handler.turn_on_calls == [(_CLIMATE, _HEAT)]


async def test_off_still_runs_when_on_was_skipped(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    rule = _outdoor_rule()
    await _refresh_at(hass, engine, freezer, rule, _at(20, 59))
    freezer.move_to(_at(21, 0, 1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert fake_climate_handler.turn_on_calls == []
    assert fake_climate_handler.turn_off_calls == [_CLIMATE]


async def test_gate_only_rule_does_not_react_to_changes(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    await _refresh_at(hass, engine, freezer, _outdoor_rule(watch=False))
    await _set_outside(hass, 30)
    assert fake_climate_handler.turn_on_calls == []


# --- watching during the window -------------------------------------------------


async def test_watch_turns_on_and_off_with_buffer(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    await _refresh_at(hass, engine, freezer, _outdoor_rule(watch=True))
    assert fake_climate_handler.turn_on_calls == []

    await _set_outside(hass, 44)
    assert fake_climate_handler.turn_on_calls == [(_CLIMATE, _HEAT)]

    await _set_outside(hass, 46)  # inside the 2 degree buffer
    await _set_outside(hass, 47)
    assert fake_climate_handler.turn_off_calls == []

    await _set_outside(hass, 48)
    assert fake_climate_handler.turn_off_calls == [_CLIMATE]

    await _set_outside(hass, 46)  # back under 47 but not under 45: stays off
    assert len(fake_climate_handler.turn_on_calls) == 1


async def test_watch_ignores_unavailable_sensor(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    await _refresh_at(hass, engine, freezer, _outdoor_rule(watch=True))
    await _set_outside(hass, "unavailable")
    await _set_outside(hass, 50)
    assert fake_climate_handler.turn_on_calls == []
    assert fake_climate_handler.turn_off_calls == []


async def test_watch_keeps_buffer_state_across_rescan(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    rule = _outdoor_rule(watch=True)
    await _set_outside(hass, 40)
    await _refresh_at(hass, engine, freezer, rule)
    assert len(fake_climate_handler.turn_on_calls) == 1

    await _set_outside(hass, 46)  # in the buffer, still on
    await _refresh_at(hass, engine, freezer, rule, _at(12) + timedelta(minutes=5))
    await _set_outside(hass, 48)
    assert fake_climate_handler.turn_off_calls == [_CLIMATE]


async def test_watch_stops_at_off_time(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    rule = _outdoor_rule(watch=True)
    await _refresh_at(hass, engine, freezer, rule, _at(20, 59))
    freezer.move_to(_at(21, 0, 1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert rule.id not in engine._outdoor_watching
    assert rule.id not in engine._outdoor_state

    await _set_outside(hass, 30)
    assert fake_climate_handler.turn_on_calls == []


async def test_watch_arms_at_on_time(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    rule = _outdoor_rule(watch=True)
    await _refresh_at(hass, engine, freezer, rule, _at(5))
    assert rule.id not in engine._outdoor_watching

    freezer.move_to(_at(6, 0, 1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert fake_climate_handler.turn_on_calls == []
    assert rule.id in engine._outdoor_watching

    await _set_outside(hass, 40)
    assert fake_climate_handler.turn_on_calls == [(_CLIMATE, _HEAT)]


async def test_override_enforcement_inert_while_warm(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    """A rule the weather has turned off must not reapply its heat over manual changes."""
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    rule = _outdoor_rule(watch=True, allow_override=False)
    await _refresh_at(hass, engine, freezer, rule)

    hass.states.async_set(_CLIMATE, "cool", {"temperature": 72})
    await hass.async_block_till_done()
    freezer.move_to(_at(12) + timedelta(minutes=20))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert fake_climate_handler.turn_on_calls == []


async def test_changing_default_sensor_rescans(
    hass: HomeAssistant, engine: SchedulerEngine,
) -> None:
    engine._started = True
    calls: list[bool] = []

    async def _fake_refresh(*, startup: bool = False) -> None:
        calls.append(startup)

    engine._async_refresh_all = _fake_refresh  # type: ignore[method-assign]
    engine.async_set_outdoor_temperature_entity(_SENSOR)
    engine.async_set_outdoor_temperature_entity(_SENSOR)  # unchanged: no rescan
    await hass.async_block_till_done()
    assert calls == [False]
    engine._started = False


async def test_late_start_policy_blocks_weather_reactivation_but_keeps_shutoff(
    hass: HomeAssistant, engine: SchedulerEngine, fake_climate_handler: FakeClimateDeviceHandler,
    freezer: FrozenDateTimeFactory,
) -> None:
    engine.async_set_skip_late_climate_starts(True)
    engine._outdoor_temperature_entity = _SENSOR
    await _set_outside(hass, 50)
    hass.states.async_set(_CLIMATE, "heat")
    await _refresh_at(hass, engine, freezer, _outdoor_rule(watch=True))
    await _set_outside(hass, 44)
    assert fake_climate_handler.turn_on_calls == []
    await _set_outside(hass, 48)
    assert fake_climate_handler.turn_off_calls == [_CLIMATE]
