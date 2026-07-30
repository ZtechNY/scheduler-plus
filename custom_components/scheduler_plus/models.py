"""Domain models for Scheduler+.

Pure data shapes for Schedule and Rule, with no dependency on Home
Assistant or on any concrete device-handler/time-provider plugin. `action`
and `TimeSpec.params` are intentionally opaque dicts: the meaning of a
light's action (brightness, transition) or a climate action (hvac_mode,
target_temperature) is only known to the corresponding device-handler
plugin, and the meaning of time params (a fixed time string, a sunset
offset, a future YidCal event name) is only known to the corresponding
time-provider plugin. This module must stay ignorant of both so the
scheduling engine never has to know about lights, climate, or YidCal.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import StrEnum
from typing import Any

from .const import DayConditionType, DeviceType, TimeProviderType


class Weekday(StrEnum):
    """Days of the week a Rule can be active on."""

    MONDAY = "mon"
    TUESDAY = "tue"
    WEDNESDAY = "wed"
    THURSDAY = "thu"
    FRIDAY = "fri"
    SATURDAY = "sat"
    SUNDAY = "sun"


class RuleDateMode(StrEnum):
    """How a Rule's optional `dates` list constrains which days it's active on.

    ALWAYS: `dates` is ignored - the rule follows `days` alone, every week.
    INCLUDE: the rule ignores `days` entirely and only fires on the specific
        dates listed in `dates` - a one-off/holiday-style rule.
    EXCLUDE: the rule follows `days` as usual, except it's skipped entirely
        on any date listed in `dates` - an override/blackout for otherwise-
        recurring rules.
    """

    ALWAYS = "always"
    INCLUDE = "include"
    EXCLUDE = "exclude"


@dataclass(slots=True, kw_only=True)
class TimeSpec:
    """A point in time resolved by a time-provider plugin.

    `params` is opaque here: its expected shape depends entirely on
    `provider` and is defined/validated by that provider's plugin, not by
    this class.
    """

    provider: TimeProviderType
    params: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for storage."""
        return {"provider": self.provider.value, "params": dict(self.params)}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> TimeSpec:
        """Deserialize from a plain dict loaded from storage."""
        return cls(
            provider=TimeProviderType(data["provider"]),
            params=dict(data["params"]),
        )


