"""
Tests for POST /query.

These tests call the real FastAPI app through TestClient with the RAG service
replaced by a fake, so they run offline. They check a successful answer with
sources, usage and trace, that the chat history reaches the service, and the
automatic 422 responses for invalid input.
"""

# Imports
from app.services.rag_service import RagAnswer, Source, Trace, TraceCandidate, Usage
from fastapi.testclient import TestClient
from app.api.routes import query
from app.main import app


# One client for all tests
client = TestClient(app)


def test_query_returns_answer_sources_and_trace(monkeypatch):
    """A follow-up question returns the answer, its sources, usage and trace."""

    # Fake RAG service that records the arguments
    received = {}

    def fake_answer_question(question, history=None):
        received.update(question=question, history=history)
        source = Source(number=1, label="hr.pdf, page 4", score=0.81, text="Employees get 8 sick days.", source="hr.pdf", page=4, rerank_score=10.0, retrieval_rank=1)
        candidate = TraceCandidate(1, 1, "hr.pdf, page 4", "hr.pdf", 4, 0.81, 10.0, kept=True, citation=1)
        trace = Trace(
            original_question="and interns?",
            standalone_question="How many sick days do interns get?",
            search_query="intern sick days",
            rewritten=True,
            rewrite_reason="rewritten",
            reranked=True,
            rerank_reason="reranked",
            selection_reason="above threshold",
            candidates=[candidate],
            timings_ms={"rewrite": 900, "retrieve": 300, "rerank": 950, "compress": 0, "generate": 1200},
        )
        usage = Usage(embedding_tokens=7, prompt_tokens=3000, completion_tokens=80, cost_usd=0.0005, cost_inr=0.042, latency_ms=3400)
        return RagAnswer(answer="Interns get 8 sick days [1].", sources=[source], usage=usage, trace=trace)

    monkeypatch.setattr(query, "answer_question", fake_answer_question)

    # Ask a follow-up with one earlier turn
    history = [{"question": "How many sick days do employees get?", "answer": "8 days [1]."}]
    response = client.post("/query", json={"question": "and interns?", "history": history})

    # History passed through, answer, source scores and trace in the response
    assert response.status_code == 200
    assert received == {"question": "and interns?", "history": history}
    body = response.json()
    assert body["answer"] == "Interns get 8 sick days [1]."
    assert body["sources"][0]["rerank_score"] == 10.0
    assert body["trace"]["standalone_question"] == "How many sick days do interns get?"
    assert body["trace"]["candidates"][0]["kept"] is True
    assert body["trace"]["timings_ms"]["rerank"] == 950
    assert body["usage"]["cost_inr"] == 0.042


def test_query_rejects_empty_question():
    """An empty question gives 422."""

    # Empty string fails min_length
    assert client.post("/query", json={"question": ""}).status_code == 422


def test_query_rejects_too_many_turns():
    """More than 20 history turns gives 422."""

    # 21 turns fails max_length
    history = [{"question": "q", "answer": "a"}] * 21
    assert client.post("/query", json={"question": "Hi", "history": history}).status_code == 422
