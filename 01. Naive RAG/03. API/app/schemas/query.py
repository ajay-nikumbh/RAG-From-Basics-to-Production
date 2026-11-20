"""
Query schemas.

This file defines the request and response of POST /query. The request holds
the question and an optional top_k. The response holds the answer and the
sources (citations) it was generated from.
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


class QueryResponse(BaseModel):
    """Response body of POST /query."""

    # The generated answer
    answer: str

    # The retrieved chunks in citation order
    sources: list[SourceResponse]
