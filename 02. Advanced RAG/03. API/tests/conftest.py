"""
Shared test setup.

Every test writes usage events and evaluation reports to a temporary folder
instead of the real data/usage and data/evals folders, so running the tests
never changes the analytics or the saved reports.
"""

# Imports
from app.core.config import get_settings
import pytest


@pytest.fixture(autouse=True)
def temporary_data_files(tmp_path, monkeypatch):
    """Point the usage file and the reports folder to a temporary folder for each test."""

    # Redirect usage records and evaluation reports
    monkeypatch.setattr(get_settings(), "usage_file", tmp_path / "usage" / "usage.jsonl")
    monkeypatch.setattr(get_settings(), "evals_dir", tmp_path / "evals")
