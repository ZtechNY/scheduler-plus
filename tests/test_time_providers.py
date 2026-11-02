"""Unit tests for Scheduler+ time-provider plugins."""

from __future__ import annotations

from datetime import date, datetime, timedelta

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir, sun
from homeassistant.util import dt as dt_util

from custom_components.scheduler_plus.const import DOMAIN
from custom_components.scheduler_plus.time_providers.yidcal import YidCalTimeProvider

_ZMAN_ENTITY = "sensor.yidcal_zman_erev"
_MOTZEI_ENTITY = "sensor.yidcal_zman_motzi"
# No Shabbos/Yom Tov follows, so there is no zman to compute either.
_TUESDAY = date(2026, 7, 28)
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
        hass, _TUESDAY, {"zman": "candle_lighting"}
    )

    assert resolved is None


async def test_yidcal_returns_none_when_entity_missing(hass: HomeAssistant) -> None:
    """An unregistered/never-set entity resolves to None, not an error."""
    resolved = await _PROVIDER.async_resolve(
        hass, _TUESDAY, {"zman": "candle_lighting"}
    )

    assert resolved is None


async def test_yidcal_returns_none_for_unavailable_state(hass: HomeAssistant) -> None:
    """An "unavailable"/"unknown" entity state resolves to None."""
    hass.states.async_set(_ZMAN_ENTITY, "unavailable")

    resolved = await _PROVIDER.async_resolve(
        hass, _TUESDAY, {"zman": "candle_lighting"}
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


async def test_yidcal_missing_entity_raises_repairs_issue(
    hass: HomeAssistant, issue_registry: ir.IssueRegistry, caplog: pytest.LogCaptureFixture
) -> None:
    """A zman sensor that doesn't exist is warned about and surfaced in Repairs.

    The issue clears itself once the sensor exists again.
    """
    issue_id = f"missing_entity_{_ZMAN_ENTITY}"

    resolved = await _PROVIDER.async_resolve(
        hass, _TUESDAY, {"zman": "candle_lighting"}
    )

    assert resolved is None
    assert issue_registry.async_get_issue(DOMAIN, issue_id) is not None
    assert _ZMAN_ENTITY in caplog.text

    hass.states.async_set(_ZMAN_ENTITY, "unknown")
    await _PROVIDER.async_resolve(hass, _TUESDAY, {"zman": "candle_lighting"})

    assert issue_registry.async_get_issue(DOMAIN, issue_id) is None


# Pesach 5787: Thursday-Friday Yom Tov, then Shabbos.
_PESACH_WEDNESDAY = date(2027, 4, 21)
_PESACH_THURSDAY = date(2027, 4, 22)
_PESACH_FRIDAY = date(2027, 4, 23)
_PESACH_SATURDAY = date(2027, 4, 24)


def _sunset(hass: HomeAssistant, day: date) -> datetime:
    return dt_util.as_local(sun.get_astral_event_date(hass, "sunset", day))


def _at(day: date, hour: int, minute: int) -> datetime:
    return datetime(day.year, day.month, day.day, hour, minute, tzinfo=dt_util.DEFAULT_TIME_ZONE)


async def test_candle_lighting_computed_when_sensor_is_frozen_on_block_start(
    hass: HomeAssistant,
) -> None:
    """YidCal holds zman_erev at Wednesday's lighting; Friday's is still before sunset."""
    hass.states.async_set(_ZMAN_ENTITY, _at(_PESACH_WEDNESDAY, 19, 2).isoformat())

    resolved = await _PROVIDER.async_resolve(
        hass, _PESACH_FRIDAY, {"zman": "candle_lighting"}
    )

    expected = _sunset(hass, _PESACH_FRIDAY) - timedelta(minutes=18)
    assert resolved == expected.replace(second=0, microsecond=0)


async def test_second_night_candle_lighting_waits_for_nightfall(hass: HomeAssistant) -> None:
    """Lighting from the first day of Yom Tov into the second is after nightfall."""
    resolved = await _PROVIDER.async_resolve(
        hass, _PESACH_THURSDAY, {"zman": "candle_lighting"}
    )

    nightfall = _sunset(hass, _PESACH_THURSDAY) + timedelta(minutes=72)
    assert resolved is not None
    assert timedelta(0) <= resolved - nightfall < timedelta(minutes=1)
    assert resolved.second == 0


async def test_motzei_shabbos_computed_on_last_day_only(hass: HomeAssistant) -> None:
    """Motzei is computed for the block's last day, and nothing before it."""
    hass.states.async_set(_MOTZEI_ENTITY, _at(_PESACH_WEDNESDAY, 20, 0).isoformat())

    assert await _PROVIDER.async_resolve(
        hass, _PESACH_FRIDAY, {"zman": "motzei_shabbos"}
    ) is None
    resolved = await _PROVIDER.async_resolve(
        hass, _PESACH_SATURDAY, {"zman": "motzei_shabbos"}
    )
    nightfall = _sunset(hass, _PESACH_SATURDAY) + timedelta(minutes=72)
    assert resolved is not None
    assert timedelta(0) <= resolved - nightfall < timedelta(minutes=1)


async def test_computed_zmanim_follow_yidcal_offsets(hass: HomeAssistant) -> None:
    """The computed fallback uses YidCal's configured offsets."""
    hass.data["yidcal"] = {"config": {"candlelighting_offset": 40, "havdalah_offset": 50}}

    candle_lighting = await _PROVIDER.async_resolve(
        hass, _PESACH_FRIDAY, {"zman": "candle_lighting"}
    )
    motzei = await _PROVIDER.async_resolve(
        hass, _PESACH_SATURDAY, {"zman": "motzei_shabbos"}
    )

    expected = _sunset(hass, _PESACH_FRIDAY) - timedelta(minutes=40)
    assert candle_lighting == expected.replace(second=0, microsecond=0)
    nightfall = _sunset(hass, _PESACH_SATURDAY) + timedelta(minutes=50)
    assert motzei is not None
    assert timedelta(0) <= motzei - nightfall < timedelta(minutes=1)


async def test_missing_sensor_still_computes_and_raises_issue(
    hass: HomeAssistant, issue_registry: ir.IssueRegistry
) -> None:
    """Without YidCal installed, Friday's candle lighting is computed; Repairs still says so."""
    resolved = await _PROVIDER.async_resolve(
        hass, _PESACH_FRIDAY, {"zman": "candle_lighting", "offset_minutes": -5}
    )

    expected = _sunset(hass, _PESACH_FRIDAY) - timedelta(minutes=18)
    assert resolved == expected.replace(second=0, microsecond=0) - timedelta(minutes=5)
    assert issue_registry.async_get_issue(DOMAIN, f"missing_entity_{_ZMAN_ENTITY}") is not None


async def test_candle_lighting_on_a_tuesday_is_none(hass: HomeAssistant) -> None:
    """No Shabbos/Yom Tov follows a plain Tuesday, so there's nothing to compute."""
    assert await _PROVIDER.async_resolve(
        hass, date(2026, 11, 3), {"zman": "candle_lighting"}
    ) is None
