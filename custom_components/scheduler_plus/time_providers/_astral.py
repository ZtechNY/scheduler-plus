"""Shared logic for astral (sun-based) time providers.

Sunrise and sunset are both instantaneous sun events resolved via Home
Assistant's `sun` helper, differing only in which event they ask for. This
base class holds that shared resolution logic so the concrete
SunriseTimeProvider/SunsetTimeProvider subclasses are each a one-line
declaration.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import sun

from .base import TimeProvider


class AstralTimeProvider(TimeProvider):
    """Resolves a sun event, offset by a configurable number of minutes.

    Expected params: {"offset_minutes": -15} - minutes to add to (or, if
    negative, subtract from) the event time. Defaults to 0 if omitted.
    """

    _event: str

    async def async_resolve(
        self, hass: HomeAssistant, reference_date: date, params: dict[str, Any]
    ) -> datetime | None:
        """Resolve the configured sun event on `reference_date`, with offset."""
        event_time = sun.get_astral_event_date(hass, self._event, reference_date)
        if event_time is None:
            return None
        return event_time + timedelta(minutes=params.get("offset_minutes", 0))
