"""Yom Tov dates from the fixed Hebrew calendar.

Only Rosh Hashanah needs computing: every other Yom Tov sits a fixed
number of days from it, because the months between Nisan and Tishrei
never change length (Pesach is always 163 days before the next Rosh
Hashanah, Shavuos 50 days after Pesach). Rosh Hashanah itself follows the
molad-and-postponement arithmetic from Reingold & Dershowitz,
"Calendrical Calculations", on Python's proleptic-Gregorian ordinals
(identical to their R.D. fixed dates).
"""

from __future__ import annotations

from datetime import date, timedelta
from functools import lru_cache

# R.D. fixed date of 1 Tishrei, AM 1.
_HEBREW_EPOCH = -1373427

# Day offsets from 1 Tishrei / from 15 Nisan on which melacha is forbidden.
_TISHREI_DIASPORA = (0, 1, 9, 14, 15, 21, 22)
_TISHREI_ISRAEL = (0, 1, 9, 14, 21)
_NISAN_DIASPORA = (0, 1, 6, 7, 50, 51)
_NISAN_ISRAEL = (0, 6, 50)


def _elapsed_days(year: int) -> int:
    """Days from the epoch to 1 Tishrei of `year`, before the year-length fix."""
    months = (235 * year - 234) // 19
    parts = 12084 + 13753 * months
    day = 29 * months + parts // 25920
    if (3 * (day + 1)) % 7 < 3:
        day += 1
    return day


def _year_length_correction(year: int) -> int:
    """Delay keeping every Hebrew year's length within the allowed set."""
    ny0, ny1, ny2 = _elapsed_days(year - 1), _elapsed_days(year), _elapsed_days(year + 1)
    if ny2 - ny1 == 356:
        return 2
    if ny1 - ny0 == 382:
        return 1
    return 0


def rosh_hashanah(year: int) -> date:
    """Return the Gregorian date of 1 Tishrei of Hebrew `year`."""
    return date.fromordinal(
        _HEBREW_EPOCH + _elapsed_days(year) + _year_length_correction(year)
    )


@lru_cache(maxsize=16)
def _yom_tov_dates(gregorian_year: int, israel: bool) -> frozenset[date]:
    """Every Yom Tov date touching `gregorian_year`."""
    tishrei = _TISHREI_ISRAEL if israel else _TISHREI_DIASPORA
    nisan = _NISAN_ISRAEL if israel else _NISAN_DIASPORA
    hebrew_year = gregorian_year + 3761
    dates: set[date] = set()
    for year in (hebrew_year - 1, hebrew_year, hebrew_year + 1):
        new_year = rosh_hashanah(year)
        pesach = new_year - timedelta(days=163)
        dates.update(new_year + timedelta(days=offset) for offset in tishrei)
        dates.update(pesach + timedelta(days=offset) for offset in nisan)
    return frozenset(dates)


def is_yom_tov(day: date, *, israel: bool = False) -> bool:
    """Return whether melacha is forbidden on `day` because of Yom Tov.

    Includes Yom Kippur; excludes Chol Hamoed. `israel` selects the
    one-day schedule instead of the diaspora's two days.
    """
    return day in _yom_tov_dates(day.year, israel)
