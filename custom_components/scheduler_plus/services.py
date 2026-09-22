"""Service calls for Scheduler+.

Operating modes are the one part of Scheduler+ that a *person* decides
day to day ("there's a Bris tomorrow"), so they need a way in that isn't
the card: an automation reacting to a calendar event, a dashboard button,
a voice assistant, a script run from a phone. That's what set_mode is.

Schedules deliberately have no service equivalent - they're structural,
edited in the card, and exposing a mutation API for them would mean
duplicating the whole validation layer that lives in websocket.py.
"""

from __future__ import annotations

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .modes import find_mode, with_date
from .websocket import async_persist_modes, get_coordinator

SERVICE_SET_MODE = "set_mode"

ATTR_MODE = "mode"
ATTR_DATE = "date"
ATTR_STATE = "state"

STATE_ON = "on"
STATE_OFF = "off"
STATE_AUTO = "auto"

SET_MODE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_MODE): cv.string,
        vol.Required(ATTR_STATE): vol.In([STATE_ON, STATE_OFF, STATE_AUTO]),
        vol.Optional(ATTR_DATE): cv.date,
    }
)


async def _async_set_mode(call: ServiceCall) -> None:
    """Turn a mode on or off for a date, or release it to its weekly repeat.

    Errors are ServiceValidationError rather than a logged warning: a
    mistyped mode name in an automation that's supposed to keep the lights
    on for a Chasunah should fail loudly in the trace, not quietly do
    nothing.
    """
    coordinator = get_coordinator(call.hass)
    if coordinator is None:
        raise ServiceValidationError("Scheduler+ is not set up")

    modes = coordinator.data.get("modes", [])
    mode = find_mode(modes, call.data[ATTR_MODE])
    if mode is None:
        known = ", ".join(sorted(m["name"] for m in modes)) or "none defined yet"
        raise ServiceValidationError(
            f"No Scheduler+ mode named '{call.data[ATTR_MODE]}' (known modes: {known})"
        )

    day = call.data.get(ATTR_DATE) or dt_util.now().date()
    state = call.data[ATTR_STATE]
    updated = with_date(
        mode, day.isoformat(), None if state == STATE_AUTO else state == STATE_ON
    )
    await async_persist_modes(
        coordinator, [updated if m["id"] == mode["id"] else m for m in modes]
    )


@callback
def async_register_services(hass: HomeAssistant) -> None:
    """Register Scheduler+ services.

    Called from async_setup() for the same reason the websocket commands
    are: services are global to the Home Assistant run, while
    async_setup_entry() re-runs on every config entry reload.
    """
    if hass.services.has_service(DOMAIN, SERVICE_SET_MODE):
        return
    hass.services.async_register(
        DOMAIN, SERVICE_SET_MODE, _async_set_mode, schema=SET_MODE_SCHEMA
    )
