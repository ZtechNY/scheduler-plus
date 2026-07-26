"""Persistent storage for Scheduler+.

Owns reading and writing the integration's data file via Home Assistant's
Storage helper. This module has no knowledge of Schedule/Rule domain models
or device types - it only persists and versions plain dict data. Domain
parsing (raw dict <-> Schedule/Rule dataclasses) belongs to scheduler.py.
"""

from __future__ import annotations

from typing import Any, TypedDict

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_VERSION


class SchedulerPlusStoreData(TypedDict):
    """Raw on-disk schema for Scheduler+ data.

    `version` is an internal schema version, tracked separately from the
    Store helper's own version envelope, so future schema migrations of the
    `schedules` payload can be handled explicitly in async_load() without
    being constrained by Store's migrate-callback mechanics.
    """

    version: int
    schedules: list[dict[str, Any]]


def _default_data() -> SchedulerPlusStoreData:
    """Return the empty default payload for a fresh installation."""
    return {"version": STORAGE_VERSION, "schedules": []}


class SchedulerPlusStore:
    """Thin persistence wrapper around Home Assistant's Storage helper."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store for a given Home Assistant instance."""
        self._store: Store[SchedulerPlusStoreData] = Store(
            hass, STORAGE_VERSION, STORAGE_KEY
        )

    async def async_load(self) -> SchedulerPlusStoreData:
        """Load persisted data, seeding defaults on first run."""
        data = await self._store.async_load()
        if data is None:
            return _default_data()
        return data

    async def async_save(self, data: SchedulerPlusStoreData) -> None:
        """Persist data to disk."""
        await self._store.async_save(data)
