"""Climate device handler for Scheduler+.

Translates a Rule's action into climate.set_hvac_mode / climate.set_temperature
service calls. Preset mode support is deferred to a later version.
"""

from __future__ import annotations

import math
from typing import Any

from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    DOMAIN as CLIMATE_DOMAIN,
    HVACMode,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_TEMPERATURE,
)
from homeassistant.const import ATTR_ENTITY_ID, ATTR_TEMPERATURE
from homeassistant.core import Context, HomeAssistant

from .base import DeviceHandler

# Tolerance (degrees) when comparing a climate entity's reported temperature
# against a rule's requested target_temperature - thermostats often round
# or report slightly differently than what was requested, and this must
# not be mistaken for a manual override.
_TEMPERATURE_MATCH_TOLERANCE = 0.5


class ClimateDeviceHandler(DeviceHandler):
    """Applies a rule's on/off action to climate entities.

    Expected action keys: "hvac_mode" (required, e.g. "heat", "cool") and
    "target_temperature" (optional). Preset mode support is deferred to a
    later version.
    """

    async def async_turn_on(
        self,
        hass: HomeAssistant,
        entity_id: str,
        action: dict[str, Any],
        context: Context | None = None,
    ) -> None:
        """Set the climate entity's HVAC mode, and target temperature if provided.

        The mode is always set via its own SERVICE_SET_HVAC_MODE call rather
        than bundling ATTR_HVAC_MODE into the SERVICE_SET_TEMPERATURE call.
        HA core's climate component forwards SERVICE_SET_TEMPERATURE's data
        as-is to the entity's own async_set_temperature(**kwargs) - whether
        a bundled hvac_mode is honored is up to that integration, and many
        silently ignore it. That previously meant a rule combining a new
        hvac_mode with a target_temperature (e.g. "Cool" + 69°) could apply
        the temperature while leaving the mode unchanged.
        """
        hvac_mode = action["hvac_mode"]

        await hass.services.async_call(
            CLIMATE_DOMAIN,
            SERVICE_SET_HVAC_MODE,
            {ATTR_ENTITY_ID: entity_id, ATTR_HVAC_MODE: hvac_mode},
            blocking=True,
            context=context,
        )

        if "target_temperature" in action:
            await hass.services.async_call(
                CLIMATE_DOMAIN,
                SERVICE_SET_TEMPERATURE,
                {
                    ATTR_ENTITY_ID: entity_id,
                    ATTR_TEMPERATURE: action["target_temperature"],
                },
                blocking=True,
                context=context,
            )

    async def async_turn_off(
        self, hass: HomeAssistant, entity_id: str, context: Context | None = None
    ) -> None:
        """Set the climate entity's HVAC mode to off."""
        await hass.services.async_call(
            CLIMATE_DOMAIN,
            SERVICE_SET_HVAC_MODE,
            {ATTR_ENTITY_ID: entity_id, ATTR_HVAC_MODE: HVACMode.OFF},
            blocking=True,
            context=context,
        )

    def matches_action(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> bool:
        """Check the entity's current hvac_mode/target_temperature against `action`."""
        state = hass.states.get(entity_id)
        if state is None:
            return True

        if state.state != action["hvac_mode"]:
            return False

        if "target_temperature" in action:
            current = state.attributes.get(ATTR_TEMPERATURE)
            if current is None or not math.isclose(
                current, action["target_temperature"], abs_tol=_TEMPERATURE_MATCH_TOLERANCE
            ):
                return False

        return True
