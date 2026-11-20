"""
Health check schemas.

This file defines the response returned by GET /health. It tells the caller
that the API is running and which external services are configured, without
ever showing secret values.
"""

# Imports
from pydantic import BaseModel


class ConfigStatus(BaseModel):
    """Which required settings have a value (True) or are missing (False)."""

    # Azure OpenAI chat model settings
    azure_openai: bool

    # OpenAI embeddings settings
    openai_embeddings: bool


class HealthResponse(BaseModel):
    """Response body of GET /health."""

    # Always "ok" when the API can answer
    status: str

    # App name and version from settings
    app_name: str
    version: str

    # Configuration check for external services
    config: ConfigStatus
