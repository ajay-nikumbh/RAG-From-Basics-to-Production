"""
Query schemas.

This file defines the request and response of POST /query. The request holds
the question and, for follow-up questions, the earlier turns of the chat.
The response holds the answer, the sources (citations) it was generated
from, the usage (tokens, cost in USD and INR, time) and a trace of every
pipeline stage: the rewritten questions, every candidate chunk with its
similarity, reranker score and whether it was kept, and the time per stage.
"""

# Imports
from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    """One earlier question and its answer."""

    # Earlier question and the answer that was shown
    question: str = Field(max_length=2000)
    answer: str = Field(default="", max_length=8000)


class QueryRequest(BaseModel):
    """Request body of POST /query."""

    # The user question, not empty and not longer than 2000 characters
    question: str = Field(min_length=1, max_length=2000, examples=["What are the two RAG models?"])

    # Earlier turns of the chat, oldest first; the rewriter uses the last few
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)


class SourceResponse(BaseModel):
    """One citation in the answer."""

    # Citation number, matches [number] in the answer
    number: int

    # File and page or sheet, for example "report.pdf, page 3"
    label: str

    # Cosine similarity between the search query and the chunk
    score: float

    # The chunk text used as context
    text: str

    # File name and PDF page, used by the UI to open the cited page
    source: str = ""
    page: int | None = None

    # Reranker score (0 to 10) and position before reranking
    rerank_score: float | None = None
    retrieval_rank: int | None = None


class UsageResponse(BaseModel):
    """Tokens, cost and time of one query."""

    # Tokens used by the query embedding and the chat model
    embedding_tokens: int
    prompt_tokens: int
    completion_tokens: int

    # Cost in US dollars and Indian rupees, and total time in milliseconds
    cost_usd: float
    cost_inr: float = 0.0
    latency_ms: int


class TraceCandidateResponse(BaseModel):
    """One retrieved candidate and what happened to it."""

    # Position before and after reranking (1 = best)
    retrieval_rank: int
    final_rank: int

    # Where the chunk comes from
    label: str
    source: str
    page: int | None = None

    # Cosine similarity and reranker score
    similarity: float
    rerank_score: float | None = None

    # Sent to the generator, and its citation number
    kept: bool
    citation: int | None = None


class TraceResponse(BaseModel):
    """What every stage of the pipeline did."""

    # The question at each step
    original_question: str
    standalone_question: str
    search_query: str

    # Whether each model stage ran, and why or why not
    rewritten: bool
    rewrite_reason: str
    reranked: bool
    rerank_reason: str
    selection_reason: str

    # Whether compression ran, why, and the context size before and after (characters)
    compressed: bool = False
    compression_reason: str = ""
    context_chars_before: int = 0
    context_chars_after: int = 0

    # Every candidate in final order, and milliseconds per stage
    candidates: list[TraceCandidateResponse]
    timings_ms: dict[str, int]


class QueryResponse(BaseModel):
    """Response body of POST /query."""

    # The generated answer
    answer: str

    # The kept chunks in citation order
    sources: list[SourceResponse]

    # Tokens, cost and time of this query
    usage: UsageResponse

    # What each stage did
    trace: TraceResponse
