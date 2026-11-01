"""Day-condition plugin interface for Scheduler+.

A day condition answers whether a specific calendar date matches some
semantic day-type (Shabbos, Yom Tov, ...), for use in a Rule's date filter
(RuleDateMode.INCLUDE/EXCLUDE) as an alternative to listing literal dates.
The scheduling engine only ever talks to day conditions through this
interface: it does not know these happen to be backed by YidCal.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date, datetime

from homeassistant.core import HomeAssistant

from ..const import DayConditionType


class DayCondition(ABC):
    """A plugin that answers whether a date matches a semantic day-type."""

    @property
    def watched_entity_ids(self) -> tuple[str, ...]:
        """Entities whose changes can change this condition's answers.

        The engine rescans when any of them changes state.
        """
        return ()

    @abstractmethod
    async def async_check(self, hass: HomeAssistant, reference_date: date) -> bool:
        """Return whether `reference_date` matches this condition.

        Must answer the same way whenever it is asked, for past and future
        dates alike: the engine re-evaluates yesterday's occurrence after
        midnight to keep its off action, and that decision must not change
        just because the date is no longer today.
        """

    async def async_check_at(
        self, hass: HomeAssistant, reference_date: date, start: datetime | None
    ) -> bool:
        """Return whether an occurrence for `reference_date` starting at `start` matches.

        Lets a condition depend on the time of day as well as the date (a
        Shabbos that begins at candle lighting on Friday). The whole
        occurrence, off action included, follows this one decision. `start`
        is None when the caller has no start time; date-only conditions
        need not override this.
        """
        return await self.async_check(hass, reference_date)


class DayConditionRegistry:
    """A lookup table of DayCondition plugins keyed by DayConditionType."""

    def __init__(self, conditions: dict[DayConditionType, DayCondition]) -> None:
        """Initialize the registry with a fixed mapping of conditions."""
        self._conditions = dict(conditions)

    def get(self, condition_type: DayConditionType) -> DayCondition:
        """Return the condition registered for `condition_type`.

        Raises LookupError if no condition is registered for that type.
        """
        try:
            return self._conditions[condition_type]
        except KeyError as err:
            raise LookupError(
                f"No day condition registered for '{condition_type.value}'"
            ) from err

    @property
    def watched_entity_ids(self) -> set[str]:
        """Every entity any registered condition watches."""
        return {
            entity_id
            for condition in self._conditions.values()
            for entity_id in condition.watched_entity_ids
        }
