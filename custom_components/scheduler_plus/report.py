"""Historical report generation for Scheduler+.

Builds a per-entity history of state changes over an arbitrary date range
for the card's Report dialog and PDF export, sourced from Home Assistant's
recorder (`homeassistant.components.recorder.history.get_significant_states`)
rather than anything Scheduler+ persists itself - schedules only describe
*intended* behavior; this module reports what actually happened.

Each returned point is annotated with a best-effort `source`: "rule" when a
Scheduler+ EVENT_RULE_TRIGGERED event (see const.py/scheduler.py/logbook.py)
was fired for the same entity within a small time tolerance of the state
change, "other" otherwise. This is a timestamp-based heuristic, not an exact
match: recorder-reconstructed historical State objects don't carry a usable
context id back to the event that caused them (get_significant_states's
underlying LazyState/row_to_compressed_state never restore Context - verified
against the installed homeassistant package's
recorder/history/modern.py, which has no context handling at all), so exact
context-id correlation isn't available through this public API. A close-in-
time match against Scheduler+'s own event is the closest available signal;
"other" therefore means "not provably a Scheduler+ rule," not necessarily "a
person" - it could be a different automation entirely, which the frontend
should make clear rather than implying a human did it.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Literal

from homeassistant.components.recorder import get_instance as get_recorder_instance
from homeassistant.components.recorder import history
from homeassistant.core import HomeAssistant, State
from homeassistant.util import dt as dt_util

from .const import EVENT_RULE_TRIGGERED

_LOGGER = logging.getLogger(__name__)

# Bounded-work guards, same spirit as scheduler.py's
# _MAX_INCLUDE_RANGE_CHECK_DAYS - an unbounded recorder query (or an
# unbounded PDF) is real backend/DB cost, not just a slow response. Public
# (no leading underscore) since websocket.py's schema validation reuses them.
MAX_REPORT_RANGE_DAYS = 92
MAX_REPORT_ENTITIES = 25

# How close a state change and an EVENT_RULE_TRIGGERED event for the same
# entity must be, in seconds, to treat the change as caused by that rule.
# Generous enough to absorb a real device's own turn-on latency (a network
# round-trip to a physical thermostat/bulb) without starting to false-match
# a later, unrelated change.
_RULE_MATCH_TOLERANCE = timedelta(seconds=15)

# Attributes worth tracking per real entity domain, beyond the state string
# itself. There's no existing "attributes worth tracking" concept on
# DeviceHandler (device_handlers/base.py) to derive this from - matches_action
# there answers a narrower, different question ("does this match one
# specific rule action", for override enforcement) - so this is new,
# hand-maintained config. A newly added device-handler domain needs an
# entry here too.
_TRACKED_ATTRIBUTES: dict[str, tuple[str, ...]] = {
    "climate": ("current_temperature", "temperature", "hvac_action"),
    "light": ("brightness",),
    "switch": (),
}

# Per-entity cap on compacted rows, so a genuinely flapping entity (e.g. a
# switch toggling every few seconds for hours) can't blow up the response/PDF
# size even after compaction collapses exact-duplicate samples away.
_MAX_POINTS_PER_ENTITY = 2000


class ReportError(Exception):
    """Base class for report-generation failures the caller should surface cleanly."""


class ReportRangeError(ReportError):
    """Raised for a request outside the bounded range/entity-count limits."""


ReportSource = Literal["rule", "other"]


@dataclass(slots=True, kw_only=True, frozen=True)
class ReportPoint:
    """One state transition for a reported entity."""

    at: datetime
    state: str
    attributes: dict[str, Any]
    source: ReportSource
    rule_name: str | None = None
    schedule_name: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for the websocket response/PDF renderer."""
        return {
            "at": self.at.isoformat(),
            "state": self.state,
            "attributes": self.attributes,
            "source": self.source,
            "rule_name": self.rule_name,
            "schedule_name": self.schedule_name,
        }


@dataclass(slots=True, kw_only=True)
class EntityReport:
    """One entity's reported history for the requested range."""

    entity_id: str
    domain: str
    friendly_name: str
    points: list[ReportPoint] = field(default_factory=list)
    no_data: bool = False
    truncated: bool = False

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for the websocket response/PDF renderer."""
        return {
            "entity_id": self.entity_id,
            "domain": self.domain,
            "friendly_name": self.friendly_name,
            "points": [point.to_dict() for point in self.points],
            "no_data": self.no_data,
            "truncated": self.truncated,
        }


@dataclass(slots=True, kw_only=True)
class ReportData:
    """A full report: one EntityReport per requested entity."""

    start_date: date
    end_date: date
    entities: list[EntityReport] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for the websocket response."""
        return {
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "entities": [entity.to_dict() for entity in self.entities],
        }


