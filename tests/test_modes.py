"""Tests for Scheduler+'s date-based operating modes.

Split the way the feature is: modes.py's pure rules are exercised directly
(they're the part execution, previews, and the card all agree on), while
everything with a side effect - the websocket commands, the set_mode
service, the mode binary sensors - goes through the real Home Assistant
harness via hass_ws_client, the same way test_websocket.py does. The
engine-side gating lives in test_scheduler.py, next to the rest of the
occurrence-resolution tests it modifies.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.scheduler_plus.const import DOMAIN
from custom_components.scheduler_plus.modes import (
    find_mode,
    mode_active,
    orphaned_run_schedules,
    prune_dates,
    revise,
    schedule_allowed,
    with_date,
)
from custom_components.scheduler_plus.services import SERVICE_SET_MODE

# 2026-09-25 is a Friday; 2026-09-26 the Saturday after it.
_FRIDAY = date(2026, 9, 25)
_SATURDAY = date(2026, 9, 26)


def _mode(**overrides: Any) -> dict[str, Any]:
    """A mode dict with every field the storage layer would have written."""
    return {
        "id": "m1",
        "name": "Tish",
        "weekdays": [],
        "dates": {},
        "run_schedules": [],
        "skip_schedules": [],
        "rev": 0,
        **overrides,
    }


def test_date_choices_override_weekly_routine() -> None:
    """An explicit date wins over the weekly repeat, in both directions."""
    mode = _mode(weekdays=["fri"], dates={"2026-09-25": False, "2026-09-24": True})

    assert not mode_active(mode, _FRIDAY)
    assert mode_active(mode, date(2026, 9, 24))
    assert mode_active(mode, date(2026, 10, 2))


def test_mode_only_schedules_and_skip_priority() -> None:
    """Run makes a schedule exclusive to its modes; an active Skip beats it."""
    event = _mode(
        id="event-mode",
        weekdays=["fri"],
        run_schedules=["event"],
        skip_schedules=["regular"],
    )
    closed = _mode(id="closed-mode", weekdays=["fri"], skip_schedules=["event"])

    assert schedule_allowed([event], "event", _FRIDAY)
    assert not schedule_allowed([event], "event", _SATURDAY)
    assert not schedule_allowed([event], "regular", _FRIDAY)
    assert schedule_allowed([event], "regular", _SATURDAY)
    assert not schedule_allowed([event, closed], "event", _FRIDAY)
    assert schedule_allowed([event, closed], "unrelated", _FRIDAY)


def test_find_mode_prefers_id_then_name() -> None:
    """set_mode accepts either, since YAML authors only ever see the name."""
    modes = [_mode(id="abc", name="No school"), _mode(id="No school", name="Other")]

    assert find_mode(modes, "abc")["name"] == "No school"
    assert find_mode(modes, "No school")["name"] == "Other"
    assert find_mode(modes, "  no SCHOOL ")["id"] == "abc"
    assert find_mode(modes, "nothing") is None


def test_with_date_pins_and_releases_without_mutating() -> None:
    """Each write returns a new dict with a bumped revision."""
    mode = _mode(weekdays=["fri"])

    pinned = with_date(mode, "2026-09-25", False)
    assert not mode_active(pinned, _FRIDAY)
    assert pinned["rev"] == 1
    assert mode["dates"] == {}, "the original must be left alone"

    released = with_date(pinned, "2026-09-25", None)
    assert mode_active(released, _FRIDAY)
    assert released["rev"] == 2


def test_revise_bumps_revision_from_missing_field() -> None:
    """Modes stored before revisions existed start at 0, not a KeyError."""
    legacy = {"id": "m1", "name": "Tish"}

    assert revise(legacy, name="Tish II")["rev"] == 1


def test_prune_dates_keeps_yesterday_for_overnight_windows() -> None:
    """Yesterday survives: its overnight window still has an off action due."""
    mode = _mode(
        dates={
            "2026-09-20": True,
            "2026-09-24": True,
            "2026-09-25": False,
            "2026-10-01": True,
        }
    )

    pruned = prune_dates([mode], _FRIDAY)[0]

    assert sorted(pruned["dates"]) == ["2026-09-24", "2026-09-25", "2026-10-01"]
    assert pruned["rev"] == 0, "tidying is not an edit anyone made"


def test_orphaned_run_schedules_detects_lost_last_owner() -> None:
    """Only a schedule with no remaining Run owner counts as orphaned."""
    a = _mode(id="a", run_schedules=["s1", "s2"])
    b = _mode(id="b", run_schedules=["s2"])

    assert orphaned_run_schedules([a, b], [b]) == {"s1"}
    assert orphaned_run_schedules([a, b], [a, b]) == set()
    assert orphaned_run_schedules([a], []) == {"s1", "s2"}


async def _setup_entry(hass: HomeAssistant) -> MockConfigEntry:
    """Set up a bare Scheduler+ config entry - no host/credentials required."""
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _create_schedule(client, name: str = "Hall lights") -> str:
    """Create a minimal enabled schedule and return its id."""
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/create_schedule",
            "name": name,
            "device_type": "light",
            "entities": ["light.hall"],
        }
    )
    resp = await client.receive_json()
    assert resp["success"], resp
    return resp["result"]["schedule"]["id"]


async def _save_mode(client, **fields: Any) -> dict[str, Any]:
    """Send save_mode and return the raw response."""
    await client.send_json_auto_id({"type": f"{DOMAIN}/save_mode", **fields})
    return await client.receive_json()


async def test_save_mode_creates_and_lists(hass: HomeAssistant, hass_ws_client) -> None:
    """A created mode comes back from list_modes with a revision of 1."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    schedule_id = await _create_schedule(client)

    resp = await _save_mode(
        client, name="  Tish  ", weekdays=["fri"], run_schedules=[schedule_id]
    )

    assert resp["success"], resp
    assert resp["result"]["mode"]["name"] == "Tish", "name is trimmed"
    assert resp["result"]["mode"]["rev"] == 1
    assert resp["result"]["paused_schedules"] == []

    await client.send_json_auto_id({"type": f"{DOMAIN}/list_modes"})
    listed = await client.receive_json()
    assert [mode["name"] for mode in listed["result"]["modes"]] == ["Tish"]
    assert listed["result"]["today"] == dt_util.now().date().isoformat()


