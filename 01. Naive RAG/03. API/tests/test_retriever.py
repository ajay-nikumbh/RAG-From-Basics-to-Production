"""
Tests for the retriever.

These tests replace the question embedding with a fixed vector, so they run
offline. They check that the most similar chunks come back best first, that
top_k limits the number of results, and that an empty store skips the
embedding call.
"""

# Imports
from app.vectorstore.faiss_store import FaissStore
from app.ingestion.document import Document
from app.retrieval import retriever
import numpy as np


def build_store() -> FaissStore:
    """A store with three chunks in different directions."""

    # Three chunks and their 3-number vectors
    store = FaissStore(dimensions=3)
    store.add(
        np.array([[1, 0, 0], [0, 1, 0], [0.9, 0.1, 0]], dtype="float32"),
        [Document(text="sick leave"), Document(text="laptops"), Document(text="sick days")],
    )
    return store


def test_retrieve_returns_best_chunks_first(monkeypatch):
    """The two leave chunks come back, the closest first."""

    # Pretend the question embeds to the first axis
    monkeypatch.setattr(retriever, "embed_query", lambda question: np.array([[1, 0, 0]], dtype="float32"))

    # Ask for the top 2
    results = retriever.retrieve("How many sick days?", top_k=2, store=build_store())

    # Best match first, unrelated chunk left out
    assert [r.document.text for r in results] == ["sick leave", "sick days"]


def test_retrieve_on_empty_store_skips_embedding(monkeypatch):
    """With nothing indexed, the embedding model is never called."""

    # Fail the test if the embedding is called
    def must_not_be_called(question):
        raise AssertionError("embed_query should not be called")

    monkeypatch.setattr(retriever, "embed_query", must_not_be_called)

    # Empty store gives no results
    assert retriever.retrieve("Anything?", top_k=4, store=FaissStore(dimensions=3)) == []
