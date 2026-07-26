"""The Scheduler+ integration."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import PLATFORMS
from .coordinator import SchedulerPlusCoordinator
from .storage import SchedulerPlusStore
from .websocket import async_register_websocket_commands

type SchedulerPlusConfigEntry = ConfigEntry[SchedulerPlusCoordinator]


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

    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: SchedulerPlusConfigEntry
) -> bool:
    """Unload a Scheduler+ config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
