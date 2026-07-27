"""Config flow for Scheduler+."""

from __future__ import annotations

from typing import Any, Final

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_WEEKDAY_DAYS,
    CONF_WEEKEND_DAYS,
    CONF_WORKING_HOURS_END,
    CONF_WORKING_HOURS_START,
    DEFAULT_WEEKDAY_DAYS,
    DEFAULT_WEEKEND_DAYS,
    DEFAULT_WORKING_HOURS_END,
    DEFAULT_WORKING_HOURS_START,
    DOMAIN,
)
from .models import Weekday

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
    """Handle Scheduler+'s options: weekday/weekend split and working hours.

    Reachable via Settings > Devices & Services > Scheduler+ > Configure.
    These are scheduling *preferences* the frontend's rule editor reads to
    power its Weekdays/Weekend/After hours quick-fill presets - not schedule
    data itself.
    """

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the single options step."""
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
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
