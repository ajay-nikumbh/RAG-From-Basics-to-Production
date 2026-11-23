"""
Tests for the RAG service.

These tests replace every model call (rewrite, embedding, rerank, answer)
with fakes, so they run offline. They check that the stages run in order
with the right inputs, that only the kept chunks become numbered sources,
that the trace records every candidate, and that the chat model is not
called when no chunk is kept.
"""

# Imports
from app.reranking.reranker import RankedChunk, RerankOutcome
from app.compression.compressor import CompressionOutcome
from app.vectorstore.faiss_store import SearchResult
from app.generation.prompts import NOT_FOUND_ANSWER
from app.rewriting.rewriter import RewriteResult
from app.ingestion.document import Document
from app.core.config import get_settings
from app.services import rag_service
import pytest


def candidates() -> list[SearchResult]:
    """Three candidates in retrieval order: a results table, the answer chunk, an HR chunk."""

    # Two paper chunks and one unrelated chunk
    return [
        SearchResult(Document("Table 2: results of Self-RAG", {"source": "selfrag.pdf", "page": 8}), 0.62),
        SearchResult(Document("Self-RAG uses reflection tokens", {"source": "selfrag.pdf", "page": 3}), 0.60),
        SearchResult(Document("Employees get 8 sick days", {"source": "hr_policy.md"}), 0.20),
    ]


@pytest.fixture
def fakes(monkeypatch):
    """Fake rewrite, retrieval and rerank; record what each stage received."""

    # Threshold settings for the selector
    settings = get_settings()
    monkeypatch.setattr(settings, "rerank_threshold", 6.0)
    monkeypatch.setattr(settings, "rerank_min_best_score", 2.0)
    monkeypatch.setattr(settings, "min_chunks", 1)
    monkeypatch.setattr(settings, "max_chunks", 5)
    received = {}

    # Rewriter resolves "it" into Self-RAG
    def fake_rewrite(question, history):
        received["rewrite"] = (question, history)
        return RewriteResult(question, "How does Self-RAG work?", "Self-RAG reflection tokens", rewritten=True, reason="rewritten")

    # Retrieval returns the three candidates
    def fake_retrieve(search_query):
        received["search_query"] = search_query
        return candidates()

    # Reranker puts the answer chunk first and the HR chunk last
    def fake_rerank(question, results):
        received["rerank_question"] = question
        chunks = [RankedChunk(results[1], 2, 9.0), RankedChunk(results[0], 1, 3.0), RankedChunk(results[2], 3, 0.0)]
        return RerankOutcome(chunks, reranked=True, reason="reranked")

    monkeypatch.setattr(rag_service, "rewrite_query", fake_rewrite)
    monkeypatch.setattr(rag_service, "retrieve_candidates", fake_retrieve)
    monkeypatch.setattr(rag_service, "rerank", fake_rerank)
    return received


def test_stages_run_in_order_and_only_kept_chunks_are_sources(fakes, monkeypatch):
    """Search uses the rewrite, rerank and answer use the standalone question, one chunk is kept."""

    # Fake generation that records its messages
    def fake_generate(messages):
        fakes["messages"] = messages
        return "Self-RAG uses reflection tokens [1]."

    monkeypatch.setattr(rag_service, "generate_answer", fake_generate)

    # Ask a follow-up with one earlier turn
    history = [{"question": "What is Self-RAG?", "answer": "A RAG method [1]."}]
    result = rag_service.answer_question("how does it work?", history=history)

    # Each stage got the right input
    assert fakes["rewrite"] == ("how does it work?", history)
    assert fakes["search_query"] == "Self-RAG reflection tokens"
    assert fakes["rerank_question"] == "How does Self-RAG work?"
    assert fakes["messages"][1]["content"].endswith("QUESTION: How does Self-RAG work?")

    # Only the chunk scoring 9 passes the threshold of 6
    assert result.answer == "Self-RAG uses reflection tokens [1]."
    assert [(s.number, s.label, s.rerank_score, s.retrieval_rank) for s in result.sources] == [(1, "selfrag.pdf, page 3", 9.0, 2)]


