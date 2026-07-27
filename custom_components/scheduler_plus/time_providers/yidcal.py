"""YidCal-backed time providers for Scheduler+.

Resolves a Rule's on_time/off_time to a YidCal zman (a halachic time), read
from the corresponding YidCal entity's current state, offset by a
configurable number of minutes - the same offset convention already used
by the sun-based providers (see _astral.py).
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .base import TimeProvider

_LOGGER = logging.getLogger(__name__)


class YidCalTimeProvider(TimeProvider):
    """Resolves one of several YidCal zman entities, selected via params["zman"].

    Expected params: {"zman": "candle_lighting", "offset_minutes": -15}.
    Each zman key is backed by one timestamp-valued entity, fixed at
    registration time (see time_providers/__init__.py).

    Entities are read for their *current* state, so - like DayCondition -
    this can only resolve accurately when that state actually falls on
    `reference_date`; a value for a different date (e.g. a stale reading,
    or a lookahead several days beyond what the entity currently reports)
    resolves to None rather than silently attaching the wrong date to it.
    """

    def __init__(self, entities: dict[str, str]) -> None:
        """Initialize with a mapping of zman key -> YidCal entity_id."""
        self._entities = entities

    async def async_resolve(
        self, hass: HomeAssistant, reference_date: date, params: dict[str, Any]
    ) -> datetime | None:
        """Resolve the named zman's current timestamp, offset by minutes."""
        zman_key = params.get("zman")
        entity_id = self._entities.get(zman_key) if isinstance(zman_key, str) else None
        if entity_id is None:
            _LOGGER.error("Rule references an unknown YidCal zman %r", zman_key)
            return None

        state = hass.states.get(entity_id)
        if state is None or state.state in ("unknown", "unavailable"):
            return None

        zman = dt_util.parse_datetime(state.state)
        if zman is None:
            return None

        zman = dt_util.as_local(zman)
        if zman.date() != reference_date:
            return None

        return zman + timedelta(minutes=params.get("offset_minutes", 0))
