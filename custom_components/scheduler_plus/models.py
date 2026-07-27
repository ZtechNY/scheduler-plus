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
    """

    id: str
    name: str
    enabled: bool = True
    days: frozenset[Weekday]
    date_mode: RuleDateMode = RuleDateMode.ALWAYS
    dates: frozenset[str] = field(default_factory=frozenset)
    day_conditions: frozenset[DayConditionType] = field(default_factory=frozenset)
    on_time: TimeSpec
    off_time: TimeSpec
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
            "day_conditions": sorted(cond.value for cond in self.day_conditions),
            "on_time": self.on_time.to_dict(),
            "off_time": self.off_time.to_dict(),
            "action": dict(self.action),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Rule:
        """Deserialize from a plain dict loaded from storage.

        `date_mode`/`dates`/`day_conditions` use `.get()` with defaults
        rather than direct indexing, since rules stored before these fields
        existed won't have them - they behave exactly as before
        (RuleDateMode.ALWAYS, no dates, no day conditions).
        """
        return cls(
            id=data["id"],
            name=data["name"],
            enabled=data["enabled"],
            days=frozenset(Weekday(day) for day in data["days"]),
            date_mode=RuleDateMode(data.get("date_mode", RuleDateMode.ALWAYS)),
            dates=frozenset(data.get("dates", [])),
            day_conditions=frozenset(
                DayConditionType(cond) for cond in data.get("day_conditions", [])
            ),
            on_time=TimeSpec.from_dict(data["on_time"]),
            off_time=TimeSpec.from_dict(data["off_time"]),
            action=dict(data["action"]),
        )


@dataclass(slots=True, kw_only=True)
class Schedule:
    """A named collection of rules targeting one or more entities of a single device type."""

    id: str
    name: str
    enabled: bool = True
    device_type: DeviceType
    entities: list[str]
    rules: list[Rule] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for storage."""
        return {
            "id": self.id,
            "name": self.name,
            "enabled": self.enabled,
            "device_type": self.device_type.value,
            "entities": list(self.entities),
            "rules": [rule.to_dict() for rule in self.rules],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Schedule:
        """Deserialize from a plain dict loaded from storage."""
        return cls(
            id=data["id"],
            name=data["name"],
            enabled=data["enabled"],
            device_type=DeviceType(data["device_type"]),
            entities=list(data["entities"]),
            rules=[Rule.from_dict(rule) for rule in data["rules"]],
        )
