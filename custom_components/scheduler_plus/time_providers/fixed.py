"""Fixed clock-time provider for Scheduler+.

Resolves a Rule's on_time/off_time when it is set to a literal time of day
(e.g. 6:00 AM), independent of sun position or any external calendar
system.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .base import TimeProvider


class FixedTimeProvider(TimeProvider):
    """Resolves a literal clock time on the reference date.

    Expected params: {"time": "06:00"} - a 24-hour "HH:MM" string,
    interpreted in Home Assistant's configured local time zone.
    """

    async def async_resolve(
        self, hass: HomeAssistant, reference_date: date, params: dict[str, Any]
    ) -> datetime | None:
        """Combine the configured time-of-day with `reference_date`."""
        time_of_day = datetime.strptime(params["time"], "%H:%M").time()
        return datetime.combine(
            reference_date, time_of_day, tzinfo=dt_util.DEFAULT_TIME_ZONE
        )
