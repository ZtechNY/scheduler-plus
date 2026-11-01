"""Shabbos/Yom Tov day conditions for Scheduler+.

Each date is decided from the Hebrew calendar (hebrew_calendar.py), so a
decision never depends on when it is asked: yesterday, today and next
week all answer the same way, which keeps a window's off action tied to
the decision made for its start. The only live input is the candle-
lighting boundary on the eve of Shabbos/Yom Tov, read from YidCal's zman
sensor when it reports that day and otherwise approximated as 18 minutes
before sunset.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from homeassistant.core import HomeAssistant
from homeassistant.helpers import sun
from homeassistant.util import dt as dt_util

from ..const import DayConditionType
from ..issues import async_clear_missing_entity, async_report_missing_entity
from .base import DayCondition
from .hebrew_calendar import is_yom_tov

_CANDLE_LIGHTING_BEFORE_SUNSET = timedelta(minutes=18)


class YidCalDayCondition(DayCondition):
    """Matches Shabbos, Yom Tov, or the day before either.

    SHABBOS/YOM_TOV match the whole calendar date, plus the evening before
    from candle lighting on - so a Friday-night window counts as Shabbos.
    EREV_SHABBOS/EREV_YOM_TOV match the whole date before.
    """

    def __init__(self, kind: DayConditionType, candle_lighting_entity: str) -> None:
        """Initialize with the condition kind and YidCal's candle-lighting sensor."""
        self._kind = kind
        self._candle_lighting_entity = candle_lighting_entity

    @property
    def watched_entity_ids(self) -> tuple[str, ...]:
        """The candle-lighting sensor moves the evening boundary."""
        return (self._candle_lighting_entity,)

    async def async_check(self, hass: HomeAssistant, reference_date: date) -> bool:
        """Return whether `reference_date` is a whole matching date."""
        israel = hass.config.country == "IL"
        if self._kind is DayConditionType.SHABBOS:
            return reference_date.weekday() == 5
        if self._kind is DayConditionType.YOM_TOV:
            return is_yom_tov(reference_date, israel=israel)
        if self._kind is DayConditionType.EREV_SHABBOS:
            return reference_date.weekday() == 4
        return is_yom_tov(
            reference_date + timedelta(days=1), israel=israel
        ) and not is_yom_tov(reference_date, israel=israel)

    async def async_check_at(
        self, hass: HomeAssistant, reference_date: date, start: datetime | None
    ) -> bool:
        """Also match an occurrence starting after candle lighting the evening before."""
        if await self.async_check(hass, reference_date):
            return True
        if start is None or self._kind not in (
            DayConditionType.SHABBOS,
            DayConditionType.YOM_TOV,
        ):
            return False
        if not await self.async_check(hass, reference_date + timedelta(days=1)):
            return False
        candle_lighting = self._candle_lighting(hass, reference_date)
        return candle_lighting is not None and start >= candle_lighting

    def _candle_lighting(self, hass: HomeAssistant, day: date) -> datetime | None:
        """YidCal's candle lighting for `day`, else 18 minutes before sunset."""
        state = hass.states.get(self._candle_lighting_entity)
        if state is None:
            async_report_missing_entity(
                hass, self._candle_lighting_entity, "the Shabbos/Yom Tov day condition"
            )
        else:
            async_clear_missing_entity(hass, self._candle_lighting_entity)
            zman = dt_util.parse_datetime(state.state)
            if zman is not None and dt_util.as_local(zman).date() == day:
                return dt_util.as_local(zman)

        sunset = sun.get_astral_event_date(hass, "sunset", day)
        if sunset is None:
            return None
        return dt_util.as_local(sunset) - _CANDLE_LIGHTING_BEFORE_SUNSET
