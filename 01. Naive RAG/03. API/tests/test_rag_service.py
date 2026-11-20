"""
Tests for the RAG service.

These tests replace retrieval and generation with fakes, so they run offline.
They check that sources are numbered like the context blocks, that the chat
model receives the built messages, and that an empty index returns the
not-found answer without calling the chat model.
"""

# Imports
from app.vectorstore.faiss_store import SearchResult
from app.generation.prompts import NOT_FOUND_ANSWER
from app.ingestion.document import Document
from app.services import rag_service


def test_answer_question_returns_answer_and_sources(monkeypatch):
    """Two retrieved chunks become sources [1] and [2] next to the answer."""

    # Fake retrieval with two chunks
    results = [
        SearchResult(Document("Employees get 8 sick days.", {"source": "hr.pdf", "page": 4}), 0.81234),
        SearchResult(Document("Name: Ravi, Leave days: 8", {"source": "leave.xlsx", "sheet": "Leave"}), 0.5),
    ]
    monkeypatch.setattr(rag_service, "retrieve", lambda question, top_k=None: results)

    # Fake generation that records the messages it received
    received = {}

    def fake_generate(messages):
        received["messages"] = messages
        return "You get 8 sick days [1]."

    monkeypatch.setattr(rag_service, "generate_answer", fake_generate)

    # Ask the question
    result = rag_service.answer_question("How many sick days?")

    # Answer and numbered sources
    assert result.answer == "You get 8 sick days [1]."
    assert [(s.number, s.label, s.score) for s in result.sources] == [
        (1, "hr.pdf, page 4", 0.8123),
        (2, "leave.xlsx, sheet Leave", 0.5),
    ]

    # The chat model saw the question in the user message
    assert received["messages"][1]["content"].endswith("QUESTION: How many sick days?")


def test_answer_question_with_empty_index_skips_llm(monkeypatch):
    """No retrieved chunks gives the not-found answer and no chat call."""

    # Nothing retrieved
    monkeypatch.setattr(rag_service, "retrieve", lambda question, top_k=None: [])

    # Fail the test if the chat model is called
    def must_not_be_called(messages):
        raise AssertionError("generate_answer should not be called")

    monkeypatch.setattr(rag_service, "generate_answer", must_not_be_called)

    # Fixed answer, no sources
    result = rag_service.answer_question("Anything?")
    assert result.answer == NOT_FOUND_ANSWER
    assert result.sources == []
