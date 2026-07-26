"""Coordinator for Scheduler+.

Owns the in-memory representation of stored schedule data and notifies
listeners (entities, websocket API) when it changes. This is a push-based
coordinator: Scheduler+ has no external device to poll, so update_interval
is None and updates are pushed explicitly via async_set_updated_data()
whenever the data is mutated.
"""

from __future__ import annotations

import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import DOMAIN
from .storage import SchedulerPlusStore, SchedulerPlusStoreData

_LOGGER = logging.getLogger(__name__)


class SchedulerPlusCoordinator(DataUpdateCoordinator[SchedulerPlusStoreData]):
    """Central in-memory owner of Scheduler+ data.

    No scheduling logic lives here. This coordinator is responsible only for
    loading persisted data on setup, holding it in memory, and notifying
    listeners when it changes. Rule evaluation and device dispatch will be
    implemented in the scheduling engine, which uses this coordinator's data
    without the coordinator needing to understand schedules itself.
    """

    def __init__(self, hass: HomeAssistant, store: SchedulerPlusStore) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=None,
        )
        self._store = store

    async def _async_update_data(self) -> SchedulerPlusStoreData:
        """Load data from storage.

        Invoked once via async_config_entry_first_refresh() during setup.
        Later changes are applied via async_set_updated_data() instead of
        re-fetching, since there is no external source to poll.
        """
        return await self._store.async_load()

    async def async_save(self) -> None:
        """Persist the current in-memory data to storage."""
        await self._store.async_save(self.data)
