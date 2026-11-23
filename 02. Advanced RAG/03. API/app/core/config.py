"""
Application settings.

This file reads every configuration value the app needs (Azure OpenAI chat
and embedding settings, chunking and retrieval settings, the Advanced RAG
stage switches for rewriting, reranking, thresholds and compression, data
folders) from environment variables and from the repository root .env file.

All other files get settings through get_settings(), so values are read once
and the same Settings object is shared everywhere. An evaluation run can use
override_settings() to change some values (for example switch reranking off)
for its own thread only, without touching the shared settings.
"""

# Imports
from pydantic_settings import BaseSettings, SettingsConfigDict
from contextlib import contextmanager
from contextvars import ContextVar
from functools import lru_cache
from pathlib import Path


# Folder that contains the "app" package (02. Advanced RAG/03. API)
IMPLEMENTATION_DIR = Path(__file__).resolve().parents[2]

# Repository root, where the shared .env file lives
REPO_ROOT = IMPLEMENTATION_DIR.parents[1]


class Settings(BaseSettings):
    """All configuration values for the Advanced RAG app."""

    # Read from the root .env file, ignore variables this app does not use
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App information shown in the API docs
    app_name: str = "Advanced RAG API"
    app_version: str = "0.1.0"

    # Log level for the app logs: DEBUG, INFO, WARNING or ERROR
    log_level: str = "INFO"

    # Azure OpenAI chat model used to write answers
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment_name: str = ""
    azure_openai_api_version: str = "2024-10-21"

    # Azure OpenAI embedding model used to turn text into vectors
    azure_openai_embedding_deployment: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # Chunking settings (in characters)
    chunk_size: int = 1000
    chunk_overlap: int = 150

    # Retrieval settings: top_k is used when reranking is off (Naive behaviour)
    top_k: int = 4

    # Query rewriting: one gpt-4o-mini call that condenses follow-ups and rewrites the question
    rewrite_enabled: bool = True
    rewrite_history_turns: int = 3
    rewrite_max_tokens: int = 150

    # Candidate retrieval: how many chunks the reranker scores
    candidate_k: int = 10

    # Reranking: gpt-4o-mini scores every candidate from 0 (unrelated) to 10 (answers the question)
    rerank_enabled: bool = True
    rerank_max_tokens: int = 400

    # Threshold and dynamic k: keep chunks scoring at least the threshold, between min and max chunks
    rerank_threshold: float = 6.0
    min_chunks: int = 1
    max_chunks: int = 5

    # Not-found floor: if even the best chunk scores below this, no context is sent
    rerank_min_best_score: float = 2.0

    # Optional extractive context compression (off by default, evaluated separately)
    compression_enabled: bool = False
    compression_max_tokens: int = 600

    # Answer generation settings
    llm_temperature: float = 0.0
    llm_max_tokens: int = 800

    # Longest reply the evaluation judge may write (scores and short reasons)
    eval_judge_max_tokens: int = 600

    # Prices in US dollars per one million tokens (gpt-4o-mini and text-embedding-3-small list prices)
    price_embedding_per_million: float = 0.02
    price_chat_input_per_million: float = 0.15
    price_chat_output_per_million: float = 0.60

    # Fixed exchange rate used to show costs in Indian rupees (set USD_TO_INR in .env to change it)
    usd_to_inr: float = 84.0

    # Data folders for uploaded files and the saved FAISS index
    upload_dir: Path = IMPLEMENTATION_DIR / "data" / "uploads"
    index_dir: Path = IMPLEMENTATION_DIR / "data" / "index"

    # File where every query and ingestion run is recorded for analytics
    usage_file: Path = IMPLEMENTATION_DIR / "data" / "usage" / "usage.jsonl"

    # Folder where evaluation run reports are saved (one JSON file per run)
    evals_dir: Path = IMPLEMENTATION_DIR / "data" / "evals"


# Settings that replace the shared ones inside one thread, used by evaluation presets
settings_override: ContextVar[Settings | None] = ContextVar("settings_override", default=None)


# Cached so the .env file is read only once
@lru_cache
def load_settings() -> Settings:
    """Build the shared Settings object from the environment and the .env file."""

    # Build settings from environment variables and the .env file
    return Settings()


def get_settings() -> Settings:
    """Return the settings in force: an override set by override_settings(), or the shared ones."""

    # An evaluation preset can replace the settings for its own thread only
    return settings_override.get() or load_settings()


@contextmanager
def override_settings(**changes):
    """Use a copy of the shared settings with some values changed, inside this block and thread only.

        with override_settings(rerank_enabled=False):
            answer_question(...)   # runs without reranking; other requests are not affected
    """

    # A copy, so the shared settings never change
    token = settings_override.set(load_settings().model_copy(update=changes))

    # Run the block, then go back to the shared settings
    try:
        yield
    finally:
        settings_override.reset(token)
