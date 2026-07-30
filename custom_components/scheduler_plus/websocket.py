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
from datetime import date, timedelta
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util

from .const import (
    CONF_ENABLE_BRIGHTNESS,
    CONF_ENABLE_FADE_IN,
    CONF_WEEKDAY_DAYS,
    CONF_WEEKEND_DAYS,
    CONF_WORKING_HOURS_END,
    CONF_WORKING_HOURS_START,
    DEFAULT_ENABLE_BRIGHTNESS,
    DEFAULT_ENABLE_FADE_IN,
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
from .models import Rule, RuleDateMode, Schedule, ScheduleTemplate, TemplateScope, Weekday
from .scheduler import SchedulerEngine
from .storage import SchedulerPlusStoreData


_DATE_RE = r"^\d{4}-\d{2}-\d{2}$"
_TIME_RE = r"^\d{2}:\d{2}$"


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


def _validate_time_enabled(value: dict[str, Any]) -> dict[str, Any]:
    """Require at least one of on_enabled/off_enabled to stay True.

    A rule that acts on neither side would be scheduled and simply do
    nothing, which is never useful and is almost certainly a UI bug or a
    mistaken edit, so it's rejected here rather than silently accepted.
    """
    if not value.get("on_enabled", True) and not value.get("off_enabled", True):
        raise vol.Invalid("At least one of on_enabled or off_enabled must be true")
    return value


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

_RULE_SCHEMA = vol.All(
    vol.Schema(
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
            vol.Optional("on_enabled", default=True): bool,
            vol.Optional("off_enabled", default=True): bool,
            vol.Optional("allow_override", default=True): bool,
            vol.Optional("override_grace_minutes", default=15): vol.All(
                vol.Coerce(int), vol.Range(min=1)
            ),
            vol.Optional("action", default=dict): dict,
        }
    ),
    _validate_time_enabled,
)

_SCHEDULE_FIELDS = {
    vol.Required("name"): str,
    vol.Required("device_type"): vol.Coerce(DeviceType),
    vol.Required("entities"): vol.All(
        cv.ensure_list, [cv.entity_id], vol.Length(min=1)
    ),
    vol.Optional("enabled", default=True): bool,
    vol.Optional("rules", default=list): [_RULE_SCHEMA],
    # Seasonal active window - see Schedule.is_active_on's docstring for why
    # this is a schedule-level, date-range-only concept distinct from a
    # Rule's own date_mode/dates/date_ranges.
    vol.Optional("active_date_mode", default=RuleDateMode.ALWAYS): vol.Coerce(
        RuleDateMode
    ),
    vol.Optional("active_date_ranges", default=list): vol.All(
        cv.ensure_list, [_validate_date_range]
    ),
    # A manager-triggered pause, "paused through and including this date" -
    # see Schedule.is_overridden's docstring. Date-granularity (not
    # datetime), reusing the same _DATE_RE every other date field already
    # validates against.
    vol.Optional("override_until", default=None): vol.Any(None, vol.Match(_DATE_RE)),
}


_TEMPLATE_FIELDS = {
    vol.Required("name"): str,
    vol.Required("device_type"): vol.Coerce(DeviceType),
    vol.Optional("rules", default=list): [_RULE_SCHEMA],
    vol.Optional("scope", default=TemplateScope.SCHEDULE): vol.Coerce(TemplateScope),
}


_DEVICE_TYPE_DOMAINS: dict[DeviceType, tuple[str, ...]] = {
    DeviceType.LIGHT: ("light",),
    DeviceType.CLIMATE: ("climate",),
    DeviceType.SWITCH: ("switch",),
    DeviceType.LIGHT_SWITCH: ("light", "switch"),
}


def _mismatched_entities(device_type: DeviceType, entities: list[str]) -> list[str]:
    """Return any entity_ids whose domain doesn't match `device_type`.

    LIGHT_SWITCH allows either light.* or switch.* - see DeviceType's
    docstring for why it's a domain *group*, not a single domain.
    """
    allowed_prefixes = tuple(f"{domain}." for domain in _DEVICE_TYPE_DOMAINS[device_type])
    return [
        entity_id for entity_id in entities if not entity_id.startswith(allowed_prefixes)
    ]


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
        active_date_mode=msg["active_date_mode"],
        active_date_ranges=frozenset(msg["active_date_ranges"]),
        override_until=msg["override_until"],
    )


