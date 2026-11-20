"""
Tests for the FAISS vector store.

These tests use tiny 3-number vectors so the expected nearest chunk is easy to
see. They check search order and scores, the empty-store case, the length
check in add, and that save followed by load gives the same results.
"""

# Imports
from app.vectorstore.faiss_store import FaissStore
from app.ingestion.document import Document
import numpy as np
import pytest


def build_store() -> FaissStore:
    """A store with three chunks pointing in different directions."""

    # Three chunks and their vectors
    chunks = [
        Document(text="sick leave", metadata={"source": "hr.pdf", "page": 1}),
        Document(text="laptops", metadata={"source": "it.pdf", "page": 2}),
        Document(text="paid leave", metadata={"source": "hr.pdf", "page": 3}),
    ]
    vectors = np.array([[1, 0, 0], [0, 1, 0], [0.8, 0, 0.6]], dtype="float32")

    # Add them to a new store
    store = FaissStore(dimensions=3)
    store.add(vectors, chunks)
    return store


def test_search_returns_best_matches_first():
    """The chunk pointing the same way as the query comes first with score 1."""

    # Query pointing along the first axis
    results = build_store().search(np.array([[2, 0, 0]]), top_k=2)

    # Exact match first (cosine 1.0), then the 0.8 match
    assert [r.document.text for r in results] == ["sick leave", "paid leave"]
    assert results[0].score == pytest.approx(1.0)
    assert results[1].score == pytest.approx(0.8)


def test_search_on_empty_store_returns_nothing():
    """An empty store returns an empty list instead of failing."""

    # New store with no chunks
    assert FaissStore(dimensions=3).search(np.array([[1, 0, 0]]), top_k=4) == []


def test_add_rejects_mismatched_lengths():
    """Two vectors with one chunk is an error."""

    # Lengths do not match
    with pytest.raises(ValueError):
        FaissStore(dimensions=3).add(np.zeros((2, 3)), [Document(text="only one")])


def test_save_and_load_round_trip(tmp_path):
    """A saved store loads back with the same chunks and search results."""

    # Save, then load into a new object
    build_store().save(tmp_path)
    loaded = FaissStore.load(tmp_path, dimensions=3)

    # Same size and same best match with its metadata
    assert loaded.count == 3
    best = loaded.search(np.array([[0, 1, 0]]), top_k=1)[0]
    assert best.document.text == "laptops"
    assert best.document.metadata == {"source": "it.pdf", "page": 2}


def test_load_without_files_gives_empty_store(tmp_path):
    """Loading from a folder with no saved index gives an empty store."""

    # Nothing has been saved in tmp_path
    assert FaissStore.load(tmp_path, dimensions=3).count == 0
