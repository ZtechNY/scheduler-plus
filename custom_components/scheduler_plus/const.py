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