def _build_template(template_id: str, msg: dict[str, Any]) -> ScheduleTemplate:
    """Build a ScheduleTemplate from an already-validated create_template message.

    Rules run through _prepare_rule_data just like a schedule's do, since a
    template saved from an in-progress schedule editor will contain rules
    that don't have an id yet - Rule.from_dict requires one.
    """
    return ScheduleTemplate(
        id=template_id,
        name=msg["name"],
        device_type=msg["device_type"],
        rules=[Rule.from_dict(_prepare_rule_data(rule)) for rule in msg["rules"]],
        scope=msg["scope"],
    )


async def _async_persist(
    coordinator: SchedulerPlusCoordinator, schedules: list[dict[str, Any]]
) -> None:
    """Replace the schedules list, notify listeners, and persist to storage.

    Notifying listeners (via async_set_updated_data) is what causes the
    SchedulerEngine to immediately rescan and reschedule based on the new
    data - the engine never has to be told about a change directly.
    `user_preferences`/`templates` are carried over unchanged - this
    function only ever touches schedules, and coordinator.data is replaced
    wholesale, so dropping either here would silently erase every user's
    saved preferences or every saved template the next time any schedule
    was created, updated, or deleted.
    """
    new_data: SchedulerPlusStoreData = {
        "version": coordinator.data["version"],
        "schedules": schedules,
        "user_preferences": coordinator.data["user_preferences"],
        "templates": coordinator.data["templates"],
    }
    coordinator.async_set_updated_data(new_data)
    await coordinator.async_save()


async def _async_persist_templates(
    coordinator: SchedulerPlusCoordinator, templates: list[dict[str, Any]]
) -> None:
    """Replace the templates list, notify listeners, and persist to storage.

    Mirrors _async_persist exactly, but for `templates` instead of
    `schedules` - `schedules`/`user_preferences` are carried over unchanged
    for the same reason _async_persist carries the other two over.
    """
    new_data: SchedulerPlusStoreData = {
        "version": coordinator.data["version"],
        "schedules": coordinator.data["schedules"],
        "user_preferences": coordinator.data["user_preferences"],
        "templates": templates,
    }
    coordinator.async_set_updated_data(new_data)
    await coordinator.async_save()


