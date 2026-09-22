"""Date-based operating modes shared by execution, previews, and entities.

Modes gate occurrences by their start date, so an overnight event retains
its next-morning off action. Explicit date choices override weekly repeats.

Everything here is pure: callers own loading, persisting, and notifying.
The websocket API, the `set_mode` service, and the mode binary sensors all
go through these helpers so they can't drift apart on what "active" means.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


def mode_active(mode: dict[str, Any], day: date) -> bool:
    """Whether `mode` is on for `day` - an explicit date choice wins."""
    override = mode.get("dates", {}).get(day.isoformat())
    return override if override is not None else WEEKDAYS[day.weekday()] in mode.get("weekdays", [])


def schedule_allowed(modes: list[dict[str, Any]], schedule_id: str, day: date) -> bool:
    """Skip wins; schedules assigned to Run are exclusive to those modes."""
    owners = [mode for mode in modes if schedule_id in mode.get("run_schedules", [])]
    if any(mode_active(mode, day) and schedule_id in mode.get("skip_schedules", []) for mode in modes):
        return False
    return not owners or any(mode_active(mode, day) for mode in owners)


def find_mode(modes: list[dict[str, Any]], key: str) -> dict[str, Any] | None:
    """Look a mode up by id, falling back to a case-insensitive name match.

    The websocket API always has the id to hand, but the `set_mode` service
    is written by people in YAML, where the name is the only part they ever
    see. Ids are checked first so a mode named after another mode's id
    can't shadow it.
    """
    by_id = next((mode for mode in modes if mode["id"] == key), None)
    if by_id is not None:
        return by_id
    folded = key.casefold().strip()
    return next((mode for mode in modes if mode["name"].casefold().strip() == folded), None)


def revise(mode: dict[str, Any], **changes: Any) -> dict[str, Any]:
    """Return `mode` with `changes` applied and its revision counter bumped.

    `rev` is what makes the mode editor safe to leave open: a save carrying
    a stale `rev` is rejected rather than writing the whole mode back over
    a date toggle that landed in the meantime (see websocket_save_mode).
    """
    return {**mode, **changes, "rev": mode.get("rev", 0) + 1}


def with_date(mode: dict[str, Any], day: str, active: bool | None) -> dict[str, Any]:
    """Pin `day` on/off for `mode`, or release it back to the weekly repeat."""
    dates = dict(mode.get("dates", {}))
    if active is None:
        dates.pop(day, None)
    else:
        dates[day] = active
    return revise(mode, dates=dates)


def prune_dates(modes: list[dict[str, Any]], today: date) -> list[dict[str, Any]]:
    """Drop date choices no occurrence can reach any more.

    One-off dates ("Bris on the 5th") would otherwise accumulate in the
    store for the life of the install, and every mode toggle rewrites the
    whole blob. Yesterday is deliberately kept: _async_refresh_rule still
    resolves yesterday's reference date to close out an overnight window,
    so pruning to `today` would strand a running event's off action.

    Revisions are left alone - this is bookkeeping, not an edit anyone
    made, and bumping `rev` here would invalidate open editors for no
    reason.
    """
    cutoff = (today - timedelta(days=1)).isoformat()
    return [
        {**mode, "dates": {day: on for day, on in mode.get("dates", {}).items() if day >= cutoff}}
        for mode in modes
    ]


def orphaned_run_schedules(
    before: list[dict[str, Any]], after: list[dict[str, Any]]
) -> set[str]:
    """Schedule ids that just lost their last "Run only in this mode" owner.

    Such a schedule would otherwise fall back to running every day its own
    weekdays allow - the opposite of what someone who built it as an event
    schedule expects - so callers pause it instead.
    """
    def owned(modes: list[dict[str, Any]]) -> set[str]:
        return {sid for mode in modes for sid in mode.get("run_schedules", [])}

    return owned(before) - owned(after)
