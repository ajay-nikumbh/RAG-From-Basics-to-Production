"""
Health check route.

This file defines GET /health. It is the simplest endpoint of the app: it
confirms the API is running and reports whether the Azure OpenAI and OpenAI
settings are filled in, so setup problems are visible before any real request.
"""

# Imports
from app.schemas.health import ConfigStatus, HealthResponse
from app.core.config import get_settings
from fastapi import APIRouter


# Router for health endpoints, shown under the "Health" group in the API docs
router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Return API status and a configuration check."""

    # Read the shared settings
    settings = get_settings()

    # Azure OpenAI is ready when endpoint, key and deployment are all set
    azure_ready = all([
        settings.azure_openai_endpoint,
        settings.azure_openai_api_key,
        settings.azure_openai_deployment_name,
    ])

    # OpenAI embeddings are ready when the API key is set
    embeddings_ready = bool(settings.openai_api_key)

    # Build the response (only True/False, never the secret values)
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        version=settings.app_version,
        config=ConfigStatus(
            azure_openai=azure_ready,
            openai_embeddings=embeddings_ready,
        ),
    )
