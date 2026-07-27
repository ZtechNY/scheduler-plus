"""Day-condition plugins for Scheduler+.

Each concrete condition (currently, YidCal-backed ones) implements the
DayCondition interface defined in base.py. This module assembles the
default DayConditionRegistry from the conditions that ship with
Scheduler+. Adding a new condition means adding one registration line here,
with no changes required to base.py or the scheduling engine.
"""

from __future__ import annotations

from ..const import DayConditionType
from .base import DayCondition, DayConditionRegistry
from .yidcal import YidCalEntityDayCondition

DEFAULT_DAY_CONDITIONS = DayConditionRegistry(
    {
        DayConditionType.SHABBOS: YidCalEntityDayCondition(
            "binary_sensor.yidcal_no_melucha_regular_shabbos"
        ),
        DayConditionType.YOM_TOV: YidCalEntityDayCondition(
            "binary_sensor.yidcal_no_melucha_yomtov"
        ),
        DayConditionType.EREV_SHABBOS: YidCalEntityDayCondition(
            "binary_sensor.yidcal_erev_shabbos"
        ),
        DayConditionType.EREV_YOM_TOV: YidCalEntityDayCondition(
            "binary_sensor.yidcal_erev_yom_tov"
        ),
    }
)

__all__ = ["DEFAULT_DAY_CONDITIONS", "DayCondition", "DayConditionRegistry"]