def validate_report_bounds(
    entity_ids: list[str], start_date: date, end_date: date
) -> None:
    """Raise ReportRangeError if the request exceeds the bounded-work limits.

    Shared by the websocket command and the PDF HTTP view (report_view.py)
    so both reject an out-of-bounds request identically.
    """
    if start_date > end_date:
        raise ReportRangeError("start_date must not be after end_date")
    if (end_date - start_date).days + 1 > MAX_REPORT_RANGE_DAYS:
        raise ReportRangeError(
            f"Date range too long - the maximum is {MAX_REPORT_RANGE_DAYS} days"
        )
    if not entity_ids:
        raise ReportRangeError("At least one entity is required")
    if len(entity_ids) > MAX_REPORT_ENTITIES:
        raise ReportRangeError(
            f"Too many entities - the maximum is {MAX_REPORT_ENTITIES}"
        )


async def async_build_report(
    hass: HomeAssistant, entity_ids: list[str], start_date: date, end_date: date
) -> ReportData:
    """Build a ReportData for `entity_ids` over [start_date, end_date], inclusive.

    Never raises for "no data" - a per-entity EntityReport.no_data flag
    covers that (most commonly because the range predates the recorder's
    own purge_keep_days retention window, which this integration has no
    control over). Only raises ReportError/ReportRangeError for a genuinely
    invalid/over-limit request, or if recorder isn't set up at all.

    Shared by websocket.py's generate_report command and report_view.py's
    PDF endpoint, so the two outputs can never diverge.
    """
    validate_report_bounds(entity_ids, start_date, end_date)

    if "recorder" not in hass.config.components:
        raise ReportError(
            "Home Assistant's recorder integration is not enabled - reports "
            "need entity history, which only recorder tracks"
        )

    start_dt = dt_util.start_of_local_day(start_date)
    end_dt = dt_util.start_of_local_day(end_date) + timedelta(days=1)

    history_by_entity = await _async_fetch_state_history(
        hass, entity_ids, start_dt, end_dt
    )
    rule_events_by_entity = await _async_fetch_rule_triggered_events(
        hass, start_dt, end_dt
    )

    entities: list[EntityReport] = []
    for entity_id in entity_ids:
        domain = entity_id.split(".", 1)[0]
        live_state = hass.states.get(entity_id)
        friendly_name = (
            live_state.attributes.get("friendly_name", entity_id)
            if live_state
            else entity_id
        )
        points, truncated = _compact_points(
            history_by_entity.get(entity_id, []),
            domain,
            rule_events_by_entity.get(entity_id, []),
        )
        entities.append(
            EntityReport(
                entity_id=entity_id,
                domain=domain,
                friendly_name=friendly_name,
                points=points,
                no_data=not points,
                truncated=truncated,
            )
        )

    return ReportData(start_date=start_date, end_date=end_date, entities=entities)


async def _async_fetch_state_history(
    hass: HomeAssistant, entity_ids: list[str], start: datetime, end: datetime
) -> dict[str, list[State]]:
    """Fetch every recorded state (not just "significant" ones) for `entity_ids`.

    significant_changes_only=False is deliberate: history's default
    heuristic (recorder/history/const.py's SIGNIFICANT_DOMAINS) only treats
    a handful of domains - climate among them, but *not* light/switch - as
    significant on an attribute-only change, which would silently drop
    light brightness changes from the report. Passing False disables that
    heuristic uniformly across every domain this report covers, at the cost
    of more rows to compact afterward (see _compact_points).

    Recorder access is synchronous (SQLAlchemy), so it must run in the
    recorder's own executor, not the event loop.
    """
    instance = get_recorder_instance(hass)

    def _fetch() -> dict[str, list[State]]:
        return history.get_significant_states(
            hass,
            start,
            end,
            entity_ids=entity_ids,
            include_start_time_state=True,
            significant_changes_only=False,
            no_attributes=False,
        )

    return await instance.async_add_executor_job(_fetch)


