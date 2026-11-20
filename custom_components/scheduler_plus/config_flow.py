"""Config flow for Scheduler+."""

from __future__ import annotations

from typing import Any, Final

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import selector

from .const import (
    CONF_ENABLE_BRIGHTNESS,
    CONF_ENABLE_FADE_IN,
    CONF_OUTDOOR_TEMPERATURE_ENTITY,
    CONF_WEEKDAY_DAYS,
    CONF_WEEKEND_DAYS,
    CONF_WORKING_HOURS_END,
    CONF_WORKING_HOURS_START,
    DEFAULT_ENABLE_BRIGHTNESS,
    DEFAULT_ENABLE_FADE_IN,
    DEFAULT_WEEKDAY_DAYS,
    DEFAULT_WEEKEND_DAYS,
    DEFAULT_WORKING_HOURS_END,
    DEFAULT_WORKING_HOURS_START,
    DOMAIN,
)
from .models import Weekday
from .report_branding import InvalidReportLogo, read_report_logo_upload, report_logo_store

_LOGO_FILE: Final = "report_logo_file"
_REMOVE_LOGO: Final = "remove_report_logo"

_WEEKDAY_LABELS: Final[dict[Weekday, str]] = {
    Weekday.MONDAY: "Monday",
    Weekday.TUESDAY: "Tuesday",
    Weekday.WEDNESDAY: "Wednesday",
    Weekday.THURSDAY: "Thursday",
    Weekday.FRIDAY: "Friday",
    Weekday.SATURDAY: "Saturday",
    Weekday.SUNDAY: "Sunday",
}

_WEEKDAY_SELECT_OPTIONS: Final = [
    selector.SelectOptionDict(value=day.value, label=label)
    for day, label in _WEEKDAY_LABELS.items()
]


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

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: ConfigEntry,
    ) -> SchedulerPlusOptionsFlow:
        """Return Scheduler+'s options flow."""
        return SchedulerPlusOptionsFlow()


class SchedulerPlusOptionsFlow(OptionsFlow):
    """Handle scheduling preferences, feature toggles and site PDF branding.

    Reachable via Settings > Devices & Services > Scheduler+ > Configure.
    The weekday/weekend/working-hours fields power the frontend rule
    editor's Weekdays/Weekend/After hours quick-fill presets. The
    enable_brightness/enable_fade_in fields are org-wide feature toggles -
    unlike the presets, there's no per-user override for these - that
    control whether the rule editor's brightness/fade-in controls appear
    at all for light rules.
    """

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Keep branding separate from existing scheduling preferences."""
        return self.async_show_menu(
            step_id="init", menu_options=["scheduling_preferences", "report_branding"],
        )

    async def async_step_report_branding(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Set, replace or remove an image using Home Assistant's native file selector."""
        store = report_logo_store(self.hass, self.config_entry.entry_id)
        errors: dict[str, str] = {}
        if user_input is not None:
            file_id = user_input.get(_LOGO_FILE)
            remove = user_input.get(_REMOVE_LOGO, False)
            if file_id and remove:
                errors["base"] = "choose_one_logo_action"
            else:
                try:
                    if file_id:
                        logo = await self.hass.async_add_executor_job(
                            read_report_logo_upload, self.hass, file_id,
                        )
                        await store.async_replace(logo)
                    elif remove:
                        await store.async_replace(None)
                except InvalidReportLogo:
                    errors[_LOGO_FILE] = "invalid_report_logo"
                except (HomeAssistantError, OSError):
                    errors["base"] = "report_logo_save_failed"
                else:
                    # No config entry option mutations, listeners or reloads.
                    return self.async_create_entry(data=dict(self.config_entry.options))

        return self.async_show_form(
            step_id="report_branding",
            data_schema=vol.Schema({
                vol.Optional(_LOGO_FILE): selector.FileSelector(
                    selector.FileSelectorConfig(accept="image/png,image/jpeg")
                ),
                vol.Optional(_REMOVE_LOGO, default=False): selector.BooleanSelector(),
            }),
            errors=errors,
        )

    async def async_step_scheduling_preferences(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the original scheduling preferences form."""
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        options = self.config_entry.options
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_WEEKDAY_DAYS,
                    default=list(
                        options.get(CONF_WEEKDAY_DAYS, DEFAULT_WEEKDAY_DAYS)
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=_WEEKDAY_SELECT_OPTIONS,
                        multiple=True,
                        mode=selector.SelectSelectorMode.LIST,
                    )
                ),
                vol.Required(
                    CONF_WEEKEND_DAYS,
                    default=list(
                        options.get(CONF_WEEKEND_DAYS, DEFAULT_WEEKEND_DAYS)
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=_WEEKDAY_SELECT_OPTIONS,
                        multiple=True,
                        mode=selector.SelectSelectorMode.LIST,
                    )
                ),
                vol.Required(
                    CONF_WORKING_HOURS_START,
                    default=options.get(
                        CONF_WORKING_HOURS_START, DEFAULT_WORKING_HOURS_START
                    ),
                ): selector.TimeSelector(),
                vol.Required(
                    CONF_WORKING_HOURS_END,
                    default=options.get(
                        CONF_WORKING_HOURS_END, DEFAULT_WORKING_HOURS_END
                    ),
                ): selector.TimeSelector(),
                vol.Required(
                    CONF_ENABLE_BRIGHTNESS,
                    default=options.get(
                        CONF_ENABLE_BRIGHTNESS, DEFAULT_ENABLE_BRIGHTNESS
                    ),
                ): selector.BooleanSelector(),
                vol.Required(
                    CONF_ENABLE_FADE_IN,
                    default=options.get(CONF_ENABLE_FADE_IN, DEFAULT_ENABLE_FADE_IN),
                ): selector.BooleanSelector(),
                # Optional and without a default, so it can be cleared;
                # suggested_value pre-fills the current choice.
                vol.Optional(
                    CONF_OUTDOOR_TEMPERATURE_ENTITY,
                    description={
                        "suggested_value": options.get(CONF_OUTDOOR_TEMPERATURE_ENTITY)
                    },
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        filter=[
                            selector.EntityFilterSelectorConfig(
                                domain="sensor", device_class="temperature"
                            ),
                            selector.EntityFilterSelectorConfig(domain="weather"),
                        ]
                    )
                ),
            }
        )
        return self.async_show_form(step_id="scheduling_preferences", data_schema=schema)
