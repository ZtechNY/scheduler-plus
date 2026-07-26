"""Websocket API for Scheduler+.

The frontend communicates with Scheduler+ exclusively through these
commands - no REST endpoints, no direct service calls for managing
schedules. Validation of untrusted input lives entirely here, at the
system boundary; the domain models (Schedule/Rule) and the scheduling
engine assume any data reaching them is already well-formed.
"""

from __future__ import annotations

import uuid
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN, DeviceType, TimeProviderType
from .coordinator import SchedulerPlusCoordinator
from .models import Rule, Schedule, Weekday
from .storage import SchedulerPlusStoreData


def _get_coordinator(hass: HomeAssistant) -> SchedulerPlusCoordinator | None:
    """Return the coordinator for the single Scheduler+ config entry.

    Looked up dynamically (rather than captured at registration time)
    because websocket commands are registered once in async_setup(), before
    any config entry - and therefore any coordinator - necessarily exists.
    """
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        return None
    return entries[0].runtime_data.coordinator


_TIME_SPEC_SCHEMA = vol.Schema(
    {
        vol.Required("provider"): vol.Coerce(TimeProviderType),
        vol.Optional("params", default=dict): dict,
    }
)

_RULE_SCHEMA = vol.Schema(
    {
        vol.Optional("id"): str,
        vol.Required("name"): str,
        vol.Optional("enabled", default=True): bool,
        vol.Required("days"): vol.All(
            cv.ensure_list, [vol.Coerce(Weekday)], vol.Length(min=1)
        ),
        vol.Required("on_time"): _TIME_SPEC_SCHEMA,
        vol.Required("off_time"): _TIME_SPEC_SCHEMA,
        vol.Optional("action", default=dict): dict,
    }
)

_SCHEDULE_FIELDS = {
    vol.Required("name"): str,
    vol.Required("device_type"): vol.Coerce(DeviceType),
    vol.Required("entities"): vol.All(
        cv.ensure_list, [cv.entity_id], vol.Length(min=1)
    ),
    vol.Optional("enabled", default=True): bool,
    vol.Optional("rules", default=list): [_RULE_SCHEMA],
}


def _mismatched_entities(device_type: DeviceType, entities: list[str]) -> list[str]:
    """Return any entity_ids whose domain doesn't match `device_type`."""
    expected_prefix = f"{device_type.value}."
    return [entity_id for entity_id in entities if not entity_id.startswith(expected_prefix)]


def _prepare_rule_data(raw: dict[str, Any]) -> dict[str, Any]:
    """Fill in a server-generated id for a rule payload that doesn't have one.

    Rule ids are opaque server-side identifiers with no independent
    websocket commands addressing them directly, so the client is never
    required to manage them: a rule echoed back from a previous
    create/update keeps its id, and a newly added rule gets a fresh one.
    """
    return {**raw, "id": raw.get("id") or str(uuid.uuid4())}


def _build_schedule(schedule_id: str, msg: dict[str, Any]) -> Schedule:
    """Build a Schedule from an already-validated create/update message."""
    return Schedule(
        id=schedule_id,
        name=msg["name"],
        enabled=msg["enabled"],
        device_type=msg["device_type"],
        entities=list(msg["entities"]),
        rules=[Rule.from_dict(_prepare_rule_data(rule)) for rule in msg["rules"]],
    )


async def _async_persist(
    coordinator: SchedulerPlusCoordinator, schedules: list[dict[str, Any]]
) -> None:
    """Replace the schedules list, notify listeners, and persist to storage.

    Notifying listeners (via async_set_updated_data) is what causes the
    SchedulerEngine to immediately rescan and reschedule based on the new
    data - the engine never has to be told about a change directly.
    """
    new_data: SchedulerPlusStoreData = {
        "version": coordinator.data["version"],
        "schedules": schedules,
    }
    coordinator.async_set_updated_data(new_data)
    await coordinator.async_save()


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/list_schedules"})
@websocket_api.async_response
async def websocket_list_schedules(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the raw list of stored schedules."""
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    connection.send_result(msg["id"], {"schedules": coordinator.data["schedules"]})


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/create_schedule", **_SCHEDULE_FIELDS}
)
@websocket_api.async_response
async def websocket_create_schedule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Create a new schedule."""
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    if mismatched := _mismatched_entities(msg["device_type"], msg["entities"]):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_INVALID_FORMAT,
            f"Entities do not match device_type '{msg['device_type'].value}': "
            f"{mismatched}",
        )
        return

    schedule = _build_schedule(str(uuid.uuid4()), msg)
    schedules = [*coordinator.data["schedules"], schedule.to_dict()]
    await _async_persist(coordinator, schedules)

    connection.send_result(msg["id"], {"schedule": schedule.to_dict()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/update_schedule",
        vol.Required("schedule_id"): str,
        **_SCHEDULE_FIELDS,
    }
)
@websocket_api.async_response
async def websocket_update_schedule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Replace an existing schedule's fields."""
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    existing = coordinator.data["schedules"]
    if not any(s["id"] == msg["schedule_id"] for s in existing):
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Schedule not found"
        )
        return

    if mismatched := _mismatched_entities(msg["device_type"], msg["entities"]):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_INVALID_FORMAT,
            f"Entities do not match device_type '{msg['device_type'].value}': "
            f"{mismatched}",
        )
        return

    schedule = _build_schedule(msg["schedule_id"], msg)
    schedules = [
        schedule.to_dict() if s["id"] == msg["schedule_id"] else s for s in existing
    ]
    await _async_persist(coordinator, schedules)

    connection.send_result(msg["id"], {"schedule": schedule.to_dict()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/delete_schedule",
        vol.Required("schedule_id"): str,
    }
)
@websocket_api.async_response
async def websocket_delete_schedule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete a schedule."""
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    existing = coordinator.data["schedules"]
    schedules = [s for s in existing if s["id"] != msg["schedule_id"]]
    if len(schedules) == len(existing):
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Schedule not found"
        )
        return

    await _async_persist(coordinator, schedules)

    connection.send_result(msg["id"], {})


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all Scheduler+ websocket commands."""
    websocket_api.async_register_command(hass, websocket_list_schedules)
    websocket_api.async_register_command(hass, websocket_create_schedule)
    websocket_api.async_register_command(hass, websocket_update_schedule)
    websocket_api.async_register_command(hass, websocket_delete_schedule)
