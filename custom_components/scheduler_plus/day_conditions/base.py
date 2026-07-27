"""Day-condition plugin interface for Scheduler+.

A day condition answers whether a specific calendar date matches some
semantic day-type (Shabbos, Yom Tov, ...), for use in a Rule's date filter
(RuleDateMode.INCLUDE/EXCLUDE) as an alternative to listing literal dates.
The scheduling engine only ever talks to day conditions through this
interface: it does not know these happen to be backed by YidCal.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date

from homeassistant.core import HomeAssistant

from ..const import DayConditionType


class DayCondition(ABC):
    """A plugin that answers whether a date matches a semantic day-type."""

    @abstractmethod
    async def async_check(self, hass: HomeAssistant, reference_date: date) -> bool:
        """Return whether `reference_date` matches this condition.

        Concrete conditions are typically backed by a live sensor's
        *current* state, which can only speak to today - implementations
        should return False for a `reference_date` that isn't today rather
        than guessing, since neither confirming nor ruling out a past or
        future date is possible from current state alone. This means a
        day-condition rule's actual on/off firing (evaluated fresh each
        midnight - see SchedulerEngine._async_refresh_all) is always
        correct, but forward-looking previews (async_get_next_event) can
        only confirm today's occurrence, not predict a future one.
        """


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
