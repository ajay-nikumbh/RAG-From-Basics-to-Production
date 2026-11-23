"""
Tests for the ingestion service.

These tests replace the embedding call and the index folder, so they run
offline and never touch the real data/index folder. They check the full
pipeline result, that the index is saved, and that duplicate and empty files
are rejected.
"""

# Imports
from app.services.ingestion_service import DuplicateDocumentError, EmptyDocumentError, ingest_file
from app.vectorstore.faiss_store import FaissStore
from app.services import ingestion_service
from app.core.config import get_settings
import numpy as np
import pytest


def fake_embed_texts(texts):
    """Return one random 8-number vector per text instead of calling Azure."""

    # Random but valid float32 vectors
    return np.random.rand(len(texts), 8).astype("float32")


@pytest.fixture
def setup(tmp_path, monkeypatch):
    """Use the fake embedder and a temporary index folder."""

    # Replace the real embedding call
    monkeypatch.setattr(ingestion_service, "embed_texts", fake_embed_texts)

    # Save the index into the temporary folder
    monkeypatch.setattr(get_settings(), "index_dir", tmp_path / "index")

    # An empty store with 8-number vectors
    return FaissStore(dimensions=8), tmp_path


def test_ingest_file_runs_full_pipeline(setup):
    """A text file is loaded, chunked, embedded, stored and saved."""

    # Write a file long enough for several chunks
    store, folder = setup
    path = folder / "policy.txt"
    path.write_text("Employees get 8 sick days per year. " * 100, encoding="utf-8")

    # Ingest it
    result = ingest_file(path, store=store)

    # One Document, several chunks, all in the store
    assert result.source == "policy.txt"
    assert result.documents == 1
    assert result.chunks > 1
    assert result.total_chunks == store.count == result.chunks

    # The index files were written
    assert (folder / "index" / "index.faiss").exists()
    assert (folder / "index" / "chunks.json").exists()


def test_ingest_file_rejects_duplicates(setup):
    """The same file name cannot be ingested twice."""

    # Ingest once
    store, folder = setup
    path = folder / "notes.md"
    path.write_text("# Notes\n\nSome text.", encoding="utf-8")
    ingest_file(path, store=store)

    # Second time fails
    with pytest.raises(DuplicateDocumentError):
        ingest_file(path, store=store)


def test_ingest_file_rejects_empty_files(setup):
    """A file with no text raises EmptyDocumentError and stores nothing."""

    # Whitespace-only file
    store, folder = setup
    path = folder / "empty.txt"
    path.write_text("   ", encoding="utf-8")

    # Nothing to index
    with pytest.raises(EmptyDocumentError):
        ingest_file(path, store=store)
    assert store.count == 0