async def test_save_mode_rejects_stale_revision(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """An editor left open can't overwrite a date toggle made since."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    schedule_id = await _create_schedule(client)
    created = await _save_mode(client, name="Tish", run_schedules=[schedule_id])
    mode = created["result"]["mode"]

    # A date toggle lands while the editor is open, bumping the revision.
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/set_mode_date",
            "mode_id": mode["id"],
            "date": "2036-09-25",
            "active": True,
        }
    )
    toggled = await client.receive_json()
    assert toggled["success"], toggled
    assert toggled["result"]["mode"]["rev"] == mode["rev"] + 1

    stale = await _save_mode(
        client,
        mode_id=mode["id"],
        rev=mode["rev"],
        name="Tish",
        run_schedules=[schedule_id],
    )

    assert stale["success"] is False
    assert stale["error"]["code"] == "conflict"


async def test_save_mode_preserves_dates_it_never_saw(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """The editor doesn't send dates, so a fresh save leaves them intact."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    schedule_id = await _create_schedule(client)
    created = await _save_mode(client, name="Tish", run_schedules=[schedule_id])

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/set_mode_date",
            "mode_id": created["result"]["mode"]["id"],
            "date": "2036-09-25",
            "active": True,
        }
    )
    toggled = await client.receive_json()

    renamed = await _save_mode(
        client,
        mode_id=toggled["result"]["mode"]["id"],
        rev=toggled["result"]["mode"]["rev"],
        name="Friday night Tish",
        run_schedules=[schedule_id],
    )

    assert renamed["success"], renamed
    assert renamed["result"]["mode"]["dates"] == {"2036-09-25": True}


