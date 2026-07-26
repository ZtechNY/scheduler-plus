"""Sunset time provider for Scheduler+.

Resolves a Rule's on_time/off_time to the astronomical sunset on a given
day, optionally offset by a number of minutes (e.g. "Sunset +25").
"""

from __future__ import annotations

from ._astral import AstralTimeProvider


class SunsetTimeProvider(AstralTimeProvider):
    """Resolves sunset, offset by params["offset_minutes"]."""

    _event = "sunset"
