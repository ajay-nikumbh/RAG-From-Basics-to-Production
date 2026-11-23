"""
Health check route.

This file defines GET /health. It is the simplest endpoint of the app: it
confirms the API is running and reports whether the Azure OpenAI chat and
embedding settings are filled in, so setup problems are visible before any real request.
It also returns the non-secret pipeline settings (model deployment names,
chunk size, overlap, top_k and the Advanced RAG stage switches) that the UI
shows.
"""

# Imports
from app.schemas.health import ConfigStatus, HealthResponse, PipelineSettings
from app.core.config import get_settings
from fastapi import APIRouter


# Router for health endpoints, shown under the "Health" group in the API docs
router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Return API status and a configuration check."""

    # Read the shared settings
    settings = get_settings()

    # Endpoint and key are shared by the chat and embedding models
    connection_ready = bool(settings.azure_openai_endpoint and settings.azure_openai_api_key)

    # Chat is ready when the connection and the chat deployment are set
    chat_ready = connection_ready and bool(settings.azure_openai_deployment_name)

    # Embeddings are ready when the connection and the embedding deployment are set
    embeddings_ready = connection_ready and bool(settings.azure_openai_embedding_deployment)

    # Build the response (only True/False and names, never the secret values)
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        version=settings.app_version,
        config=ConfigStatus(
            azure_chat=chat_ready,
            azure_embeddings=embeddings_ready,
        ),
        pipeline=PipelineSettings(
            chat_model=settings.azure_openai_deployment_name,
            embedding_model=settings.azure_openai_embedding_deployment,
            embedding_dimensions=settings.embedding_dimensions,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            top_k=settings.top_k,
            rewrite_enabled=settings.rewrite_enabled,
            candidate_k=settings.candidate_k,
            rerank_enabled=settings.rerank_enabled,
            rerank_threshold=settings.rerank_threshold,
            min_chunks=settings.min_chunks,
            max_chunks=settings.max_chunks,
            compression_enabled=settings.compression_enabled,
        ),
    )
