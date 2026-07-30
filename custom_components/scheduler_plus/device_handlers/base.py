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

from homeassistant.core import Context, HomeAssistant

from ..const import DeviceType


class DeviceHandler(ABC):
    """A plugin that applies a rule's on/off action to entities of one device type."""

    @abstractmethod
    async def async_turn_on(
        self,
        hass: HomeAssistant,
        entity_id: str,
        action: dict[str, Any],
        context: Context | None = None,
    ) -> None:
        """Apply the rule's "on" action to `entity_id`.

        `action` is the opaque dict from Rule.action; its expected keys
        (brightness/transition for lights, hvac_mode/target_temperature for
        climate, ...) are defined entirely by the concrete implementation.

        `context`, if given, must be passed through to the underlying
        service call unchanged - the scheduling engine uses it to
        recognize its own resulting state change later (for override
        enforcement), by comparing a state_changed event's context id
        against the one it passed in here.
        """

    @abstractmethod
    async def async_turn_off(
        self, hass: HomeAssistant, entity_id: str, context: Context | None = None
    ) -> None:
        """Turn `entity_id` off.

        Unlike turning on, turning off never needs rule-specific
        parameters - it is an unambiguous operation for every device type
        Scheduler+ supports. See `async_turn_on` for `context`.
        """

    @abstractmethod
    def matches_action(
        self, hass: HomeAssistant, entity_id: str, action: dict[str, Any]
    ) -> bool:
        """Return whether `entity_id`'s current state already reflects `action`.

        Used as a belt-and-suspenders check before treating an externally-
        caused state change as a genuine override needing a reapply: even
        when a change wasn't caused by us, if the entity already matches
        the rule's action, there's nothing to correct. Returns True
        (nothing to enforce) if the entity is unavailable/missing.
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
