"""Time-provider plugins for Scheduler+.

Each concrete provider (fixed clock time, sunrise, sunset, YidCal)
implements the TimeProvider interface defined in base.py. This module
assembles the default TimeProviderRegistry from the providers that ship
with Scheduler+. Adding a new provider means adding one new file plus one
line to this registry, with no changes required to base.py or the
scheduling engine.
"""

from __future__ import annotations

from ..const import TimeProviderType
from .base import TimeProvider, TimeProviderRegistry
from .fixed import FixedTimeProvider
from .sunrise import SunriseTimeProvider
from .sunset import SunsetTimeProvider
from .yidcal import YidCalTimeProvider

DEFAULT_TIME_PROVIDERS = TimeProviderRegistry(
    {
        TimeProviderType.FIXED: FixedTimeProvider(),
        TimeProviderType.SUNRISE: SunriseTimeProvider(),
        TimeProviderType.SUNSET: SunsetTimeProvider(),
        TimeProviderType.YIDCAL: YidCalTimeProvider(
            {
                "candle_lighting": "sensor.yidcal_zman_erev",
                "motzei_shabbos": "sensor.yidcal_zman_motzi",
            }
        ),
    }
)

__all__ = ["DEFAULT_TIME_PROVIDERS", "TimeProvider", "TimeProviderRegistry"]
