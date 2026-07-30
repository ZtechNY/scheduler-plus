"""Light device handler for Scheduler+.

Translates a Rule's action into light.turn_on / light.turn_off service
calls.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.light import ATTR_BRIGHTNESS, ATTR_TRANSITION
from homeassistant.components.light import DOMAIN as LIGHT_DOMAIN
from homeassistant.const import ATTR_ENTITY_ID, SERVICE_TURN_OFF, SERVICE_TURN_ON
from homeassistant.core import Context, HomeAssistant

from .base import DeviceHandler


class LightDeviceHandler(DeviceHandler):
    """Applies a rule's on/off action to light entities.

    Expected action keys (all optional): "brightness" (0-255) and
    "transition" (seconds).
    """

    async def async_turn_on(
        self,
        hass: HomeAssistant,
        entity_id: str,
        action: dict[str, Any],
        context: Context | None = None,
    ) -> None:
        """Turn the light on, applying brightness/transition if provided."""
        service_data: dict[str, Any] = {ATTR_ENTITY_ID: entity_id}
        if "brightness" in action:
            service_data[ATTR_BRIGHTNESS] = action["brightness"]
        if "transition" in action:
            service_data[ATTR_TRANSITION] = action["transition"]

        await hass.services.async_call(
            LIGHT_DOMAIN, SERVICE_TURN_ON, service_data, blocking=True, context=context
        )

    async def async_turn_off(
        self, hass: HomeAssistant, entity_id: str, context: Context | None = None
    ) -> None:
        """Turn the light off."""
        await hass.services.async_call(
            LIGHT_DOMAIN,
            SERVICE_TURN_OFF,
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
            context=context,
        )

    def matches_action(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> bool:
        """Check whether the light is already on.

        Override enforcement isn't exposed in the UI for lights yet - this
        only exists to satisfy the DeviceHandler interface, so it doesn't
        compare brightness/transition.
        """
        state = hass.states.get(entity_id)
        return state is None or state.state == "on"
