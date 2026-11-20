"""
Query route.

This file defines POST /query. It receives a question, runs the RAG service
(retrieve, build prompt, generate) and returns the answer with its sources.
Input validation (empty question, top_k out of range) is done by the
QueryRequest schema, so invalid requests get a 422 response automatically.
"""

# Imports
from app.schemas.query import QueryRequest, QueryResponse, SourceResponse
from app.services.rag_service import answer_question
from fastapi import APIRouter


# Router for query endpoints, shown under the "Query" group in the API docs
router = APIRouter(tags=["Query"])


@router.post("/query", response_model=QueryResponse)
def query(request: QueryRequest) -> QueryResponse:
    """Answer a question from the uploaded documents, with sources."""

    # Run the Naive RAG query pipeline
    result = answer_question(request.question, top_k=request.top_k)

    # Convert the service result into the response schema
    return QueryResponse(
        answer=result.answer,
        sources=[
            SourceResponse(
                number=source.number,
                label=source.label,
                score=source.score,
                text=source.text,
            )
            for source in result.sources
        ],
    )
