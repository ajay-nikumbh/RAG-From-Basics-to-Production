"""
Shared vector store.

This file gives every part of the app the same FaissStore object. On first use
it loads the saved index from data/index (or starts empty), and after that the
same in-memory store is returned, so a file ingested through one request is
searchable by the next request without reloading from disk.
"""

# Imports
from app.vectorstore.faiss_store import FaissStore
from app.core.config import get_settings
from functools import lru_cache


@lru_cache
def get_vector_store() -> FaissStore:
    """Return the shared FaissStore, loaded from disk on first use."""

    # Read the shared settings
    settings = get_settings()

    # Load the saved index, or an empty store on the first run
    return FaissStore.load(settings.index_dir, settings.embedding_dimensions)
