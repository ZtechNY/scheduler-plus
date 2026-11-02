"""Day-condition plugins for Scheduler+.

Each concrete condition (currently, the Shabbos/Yom Tov ones) implements the
DayCondition interface defined in base.py. This module assembles the
default DayConditionRegistry from the conditions that ship with
Scheduler+. Adding a new condition means adding one registration line here,
with no changes required to base.py or the scheduling engine.
"""

from __future__ import annotations

from ..const import DayConditionType
from .base import DayCondition, DayConditionRegistry
from .yidcal import YidCalDayCondition

# Candle lighting on the eve of Shabbos/Yom Tov and havdalah at its end -
# see YidCalDayCondition.
_CANDLE_LIGHTING_ENTITY = "sensor.yidcal_zman_erev"
_HAVDALAH_ENTITY = "sensor.yidcal_zman_motzi"

DEFAULT_DAY_CONDITIONS = DayConditionRegistry(
    {
        condition_type: YidCalDayCondition(
            condition_type, _CANDLE_LIGHTING_ENTITY, _HAVDALAH_ENTITY
        )
        for condition_type in (
            DayConditionType.SHABBOS,
            DayConditionType.YOM_TOV,
            DayConditionType.EREV_SHABBOS,
            DayConditionType.EREV_YOM_TOV,
        )
    }
)

__all__ = ["DEFAULT_DAY_CONDITIONS", "DayCondition", "DayConditionRegistry"]
