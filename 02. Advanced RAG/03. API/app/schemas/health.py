"""
Health check schemas.

This file defines the response returned by GET /health. It tells the caller
that the API is running, which Azure OpenAI services are configured and which
models and chunking settings the pipeline uses, without ever showing secret
values.
"""

# Imports
from pydantic import BaseModel


class ConfigStatus(BaseModel):
    """Which required settings have a value (True) or are missing (False)."""

    # Azure OpenAI chat model settings
    azure_chat: bool

    # Azure OpenAI embedding model settings
    azure_embeddings: bool


class PipelineSettings(BaseModel):
    """Non-secret pipeline settings shown in the UI."""

    # Azure OpenAI deployment names (not secret)
    chat_model: str
    embedding_model: str
    embedding_dimensions: int

    # Chunking and retrieval settings
    chunk_size: int
    chunk_overlap: int
    top_k: int

    # Advanced RAG stages: switches and limits
    rewrite_enabled: bool
    candidate_k: int
    rerank_enabled: bool
    rerank_threshold: float
    min_chunks: int
    max_chunks: int
    compression_enabled: bool


class HealthResponse(BaseModel):
    """Response body of GET /health."""

    # Always "ok" when the API can answer
    status: str

    # App name and version from settings
    app_name: str
    version: str

    # Configuration check for external services
    config: ConfigStatus

    # Models and chunking settings the pipeline runs with
    pipeline: PipelineSettings
