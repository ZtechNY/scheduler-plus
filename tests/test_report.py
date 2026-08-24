"""Tests for Scheduler+'s history-report builder (report.py).

_compact_points/_nearest_rule_match/validate_report_bounds are pure
functions and are tested directly with hand-built State objects, with no
Home Assistant recorder involved. async_build_report itself is exercised
against a real (in-memory SQLite) recorder via pytest-homeassistant-custom-
component's `recorder_mock` fixture, since report.py's whole purpose is
querying recorder/logbook's real APIs correctly - mocking those away would
test nothing meaningful about this module. See report.py's module docstring
for why context-id correlation (the first approach considered) isn't used:
this is what confirmed that, by testing against the real recorder.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from homeassistant.core import Context, HomeAssistant, State
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.components.recorder.common import (
    async_wait_recording_done,
)

from custom_components.scheduler_plus.const import EVENT_RULE_TRIGGERED
from custom_components.scheduler_plus.report import (
    MAX_REPORT_ENTITIES,
    MAX_REPORT_RANGE_DAYS,
    ReportError,
    ReportRangeError,
    _compact_points,
    _nearest_rule_match,
    async_build_report,
    validate_report_bounds,
)

_D1 = date(2026, 8, 1)
_D2 = date(2026, 8, 2)


def _state(
    entity_id: str, state: str, attributes: dict, at: datetime
) -> State:
    """Build a bare State object for _compact_points tests - no recorder involved."""
    return State(entity_id, state, attributes, last_updated=at, last_changed=at)


# --- validate_report_bounds -------------------------------------------------


def test_validate_report_bounds_accepts_a_valid_request() -> None:
    """A same-day, single-entity request never raises."""
    validate_report_bounds(["light.a"], _D1, _D1)


def test_validate_report_bounds_rejects_start_after_end() -> None:
    with pytest.raises(ReportRangeError):
        validate_report_bounds(["light.a"], _D2, _D1)


def test_validate_report_bounds_rejects_too_long_a_range() -> None:
    end = _D1 + timedelta(days=MAX_REPORT_RANGE_DAYS)
    with pytest.raises(ReportRangeError):
        validate_report_bounds(["light.a"], _D1, end)


def test_validate_report_bounds_rejects_no_entities() -> None:
    with pytest.raises(ReportRangeError):
        validate_report_bounds([], _D1, _D1)


def test_validate_report_bounds_rejects_too_many_entities() -> None:
    entities = [f"light.a{i}" for i in range(MAX_REPORT_ENTITIES + 1)]
    with pytest.raises(ReportRangeError):
        validate_report_bounds(entities, _D1, _D1)


# --- _nearest_rule_match -----------------------------------------------------


def test_nearest_rule_match_within_tolerance() -> None:
    at = datetime(2026, 8, 1, 8, 0, 0, tzinfo=timezone.utc)
    events = [(at + timedelta(seconds=3), {"rule_name": "R", "schedule_name": "S"})]
    assert _nearest_rule_match(at, events) == {"rule_name": "R", "schedule_name": "S"}


def test_nearest_rule_match_outside_tolerance_is_none() -> None:
    at = datetime(2026, 8, 1, 8, 0, 0, tzinfo=timezone.utc)
    events = [(at + timedelta(minutes=5), {"rule_name": "R", "schedule_name": "S"})]
    assert _nearest_rule_match(at, events) is None


def test_nearest_rule_match_picks_the_closest_of_several() -> None:
    at = datetime(2026, 8, 1, 8, 0, 0, tzinfo=timezone.utc)
    events = [
        (at + timedelta(seconds=10), {"rule_name": "far", "schedule_name": "S"}),
        (at + timedelta(seconds=1), {"rule_name": "near", "schedule_name": "S"}),
    ]
    assert _nearest_rule_match(at, events)["rule_name"] == "near"


# --- _compact_points ----------------------------------------------------------


def test_compact_points_collapses_duplicate_samples() -> None:
    """Repeated identical (state, tracked attrs) samples become one point."""
    base = datetime(2026, 8, 1, 8, tzinfo=timezone.utc)
    states = [
        _state("switch.a", "on", {}, base),
        _state("switch.a", "on", {}, base + timedelta(minutes=5)),
        _state("switch.a", "on", {}, base + timedelta(minutes=10)),
        _state("switch.a", "off", {}, base + timedelta(minutes=15)),
    ]
    points, truncated = _compact_points(states, "switch", [])
    assert [p.state for p in points] == ["on", "off"]
    assert truncated is False


def test_compact_points_tracks_attribute_only_changes_for_climate() -> None:
    """A climate setpoint change with hvac_mode unchanged is still a new point."""
    base = datetime(2026, 8, 1, 8, tzinfo=timezone.utc)
    states = [
        _state(
            "climate.a", "heat", {"temperature": 68, "current_temperature": 65}, base
        ),
        _state(
            "climate.a",
            "heat",
            {"temperature": 70, "current_temperature": 65},
            base + timedelta(minutes=5),
        ),
    ]
    points, _truncated = _compact_points(states, "climate", [])
    assert len(points) == 2
    assert points[0].attributes["temperature"] == 68
    assert points[1].attributes["temperature"] == 70


def test_compact_points_ignores_untracked_attributes_for_switch() -> None:
    """switch has no tracked attributes, so an attribute-only change collapses away."""
    base = datetime(2026, 8, 1, 8, tzinfo=timezone.utc)
    states = [
        _state("switch.a", "on", {"icon": "mdi:one"}, base),
        _state("switch.a", "on", {"icon": "mdi:two"}, base + timedelta(minutes=5)),
    ]
    points, _truncated = _compact_points(states, "switch", [])
    assert len(points) == 1


def test_compact_points_annotates_source_from_rule_events() -> None:
    at = datetime(2026, 8, 1, 8, tzinfo=timezone.utc)
    states = [_state("light.a", "on", {}, at)]
    rule_events = [(at, {"rule_name": "Evening", "schedule_name": "Porch"})]
    points, _truncated = _compact_points(states, "light", rule_events)
    assert points[0].source == "rule"
    assert points[0].rule_name == "Evening"
    assert points[0].schedule_name == "Porch"


def test_compact_points_defaults_to_other_without_a_matching_event() -> None:
    at = datetime(2026, 8, 1, 8, tzinfo=timezone.utc)
    states = [_state("light.a", "on", {}, at)]
    points, _truncated = _compact_points(states, "light", [])
    assert points[0].source == "other"
    assert points[0].rule_name is None


# --- async_build_report (real in-memory recorder) -----------------------------


async def test_async_build_report_requires_recorder(hass: HomeAssistant) -> None:
    """Without the recorder component set up, building a report raises ReportError."""
    with pytest.raises(ReportError):
        await async_build_report(hass, ["light.a"], _D1, _D1)


async def test_async_build_report_no_data_for_unknown_entity(
    recorder_mock, hass: HomeAssistant
) -> None:
    """An entity with no recorded history ever gets no_data=True, not an error."""
    await async_wait_recording_done(hass)
    today = dt_util.now().date()
    result = await async_build_report(hass, ["light.never_existed"], today, today)
    assert len(result.entities) == 1
    assert result.entities[0].no_data is True
    assert result.entities[0].points == []


async def test_async_build_report_annotates_rule_triggered_changes(
    recorder_mock, hass: HomeAssistant
) -> None:
    """A state change whose EVENT_RULE_TRIGGERED shares its moment is annotated "rule".

    A second, unrelated state change (no matching event nearby) comes back
    "other" - this is the same behavior _compact_points' unit tests already
    cover in isolation, exercised here through the real recorder/logbook
    query path instead of hand-built State objects, since that query path
    (not the compaction math) is what actually needed verifying.
    """
    assert await async_setup_component(hass, "logbook", {})
    await hass.async_block_till_done()

    entity_id = "light.kitchen"
    today = dt_util.now().date()

    # A Scheduler+-triggered change: fire EVENT_RULE_TRIGGERED and the
    # resulting state change under the same Context, mirroring
    # scheduler.py's _issue_turn_on.
    context = Context()
    hass.bus.async_fire(
        EVENT_RULE_TRIGGERED,
        {
            "entity_id": entity_id,
            "rule_id": "rule-1",
            "rule_name": "Evening On",
            "schedule_name": "Kitchen Lights",
            "turning_on": True,
        },
        context=context,
    )
    hass.states.async_set(entity_id, "on", {"brightness": 200}, context=context)
    await hass.async_block_till_done()

    # An unrelated manual change a while later, no Scheduler+ event nearby.
    hass.states.async_set(entity_id, "off", {}, context=Context())
    await hass.async_block_till_done()

    await async_wait_recording_done(hass)

    result = await async_build_report(hass, [entity_id], today, today)
    assert len(result.entities) == 1
    entity_report = result.entities[0]
    assert entity_report.no_data is False
    assert [p.state for p in entity_report.points] == ["on", "off"]
    assert entity_report.points[0].source == "rule"
    assert entity_report.points[0].rule_name == "Evening On"
    assert entity_report.points[0].schedule_name == "Kitchen Lights"
    assert entity_report.points[1].source == "other"


async def test_async_build_report_degrades_gracefully_without_logbook(
    recorder_mock, hass: HomeAssistant
) -> None:
    """Without the logbook component, every point still comes back - just unannotated."""
    entity_id = "switch.fan"
    today = dt_util.now().date()

    hass.states.async_set(entity_id, "on", {})
    await hass.async_block_till_done()
    await async_wait_recording_done(hass)

    result = await async_build_report(hass, [entity_id], today, today)
    assert result.entities[0].no_data is False
    assert result.entities[0].points[0].source == "other"
