"""Websocket API for Scheduler+.

The frontend communicates with Scheduler+ exclusively through these
commands - no REST endpoints, no direct service calls for managing
schedules. Validation of untrusted input lives entirely here, at the
system boundary; the domain models (Schedule/Rule) and the scheduling
engine assume any data reaching them is already well-formed.
"""

from __future__ import annotations

import re
import uuid
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .const import (
    CONF_WEEKDAY_DAYS,
    CONF_WEEKEND_DAYS,
    CONF_WORKING_HOURS_END,
    CONF_WORKING_HOURS_START,
    DEFAULT_WEEKDAY_DAYS,
    DEFAULT_WEEKEND_DAYS,
    DEFAULT_WORKING_HOURS_END,
    DEFAULT_WORKING_HOURS_START,
    DOMAIN,
    DayConditionType,
    DeviceType,
    TimeProviderType,
)
from .coordinator import SchedulerPlusCoordinator
from .models import Rule, RuleDateMode, Schedule, Weekday
from .storage import SchedulerPlusStoreData


_DATE_RE = r"^\d{4}-\d{2}-\d{2}$"


def _validate_date_range(value: Any) -> tuple[str, str]:
    """Validate a [start, end] pair of "YYYY-MM-DD" strings, start <= end."""
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise vol.Invalid("date_ranges entries must be a [start, end] pair")
    start, end = value
    if not (
        isinstance(start, str)
        and isinstance(end, str)
        and re.match(_DATE_RE, start)
        and re.match(_DATE_RE, end)
    ):
        raise vol.Invalid('date_ranges entries must be "YYYY-MM-DD" strings')
    if start > end:
        raise vol.Invalid("date_ranges start must not be after end")
    return (start, end)


def _get_entry(hass: HomeAssistant) -> ConfigEntry | None:
    """Return the single Scheduler+ config entry, if set up.

    Looked up dynamically (rather than captured at registration time)
    because websocket commands are registered once in async_setup(), before
    any config entry necessarily exists.
    """
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def _get_coordinator(hass: HomeAssistant) -> SchedulerPlusCoordinator | None:
    """Return the coordinator for the single Scheduler+ config entry."""
    entry = _get_entry(hass)
    return entry.runtime_data.coordinator if entry is not None else None


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
        # Required even for RuleDateMode.INCLUDE rules, which ignore it -
        # keeping it non-optional avoids a conditional-on-date_mode schema.
        # The frontend fills it with every day for INCLUDE rules.
        vol.Required("days"): vol.All(
            cv.ensure_list, [vol.Coerce(Weekday)], vol.Length(min=1)
        ),
        vol.Optional("date_mode", default=RuleDateMode.ALWAYS): vol.Coerce(
            RuleDateMode
        ),
        vol.Optional("dates", default=list): vol.All(
            cv.ensure_list, [vol.Match(_DATE_RE)]
        ),
        vol.Optional("date_ranges", default=list): vol.All(
            cv.ensure_list, [_validate_date_range]
        ),
        vol.Optional("day_conditions", default=list): vol.All(
            cv.ensure_list, [vol.Coerce(DayConditionType)]
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
    """Return the stored schedules, each annotated with its next event.

    `next_event`/`next_event_action` are computed here (via the engine)
    rather than left for the frontend to work out from a separate sensor
    entity - a schedule's own list response is the one place the UI already
    has to read, and it keeps "what's next" logic in one place instead of
    duplicated between SchedulerEngine and the frontend.
    """
    entry = _get_entry(hass)
    if entry is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    engine = entry.runtime_data.engine
    schedules = []
    for raw_schedule in entry.runtime_data.coordinator.data["schedules"]:
        next_event = await engine.async_get_next_event(Schedule.from_dict(raw_schedule))
        schedules.append(
            {
                **raw_schedule,
                "next_event": next_event[0].isoformat() if next_event else None,
                "next_event_action": next_event[1] if next_event else None,
            }
        )

    connection.send_result(msg["id"], {"schedules": schedules})


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


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/get_preferences"})
@websocket_api.async_response
async def websocket_get_preferences(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the user's scheduling preferences.

    Configured via Scheduler+'s options flow (Settings > Devices & Services
    > Scheduler+ > Configure). The rule editor uses these to power its
    Weekdays/Weekend/After hours quick-fill presets.
    """
    entry = _get_entry(hass)
    if entry is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    options = entry.options
    connection.send_result(
        msg["id"],
        {
            "weekday_days": list(options.get(CONF_WEEKDAY_DAYS, DEFAULT_WEEKDAY_DAYS)),
            "weekend_days": list(options.get(CONF_WEEKEND_DAYS, DEFAULT_WEEKEND_DAYS)),
            "working_hours_start": options.get(
                CONF_WORKING_HOURS_START, DEFAULT_WORKING_HOURS_START
            ),
            "working_hours_end": options.get(
                CONF_WORKING_HOURS_END, DEFAULT_WORKING_HOURS_END
            ),
        },
    )


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all Scheduler+ websocket commands."""
    websocket_api.async_register_command(hass, websocket_list_schedules)
    websocket_api.async_register_command(hass, websocket_create_schedule)
    websocket_api.async_register_command(hass, websocket_update_schedule)
    websocket_api.async_register_command(hass, websocket_delete_schedule)
    websocket_api.async_register_command(hass, websocket_get_preferences)