@dataclass(slots=True, kw_only=True)
class Rule:
    """A single on/off rule within a Schedule.

    `action` is opaque here: its expected shape depends entirely on the
    owning Schedule's `device_type` and is defined/validated by that
    device-handler plugin, not by this class.

    `on_time`/`off_time` are always populated, but `on_enabled`/
    `off_enabled` control whether the engine actually acts on each side -
    a rule can be on-only or off-only, firing once and then leaving the
    device alone indefinitely. At least one of the two must be enabled;
    that invariant is enforced at the websocket boundary, not here.

    `allow_override`/`override_grace_minutes` are climate-only enforcement
    settings: when `allow_override` is False, the engine watches the
    entity during the on-window and reapplies `action` if a manual change
    still doesn't match after `override_grace_minutes` (debounced - reset
    on each further manual change). Only meaningful when both `on_enabled`
    and `off_enabled` are True, since enforcement needs a defined window.
    """

    id: str
    name: str
    enabled: bool = True
    days: frozenset[Weekday]
    date_mode: RuleDateMode = RuleDateMode.ALWAYS
    dates: frozenset[str] = field(default_factory=frozenset)
    date_ranges: frozenset[tuple[str, str]] = field(default_factory=frozenset)
    day_conditions: frozenset[DayConditionType] = field(default_factory=frozenset)
    on_time: TimeSpec
    off_time: TimeSpec
    on_enabled: bool = True
    off_enabled: bool = True
    allow_override: bool = True
    override_grace_minutes: int = 15
    action: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for storage."""
        return {
            "id": self.id,
            "name": self.name,
            "enabled": self.enabled,
            "days": sorted(day.value for day in self.days),
            "date_mode": self.date_mode.value,
            "dates": sorted(self.dates),
            "date_ranges": sorted([list(r) for r in self.date_ranges]),
            "day_conditions": sorted(cond.value for cond in self.day_conditions),
            "on_time": self.on_time.to_dict(),
            "off_time": self.off_time.to_dict(),
            "on_enabled": self.on_enabled,
            "off_enabled": self.off_enabled,
            "allow_override": self.allow_override,
            "override_grace_minutes": self.override_grace_minutes,
            "action": dict(self.action),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Rule:
        """Deserialize from a plain dict loaded from storage.

        `date_mode`/`dates`/`date_ranges`/`day_conditions`/`on_enabled`/
        `off_enabled`/`allow_override`/`override_grace_minutes` use `.get()`
        with defaults rather than direct indexing, since rules stored
        before these fields existed won't have them - they behave exactly
        as before (RuleDateMode.ALWAYS, no dates, no ranges, no day
        conditions, both on and off enabled, overrides allowed).
        """
        return cls(
            id=data["id"],
            name=data["name"],
            enabled=data["enabled"],
            days=frozenset(Weekday(day) for day in data["days"]),
            date_mode=RuleDateMode(data.get("date_mode", RuleDateMode.ALWAYS)),
            dates=frozenset(data.get("dates", [])),
            date_ranges=frozenset(
                (start, end) for start, end in data.get("date_ranges", [])
            ),
            day_conditions=frozenset(
                DayConditionType(cond) for cond in data.get("day_conditions", [])
            ),
            on_time=TimeSpec.from_dict(data["on_time"]),
            off_time=TimeSpec.from_dict(data["off_time"]),
            on_enabled=bool(data.get("on_enabled", True)),
            off_enabled=bool(data.get("off_enabled", True)),
            allow_override=bool(data.get("allow_override", True)),
            override_grace_minutes=int(data.get("override_grace_minutes", 15)),
            action=dict(data["action"]),
        )


@dataclass(slots=True, kw_only=True)
class Schedule:
    """A named collection of rules targeting one or more entities of a single device type.

    `active_date_mode`/`active_date_ranges` gate the whole schedule to a
    seasonal window (e.g. "Jul 1-Aug 31 only"), independent of each rule's
    own `date_mode`/`dates`/`date_ranges` - this exists so a multi-rule
    schedule doesn't need the same range repeated on every rule, and so a
    manager can pair two schedules (e.g. "Summer Hours" / "Regular Hours")
    targeting the same entities without them fighting over which one is
    "active" outside of literal per-rule date filtering. Deliberately
    date-range-only (no individual `dates`, no day_conditions) - unlike a
    Rule's date filter, this is a pure/synchronous check with no need for
    the day-conditions plugin registry.

    `override_until` is a separate, temporary concept: a manager-triggered
    pause ("paused through <date>") that suppresses the schedule entirely
    regardless of `enabled`/`active_date_mode`, auto-reverting once that
    date has passed. Date-granularity (not datetime) so it piggybacks on
    the engine's existing midnight rescan instead of needing its own timer.
    """

    id: str
    name: str
    enabled: bool = True
    device_type: DeviceType
    entities: list[str]
    rules: list[Rule] = field(default_factory=list)
    active_date_mode: RuleDateMode = RuleDateMode.ALWAYS
    active_date_ranges: frozenset[tuple[str, str]] = field(default_factory=frozenset)
    override_until: str | None = None

    def is_active_on(self, reference_date: date) -> bool:
        """Whether this schedule's seasonal active window includes `reference_date`.

        ALWAYS ignores active_date_ranges entirely. INCLUDE only counts as
        active while reference_date falls in one of active_date_ranges;
        EXCLUDE is active everywhere except those ranges.
        """
        if self.active_date_mode is RuleDateMode.ALWAYS:
            return True
        date_str = reference_date.isoformat()
        matches = any(start <= date_str <= end for start, end in self.active_date_ranges)
        return matches if self.active_date_mode is RuleDateMode.INCLUDE else not matches

    def is_overridden(self, reference_date: date) -> bool:
        """Whether a manager-triggered pause suppresses this schedule on `reference_date`.

        Comparing against whichever reference_date is in question (today
        for live engine checks, a report's own date for Day View) makes
        this exact for both callers rather than needing separate handling.
        """
        if self.override_until is None:
            return False
        return reference_date <= date.fromisoformat(self.override_until)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for storage."""
        return {
            "id": self.id,
            "name": self.name,
            "enabled": self.enabled,
            "device_type": self.device_type.value,
            "entities": list(self.entities),
            "rules": [rule.to_dict() for rule in self.rules],
            "active_date_mode": self.active_date_mode.value,
            "active_date_ranges": sorted([list(r) for r in self.active_date_ranges]),
            "override_until": self.override_until,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Schedule:
        """Deserialize from a plain dict loaded from storage.

        `active_date_mode`/`active_date_ranges`/`override_until` use
        `.get()` with defaults, since schedules stored before these fields
        existed won't have them - they behave exactly as before (always
        active, never overridden).
        """
        return cls(
            id=data["id"],
            name=data["name"],
            enabled=data["enabled"],
            device_type=DeviceType(data["device_type"]),
            entities=list(data["entities"]),
            rules=[Rule.from_dict(rule) for rule in data["rules"]],
            active_date_mode=RuleDateMode(
                data.get("active_date_mode", RuleDateMode.ALWAYS)
            ),
            active_date_ranges=frozenset(
                (start, end) for start, end in data.get("active_date_ranges", [])
            ),
            override_until=data.get("override_until"),
        )


class TemplateScope(StrEnum):
    """Whether a ScheduleTemplate represents one reusable rule or a whole schedule's rule set.

    Purely a frontend-facing tag: the engine never reads templates at all
    (see ScheduleTemplate's own docstring), so this only exists to let the
    UI show a rule template solely where a single rule is being picked
    (the rule editor's "Start from template") and a schedule template
    solely where a whole rule set is being picked (the card's "From
    template") - the two lists never mix.
    """

    RULE = "rule"
    SCHEDULE = "schedule"


@dataclass(slots=True, kw_only=True)
class ScheduleTemplate:
    """A reusable, entity-agnostic set of rules a manager can save and reapply later.

    Deliberately has no `entities`/`enabled` - unlike a Schedule, a
    template is never itself scheduled or dispatched to a device, so it
    never appears in coordinator.data["schedules"] and never spawns an HA
    device/entity pair (see entity.py). "Applying" a template happens
    entirely in the frontend, by pre-filling the schedule/rule editor from
    this template's device_type/rules - there is no dedicated "create from
    template" websocket command, since the manager should still get the
    normal editor to review/adjust before saving.
    """

    id: str
    name: str
    device_type: DeviceType
    rules: list[Rule] = field(default_factory=list)
    scope: TemplateScope = TemplateScope.SCHEDULE

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for storage."""
        return {
            "id": self.id,
            "name": self.name,
            "device_type": self.device_type.value,
            "rules": [rule.to_dict() for rule in self.rules],
            "scope": self.scope.value,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ScheduleTemplate:
        """Deserialize from a plain dict loaded from storage.

        `scope` uses `.get()` with a SCHEDULE default, since templates
        saved before this field existed (schedule-only templates, at the
        time) won't have it.
        """
        return cls(
            id=data["id"],
            name=data["name"],
            device_type=DeviceType(data["device_type"]),
            rules=[Rule.from_dict(rule) for rule in data["rules"]],
            scope=TemplateScope(data.get("scope", TemplateScope.SCHEDULE)),
        )
