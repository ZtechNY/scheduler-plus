"""Tests for Scheduler+'s websocket API.

No websocket command had a dedicated test before this file (see report.py's
history-report feature) - `scheduler_plus/generate_report` is exercised here
via pytest-homeassistant-custom-component's standard `hass_ws_client`
fixture, the conventional way to drive a registered websocket command
end-to-end in a Home Assistant custom-integration test.
"""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.components.recorder.common import (
    async_wait_recording_done,
)

from custom_components.scheduler_plus.const import DOMAIN


async def _setup_entry(hass: HomeAssistant) -> MockConfigEntry:
    """Set up a bare Scheduler+ config entry - no host/credentials required."""
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_generate_report_not_set_up(hass, hass_ws_client) -> None:
    """Without any Scheduler+ config entry, the command reports not_found."""
    assert await async_setup_component(hass, "websocket_api", {})
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/generate_report",
            "entities": ["light.a"],
            "start_date": "2026-08-01",
            "end_date": "2026-08-01",
        }
    )
    resp = await client.receive_json()

    assert resp["success"] is False
    assert resp["error"]["code"] == "not_found"


async def test_generate_report_rejects_start_after_end(
    recorder_mock, hass: HomeAssistant, hass_ws_client
) -> None:
    """start_date after end_date is a cross-field validation error, not a crash."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/generate_report",
            "entities": ["light.a"],
            "start_date": "2026-08-02",
            "end_date": "2026-08-01",
        }
    )
    resp = await client.receive_json()

    assert resp["success"] is False
    assert resp["error"]["code"] == "invalid_format"


async def test_generate_report_rejects_malformed_date(
    recorder_mock, hass: HomeAssistant, hass_ws_client
) -> None:
    """A non "YYYY-MM-DD" date fails schema validation before the handler runs."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/generate_report",
            "entities": ["light.a"],
            "start_date": "not-a-date",
            "end_date": "2026-08-01",
        }
    )
    resp = await client.receive_json()

    assert resp["success"] is False


async def test_generate_report_rejects_empty_entities(
    recorder_mock, hass: HomeAssistant, hass_ws_client
) -> None:
    """An empty entities list fails schema validation (vol.Length(min=1))."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/generate_report",
            "entities": [],
            "start_date": "2026-08-01",
            "end_date": "2026-08-01",
        }
    )
    resp = await client.receive_json()

    assert resp["success"] is False


async def test_generate_report_happy_path(
    recorder_mock, hass: HomeAssistant, hass_ws_client
) -> None:
    """A valid request returns a report dict with one entity entry."""
    await _setup_entry(hass)
    client = await hass_ws_client(hass)

    hass.states.async_set("light.kitchen", "on", {"brightness": 100})
    await hass.async_block_till_done()
    await async_wait_recording_done(hass)

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/generate_report",
            "entities": ["light.kitchen"],
            "start_date": "2026-08-01",
            "end_date": "2026-08-01",
        }
    )
    resp = await client.receive_json()

    assert resp["success"] is True
    assert resp["result"]["start_date"] == "2026-08-01"
    assert resp["result"]["end_date"] == "2026-08-01"
    assert len(resp["result"]["entities"]) == 1
    assert resp["result"]["entities"][0]["entity_id"] == "light.kitchen"