def _next_active_date(schedule: Schedule, today: date) -> str | None:
    """The soonest upcoming date `schedule`'s seasonal window turns active, if any.

    Only meaningful for RuleDateMode.INCLUDE (a window that's currently
    "off" but has a known future start) - EXCLUDE's "active everywhere but
    these ranges" doesn't have a single well-defined "next active" moment,
    so this returns None for it, same as when the schedule is already
    active or has no active_date_ranges at all.
    """
    if schedule.active_date_mode is not RuleDateMode.INCLUDE:
        return None
    if schedule.is_active_on(today):
        return None
    today_str = today.isoformat()
    upcoming = [start for start, end in schedule.active_date_ranges if end >= today_str]
    return min(upcoming) if upcoming else None


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
    today = dt_util.now().date()
    schedules = []
    for raw_schedule in entry.runtime_data.coordinator.data["schedules"]:
        schedule = Schedule.from_dict(raw_schedule)
        next_event = await engine.async_get_next_event(schedule)
        schedules.append(
            {
                **raw_schedule,
                "next_event": next_event[0].isoformat() if next_event else None,
                "next_event_action": next_event[1] if next_event else None,
                "active_now": schedule.is_active_on(today)
                and not schedule.is_overridden(today),
                "next_active_date": _next_active_date(schedule, today),
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
    """Return the calling user's own scheduling preferences.

    Each Home Assistant user can set their own weekday/weekend/working-
    hours split (see websocket_set_preferences) rather than sharing one
    org-wide value - this falls back to the admin-configured defaults from
    Scheduler+'s options flow (Settings > Devices & Services > Scheduler+ >
    Configure) only for a user who hasn't set their own yet. The rule
    editor uses the result to power its Weekdays/Weekend/After hours
    quick-fill presets.

    enable_brightness/enable_fade_in are different: they're org-wide
    feature toggles with no per-user override at all, so they're always
    read from the options flow and merged into the response regardless of
    which branch below fires - unlike weekday_days/etc., a user's own
    saved preferences dict never contains them.
    """
    entry = _get_entry(hass)
    if entry is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    options = entry.options
    feature_toggles = {
        "enable_brightness": options.get(CONF_ENABLE_BRIGHTNESS, DEFAULT_ENABLE_BRIGHTNESS),
        "enable_fade_in": options.get(CONF_ENABLE_FADE_IN, DEFAULT_ENABLE_FADE_IN),
    }

    user_preferences = entry.runtime_data.coordinator.data["user_preferences"].get(
        connection.user.id
    )
    if user_preferences is not None:
        connection.send_result(msg["id"], {**user_preferences, **feature_toggles})
        return

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
            **feature_toggles,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/set_preferences",
        vol.Required("weekday_days"): vol.All(
            cv.ensure_list, [vol.Coerce(Weekday)], vol.Length(min=1)
        ),
        vol.Required("weekend_days"): vol.All(
            cv.ensure_list, [vol.Coerce(Weekday)], vol.Length(min=1)
        ),
        vol.Required("working_hours_start"): vol.Match(_TIME_RE),
        vol.Required("working_hours_end"): vol.Match(_TIME_RE),
    }
)
@websocket_api.async_response
async def websocket_set_preferences(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Save the calling user's own scheduling preferences.

    Stored per Home Assistant user (connection.user.id) in Scheduler+'s own
    storage, not shared org-wide - each user gets their own weekday/
    weekend/working-hours split, independent of the admin-only options
    flow defaults (which remain the fallback for anyone who hasn't set
    their own).
    """
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    preferences = {
        "weekday_days": [day.value for day in msg["weekday_days"]],
        "weekend_days": [day.value for day in msg["weekend_days"]],
        "working_hours_start": msg["working_hours_start"],
        "working_hours_end": msg["working_hours_end"],
    }
    new_data: SchedulerPlusStoreData = {
        "version": coordinator.data["version"],
        "schedules": coordinator.data["schedules"],
        "user_preferences": {
            **coordinator.data["user_preferences"],
            connection.user.id: preferences,
        },
    }
    coordinator.async_set_updated_data(new_data)
    await coordinator.async_save()

    connection.send_result(msg["id"], preferences)


async def _collect_day_events(
    coordinator: SchedulerPlusCoordinator,
    engine: SchedulerEngine,
    reference_date: date,
    device_type_filter: DeviceType | None,
) -> list[dict[str, Any]]:
    """Every rule occurrence on `reference_date`, across all schedules, as plain dicts.

    Shared by websocket_get_day_schedule (one date) and
    websocket_get_week_schedule (called once per day of the week) so both
    read-only reports stay backed by the exact same
    SchedulerEngine.async_get_day_events resolution logic.
    """
    events: list[dict[str, Any]] = []
    for raw_schedule in coordinator.data["schedules"]:
        schedule = Schedule.from_dict(raw_schedule)
        if device_type_filter is not None and schedule.device_type != device_type_filter:
            continue

        for rule, on_at, off_at in await engine.async_get_day_events(
            schedule, reference_date
        ):
            events.append(
                {
                    "schedule_id": schedule.id,
                    "schedule_name": schedule.name,
                    "device_type": schedule.device_type.value,
                    "entities": list(schedule.entities),
                    "rule_id": rule.id,
                    "rule_name": rule.name,
                    "action": dict(rule.action),
                    "on_at": on_at.isoformat() if on_at else None,
                    "off_at": off_at.isoformat() if off_at else None,
                }
            )
    return events


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get_day_schedule",
        vol.Required("date"): vol.Match(_DATE_RE),
        vol.Optional("device_type"): vol.Coerce(DeviceType),
    }
)
@websocket_api.async_response
async def websocket_get_day_schedule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return every rule occurrence on a given date, across all schedules.

    Read-only reporting endpoint powering the card's Day view dialog.
    Reuses the engine's own occurrence-resolution logic (weekday matching,
    date filters, day conditions, time providers) via
    SchedulerEngine.async_get_day_events, so the report always matches what
    the engine would actually do instead of the frontend re-deriving that
    logic independently.
    """
    entry = _get_entry(hass)
    if entry is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    reference_date = date.fromisoformat(msg["date"])
    device_type_filter: DeviceType | None = msg.get("device_type")
    events = await _collect_day_events(
        entry.runtime_data.coordinator,
        entry.runtime_data.engine,
        reference_date,
        device_type_filter,
    )

    connection.send_result(msg["id"], {"events": events})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get_week_schedule",
        vol.Required("start_date"): vol.Match(_DATE_RE),
        vol.Optional("device_type"): vol.Coerce(DeviceType),
    }
)
@websocket_api.async_response
async def websocket_get_week_schedule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return every rule occurrence across the 7 days starting at `start_date`.

    The week-at-a-glance view's backing endpoint: calls the same
    _collect_day_events helper as websocket_get_day_schedule once per day,
    so it inherits identical seasonal/pause gating and occurrence
    resolution without duplicating any of that logic.
    """
    entry = _get_entry(hass)
    if entry is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    start_date = date.fromisoformat(msg["start_date"])
    device_type_filter: DeviceType | None = msg.get("device_type")
    coordinator = entry.runtime_data.coordinator
    engine = entry.runtime_data.engine

    days: list[dict[str, Any]] = []
    for offset in range(7):
        reference_date = start_date + timedelta(days=offset)
        events = await _collect_day_events(
            coordinator, engine, reference_date, device_type_filter
        )
        days.append({"date": reference_date.isoformat(), "events": events})

    connection.send_result(msg["id"], {"days": days})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/list_templates"})
@websocket_api.async_response
async def websocket_list_templates(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the stored schedule templates."""
    entry = _get_entry(hass)
    if entry is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    connection.send_result(
        msg["id"], {"templates": entry.runtime_data.coordinator.data["templates"]}
    )


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/create_template", **_TEMPLATE_FIELDS}
)
@websocket_api.async_response
async def websocket_create_template(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Save a new reusable schedule template.

    A template has no `entities`/`enabled` - it's applied later via
    websocket_create_schedule_from_template, which supplies those along
    with a fresh id for every rule.
    """
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    template = _build_template(str(uuid.uuid4()), msg)
    templates = [*coordinator.data["templates"], template.to_dict()]
    await _async_persist_templates(coordinator, templates)

    connection.send_result(msg["id"], {"template": template.to_dict()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/delete_template",
        vol.Required("template_id"): str,
    }
)
@websocket_api.async_response
async def websocket_delete_template(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete a schedule template."""
    coordinator = _get_coordinator(hass)
    if coordinator is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Scheduler+ is not set up"
        )
        return

    existing = coordinator.data["templates"]
    templates = [t for t in existing if t["id"] != msg["template_id"]]
    if len(templates) == len(existing):
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Template not found"
        )
        return

    await _async_persist_templates(coordinator, templates)

    connection.send_result(msg["id"], {})


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all Scheduler+ websocket commands."""
    websocket_api.async_register_command(hass, websocket_list_schedules)
    websocket_api.async_register_command(hass, websocket_create_schedule)
    websocket_api.async_register_command(hass, websocket_update_schedule)
    websocket_api.async_register_command(hass, websocket_delete_schedule)
    websocket_api.async_register_command(hass, websocket_get_preferences)
    websocket_api.async_register_command(hass, websocket_set_preferences)
    websocket_api.async_register_command(hass, websocket_get_day_schedule)
    websocket_api.async_register_command(hass, websocket_get_week_schedule)
    websocket_api.async_register_command(hass, websocket_list_templates)
    websocket_api.async_register_command(hass, websocket_create_template)
    websocket_api.async_register_command(hass, websocket_delete_template)
