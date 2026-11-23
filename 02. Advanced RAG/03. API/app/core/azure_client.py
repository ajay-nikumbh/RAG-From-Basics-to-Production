"""
Azure OpenAI client.

This file creates the one AzureOpenAI client the app uses for both the
embedding model and the chat model. The endpoint, key and API version come
from settings. The client is cached, so every caller shares the same
connection pool instead of opening a new one per request.
"""

# Imports
from app.core.config import get_settings
from functools import lru_cache
from openai import AzureOpenAI


@lru_cache
def get_azure_client() -> AzureOpenAI:
    """Return the shared AzureOpenAI client, created on first use."""

    # Read the shared settings
    settings = get_settings()

    # Stop early with a clear message if the connection settings are missing
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        raise RuntimeError("AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY must be set in .env")

    # One client for embeddings and chat on the same Azure resource
    return AzureOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        api_version=settings.azure_openai_api_version,
    )
