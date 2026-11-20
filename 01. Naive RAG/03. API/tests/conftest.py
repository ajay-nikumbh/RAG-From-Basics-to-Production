"""
Shared test setup.

Every test writes usage events to a temporary file instead of the real
data/usage/usage.jsonl, so running the tests never changes the analytics.
"""

# Imports
from app.core.config import get_settings
import pytest


@pytest.fixture(autouse=True)
def temporary_usage_file(tmp_path, monkeypatch):
    """Point the usage file to a temporary folder for each test."""

    # Redirect usage records
    monkeypatch.setattr(get_settings(), "usage_file", tmp_path / "usage" / "usage.jsonl")
