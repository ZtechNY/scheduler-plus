"""Fixed clock-time provider for Scheduler+.

Resolves a Rule's on_time/off_time when it is set to a literal time of day
(e.g. 6:00 AM), independent of sun position or any external calendar
system.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
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
        """Combine the configured time-of-day with `reference_date`.

        A time the clocks skip (spring-forward DST) moves to the first
        minute after the jump, so it still happens once that day. A time
        that repeats (fall-back) resolves to its first occurrence.
        """
        time_of_day = datetime.strptime(params["time"], "%H:%M").time()
        resolved = datetime.combine(
            reference_date, time_of_day, tzinfo=dt_util.DEFAULT_TIME_ZONE
        )
        while not _exists(resolved):
            resolved += timedelta(minutes=1)
        return resolved


def _exists(local: datetime) -> bool:
    """Whether wall-clock `local` actually occurs in its time zone."""
    round_trip = local.astimezone(dt_util.UTC).astimezone(local.tzinfo)
    return round_trip.replace(tzinfo=None) == local.replace(tzinfo=None)
