"""
Application settings.

This file reads every configuration value the app needs (Azure OpenAI chat
settings, OpenAI embedding settings, chunking and retrieval settings, data
folders) from environment variables and from the repository root .env file.

All other files get settings through get_settings(), so values are read once
and the same Settings object is shared everywhere.
"""

# Imports
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path


# Folder that contains the "app" package (01. Naive RAG/implementation)
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

    # Azure OpenAI chat model used to write answers
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment_name: str = ""
    azure_openai_api_version: str = "2024-10-21"

    # OpenAI embedding model used to turn text into vectors
    openai_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"

    # Chunking settings (in characters)
    chunk_size: int = 1000
    chunk_overlap: int = 150

    # Retrieval settings
    top_k: int = 4

    # Data folders for uploaded files and the saved FAISS index
    upload_dir: Path = IMPLEMENTATION_DIR / "data" / "uploads"
    index_dir: Path = IMPLEMENTATION_DIR / "data" / "index"


# Cached so the .env file is read only once
@lru_cache
def get_settings() -> Settings:
    """Return the shared Settings object."""

    # Build settings from environment variables and the .env file
    return Settings()
