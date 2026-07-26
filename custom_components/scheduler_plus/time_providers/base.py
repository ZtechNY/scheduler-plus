"""Time-provider plugin interface for Scheduler+.

A time provider resolves an abstract time reference (a Rule's on_time or
off_time) to a concrete datetime for a given day. The scheduling engine
only ever talks to time providers through this interface: it does not know
whether a given provider is a fixed clock time, a sun event, or a future
YidCal zman.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import Any

from homeassistant.core import HomeAssistant

from ..const import TimeProviderType


class TimeProvider(ABC):
    """A plugin that resolves a rule's time parameters to a concrete datetime."""

    @abstractmethod
    async def async_resolve(
        self, hass: HomeAssistant, reference_date: date, params: dict[str, Any]
    ) -> datetime | None:
        """Resolve `params` to a concrete datetime on `reference_date`.

        `params` is the opaque dict from TimeSpec.params; its expected keys
        are defined entirely by the concrete provider implementation.

        Returns None if the time cannot be resolved for that date (for
        example, a referenced entity is unavailable), leaving it to the
        caller to decide how to handle a missing occurrence.
        """


class TimeProviderRegistry:
    """A lookup table of TimeProvider plugins keyed by TimeProviderType."""

    def __init__(self, providers: dict[TimeProviderType, TimeProvider]) -> None:
        """Initialize the registry with a fixed mapping of providers."""
        self._providers = dict(providers)

    def get(self, provider_type: TimeProviderType) -> TimeProvider:
        """Return the provider registered for `provider_type`.

        Raises LookupError if no provider is registered for that type, for
        example when a rule references TimeProviderType.YIDCAL before that
        provider is implemented and registered.
        """
        try:
            return self._providers[provider_type]
        except KeyError as err:
            raise LookupError(
                f"No time provider registered for '{provider_type.value}'"
            ) from err
