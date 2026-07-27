"""YidCal-backed day conditions for Scheduler+.

Each instance reflects the *current* state of one YidCal binary_sensor -
see DayCondition.async_check for why that limits these to same-day checks.
Entity IDs are fixed at registration time (day_conditions/__init__.py)
rather than made user-configurable, matching how DeviceHandler/TimeProvider
plugins are wired: if YidCal ever renames an entity, only that one
registration line needs to change.
"""

from __future__ import annotations

from datetime import date

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .base import DayCondition


class YidCalEntityDayCondition(DayCondition):
    """True when `reference_date` is today and the named entity is "on"."""

    def __init__(self, entity_id: str) -> None:
        """Initialize with the YidCal binary_sensor entity_id to watch."""
        self._entity_id = entity_id

    async def async_check(self, hass: HomeAssistant, reference_date: date) -> bool:
        """Return the entity's current on/off state, but only for today."""
        if reference_date != dt_util.now().date():
            return False

        state = hass.states.get(self._entity_id)
        return state is not None and state.state == "on"
