"""Unit tests for Scheduler+'s device-handler plugins.

Exercises ClimateDeviceHandler's matches_action comparison (the belt-and-
suspenders check override enforcement relies on) and confirms `context` is
threaded through to the underlying service call, using Home Assistant's
demo/registered services rather than mocking hass.services.async_call
directly.
"""

from __future__ import annotations

import pytest
from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    DOMAIN as CLIMATE_DOMAIN,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_TEMPERATURE,
)
from homeassistant.const import ATTR_ENTITY_ID, ATTR_TEMPERATURE
from homeassistant.core import Context, HomeAssistant, ServiceCall

from custom_components.scheduler_plus.device_handlers.climate import ClimateDeviceHandler


@pytest.fixture
def climate_handler() -> ClimateDeviceHandler:
    """A fresh ClimateDeviceHandler for each test."""
    return ClimateDeviceHandler()


@pytest.fixture
def recorded_calls(hass: HomeAssistant) -> list[ServiceCall]:
    """Record every climate.set_hvac_mode/set_temperature call instead of applying it."""
    calls: list[ServiceCall] = []

    async def _record(call: ServiceCall) -> None:
        calls.append(call)

    hass.services.async_register(CLIMATE_DOMAIN, SERVICE_SET_HVAC_MODE, _record)
    hass.services.async_register(CLIMATE_DOMAIN, SERVICE_SET_TEMPERATURE, _record)
    return calls


async def test_matches_action_hvac_mode_mismatch(
    hass: HomeAssistant, climate_handler: ClimateDeviceHandler
) -> None:
    """A different hvac_mode is not a match, even with no target_temperature."""
    hass.states.async_set("climate.test", "cool")

    assert not climate_handler.matches_action(
        hass, "climate.test", {"hvac_mode": "heat"}
    )


async def test_matches_action_hvac_mode_match_no_temperature(
    hass: HomeAssistant, climate_handler: ClimateDeviceHandler
) -> None:
    """A matching hvac_mode with no target_temperature in the action is a match."""
    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 75})

    assert climate_handler.matches_action(hass, "climate.test", {"hvac_mode": "heat"})


async def test_matches_action_temperature_within_tolerance(
    hass: HomeAssistant, climate_handler: ClimateDeviceHandler
) -> None:
    """A temperature within the 0.5-degree tolerance counts as a match."""
    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 69.3})

    assert climate_handler.matches_action(
        hass, "climate.test", {"hvac_mode": "heat", "target_temperature": 69}
    )


async def test_matches_action_temperature_outside_tolerance(
    hass: HomeAssistant, climate_handler: ClimateDeviceHandler
) -> None:
    """A temperature outside the tolerance is a genuine mismatch."""
    hass.states.async_set("climate.test", "heat", {ATTR_TEMPERATURE: 75})

    assert not climate_handler.matches_action(
        hass, "climate.test", {"hvac_mode": "heat", "target_temperature": 69}
    )


async def test_matches_action_missing_entity_reports_match(
    hass: HomeAssistant, climate_handler: ClimateDeviceHandler
) -> None:
    """An unavailable/missing entity has nothing to enforce against."""
    assert climate_handler.matches_action(
        hass, "climate.missing", {"hvac_mode": "heat", "target_temperature": 69}
    )


async def test_matches_action_missing_temperature_attribute_is_mismatch(
    hass: HomeAssistant, climate_handler: ClimateDeviceHandler
) -> None:
    """A registered entity with no temperature attribute at all is a mismatch.

    Distinguishes "the entity has no data yet" from "the data matches" -
    the latter alone should count as a match.
    """
    hass.states.async_set("climate.test", "heat")

    assert not climate_handler.matches_action(
        hass, "climate.test", {"hvac_mode": "heat", "target_temperature": 69}
    )


async def test_async_turn_on_passes_context_to_service_call(
    hass: HomeAssistant,
    climate_handler: ClimateDeviceHandler,
    recorded_calls: list[ServiceCall],
) -> None:
    """context= reaches the underlying set_temperature service call unchanged."""
    context = Context()

    await climate_handler.async_turn_on(
        hass,
        "climate.test",
        {"hvac_mode": "heat", "target_temperature": 69},
        context=context,
    )

    assert len(recorded_calls) == 1
    call = recorded_calls[0]
    assert call.context is context
    assert call.data[ATTR_ENTITY_ID] == "climate.test"
    assert call.data[ATTR_HVAC_MODE] == "heat"
    assert call.data[ATTR_TEMPERATURE] == 69


async def test_async_turn_on_without_temperature_uses_set_hvac_mode(
    hass: HomeAssistant,
    climate_handler: ClimateDeviceHandler,
    recorded_calls: list[ServiceCall],
) -> None:
    """With no target_temperature, only hvac_mode is set - a different service call."""
    context = Context()

    await climate_handler.async_turn_on(
        hass, "climate.test", {"hvac_mode": "cool"}, context=context
    )

    assert len(recorded_calls) == 1
    call = recorded_calls[0]
    assert call.context is context
    assert call.data[ATTR_HVAC_MODE] == "cool"
    assert ATTR_TEMPERATURE not in call.data


async def test_async_turn_off_passes_context_to_service_call(
    hass: HomeAssistant,
    climate_handler: ClimateDeviceHandler,
    recorded_calls: list[ServiceCall],
) -> None:
    """context= reaches the underlying set_hvac_mode(off) service call unchanged."""
    context = Context()

    await climate_handler.async_turn_off(hass, "climate.test", context=context)

    assert len(recorded_calls) == 1
    call = recorded_calls[0]
    assert call.context is context
    assert call.data[ATTR_ENTITY_ID] == "climate.test"
    assert call.data[ATTR_HVAC_MODE] == "off"
