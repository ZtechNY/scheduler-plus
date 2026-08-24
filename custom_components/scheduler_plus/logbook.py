"""Describe Scheduler+ events for the Home Assistant Logbook.

Home Assistant auto-discovers this module for any integration that has one,
the same mechanism `automation`/`script` use to make their own actions show
up as "triggered by automation 'X'" instead of looking like they came from
nowhere. SchedulerEngine (`scheduler.py`'s `_fire_rule_triggered`) fires
EVENT_RULE_TRIGGERED under the exact Context it then passes to the resulting
light/switch/climate service call - sharing that Context is what lets the
Logbook link the entity's own "turned on/off" entry back to the description
below, crediting Scheduler+ (and the specific rule/schedule) as the cause.

The returned dict carries `rule_id`/`rule_name`/`schedule_name`/`turning_on`
as extra keys alongside the `name`/`message`/`entity_id` the Logbook UI
itself reads - additive and backward-compatible (unknown keys are ignored by
the Logbook), but load-bearing for `report.py`, which re-queries these same
events historically (via `logbook.processor.EventProcessor`, which calls
straight back into this describer for each matching event) to annotate a
report's state-history rows as "caused by this rule" instead of just
formatting a message string for display.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from homeassistant.core import Event, HomeAssistant, callback

from .const import DOMAIN, EVENT_RULE_TRIGGERED


@callback
def async_describe_events(
    hass: HomeAssistant,
    async_describe_event: Callable[[str, str, Callable[[Event], dict[str, Any]]], None],
) -> None:
    """Register the EVENT_RULE_TRIGGERED describer with the Logbook integration."""

    @callback
    def async_describe_rule_triggered(event: Event) -> dict[str, Any]:
        """Turn one EVENT_RULE_TRIGGERED event into a Logbook entry.

        `event` is a live `Event` when this fires from the real-time bus,
        but a `logbook.models.LazyEventPartialState` when it's re-derived
        from recorder history by `EventProcessor` (report.py's use case) -
        both expose a `.data` dict the same way, so no branching is needed
        here for that difference.
        """
        data = event.data
        state = "on" if data["turning_on"] else "off"
        return {
            "name": "Scheduler+",
            "message": (
                f"turned {data['entity_id']} {state} via rule "
                f"'{data['rule_name']}' in schedule '{data['schedule_name']}'"
            ),
            "entity_id": data["entity_id"],
            "rule_id": data["rule_id"],
            "rule_name": data["rule_name"],
            "schedule_name": data["schedule_name"],
            "turning_on": data["turning_on"],
        }

    async_describe_event(DOMAIN, EVENT_RULE_TRIGGERED, async_describe_rule_triggered)
