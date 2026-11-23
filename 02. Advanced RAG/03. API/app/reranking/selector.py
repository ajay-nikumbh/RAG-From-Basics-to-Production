"""
Chunk selector (threshold and dynamic k).

This file decides which reranked chunks go to the generator. It keeps every
chunk whose reranker score reaches the threshold, then makes sure at least
min_chunks and at most max_chunks are kept. If even the best chunk scores
below the not-found floor, nothing is kept, so the answer can say the
documents do not contain it without sending unrelated text.

If the reranker did not run (switched off or failed), there are no scores to
judge, so the first top_k chunks in retrieval order are kept, exactly like
Naive RAG.
"""

# Imports
from app.reranking.reranker import RankedChunk, RerankOutcome
from app.core.config import get_settings
from dataclasses import dataclass, field


@dataclass
class Selection:
    """Chunks sent to the generator, chunks left out, and why."""

    # Chunks for the prompt, best first
    kept: list[RankedChunk] = field(default_factory=list)

    # Candidates not sent, best first
    dropped: list[RankedChunk] = field(default_factory=list)

    # Short reason, for logs and the trace
    reason: str = ""


def select_chunks(outcome: RerankOutcome) -> Selection:
    """Apply the not-found floor, the threshold and the min and max chunk limits."""

    # Read the limits and the ordered candidates
    settings = get_settings()
    chunks = outcome.chunks

    # Nothing retrieved
    if not chunks:
        return Selection(reason="no candidates")

    # No scores: keep the Naive top_k in retrieval order
    if not outcome.reranked:
        return Selection(chunks[:settings.top_k], chunks[settings.top_k:], "not reranked, kept top_k")

    # Even the best chunk is unrelated: send no context
    if chunks[0].rerank_score < settings.rerank_min_best_score:
        return Selection([], chunks, "nothing relevant")

    # Chunks at or above the threshold (chunks are sorted, so this is a prefix)
    kept = [chunk for chunk in chunks if chunk.rerank_score >= settings.rerank_threshold]
    reason = "above threshold"

    # Too few: keep the best min_chunks anyway
    if len(kept) < settings.min_chunks:
        kept = chunks[:settings.min_chunks]
        reason = "below threshold, kept min_chunks"

    # Too many: cap at max_chunks
    if len(kept) > settings.max_chunks:
        kept = kept[:settings.max_chunks]
        reason = "above threshold, capped at max_chunks"

    # Everything after the kept prefix is dropped
    return Selection(kept, chunks[len(kept):], reason)
