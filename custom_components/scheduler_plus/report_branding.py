"""Private, per-installation PDF logo managed by the Scheduler+ options flow."""

from __future__ import annotations

import base64
import binascii
import logging
from asyncio import Lock
from io import BytesIO

from homeassistant.components.file_upload import process_uploaded_file
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.storage import Store
from PIL import Image, ImageOps  # Already dependencies of fpdf2.

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
_STORE_KEY = f"{DOMAIN}.report_logo"
_MAX_INPUT_BYTES = 1024 * 1024
_MAX_INPUT_SIDE = 2048
_LOGO_BOX = (384, 128)
_MAX_PNG_BYTES = 200 * 1024  # Fits even a full 384 x 128 RGBA PNG.
_IMAGE_ERRORS = (Image.DecompressionBombError, OSError, SyntaxError, ValueError)


class InvalidReportLogo(ValueError):
    """The file selected for the logo is missing or invalid."""


def read_report_logo_upload(hass: HomeAssistant, file_id: str) -> bytes:
    """Consume a native HA file selection, bound its input and keep only raster pixels."""
    try:
        with process_uploaded_file(hass, file_id) as path, path.open("rb") as file:
            raw = file.read(_MAX_INPUT_BYTES + 1)
        if not raw or len(raw) > _MAX_INPUT_BYTES:
            raise InvalidReportLogo
        with Image.open(BytesIO(raw), formats=("PNG", "JPEG")) as source:
            if (
                not (0 < source.width <= _MAX_INPUT_SIDE and 0 < source.height <= _MAX_INPUT_SIDE)
                or getattr(source, "is_animated", False)
            ):
                raise InvalidReportLogo
            oriented = ImageOps.exif_transpose(source)
            alpha = "A" in oriented.getbands() or "transparency" in oriented.info
            pixels = oriented.convert("RGBA" if alpha else "RGB")
            pixels.info.clear()
            pixels.thumbnail(_LOGO_BOX, Image.Resampling.LANCZOS)
            output = BytesIO()
            pixels.save(output, format="PNG")
        if output.tell() > _MAX_PNG_BYTES:
            raise InvalidReportLogo
    except InvalidReportLogo:
        raise
    except _IMAGE_ERRORS as err:
        raise InvalidReportLogo from err
    return output.getvalue()


def decode_report_logo(data: bytes) -> Image.Image | None:
    """Read the normalized private PNG for fpdf2, or ignore unreadable stored data."""
    if not data or len(data) > _MAX_PNG_BYTES:
        return None
    try:
        with Image.open(BytesIO(data), formats=("PNG",)) as image:
            if (
                not (0 < image.width <= _LOGO_BOX[0] and 0 < image.height <= _LOGO_BOX[1])
                or image.n_frames != 1
            ):
                return None
            image.load()
            image.info.clear()
            return image.copy()
    except _IMAGE_ERRORS:
        return None


class ReportLogoStore:
    """Keep logo bytes out of config entries, dashboard JSON and report requests."""

    def __init__(self, hass: HomeAssistant, entry_id: str) -> None:
        self._store = Store[dict[str, str]](
            hass, 1, f"{_STORE_KEY}.{entry_id}", private=True, atomic_writes=True,
        )
        self._lock = Lock()
        self._loaded = False
        self._png: bytes | None = None

    async def async_get(self) -> bytes | None:
        """Return this entry's logo, loading its private storage only once."""
        async with self._lock:
            if not self._loaded:
                try:
                    saved = await self._store.async_load()
                    if isinstance(saved, dict):
                        encoded = saved.get("png")
                        if isinstance(encoded, str) and len(encoded) <= 4 * ((_MAX_PNG_BYTES + 2) // 3):
                            data = base64.b64decode(encoded, validate=True)
                            if len(data) <= _MAX_PNG_BYTES:
                                self._png = data
                except (binascii.Error, HomeAssistantError, OSError, ValueError):
                    _LOGGER.warning("Could not read the Scheduler+ report logo; continuing without it")
                self._loaded = True
            return self._png

    async def async_replace(self, png: bytes | None) -> None:
        """Persist the normalized image, or remove only this entry's logo."""
        async with self._lock:
            if png is None:
                await self._store.async_remove()
            else:
                value = {"png": base64.b64encode(png).decode("ascii")}
                await self._store.async_save(value)
                # Store logs rather than raising certain write failures. Confirm
                # persistence before changing the in-memory copy or reporting success.
                if await self._store.async_load() != value:
                    raise HomeAssistantError("Could not save the Scheduler+ report logo")
            self._png = png
            self._loaded = True


@callback
def report_logo_store(hass: HomeAssistant, entry_id: str) -> ReportLogoStore:
    """Get the private store for this HA instance and this config entry."""
    stores: dict[str, ReportLogoStore] = hass.data.setdefault(_STORE_KEY, {})
    if entry_id not in stores:
        stores[entry_id] = ReportLogoStore(hass, entry_id)
    return stores[entry_id]


async def async_get_site_logo(hass: HomeAssistant) -> bytes | None:
    """Scheduler+ allows one config entry per HA instance; never choose arbitrarily."""
    entries = hass.config_entries.async_entries(DOMAIN)
    if len(entries) != 1:
        return None
    return await report_logo_store(hass, entries[0].entry_id).async_get()


async def async_remove_site_logo(hass: HomeAssistant, entry_id: str) -> None:
    """Remove branding storage when its Scheduler+ entry is deleted."""
    await report_logo_store(hass, entry_id).async_replace(None)
    hass.data[_STORE_KEY].pop(entry_id, None)
