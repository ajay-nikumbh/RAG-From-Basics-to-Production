"""
Tests for POST /query.

These tests call the real FastAPI app through TestClient with the RAG service
replaced by a fake, so they run offline. They check a successful answer with
sources and the automatic 422 responses for invalid input.
"""

# Imports
from app.services.rag_service import RagAnswer, Source, Usage
from fastapi.testclient import TestClient
from app.api.routes import query
from app.main import app


# One client for all tests
client = TestClient(app)


def test_query_returns_answer_and_sources(monkeypatch):
    """A question returns the answer and its numbered sources."""

    # Fake RAG service that records the arguments
    received = {}

    def fake_answer_question(question, top_k=None):
        received.update(question=question, top_k=top_k)
        return RagAnswer(
            answer="You get 8 sick days [1].",
            sources=[Source(number=1, label="hr.pdf, page 4", score=0.81, text="Employees get 8 sick days.", source="hr.pdf", page=4)],
            usage=Usage(embedding_tokens=7, prompt_tokens=300, completion_tokens=20, cost_usd=0.0001, latency_ms=900),
        )

    monkeypatch.setattr(query, "answer_question", fake_answer_question)

    # Ask with a custom top_k
    response = client.post("/query", json={"question": "How many sick days?", "top_k": 2})

    # Answer and sources in the response, arguments passed through
    assert response.status_code == 200
    assert response.json() == {
        "answer": "You get 8 sick days [1].",
        "sources": [{"number": 1, "label": "hr.pdf, page 4", "score": 0.81, "text": "Employees get 8 sick days.", "source": "hr.pdf", "page": 4}],
        "usage": {"embedding_tokens": 7, "prompt_tokens": 300, "completion_tokens": 20, "cost_usd": 0.0001, "latency_ms": 900},
    }
    assert received == {"question": "How many sick days?", "top_k": 2}


def test_query_rejects_empty_question():
    """An empty question gives 422."""

    # Empty string fails min_length
    assert client.post("/query", json={"question": ""}).status_code == 422


def test_query_rejects_top_k_out_of_range():
    """top_k above 20 gives 422."""

    # 50 fails le=20
    assert client.post("/query", json={"question": "Hi", "top_k": 50}).status_code == 422
