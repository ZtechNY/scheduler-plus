"""Switch device handler for Scheduler+.

Translates a Rule's action into switch.turn_on / switch.turn_off service
calls. Generic on/off switches have no adjustable parameters, so the rule's
action is accepted for interface consistency but never read.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import DOMAIN as SWITCH_DOMAIN
from homeassistant.const import ATTR_ENTITY_ID, SERVICE_TURN_OFF, SERVICE_TURN_ON
from homeassistant.core import Context, HomeAssistant

from .base import DeviceHandler


class SwitchDeviceHandler(DeviceHandler):
    """Applies a rule's on/off action to switch entities."""

    async def async_turn_on(
        self,
        hass: HomeAssistant,
        entity_id: str,
        action: dict[str, Any],
        context: Context | None = None,
    ) -> None:
        """Turn the switch on."""
        await hass.services.async_call(
            SWITCH_DOMAIN,
            SERVICE_TURN_ON,
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
            context=context,
        )

    async def async_turn_off(
        self, hass: HomeAssistant, entity_id: str, context: Context | None = None
    ) -> None:
        """Turn the switch off."""
        await hass.services.async_call(
            SWITCH_DOMAIN,
            SERVICE_TURN_OFF,
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
            context=context,
        )

    def matches_action(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> bool:
        """Check whether the switch is already on.

        Override enforcement isn't exposed in the UI for switches yet -
        this only exists to satisfy the DeviceHandler interface.
        """
        state = hass.states.get(entity_id)
        return state is None or state.state == "on"
