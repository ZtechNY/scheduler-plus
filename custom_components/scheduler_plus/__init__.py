"""The Scheduler+ integration."""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import PLATFORMS
from .coordinator import SchedulerPlusCoordinator
from .scheduler import SchedulerEngine
from .storage import SchedulerPlusStore
from .websocket import async_register_websocket_commands


@dataclass
class SchedulerPlusData:
    """Runtime data owned by a Scheduler+ config entry."""

    coordinator: SchedulerPlusCoordinator
    engine: SchedulerEngine


type SchedulerPlusConfigEntry = ConfigEntry[SchedulerPlusData]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Scheduler+ integration.

    Called once per Home Assistant run, independent of config entries.
    Websocket commands are registered here rather than in
    async_setup_entry() because they must only be registered once, while
    async_setup_entry() re-runs on every config entry reload.
    """
    async_register_websocket_commands(hass)
    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: SchedulerPlusConfigEntry
) -> bool:
    """Set up Scheduler+ from a config entry."""
    store = SchedulerPlusStore(hass)
    coordinator = SchedulerPlusCoordinator(hass, store)
    await coordinator.async_config_entry_first_refresh()

    engine = SchedulerEngine(hass, coordinator)
    await engine.async_start()

    entry.runtime_data = SchedulerPlusData(coordinator=coordinator, engine=engine)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: SchedulerPlusConfigEntry
) -> bool:
    """Unload a Scheduler+ config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        entry.runtime_data.engine.async_stop()
    return unload_ok
