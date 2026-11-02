"""Unit tests for Scheduler+'s Shabbos/Yom Tov day conditions."""

from __future__ import annotations

from datetime import date, datetime, timedelta

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir, sun
from homeassistant.util import dt as dt_util

from custom_components.scheduler_plus.const import DOMAIN, DayConditionType
from custom_components.scheduler_plus.day_conditions import DEFAULT_DAY_CONDITIONS
from custom_components.scheduler_plus.day_conditions.hebrew_calendar import (
    is_yom_tov,
    rosh_hashanah,
)

_CANDLE_LIGHTING_ENTITY = "sensor.yidcal_zman_erev"
_HAVDALAH_ENTITY = "sensor.yidcal_zman_motzi"
# A plain week: Friday 2026-11-06, Shabbos 2026-11-07.
_FRIDAY = date(2026, 11, 6)
_SATURDAY = date(2026, 11, 7)


def _local(day: date, hour: int, minute: int = 0) -> datetime:
    return datetime(day.year, day.month, day.day, hour, minute, tzinfo=dt_util.DEFAULT_TIME_ZONE)


@pytest.mark.parametrize(
    ("year", "expected"),
    [
        (5784, date(2023, 9, 16)),
        (5785, date(2024, 10, 3)),
        (5786, date(2025, 9, 23)),
        (5787, date(2026, 9, 12)),
        (5788, date(2027, 10, 2)),
    ],
)
def test_rosh_hashanah_dates(year: int, expected: date) -> None:
    """Rosh Hashanah lands on its published date across leap and common years."""
    assert rosh_hashanah(year) == expected


def test_diaspora_yom_tov_dates_5787() -> None:
    """Every diaspora Yom Tov day of 5787, and nothing else, is Yom Tov."""
    expected = {
        date(2026, 9, 12), date(2026, 9, 13),  # Rosh Hashanah
        date(2026, 9, 21),  # Yom Kippur
        date(2026, 9, 26), date(2026, 9, 27),  # Sukkos
        date(2026, 10, 3), date(2026, 10, 4),  # Shemini Atzeres / Simchas Torah
        date(2027, 4, 22), date(2027, 4, 23),  # Pesach
        date(2027, 4, 28), date(2027, 4, 29),  # Shevi'i / Acharon shel Pesach
        date(2027, 6, 11), date(2027, 6, 12),  # Shavuos
    }
    day = date(2026, 9, 1)
    while day < date(2027, 7, 1):
        assert is_yom_tov(day) is (day in expected), day
        day += timedelta(days=1)


def test_israel_has_one_day_yom_tov() -> None:
    """In Israel the second diaspora day is a weekday (Chol Hamoed or Isru Chag)."""
    assert is_yom_tov(date(2027, 4, 22), israel=True)
    assert not is_yom_tov(date(2027, 4, 23), israel=True)
    assert is_yom_tov(date(2026, 10, 3), israel=True)
    assert not is_yom_tov(date(2026, 10, 4), israel=True)


async def test_shabbos_matches_friday_from_candle_lighting(hass: HomeAssistant) -> None:
    """Shabbos runs from Friday's candle lighting until Saturday's havdalah."""
    hass.states.async_set(_CANDLE_LIGHTING_ENTITY, _local(_FRIDAY, 16, 25).isoformat())
    hass.states.async_set(_HAVDALAH_ENTITY, _local(_SATURDAY, 17, 33).isoformat())
    shabbos = DEFAULT_DAY_CONDITIONS.get(DayConditionType.SHABBOS)

    assert not await shabbos.async_check_at(hass, _FRIDAY, _local(_FRIDAY, 8))
    assert not await shabbos.async_check_at(hass, _FRIDAY, _local(_FRIDAY, 16, 24))
    assert await shabbos.async_check_at(hass, _FRIDAY, _local(_FRIDAY, 16, 25))
    assert await shabbos.async_check_at(hass, _SATURDAY, _local(_SATURDAY, 8))
    assert await shabbos.async_check_at(hass, _SATURDAY, _local(_SATURDAY, 17, 32))
    assert not await shabbos.async_check_at(hass, _SATURDAY, _local(_SATURDAY, 17, 33))
    assert not await shabbos.async_check_at(hass, _SATURDAY, _local(_SATURDAY, 21))
    # A whole-date question (no start time) still answers for all of Saturday.
    assert await shabbos.async_check_at(hass, _SATURDAY, None)
    # Answers don't depend on what today is.
    assert await shabbos.async_check(hass, date(2030, 1, 5))


