"""Sunrise time provider for Scheduler+.

Resolves a Rule's on_time/off_time to the astronomical sunrise on a given
day, optionally offset by a number of minutes (e.g. "Sunrise -15").
"""

from __future__ import annotations

from ._astral import AstralTimeProvider


class SunriseTimeProvider(AstralTimeProvider):
    """Resolves sunrise, offset by params["offset_minutes"]."""

    _event = "sunrise"
