"""Device-handler plugin interface for Scheduler+.

A device handler translates a Rule's abstract on/off action into concrete
Home Assistant service calls for entities of one DeviceType. The
scheduling engine only ever talks to device handlers through this
interface: it does not know whether a given entity is a light, a climate
device, or (later) some other device type.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from homeassistant.core import HomeAssistant

from ..const import DeviceType


class DeviceHandler(ABC):
    """A plugin that applies a rule's on/off action to entities of one device type."""

    @abstractmethod
    async def async_turn_on(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> None:
        """Apply the rule's "on" action to `entity_id`.

        `action` is the opaque dict from Rule.action; its expected keys
        (brightness/transition for lights, hvac_mode/target_temperature for
        climate, ...) are defined entirely by the concrete implementation.
        """

    @abstractmethod
    async def async_turn_off(self, hass: HomeAssistant, entity_id: str) -> None:
        """Turn `entity_id` off.

        Unlike turning on, turning off never needs rule-specific
        parameters - it is an unambiguous operation for every device type
        Scheduler+ supports.
        """


class DeviceHandlerRegistry:
    """A lookup table of DeviceHandler plugins keyed by DeviceType."""

    def __init__(self, handlers: dict[DeviceType, DeviceHandler]) -> None:
        """Initialize the registry with a fixed mapping of handlers."""
        self._handlers = dict(handlers)

    def get(self, device_type: DeviceType) -> DeviceHandler:
        """Return the handler registered for `device_type`.

        Raises LookupError if no handler is registered for that type.
        """
        try:
            return self._handlers[device_type]
        except KeyError as err:
            raise LookupError(
                f"No device handler registered for '{device_type.value}'"
            ) from err
