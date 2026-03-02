"""Time utilities."""

import datetime


def iso_or_none(dt: datetime.datetime | None) -> str | None:
    """Return ISO string or None."""
    return dt.isoformat() if dt else None
