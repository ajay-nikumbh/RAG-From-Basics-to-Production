"""
Application settings.

This file reads every configuration value the app needs (Azure OpenAI chat
and embedding settings, chunking and retrieval settings, data
folders) from environment variables and from the repository root .env file.

All other files get settings through get_settings(), so values are read once
and the same Settings object is shared everywhere.
"""

# Imports
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path


# Folder that contains the "app" package (01. Naive RAG/03. API)
IMPLEMENTATION_DIR = Path(__file__).resolve().parents[2]

# Repository root, where the shared .env file lives
REPO_ROOT = IMPLEMENTATION_DIR.parents[1]


class Settings(BaseSettings):
    """All configuration values for the Naive RAG app."""

    # Read from the root .env file, ignore variables this app does not use
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App information shown in the API docs
    app_name: str = "Naive RAG API"
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

    # Retrieval settings
    top_k: int = 4

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


# Cached so the .env file is read only once
@lru_cache
def get_settings() -> Settings:
    """Return the shared Settings object."""

    # Build settings from environment variables and the .env file
    return Settings()
