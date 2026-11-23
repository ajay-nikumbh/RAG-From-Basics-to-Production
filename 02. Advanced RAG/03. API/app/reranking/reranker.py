"""
Reranker.

This file re-scores the retrieved candidate chunks with gpt-4o-mini acting as
a relevance judge. All candidates are scored in one call (a list with one
score from 0 to 10 per chunk, in candidate order), then sorted by that score, with the retrieval rank breaking
ties. Every chunk keeps its retrieval rank and similarity, so the trace and
the evaluation can show how the order changed.

If reranking is switched off, the call fails or the reply cannot be read, the
candidates are returned in their retrieval order without scores, so a
reranking problem never stops the answer.
"""

# Imports
from app.reranking.prompts import build_rerank_messages
from app.vectorstore.faiss_store import SearchResult
from app.core.azure_client import get_azure_client
from app.services.usage import add_chat_tokens
from app.core.config import get_settings
from dataclasses import dataclass, field
import json


# Lowest and highest score the rubric allows
MIN_SCORE = 0.0
MAX_SCORE = 10.0


@dataclass
class RankedChunk:
    """One candidate chunk with its position before and its score after reranking."""

    # The chunk and its cosine similarity from retrieval
    result: SearchResult

    # Position in the retrieval list, 1 = most similar
    retrieval_rank: int

    # Relevance score from the reranker (0 to 10), None when not reranked
    rerank_score: float | None = None


@dataclass
class RerankOutcome:
    """The candidates in their final order, and whether the reranker ran."""

    # Candidates best first
    chunks: list[RankedChunk] = field(default_factory=list)

    # True only when the model's scores were used
    reranked: bool = False

    # Short reason, for logs and the trace
    reason: str = ""


def in_retrieval_order(candidates: list[SearchResult], reason: str) -> RerankOutcome:
    """Candidates in their original order, without scores."""

    # Keep the retrieval rank so the trace still shows positions
    chunks = [RankedChunk(result, rank) for rank, result in enumerate(candidates, start=1)]
    return RerankOutcome(chunks, reranked=False, reason=reason)


def read_scores(reply_text: str, count: int) -> list[float] | None:
    """Turn the JSON reply into one score per candidate, clamped to 0 to 10.

    Returns None when the list does not have exactly one score per candidate,
    because then the scores cannot be matched to the candidates safely.
    """

    # The reply must hold a list under "scores"
    scores = json.loads(reply_text).get("scores", [])

    # One score per candidate, in candidate order
    if not isinstance(scores, list) or len(scores) != count:
        return None

    # Numbers only, kept inside the rubric range
    return [min(MAX_SCORE, max(MIN_SCORE, float(score))) for score in scores]


def rerank(question: str, candidates: list[SearchResult], client=None) -> RerankOutcome:
    """Score every candidate with one model call and return them best first."""

    # Nothing to rerank
    settings = get_settings()
    if not candidates:
        return RerankOutcome(reason="no candidates")

    # Switched off: keep the retrieval order (Naive behaviour)
    if not settings.rerank_enabled:
        return in_retrieval_order(candidates, "reranking disabled")

    # One chat completion that scores all candidates and returns JSON
    try:
        client = client or get_azure_client()
        response = client.chat.completions.create(
            model=settings.azure_openai_deployment_name,
            messages=build_rerank_messages(question, candidates),
            temperature=0.0,
            max_tokens=settings.rerank_max_tokens,
            response_format={"type": "json_object"},
        )
    except Exception as error:
        return in_retrieval_order(candidates, f"rerank call failed: {type(error).__name__}")

    # Count the tokens of this call in the running query
    if getattr(response, "usage", None):
        add_chat_tokens(response.usage.prompt_tokens, response.usage.completion_tokens)

    # Read one score per candidate, in candidate order
    try:
        scores = read_scores(response.choices[0].message.content or "", len(candidates))
    except (json.JSONDecodeError, AttributeError, TypeError, ValueError):
        return in_retrieval_order(candidates, "reply was not valid JSON")

    # A list of the wrong length cannot be matched to the candidates
    if scores is None:
        return in_retrieval_order(candidates, "score count did not match candidates")

    # Pair every candidate with its score and retrieval rank
    chunks = [
        RankedChunk(result, rank, score)
        for rank, (result, score) in enumerate(zip(candidates, scores), start=1)
    ]

    # Highest score first; on equal scores the better retrieval rank wins
    chunks.sort(key=lambda chunk: (-chunk.rerank_score, chunk.retrieval_rank))
    return RerankOutcome(chunks, reranked=True, reason="reranked")
