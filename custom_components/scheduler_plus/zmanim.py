"""Shabbos/Yom Tov zmanim computed from the calendar and sunset.

YidCal's zman sensors only ever report one date (and hold still across a
multi-day Shabbos/Yom Tov block), so for any other date these stand in:
the Hebrew calendar says which days are holy, and sunset plus YidCal's
own configured offsets says when they begin and end.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from homeassistant.core import HomeAssistant
from homeassistant.helpers import sun
from homeassistant.util import dt as dt_util

from .day_conditions.hebrew_calendar import is_yom_tov

_DEFAULT_CANDLE_LIGHTING_OFFSET = 18
_DEFAULT_HAVDALAH_OFFSET = 72


def _offset(hass: HomeAssistant, key: str, default: int) -> timedelta:
    """One of YidCal's configured offsets, in minutes, else `default`."""
    data = hass.data.get("yidcal")
    config = data.get("config") if isinstance(data, dict) else None
    value = config.get(key, default) if isinstance(config, dict) else default
    try:
        return timedelta(minutes=int(value))
    except (TypeError, ValueError):
        return timedelta(minutes=default)


def _sunset(hass: HomeAssistant, day: date) -> datetime | None:
    sunset = sun.get_astral_event_date(hass, "sunset", day)
    return dt_util.as_local(sunset) if sunset is not None else None


def is_holy_day(hass: HomeAssistant, day: date) -> bool:
    """Whether `day` is Shabbos or Yom Tov."""
    return day.weekday() == 5 or is_yom_tov(day, israel=hass.config.country == "IL")


def nightfall(hass: HomeAssistant, day: date) -> datetime | None:
    """Sunset on `day` plus YidCal's havdalah offset, rounded up to the minute."""
    sunset = _sunset(hass, day)
    if sunset is None:
        return None
    moment = sunset + _offset(hass, "havdalah_offset", _DEFAULT_HAVDALAH_OFFSET)
    whole_minute = moment.replace(second=0, microsecond=0)
    return whole_minute if whole_minute == moment else whole_minute + timedelta(minutes=1)


def candle_lighting(hass: HomeAssistant, day: date) -> datetime | None:
    """Candle lighting on `day`, or None if Shabbos/Yom Tov doesn't follow.

    Before Shabbos it is always before sunset (rounded down to the
    minute). Otherwise, lighting from one holy day into the next waits
    for nightfall.
    """
    if not is_holy_day(hass, day + timedelta(days=1)):
        return None
    if day.weekday() != 4 and is_holy_day(hass, day):
        return nightfall(hass, day)
    sunset = _sunset(hass, day)
    if sunset is None:
        return None
    moment = sunset - _offset(
        hass, "candlelighting_offset", _DEFAULT_CANDLE_LIGHTING_OFFSET
    )
    return moment.replace(second=0, microsecond=0)


def motzei(hass: HomeAssistant, day: date) -> datetime | None:
    """Nightfall on the last day of a Shabbos/Yom Tov block, else None."""
    if not is_holy_day(hass, day) or is_holy_day(hass, day + timedelta(days=1)):
        return None
    return nightfall(hass, day)
