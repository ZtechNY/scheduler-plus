"""Device-handler plugins for Scheduler+.

Each concrete handler (light, climate, and later other device types)
implements the DeviceHandler interface defined in base.py. This module
assembles the default DeviceHandlerRegistry from the handlers that ship
with Scheduler+. Adding a new device type means adding one new file plus
one line to this registry, with no changes required to base.py or the
scheduling engine.
"""

from __future__ import annotations

from ..const import DeviceType
from .base import DeviceHandler, DeviceHandlerRegistry
from .climate import ClimateDeviceHandler
from .light import LightDeviceHandler

DEFAULT_DEVICE_HANDLERS = DeviceHandlerRegistry(
    {
        DeviceType.LIGHT: LightDeviceHandler(),
        DeviceType.CLIMATE: ClimateDeviceHandler(),
    }
)

__all__ = ["DEFAULT_DEVICE_HANDLERS", "DeviceHandler", "DeviceHandlerRegistry"]
