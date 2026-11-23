"""
Tests for the chunk selector.

These tests build reranked chunks with known scores and check the threshold,
the minimum and maximum number of chunks, the not-found floor, and the
Naive top_k fallback when the reranker did not run.
"""

# Imports
from app.reranking.reranker import RankedChunk, RerankOutcome
from app.vectorstore.faiss_store import SearchResult
from app.reranking.selector import select_chunks
from app.ingestion.document import Document
from app.core.config import get_settings
import pytest


def outcome(scores: list[float | None], reranked: bool = True) -> RerankOutcome:
    """Reranked chunks with the given scores, already sorted best first."""

    # One chunk per score, named by its position
    chunks = []
    for rank, score in enumerate(scores, start=1):
        result = SearchResult(Document(text=f"chunk {rank}"), 0.5)
        chunks.append(RankedChunk(result, rank, score))
    return RerankOutcome(chunks, reranked=reranked, reason="test")


def texts(chunks: list[RankedChunk]) -> list[str]:
    """Chunk texts, to compare selections easily."""

    # Text of every chunk in order
    return [chunk.result.document.text for chunk in chunks]


@pytest.fixture(autouse=True)
def selector_settings(monkeypatch):
    """Threshold 6, floor 2, keep 1 to 3 chunks, top_k 4."""

    # Settings used by the selector
    settings = get_settings()
    monkeypatch.setattr(settings, "rerank_threshold", 6.0)
    monkeypatch.setattr(settings, "rerank_min_best_score", 2.0)
    monkeypatch.setattr(settings, "min_chunks", 1)
    monkeypatch.setattr(settings, "max_chunks", 3)
    monkeypatch.setattr(settings, "top_k", 4)


def test_keeps_chunks_at_or_above_threshold():
    """Scores 9, 6 pass; 5 and below are dropped."""

    # Two chunks pass the threshold
    selection = select_chunks(outcome([9, 6, 5, 1]))

    # Kept and dropped split at the threshold
    assert texts(selection.kept) == ["chunk 1", "chunk 2"]
    assert texts(selection.dropped) == ["chunk 3", "chunk 4"]
    assert selection.reason == "above threshold"


def test_caps_at_max_chunks():
    """Five passing chunks are cut to max_chunks."""

    # Every chunk passes
    selection = select_chunks(outcome([10, 9, 9, 8, 7]))

    # Only the best three are kept
    assert texts(selection.kept) == ["chunk 1", "chunk 2", "chunk 3"]
    assert selection.reason == "above threshold, capped at max_chunks"


def test_keeps_min_chunks_when_none_pass():
    """When nothing passes but the best is above the floor, the best chunk is kept."""

    # Best score 4: below the threshold, above the floor
    selection = select_chunks(outcome([4, 3, 1]))

    # The single best chunk is kept
    assert texts(selection.kept) == ["chunk 1"]
    assert selection.reason == "below threshold, kept min_chunks"


def test_nothing_relevant_keeps_no_chunks():
    """When even the best chunk is below the floor, no context is sent."""

    # Out-of-scope question: everything scored 0 or 1
    selection = select_chunks(outcome([1, 0, 0]))

    # Nothing kept, everything dropped
    assert selection.kept == []
    assert len(selection.dropped) == 3
    assert selection.reason == "nothing relevant"


def test_not_reranked_keeps_naive_top_k():
    """Without reranker scores, the first top_k chunks are kept in retrieval order."""

    # Six chunks without scores
    selection = select_chunks(outcome([None] * 6, reranked=False))

    # Naive top_k of 4
    assert texts(selection.kept) == ["chunk 1", "chunk 2", "chunk 3", "chunk 4"]
    assert selection.reason == "not reranked, kept top_k"


def test_no_candidates():
    """An empty outcome gives an empty selection."""

    # Nothing retrieved
    selection = select_chunks(RerankOutcome())

    # Nothing kept or dropped
    assert selection.kept == [] and selection.dropped == []
    assert selection.reason == "no candidates"
