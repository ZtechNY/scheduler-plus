"""Switch device handler for Scheduler+.

Translates a Rule's action into switch.turn_on / switch.turn_off service
calls. Generic on/off switches have no adjustable parameters, so the rule's
action is accepted for interface consistency but never read.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import DOMAIN as SWITCH_DOMAIN
from homeassistant.const import ATTR_ENTITY_ID, SERVICE_TURN_OFF, SERVICE_TURN_ON
from homeassistant.core import HomeAssistant

from .base import DeviceHandler


class SwitchDeviceHandler(DeviceHandler):
    """Applies a rule's on/off action to switch entities."""

    async def async_turn_on(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> None:
        """Turn the switch on."""
        await hass.services.async_call(
            SWITCH_DOMAIN,
            SERVICE_TURN_ON,
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
        )

    async def async_turn_off(self, hass: HomeAssistant, entity_id: str) -> None:
        """Turn the switch off."""
        await hass.services.async_call(
            SWITCH_DOMAIN,
            SERVICE_TURN_OFF,
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
        )
