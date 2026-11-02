"""YidCal-backed time providers for Scheduler+.

Resolves a Rule's on_time/off_time to a YidCal zman (a halachic time), read
from the corresponding YidCal entity's current state, offset by a
configurable number of minutes - the same offset convention already used
by the sun-based providers (see _astral.py).
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .. import zmanim
from ..issues import async_clear_missing_entity, async_report_missing_entity
from .base import TimeProvider

_LOGGER = logging.getLogger(__name__)

# Zmanim that can be computed when the sensor doesn't report the date asked.
_COMPUTED: dict[str, Callable[[HomeAssistant, date], datetime | None]] = {
    "candle_lighting": zmanim.candle_lighting,
    "motzei_shabbos": zmanim.motzei,
}


class YidCalTimeProvider(TimeProvider):
    """Resolves one of several YidCal zman entities, selected via params["zman"].

    Expected params: {"zman": "candle_lighting", "offset_minutes": -15}.
    Each zman key is backed by one timestamp-valued entity, fixed at
    registration time (see time_providers/__init__.py).

    Entities are read for their *current* state, which only ever covers
    one date - and YidCal holds it still across a multi-day Shabbos/Yom
    Tov block. For any other date (or with the sensor missing or
    unavailable) candle lighting and motzei Shabbos are computed instead
    (see zmanim.py); a day with no such zman resolves to None.
    """

    def __init__(self, entities: dict[str, str]) -> None:
        """Initialize with a mapping of zman key -> YidCal entity_id."""
        self._entities = entities

    @property
    def watched_entity_ids(self) -> tuple[str, ...]:
        """Each zman sensor; a new value moves the rules that use it."""
        return tuple(self._entities.values())

    def expects_time(
        self, hass: HomeAssistant, reference_date: date, params: dict[str, Any]
    ) -> bool:
        """Candle lighting/motzei Shabbos exist only around Shabbos and Yom Tov."""
        compute = _COMPUTED.get(params.get("zman"))  # type: ignore[arg-type]
        if compute is None:
            return True
        if compute is zmanim.candle_lighting:
            return zmanim.is_holy_day(hass, reference_date + timedelta(days=1))
        return zmanim.is_holy_day(hass, reference_date) and not zmanim.is_holy_day(
            hass, reference_date + timedelta(days=1)
        )

    async def async_resolve(
        self, hass: HomeAssistant, reference_date: date, params: dict[str, Any]
    ) -> datetime | None:
        """Resolve the named zman for `reference_date`, offset by minutes."""
        zman_key = params.get("zman")
        entity_id = self._entities.get(zman_key) if isinstance(zman_key, str) else None
        if entity_id is None:
            _LOGGER.error("Rule references an unknown YidCal zman %r", zman_key)
            return None

        zman = self._sensor_zman(hass, entity_id, zman_key, reference_date)
        if zman is None and (compute := _COMPUTED.get(zman_key)) is not None:
            zman = compute(hass, reference_date)
        if zman is None:
            return None
        return zman + timedelta(minutes=params.get("offset_minutes", 0))

    @staticmethod
    def _sensor_zman(
        hass: HomeAssistant, entity_id: str, zman_key: str, reference_date: date
    ) -> datetime | None:
        """The sensor's value, if it reports `reference_date`."""
        state = hass.states.get(entity_id)
        if state is None:
            async_report_missing_entity(hass, entity_id, f"YidCal zman '{zman_key}'")
            return None
        async_clear_missing_entity(hass, entity_id)
        if state.state in ("unknown", "unavailable"):
            return None

        zman = dt_util.parse_datetime(state.state)
        if zman is None:
            return None
        zman = dt_util.as_local(zman)
        return zman if zman.date() == reference_date else None
