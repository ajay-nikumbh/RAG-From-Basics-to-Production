"""
Query route.

This file defines POST /query. It receives a question and the earlier chat
turns, runs the RAG service (rewrite, retrieve, rerank, select, generate)
and returns the answer with its sources, the usage of the run and the trace
of every stage. Input validation (empty question, too long text, too many
turns) is done by the QueryRequest schema, so invalid requests get a 422
response automatically.
"""

# Imports
from app.schemas.query import QueryRequest, QueryResponse, SourceResponse, TraceResponse, UsageResponse
from app.services.rag_service import answer_question
from dataclasses import asdict
from fastapi import APIRouter


# Router for query endpoints, shown under the "Query" group in the API docs
router = APIRouter(tags=["Query"])


@router.post("/query", response_model=QueryResponse)
def query(request: QueryRequest) -> QueryResponse:
    """Answer a question from the uploaded documents, with sources and a trace."""

    # Earlier turns as plain dictionaries for the rewriter
    history = [turn.model_dump() for turn in request.history]

    # Run the RAG query pipeline
    result = answer_question(request.question, history=history)

    # Convert the service result into the response schema
    return QueryResponse(
        answer=result.answer,
        sources=[SourceResponse(**asdict(source)) for source in result.sources],
        usage=UsageResponse(**asdict(result.usage)),
        trace=TraceResponse(**asdict(result.trace)),
    )