async def test_erev_conditions_match_the_whole_day_before(hass: HomeAssistant) -> None:
    """Erev Shabbos is Friday; Erev Yom Tov is the day before a first day only."""
    erev_shabbos = DEFAULT_DAY_CONDITIONS.get(DayConditionType.EREV_SHABBOS)
    erev_yom_tov = DEFAULT_DAY_CONDITIONS.get(DayConditionType.EREV_YOM_TOV)

    assert await erev_shabbos.async_check_at(hass, _FRIDAY, _local(_FRIDAY, 20))
    assert not await erev_shabbos.async_check(hass, _SATURDAY)
    assert await erev_yom_tov.async_check(hass, date(2027, 4, 21))
    assert not await erev_yom_tov.async_check(hass, date(2027, 4, 22))


async def test_missing_candle_lighting_sensor_raises_issue_and_uses_sunset(
    hass: HomeAssistant, issue_registry: ir.IssueRegistry
) -> None:
    """Without YidCal's zman sensor the boundary falls back to sunset - 18 minutes."""
    shabbos = DEFAULT_DAY_CONDITIONS.get(DayConditionType.SHABBOS)

    assert await shabbos.async_check_at(hass, _FRIDAY, _local(_FRIDAY, 23))
    assert not await shabbos.async_check_at(hass, _FRIDAY, _local(_FRIDAY, 12))

    issue = issue_registry.async_get_issue(DOMAIN, f"missing_entity_{_CANDLE_LIGHTING_ENTITY}")
    assert issue is not None
    assert issue.translation_key == "missing_entity"


async def test_shabbos_after_yom_tov_lights_before_sunset(hass: HomeAssistant) -> None:
    """Friday 2027-04-23 is Yom Tov, but Shabbos candles are still lit before sunset."""
    friday = date(2027, 4, 23)
    sunset = dt_util.as_local(sun.get_astral_event_date(hass, "sunset", friday))
    shabbos = DEFAULT_DAY_CONDITIONS.get(DayConditionType.SHABBOS)

    assert await shabbos.async_check_at(hass, friday, sunset)
    assert not await shabbos.async_check_at(hass, friday, sunset - timedelta(minutes=30))


async def test_havdalah_fallback_uses_yidcal_offset(hass: HomeAssistant) -> None:
    """Without the motzi sensor, Shabbos ends YidCal's havdalah offset after sunset."""
    hass.data["yidcal"] = {"config": {"havdalah_offset": 50}}
    sunset = dt_util.as_local(sun.get_astral_event_date(hass, "sunset", _SATURDAY))
    shabbos = DEFAULT_DAY_CONDITIONS.get(DayConditionType.SHABBOS)

    assert await shabbos.async_check_at(hass, _SATURDAY, sunset + timedelta(minutes=49))
    assert not await shabbos.async_check_at(hass, _SATURDAY, sunset + timedelta(minutes=51))


async def test_candle_lighting_fallback_uses_yidcal_offset(hass: HomeAssistant) -> None:
    """Without the erev sensor, Shabbos starts YidCal's candle-lighting offset before sunset."""
    hass.data["yidcal"] = {"config": {"candlelighting_offset": 40}}
    sunset = dt_util.as_local(sun.get_astral_event_date(hass, "sunset", _FRIDAY))
    shabbos = DEFAULT_DAY_CONDITIONS.get(DayConditionType.SHABBOS)

    assert await shabbos.async_check_at(hass, _FRIDAY, sunset - timedelta(minutes=39))
    assert not await shabbos.async_check_at(hass, _FRIDAY, sunset - timedelta(minutes=42))