async def _async_fetch_rule_triggered_events(
    hass: HomeAssistant, start: datetime, end: datetime
) -> dict[str, list[tuple[datetime, dict[str, Any]]]]:
    """Fetch Scheduler+'s own EVENT_RULE_TRIGGERED entries, grouped by entity_id.

    Returns {} (never raises) if the `logbook` integration isn't set up -
    every point then falls back to source="other" rather than the whole
    report failing, since a user can legitimately run without logbook.

    Queried with an explicit event_types=(EVENT_RULE_TRIGGERED,) rather than
    Home Assistant's own logbook.helpers.async_determine_event_types: that
    helper only includes an external event type when it's owned by a config
    entry matching the requested entities' own domains, which would wrongly
    exclude Scheduler+'s event here - Scheduler+ doesn't own the climate/
    light/switch entities it schedules, whatever integration created them
    does. entity_ids is deliberately left unset on EventProcessor for the
    same reason: filtering happens here in Python against each event's own
    `entity_id` field instead of trusting the recorder's entity-linkage
    query to cover a domain-agnostic custom event correctly.
    """
    if "logbook" not in hass.config.components:
        return {}

    from homeassistant.components.logbook.processor import (  # noqa: PLC0415
        EventProcessor,
    )

    instance = get_recorder_instance(hass)

    def _fetch() -> list[dict[str, Any]]:
        processor = EventProcessor(
            hass,
            (EVENT_RULE_TRIGGERED,),
            entity_ids=None,
            device_ids=None,
            context_id=None,
            timestamp=False,
            include_entity_name=False,
        )
        return processor.get_events(start, end)

    try:
        raw_events = await instance.async_add_executor_job(_fetch)
    except Exception:  # noqa: BLE001 - a query failure here shouldn't sink the report
        _LOGGER.exception("Failed to fetch Scheduler+ rule-triggered history")
        return {}

    by_entity: dict[str, list[tuple[datetime, dict[str, Any]]]] = {}
    for raw in raw_events:
        entity_id = raw.get("entity_id")
        when = dt_util.parse_datetime(raw.get("when") or "")
        rule_name = raw.get("rule_name")
        schedule_name = raw.get("schedule_name")
        if not entity_id or when is None or rule_name is None:
            continue
        by_entity.setdefault(entity_id, []).append(
            (when, {"rule_name": rule_name, "schedule_name": schedule_name})
        )
    for events in by_entity.values():
        events.sort(key=lambda item: item[0])
    return by_entity


def _nearest_rule_match(
    at: datetime, rule_events: list[tuple[datetime, dict[str, Any]]]
) -> dict[str, Any] | None:
    """Return the closest rule-triggered event to `at` within tolerance, if any."""
    best: tuple[timedelta, dict[str, Any]] | None = None
    for when, info in rule_events:
        delta = abs(when - at)
        if delta > _RULE_MATCH_TOLERANCE:
            continue
        if best is None or delta < best[0]:
            best = (delta, info)
    return best[1] if best else None


def _compact_points(
    raw_states: list[State],
    domain: str,
    rule_events: list[tuple[datetime, dict[str, Any]]],
) -> tuple[list[ReportPoint], bool]:
    """Collapse raw recorder samples into one row per actual transition.

    significant_changes_only=False returns a row for essentially every
    recorder write, including many with an unchanged (state, tracked
    attributes) tuple (some integrations rewrite the same reading
    periodically). Collapsing consecutive duplicates into one row per
    transition matches "what *changed*" and keeps both the on-screen table
    and the PDF bounded by real events rather than raw sample density.
    """
    tracked = _TRACKED_ATTRIBUTES.get(domain, ())
    points: list[ReportPoint] = []
    last_key: tuple[str, tuple[Any, ...]] | None = None
    truncated = False

    for raw_state in raw_states:
        key = (
            raw_state.state,
            tuple(raw_state.attributes.get(attr) for attr in tracked),
        )
        if key == last_key:
            continue
        last_key = key

        # An idle/off climate commonly records a new current_temperature
        # every few minutes. Those readings are not useful in a schedule
        # report; keep the first off row, then wait for the next meaningful
        # state transition (for example, off -> cool or off -> heat).
        if (
            domain == "climate"
            and raw_state.state == "off"
            and points
            and points[-1].state == "off"
        ):
            continue

        if len(points) >= _MAX_POINTS_PER_ENTITY:
            truncated = True
            break

        at = raw_state.last_updated
        match = _nearest_rule_match(at, rule_events)
        points.append(
            ReportPoint(
                at=at,
                state=raw_state.state,
                attributes={attr: raw_state.attributes.get(attr) for attr in tracked},
                source="rule" if match else "other",
                rule_name=match["rule_name"] if match else None,
                schedule_name=match["schedule_name"] if match else None,
            )
        )

    return points, truncated