async def test_save_mode_requires_revision_with_mode_id(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """mode_id without rev fails schema validation - the check can't be skipped."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    created = await _save_mode(client, name="Tish")

    resp = await _save_mode(
        client, mode_id=created["result"]["mode"]["id"], name="Renamed"
    )

    assert resp["success"] is False


async def test_save_mode_rejects_unknown_and_double_assigned_schedules(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """A schedule gets one effect per mode, and must actually exist."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    schedule_id = await _create_schedule(client)

    unknown = await _save_mode(client, name="Tish", run_schedules=["nope"])
    assert unknown["success"] is False
    assert unknown["error"]["code"] == "invalid_format"

    both = await _save_mode(
        client, name="Tish", run_schedules=[schedule_id], skip_schedules=[schedule_id]
    )
    assert both["success"] is False
    assert both["error"]["code"] == "invalid_format"


async def test_losing_last_run_assignment_pauses_and_reports(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """The pause is announced, so it isn't discovered at 6am."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    schedule_id = await _create_schedule(client)
    created = await _save_mode(client, name="Tish", run_schedules=[schedule_id])

    dropped = await _save_mode(
        client,
        mode_id=created["result"]["mode"]["id"],
        rev=created["result"]["mode"]["rev"],
        name="Tish",
        run_schedules=[],
    )

    assert dropped["result"]["paused_schedules"] == ["Hall lights"]

    await client.send_json_auto_id({"type": f"{DOMAIN}/list_schedules"})
    listed = await client.receive_json()
    assert listed["result"]["schedules"][0]["enabled"] is False


async def test_delete_mode_pauses_its_exclusive_schedules(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """Deleting a mode is the other way a schedule can lose its last owner."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    schedule_id = await _create_schedule(client)
    created = await _save_mode(client, name="Tish", run_schedules=[schedule_id])

    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/delete_mode", "mode_id": created["result"]["mode"]["id"]}
    )
    resp = await client.receive_json()

    assert resp["success"], resp
    assert resp["result"]["paused_schedules"] == ["Hall lights"]
    assert resp["result"]["modes"] == []


async def test_deleting_a_schedule_drops_it_from_every_mode(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """_async_persist prunes assignments so modes can't reference a ghost."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    schedule_id = await _create_schedule(client)
    await _save_mode(client, name="Tish", skip_schedules=[schedule_id])

    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/delete_schedule", "schedule_id": schedule_id}
    )
    assert (await client.receive_json())["success"]

    await client.send_json_auto_id({"type": f"{DOMAIN}/list_modes"})
    listed = await client.receive_json()
    assert listed["result"]["modes"][0]["skip_schedules"] == []


async def _list_schedule(client) -> dict[str, Any]:
    """The single schedule from list_schedules, with its server-computed flags."""
    await client.send_json_auto_id({"type": f"{DOMAIN}/list_schedules"})
    resp = await client.receive_json()
    assert resp["success"], resp
    return resp["result"]["schedules"][0]


async def test_next_active_date_accounts_for_modes(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """A mode-blocked schedule never advertises a resume date modes will block.

    The seasonal window here is wide open - "always" - so anything but None
    would be coming from the mode, which is exactly the case the old
    seasonal-only _next_active_date got wrong.
    """
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    schedule_id = await _create_schedule(client)
    # Exclusive to a mode that is never on: no weekdays, no dates.
    created = await _save_mode(client, name="Tish", run_schedules=[schedule_id])
    mode = created["result"]["mode"]

    blocked = await _list_schedule(client)
    assert blocked["active_now"] is False
    assert blocked["mode_blocked"] is True
    assert blocked["next_active_date"] is None

    chosen = (dt_util.now().date() + timedelta(days=30)).isoformat()
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/set_mode_date",
            "mode_id": mode["id"],
            "date": chosen,
            "active": True,
        }
    )
    assert (await client.receive_json())["success"]

    scheduled = await _list_schedule(client)
    assert scheduled["mode_blocked"] is True
    assert scheduled["next_active_date"] == chosen


async def test_set_mode_service_pins_and_releases_a_date(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """Automations reach modes by name, which is all YAML authors ever see."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    await _save_mode(client, name="No school")

    await hass.services.async_call(
        DOMAIN,
        SERVICE_SET_MODE,
        {"mode": "no school", "state": "on", "date": "2036-09-25"},
        blocking=True,
    )

    await client.send_json_auto_id({"type": f"{DOMAIN}/list_modes"})
    listed = await client.receive_json()
    assert listed["result"]["modes"][0]["dates"] == {"2036-09-25": True}

    await hass.services.async_call(
        DOMAIN,
        SERVICE_SET_MODE,
        {"mode": "No school", "state": "auto", "date": "2036-09-25"},
        blocking=True,
    )

    await client.send_json_auto_id({"type": f"{DOMAIN}/list_modes"})
    listed = await client.receive_json()
    assert listed["result"]["modes"][0]["dates"] == {}


async def test_set_mode_service_rejects_an_unknown_mode(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """A typo in an automation fails loudly in the trace rather than silently."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    await _save_mode(client, name="No school")

    with pytest.raises(ServiceValidationError, match="No school"):
        await hass.services.async_call(
            DOMAIN, SERVICE_SET_MODE, {"mode": "typo", "state": "on"}, blocking=True
        )


async def _mode_sensor(hass: HomeAssistant, mode_id: str) -> str:
    """The entity id of a mode's binary sensor, by its stable unique id."""
    entity_id = er.async_get(hass).async_get_entity_id(
        "binary_sensor", DOMAIN, f"mode_{mode_id}_active"
    )
    assert entity_id is not None, "the mode's binary sensor was never added"
    return entity_id


async def test_mode_binary_sensor_follows_the_mode(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """Modes are reachable from automations and templates, not just the card."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    created = await _save_mode(client, name="No school")
    await hass.async_block_till_done()

    entity_id = await _mode_sensor(hass, created["result"]["mode"]["id"])
    sensor = hass.states.get(entity_id)
    assert sensor.state == "off"
    assert sensor.attributes["source"] == "weekly"

    await hass.services.async_call(
        DOMAIN, SERVICE_SET_MODE, {"mode": "No school", "state": "on"}, blocking=True
    )
    await hass.async_block_till_done()

    updated = hass.states.get(entity_id)
    assert updated.state == "on"
    assert updated.attributes["source"] == "date"


async def test_deleting_a_mode_removes_its_binary_sensor(
    hass: HomeAssistant, hass_ws_client
) -> None:
    """Mode entities appear and disappear with their modes, like schedules do."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)
    created = await _save_mode(client, name="No school")
    await hass.async_block_till_done()

    entity_id = await _mode_sensor(hass, created["result"]["mode"]["id"])

    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/delete_mode", "mode_id": created["result"]["mode"]["id"]}
    )
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()

    assert hass.states.get(entity_id) is None
