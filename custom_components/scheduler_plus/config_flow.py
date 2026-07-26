"""Config flow for Scheduler+."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN


class SchedulerPlusConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Scheduler+.

    Scheduler+ has nothing to configure at setup time (no host, no
    credentials) - schedules are created and managed later through the
    websocket API. This flow only confirms creation of the single allowed
    config entry; `single_config_entry` in the manifest handles preventing
    duplicates.
    """

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step triggered from the UI."""
        if user_input is not None:
            return self.async_create_entry(title="Scheduler+", data={})

        return self.async_show_form(step_id="user")
