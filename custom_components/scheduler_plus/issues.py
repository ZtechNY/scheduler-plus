"""Repairs issues raised by Scheduler+.

A schedule or rule that references an entity Home Assistant doesn't have
can't do its job - a light that never receives its off command, or a
zman that never resolves. Rather than skip it silently, each missing
entity is logged once and surfaced as a Repairs issue, which clears
itself as soon as the entity exists again.
"""

from __future__ import annotations

import logging

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def _issue_id(entity_id: str) -> str:
    return f"missing_entity_{entity_id}"


@callback
def async_report_missing_entity(
    hass: HomeAssistant, entity_id: str, used_by: str
) -> None:
    """Warn (once per outage) and raise a Repairs issue for a missing entity."""
    issue_id = _issue_id(entity_id)
    if ir.async_get(hass).async_get_issue(DOMAIN, issue_id) is not None:
        return
    _LOGGER.warning(
        "Entity %s is used by %s but does not exist; Scheduler+ cannot use it",
        entity_id,
        used_by,
    )
    ir.async_create_issue(
        hass,
        DOMAIN,
        issue_id,
        is_fixable=False,
        severity=ir.IssueSeverity.WARNING,
        translation_key="missing_entity",
        translation_placeholders={"entity_id": entity_id, "used_by": used_by},
    )


@callback
def async_clear_missing_entity(hass: HomeAssistant, entity_id: str) -> None:
    """Remove the missing-entity issue for `entity_id`, if one was raised."""
    issue_id = _issue_id(entity_id)
    if ir.async_get(hass).async_get_issue(DOMAIN, issue_id) is not None:
        ir.async_delete_issue(hass, DOMAIN, issue_id)
