"""Constants for the Scheduler+ integration."""

from __future__ import annotations

from enum import StrEnum
from typing import Final

from homeassistant.const import Platform

DOMAIN: Final = "scheduler_plus"

# Platforms forwarded from the config entry.
PLATFORMS: Final[list[Platform]] = [Platform.BINARY_SENSOR, Platform.SENSOR]

# Home Assistant Storage helper configuration. Bump STORAGE_VERSION and add a
# migration function whenever the persisted schema shape changes.
STORAGE_VERSION: Final = 1
STORAGE_KEY: Final = DOMAIN


class DeviceType(StrEnum):
    """Device types a Schedule can target.

    Identifiers only. The scheduling engine treats these as opaque keys into
    a device-handler plugin registry and never branches on their meaning.
    """

    LIGHT = "light"
    CLIMATE = "climate"
    SWITCH = "switch"


class TimeProviderType(StrEnum):
    """Time providers a Rule's on_time/off_time can resolve through.

    Identifiers only. The scheduling engine treats these as opaque keys into
    a time-provider plugin registry and never branches on their meaning.
    """

    FIXED = "fixed"
    SUNRISE = "sunrise"
    SUNSET = "sunset"
    YIDCAL = "yidcal"


# Options-flow keys and defaults for scheduling preferences (weekday/weekend
# split, working hours). These power the frontend rule editor's quick-fill
# presets (Weekdays/Weekend/After hours). They're stored on the config
# entry's `options` - Home Assistant's standard place for integration-wide
# settings - rather than in Scheduler+'s own versioned schedules storage,
# since they're a one-time-per-installation preference, not schedule data.
CONF_WEEKDAY_DAYS: Final = "weekday_days"
CONF_WEEKEND_DAYS: Final = "weekend_days"
CONF_WORKING_HOURS_START: Final = "working_hours_start"
CONF_WORKING_HOURS_END: Final = "working_hours_end"

DEFAULT_WEEKDAY_DAYS: Final[list[str]] = ["mon", "tue", "wed", "thu", "fri"]
DEFAULT_WEEKEND_DAYS: Final[list[str]] = ["sat", "sun"]
DEFAULT_WORKING_HOURS_START: Final = "09:00"
DEFAULT_WORKING_HOURS_END: Final = "17:00"
