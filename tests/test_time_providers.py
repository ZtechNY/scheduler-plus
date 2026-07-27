"""Unit tests for Scheduler+ time-provider plugins."""

from __future__ import annotations

from datetime import date, timedelta

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from custom_components.scheduler_plus.time_providers.yidcal import YidCalTimeProvider

_ZMAN_ENTITY = "sensor.yidcal_zman_erev"
_MOTZEI_ENTITY = "sensor.yidcal_zman_motzi"
_PROVIDER = YidCalTimeProvider(
    {"candle_lighting": _ZMAN_ENTITY, "motzei_shabbos": _MOTZEI_ENTITY}
)


async def test_yidcal_resolves_matching_date_with_offset(hass: HomeAssistant) -> None:
    """The entity's current timestamp is returned, offset by params["offset_minutes"]."""
    reference_date = date(2026, 7, 24)
    zman = dt_util.now().replace(
        year=2026, month=7, day=24, hour=19, minute=32, second=0, microsecond=0
    )
    hass.states.async_set(_ZMAN_ENTITY, zman.isoformat())

    resolved = await _PROVIDER.async_resolve(
        hass, reference_date, {"zman": "candle_lighting", "offset_minutes": -15}
    )

    assert resolved is not None
    assert resolved == zman - timedelta(minutes=15)


async def test_yidcal_returns_none_for_mismatched_date(hass: HomeAssistant) -> None:
    """A zman entity whose current value isn't on `reference_date` resolves to None.

    Regression guard: the entity always reflects its *nearest* occurrence,
    so asking about some other date must not silently reuse that value.
    """
    zman = dt_util.now().replace(year=2026, month=7, day=24, hour=19, minute=32)
    hass.states.async_set(_ZMAN_ENTITY, zman.isoformat())

    resolved = await _PROVIDER.async_resolve(
        hass, date(2026, 7, 31), {"zman": "candle_lighting"}
    )

    assert resolved is None


async def test_yidcal_returns_none_when_entity_missing(hass: HomeAssistant) -> None:
    """An unregistered/never-set entity resolves to None, not an error."""
    resolved = await _PROVIDER.async_resolve(
        hass, date(2026, 7, 24), {"zman": "candle_lighting"}
    )

    assert resolved is None


async def test_yidcal_returns_none_for_unavailable_state(hass: HomeAssistant) -> None:
    """An "unavailable"/"unknown" entity state resolves to None."""
    hass.states.async_set(_ZMAN_ENTITY, "unavailable")

    resolved = await _PROVIDER.async_resolve(
        hass, date(2026, 7, 24), {"zman": "candle_lighting"}
    )

    assert resolved is None


async def test_yidcal_returns_none_for_unregistered_zman(hass: HomeAssistant) -> None:
    """A rule referencing a zman key with no registered entity resolves to None."""
    zman = dt_util.now().replace(year=2026, month=7, day=24, hour=19, minute=32)
    hass.states.async_set(_ZMAN_ENTITY, zman.isoformat())

    resolved = await _PROVIDER.async_resolve(
        hass, date(2026, 7, 24), {"zman": "sof_zman_tefillah"}
    )

    assert resolved is None


async def test_yidcal_resolves_motzei_shabbos(hass: HomeAssistant) -> None:
    """The motzei_shabbos zman resolves independently from candle_lighting."""
    reference_date = date(2026, 7, 25)
    zman = dt_util.now().replace(
        year=2026, month=7, day=25, hour=21, minute=10, second=0, microsecond=0
    )
    hass.states.async_set(_MOTZEI_ENTITY, zman.isoformat())

    resolved = await _PROVIDER.async_resolve(
        hass, reference_date, {"zman": "motzei_shabbos", "offset_minutes": 25}
    )

    assert resolved is not None
    assert resolved == zman + timedelta(minutes=25)
