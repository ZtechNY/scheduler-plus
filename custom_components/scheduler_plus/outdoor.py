"""Outdoor-temperature rule condition for Scheduler+.

A Rule's optional `outdoor_condition` gates its on side on the current
outdoor temperature ("only heat when it's below 45° outside"). Unlike a day
condition, the answer can change at any moment and cannot be known ahead of
time, so it is checked when the on side fires, not when occurrences are
resolved - and, with `watch`, again whenever the temperature changes during
the rule's window. The off side is never gated.

Shape (validated at the websocket boundary):
    operator:   "below" | "above"
    threshold:  degrees, in Home Assistant's configured unit
    hysteresis: degrees the temperature must move back past the threshold
                before a met condition counts as no longer met (default 0)
    watch:      keep checking during the window, turning on/off as the
                condition changes (default False)
    entity_id:  temperature source for this rule; None falls back to the
                integration-wide CONF_OUTDOOR_TEMPERATURE_ENTITY
"""

from __future__ import annotations

from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant

OPERATOR_BELOW = "below"
OPERATOR_ABOVE = "above"


def read_temperature(hass: HomeAssistant, entity_id: str) -> float | None:
    """Return the temperature `entity_id` reports, or None if it has none right now.

    A weather.* entity reports it in its `temperature` attribute; any other
    entity (a temperature sensor) as its state.
    """
    state = hass.states.get(entity_id)
    if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
        return None
    raw = (
        state.attributes.get("temperature")
        if entity_id.startswith("weather.")
        else state.state
    )
    try:
        return float(raw)
    except (TypeError, ValueError):
        return None


def condition_met(condition: dict[str, Any], temperature: float, *, active: bool) -> bool:
    """Whether `temperature` satisfies `condition`.

    `active` is whether the condition counted as met until now: once met,
    it stays met until the temperature moves `hysteresis` degrees back past
    the threshold, so a reading hovering at the threshold doesn't switch
    the equipment on and off.
    """
    threshold = float(condition["threshold"])
    hysteresis = float(condition.get("hysteresis") or 0) if active else 0.0
    if condition["operator"] == OPERATOR_ABOVE:
        return temperature >= threshold - hysteresis
    return temperature <= threshold + hysteresis


def describe(condition: dict[str, Any]) -> str:
    """A short human description, e.g. "outside below 45°"."""
    return f"outside {condition['operator']} {condition['threshold']:g}°"