def test_trace_records_every_candidate(fakes, monkeypatch):
    """The trace holds the questions, reasons, all candidates and stage times."""

    # Any answer
    monkeypatch.setattr(rag_service, "generate_answer", lambda messages: "ok [1]")
    trace = rag_service.answer_question("how does it work?").trace

    # Questions and reasons
    assert trace.original_question == "how does it work?"
    assert trace.search_query == "Self-RAG reflection tokens"
    assert trace.rewritten and trace.reranked
    assert trace.selection_reason == "above threshold"

    # Every candidate in final order, with kept flags and citations
    assert [(c.final_rank, c.retrieval_rank, c.rerank_score, c.kept, c.citation) for c in trace.candidates] == [
        (1, 2, 9.0, True, 1),
        (2, 1, 3.0, False, None),
        (3, 3, 0.0, False, None),
    ]

    # A time for every stage
    assert set(trace.timings_ms) == {"rewrite", "retrieve", "rerank", "compress", "generate"}

    # Compression is off by default, so the context is unchanged
    assert not trace.compressed and trace.compression_reason == "compression disabled"
    assert trace.context_chars_before == trace.context_chars_after


def test_nothing_relevant_skips_llm(fakes, monkeypatch):
    """When every candidate scores below the floor, the not-found answer is returned without a chat call."""

    # Reranker scores everything 0
    def zero_rerank(question, results):
        chunks = [RankedChunk(result, rank, 0.0) for rank, result in enumerate(results, start=1)]
        return RerankOutcome(chunks, reranked=True, reason="reranked")

    monkeypatch.setattr(rag_service, "rerank", zero_rerank)

    # Fail the test if the chat model is called
    def must_not_be_called(messages):
        raise AssertionError("generate_answer should not be called")

    monkeypatch.setattr(rag_service, "generate_answer", must_not_be_called)

    # Ask an out-of-scope question
    result = rag_service.answer_question("Who won the World Cup?")

    # Fixed answer, no sources, all candidates dropped
    assert result.answer == NOT_FOUND_ANSWER
    assert result.sources == []
    assert result.trace.selection_reason == "nothing relevant"
    assert not any(c.kept for c in result.trace.candidates)


def test_empty_index_skips_llm(fakes, monkeypatch):
    """No candidates gives the not-found answer without a chat call."""

    # Nothing retrieved, and the real reranker handles the empty list
    monkeypatch.setattr(rag_service, "retrieve_candidates", lambda search_query: [])
    monkeypatch.setattr(rag_service, "rerank", lambda question, results: RerankOutcome(reason="no candidates"))
    monkeypatch.setattr(rag_service, "generate_answer", lambda messages: pytest.fail("generate_answer should not be called"))

    # Ask anything
    result = rag_service.answer_question("Anything?")

    # Fixed answer and reason
    assert result.answer == NOT_FOUND_ANSWER
    assert result.trace.selection_reason == "no candidates"


def test_compression_shortens_sources_and_renumbers(fakes, monkeypatch):
    """With compression on, sources hold the compressed text and dropped chunks are not cited."""

    # Keep two chunks above the threshold
    def two_kept_rerank(question, results):
        chunks = [RankedChunk(results[1], 2, 9.0), RankedChunk(results[0], 1, 7.0), RankedChunk(results[2], 3, 0.0)]
        return RerankOutcome(chunks, reranked=True, reason="reranked")

    # Compressor drops the first kept chunk and shortens the second
    def fake_compress(question, documents):
        shorter = Document("Table 2", documents[1].metadata)
        return CompressionOutcome([shorter], [1], True, "compressed", 60, 7)

    monkeypatch.setattr(rag_service, "rerank", two_kept_rerank)
    monkeypatch.setattr(rag_service, "compress_chunks", fake_compress)
    monkeypatch.setattr(rag_service, "generate_answer", lambda messages: "See [1].")

    # Ask the question
    result = rag_service.answer_question("how does it work?")

    # One source with the compressed text, from the second kept chunk
    assert [(s.number, s.text, s.retrieval_rank) for s in result.sources] == [(1, "Table 2", 1)]
    assert result.trace.compressed and result.trace.context_chars_after == 7

    # The first kept chunk is marked as not sent
    assert [(c.retrieval_rank, c.kept, c.citation) for c in result.trace.candidates] == [(2, False, None), (1, True, 1), (3, False, None)]
