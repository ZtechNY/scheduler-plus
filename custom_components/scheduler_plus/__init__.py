"""The Scheduler+ integration."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, PLATFORMS
from .coordinator import SchedulerPlusCoordinator
from .scheduler import SchedulerEngine
from .storage import SchedulerPlusStore
from .websocket import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)

_CARD_URL_PATH = f"/{DOMAIN}_files/scheduler-plus-card.js"
_CARD_FILE_PATH = Path(__file__).parent / "www" / "scheduler-plus-card.js"


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
    await _async_register_frontend(hass)
    return True


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Serve the built Lovelace card, if it has been built.

    The card is a separate npm-built artifact (frontend/), not something
    Python packages automatically - if it hasn't been built yet, the
    backend must still set up successfully, just without the card
    available. cache_headers is disabled since the bundle's filename
    never changes between versions; caching it would risk browsers
    keeping a stale copy after an update.
    """
    if not await hass.async_add_executor_job(_CARD_FILE_PATH.exists):
        _LOGGER.warning(
            "Scheduler+ frontend bundle not found at %s; run `npm run build` "
            "in frontend/ to make the Lovelace card available",
            _CARD_FILE_PATH,
        )
        return

    await hass.http.async_register_static_paths(
        [StaticPathConfig(_CARD_URL_PATH, str(_CARD_FILE_PATH), cache_headers=False)]
    )


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
