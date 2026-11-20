"""
Tests for GET /health.

Checks that the endpoint answers, reports the configuration as True/False
only, and returns the pipeline settings without any secret value.
"""

# Imports
from fastapi.testclient import TestClient
from app.core.config import get_settings
from app.main import app


def test_health_reports_status_and_pipeline_settings():
    """Health returns ok, booleans for the config and the pipeline settings."""

    # Call the endpoint
    body = TestClient(app).get("/health").json()
    settings = get_settings()

    # Status and config check
    assert body["status"] == "ok"
    assert set(body["config"].values()) <= {True, False}

    # Pipeline settings match the shared settings
    assert body["pipeline"]["chunk_size"] == settings.chunk_size
    assert body["pipeline"]["top_k"] == settings.top_k
    assert body["pipeline"]["embedding_model"] == settings.azure_openai_embedding_deployment

    # The API key never appears in the response
    assert not settings.azure_openai_api_key or settings.azure_openai_api_key not in str(body)
