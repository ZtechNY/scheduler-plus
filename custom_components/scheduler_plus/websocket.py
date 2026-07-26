"""Websocket API for Scheduler+.

The frontend communicates with Scheduler+ exclusively through these
commands - no REST endpoints, no direct service calls for managing
schedules. This module contains no scheduling logic: it only exposes
whatever the coordinator currently holds in memory.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import SchedulerPlusCoordinator


def _get_coordinator(hass: HomeAssistant) -> SchedulerPlusCoordinator | None:
    """Return the coordinator for the single Scheduler+ config entry.

    Looked up dynamically (rather than captured at registration time)
    because websocket commands are registered once in async_setup(), before
    any config entry - and therefore any coordinator - necessarily exists.
    """
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        return None
    return entries[0].runtime_data


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/list_schedules"})
@websocket_api.async_response
async def websocket_list_schedules(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the raw list of stored schedules.

    Returns the persisted dicts as-is, not parsed Schedule dataclasses.
    Schedule parsing and validation are introduced once the scheduling
    engine exists.
    """
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    connection.send_result(msg["id"], {"schedules": coordinator.data["schedules"]})


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all Scheduler+ websocket commands."""
    websocket_api.async_register_command(hass, websocket_list_schedules)
