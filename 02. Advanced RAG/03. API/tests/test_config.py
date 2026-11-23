"""
Tests for the Advanced RAG settings.

Checks the default values of the new stage settings, that each one can be
changed from an environment variable without reading real secrets, and that
override_settings() changes values only inside its block.
"""

# Imports
from app.core.config import Settings, get_settings, override_settings


def test_stage_defaults():
    """Rewriting and reranking are on, compression is off, limits are sensible."""

    # Build settings without the .env file so only defaults are used
    settings = Settings(_env_file=None)

    # Stage switches
    assert settings.rewrite_enabled is True
    assert settings.rerank_enabled is True
    assert settings.compression_enabled is False

    # Candidate count and chunk limits
    assert settings.candidate_k == 10
    assert 0 <= settings.rerank_threshold <= 10
    assert 1 <= settings.min_chunks <= settings.max_chunks <= settings.candidate_k


def test_stage_settings_read_from_environment(monkeypatch):
    """Environment variables override the defaults and are converted to the right type."""

    # Set a few variables as strings, the way a .env file provides them
    monkeypatch.setenv("RERANK_ENABLED", "false")
    monkeypatch.setenv("CANDIDATE_K", "20")
    monkeypatch.setenv("RERANK_THRESHOLD", "6.5")

    # Build settings without the .env file
    settings = Settings(_env_file=None)

    # Values are converted to bool, int and float
    assert settings.rerank_enabled is False
    assert settings.candidate_k == 20
    assert settings.rerank_threshold == 6.5


def test_override_settings_applies_inside_block_only():
    """Inside the block get_settings() returns the changed copy; outside, the shared settings."""

    # The shared value before
    shared = get_settings()
    before = shared.rerank_enabled

    # Inside the block the value is changed on a copy
    with override_settings(rerank_enabled=not before):
        assert get_settings().rerank_enabled is (not before)
        assert get_settings() is not shared

    # After the block the shared settings are back and unchanged
    assert get_settings() is shared
    assert shared.rerank_enabled is before
