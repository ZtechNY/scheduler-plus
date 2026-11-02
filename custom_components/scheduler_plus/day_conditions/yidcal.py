"""Shabbos/Yom Tov day conditions for Scheduler+.

Each date is decided from the Hebrew calendar (hebrew_calendar.py), so a
decision never depends on when it is asked: yesterday, today and next
week all answer the same way, which keeps a window's off action tied to
the decision made for its start. The only live inputs are the two
boundaries - candle lighting on the eve of Shabbos/Yom Tov and havdalah
on its last day - read from YidCal's zman sensors when they report that
day and otherwise computed from sunset (see zmanim.py).
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .. import zmanim
from ..const import DayConditionType
from ..issues import async_clear_missing_entity, async_report_missing_entity
from .base import DayCondition
from .hebrew_calendar import is_yom_tov


class YidCalDayCondition(DayCondition):
    """Matches Shabbos, Yom Tov, or the day before either.

    SHABBOS/YOM_TOV match from candle lighting the evening before until
    havdalah on the last day - so a Friday-night window counts as
    Shabbos, and a Saturday-night one doesn't. EREV_SHABBOS/EREV_YOM_TOV
    match the whole date before.
    """

    def __init__(
        self,
        kind: DayConditionType,
        candle_lighting_entity: str,
        havdalah_entity: str,
    ) -> None:
        """Initialize with the condition kind and YidCal's two boundary sensors."""
        self._kind = kind
        self._candle_lighting_entity = candle_lighting_entity
        self._havdalah_entity = havdalah_entity

    @property
    def watched_entity_ids(self) -> tuple[str, ...]:
        """The boundary sensors move the evening edges."""
        return (self._candle_lighting_entity, self._havdalah_entity)

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
        """Match from candle lighting the evening before until havdalah."""
        if start is None:
            return await self.async_check(hass, reference_date)
        if await self.async_check(hass, reference_date):
            if not self._ends_on(hass, reference_date):
                return True
            havdalah = self._havdalah(hass, reference_date)
            return havdalah is None or start < havdalah
        if self._kind not in (DayConditionType.SHABBOS, DayConditionType.YOM_TOV):
            return False
        if not await self.async_check(hass, reference_date + timedelta(days=1)):
            return False
        candle_lighting = self._candle_lighting(hass, reference_date)
        return candle_lighting is not None and start >= candle_lighting

    def _ends_on(self, hass: HomeAssistant, day: date) -> bool:
        """Whether this Shabbos/Yom Tov ends at nightfall on `day`."""
        if self._kind is DayConditionType.SHABBOS:
            return True
        if self._kind is DayConditionType.YOM_TOV:
            return not is_yom_tov(
                day + timedelta(days=1), israel=hass.config.country == "IL"
            )
        return False

    def _candle_lighting(self, hass: HomeAssistant, day: date) -> datetime | None:
        """YidCal's candle lighting for `day`, else computed from sunset."""
        zman = self._sensor_zman(hass, self._candle_lighting_entity, day)
        return zman if zman is not None else zmanim.candle_lighting(hass, day)

    def _havdalah(self, hass: HomeAssistant, day: date) -> datetime | None:
        """YidCal's havdalah for `day`, else computed from sunset."""
        zman = self._sensor_zman(hass, self._havdalah_entity, day)
        return zman if zman is not None else zmanim.nightfall(hass, day)

    @staticmethod
    def _sensor_zman(hass: HomeAssistant, entity_id: str, day: date) -> datetime | None:
        """A zman sensor's value, if it reports `day`."""
        state = hass.states.get(entity_id)
        if state is None:
            async_report_missing_entity(
                hass, entity_id, "the Shabbos/Yom Tov day condition"
            )
            return None
        async_clear_missing_entity(hass, entity_id)
        zman = dt_util.parse_datetime(state.state)
        if zman is not None and dt_util.as_local(zman).date() == day:
            return dt_util.as_local(zman)
        return None
