"""Shared pytest fixtures for Scheduler+ tests."""

from __future__ import annotations

import asyncio
import importlib
import sys
from unittest.mock import MagicMock

import pytest
import pytest_socket

if sys.platform == "win32":
    # The HA test plugin calls pytest_socket.disable_socket() before every
    # test, which on Linux still permits the AF_UNIX socketpair asyncio uses
    # internally. Windows has no AF_UNIX socketpair, so creating the event
    # loop's loopback self-pipe is blocked and every `hass` test errors at
    # setup. Skipping only the disable keeps the plugin's
    # socket_allow_hosts(["127.0.0.1"]) guard, so tests still can't reach
    # the network.
    pytest_socket.disable_socket = lambda *args, **kwargs: None
    # The plugin installs HA's loop policy (a Proactor policy on Windows) and
    # then blocks set_event_loop_policy(), but aiodns requires a selector
    # loop on Windows. Swap only the policy's loop factory.
    asyncio.get_event_loop_policy()._loop_factory = asyncio.SelectorEventLoop
    # logbook -> frontend -> onboarding imports assist_pipeline, whose native
    # audio dependencies publish no Windows wheels. The report tests never
    # touch audio, so stand in empty modules when they can't be imported.
    for _module in ("pymicro_vad", "pyspeex_noise"):
        try:
            importlib.import_module(_module)
        except ImportError:
            sys.modules[_module] = MagicMock()


def pytest_configure(config: pytest.Config) -> None:
    """Run pytest-asyncio in auto mode, as Home Assistant's test harness expects.

    Current pytest-asyncio defaults to strict mode, where the plugin's plain
    async `hass` fixture is never awaited - dependent fixtures then receive
    an async generator instead of a HomeAssistant instance and every test
    errors at setup.
    """
    config.option.asyncio_mode = "auto"
    config._inicache["asyncio_default_fixture_loop_scope"] = "function"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(request: pytest.FixtureRequest) -> None:
    """Allow the Home Assistant test harness to load this custom integration.

    Home Assistant's test harness blocks loading custom_components by
    default. pytest-homeassistant-custom-component exposes the
    `enable_custom_integrations` fixture to opt in; making it autouse here
    means individual test modules don't need to request it themselves.

    enable_custom_integrations depends on `hass`, and the recorder harness
    asserts its database fixture is created *before* `hass` - so for tests
    using the recorder, resolve that fixture first.
    """
    if "recorder_mock" in request.fixturenames:
        request.getfixturevalue("recorder_db_url")
    request.getfixturevalue("enable_custom_integrations")
