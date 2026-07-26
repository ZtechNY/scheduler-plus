"""Shared pytest fixtures for Scheduler+ tests."""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Allow the Home Assistant test harness to load this custom integration.

    Home Assistant's test harness blocks loading custom_components by
    default. pytest-homeassistant-custom-component exposes the
    `enable_custom_integrations` fixture to opt in; making it autouse here
    means individual test modules don't need to request it themselves.
    """
