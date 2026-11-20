"""
Query schemas.

This file defines the request and response of POST /query. The request holds
the question and an optional top_k. The response holds the answer, the
sources (citations) it was generated from and the usage (tokens, cost in USD and INR, time).
"""

# Imports
from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Request body of POST /query."""

    # The user question, not empty and not longer than 2000 characters
    question: str = Field(min_length=1, max_length=2000, examples=["What are the two RAG models?"])

    # Optional number of chunks to retrieve; uses TOP_K from settings when missing
    top_k: int | None = Field(default=None, ge=1, le=20)


class SourceResponse(BaseModel):
    """One citation in the answer."""

    # Citation number, matches [number] in the answer
    number: int

    # File and page or sheet, for example "report.pdf, page 3"
    label: str

    # Cosine similarity between the question and the chunk
    score: float

    # The chunk text used as context
    text: str

    # File name and PDF page, used by the UI to open the cited page
    source: str = ""
    page: int | None = None


class UsageResponse(BaseModel):
    """Tokens, cost and time of one query."""

    # Tokens used by the question embedding and the chat model
    embedding_tokens: int
    prompt_tokens: int
    completion_tokens: int

    # Cost in US dollars and Indian rupees, and total time in milliseconds
    cost_usd: float
    cost_inr: float = 0.0
    latency_ms: int


class QueryResponse(BaseModel):
    """Response body of POST /query."""

    # The generated answer
    answer: str

    # The retrieved chunks in citation order
    sources: list[SourceResponse]

    # Tokens, cost and time of this query
    usage: UsageResponse
