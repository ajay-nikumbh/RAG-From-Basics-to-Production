"""
Tests for the reranker.

These tests use a fake chat client instead of Azure OpenAI. They check that
the JSON scores reorder the candidates, that ties keep the retrieval order,
that scores are clamped, and that switching reranking off, a failed call, a
bad reply or a wrong number of scores keeps the retrieval order.
"""

# Imports
from app.reranking.reranker import read_scores, rerank
from app.reranking.prompts import build_rerank_messages
from app.vectorstore.faiss_store import SearchResult
from app.ingestion.document import Document
from app.core.config import get_settings
from types import SimpleNamespace
import pytest


class FakeCompletions:
    """Stands in for client.chat.completions, returns a fixed reply and records the request."""

    def __init__(self, reply: str = "", error: Exception | None = None):
        """Remember the reply text, or the error to raise."""

        # What the fake model returns or raises
        self.reply, self.error = reply, error

        # Arguments of the last request, None until called
        self.request = None

    def create(self, **kwargs):
        """Record the request, then raise or return a response shaped like the real one."""

        # Keep the arguments for the test to inspect
        self.request = kwargs

        # Simulate a failed call
        if self.error:
            raise self.error

        # One choice with one message
        message = SimpleNamespace(content=self.reply)
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])


def fake_client(completions: FakeCompletions):
    """Wrap the fake completions in a client-shaped object."""

    # Same attribute path as the real client
    return SimpleNamespace(chat=SimpleNamespace(completions=completions))


def candidates() -> list[SearchResult]:
    """Three candidates in retrieval order, most similar first."""

    # Texts and similarity scores
    texts = [("results table", 0.61), ("answer chunk", 0.59), ("other paper", 0.55)]

    # One SearchResult per text, on pages 1 to 3 of the same file
    results = []
    for page, (text, score) in enumerate(texts, start=1):
        document = Document(text=text, metadata={"source": "a.pdf", "page": page})
        results.append(SearchResult(document, score))
    return results


@pytest.fixture(autouse=True)
def rerank_settings(monkeypatch):
    """Reranking on and a deployment name for every test."""

    # Settings used by the reranker
    settings = get_settings()
    monkeypatch.setattr(settings, "rerank_enabled", True)
    monkeypatch.setattr(settings, "azure_openai_deployment_name", "chat-test")


def test_scores_reorder_candidates():
    """The highest scored chunk moves to the top and keeps its retrieval rank."""

    # Model rates the second candidate highest
    completions = FakeCompletions('{"scores": [3, 9, 0]}')
    outcome = rerank("How does Self-RAG work?", candidates(), client=fake_client(completions))

    # New order and preserved retrieval ranks
    assert outcome.reranked and outcome.reason == "reranked"
    assert [chunk.result.document.text for chunk in outcome.chunks] == ["answer chunk", "results table", "other paper"]
    assert [chunk.retrieval_rank for chunk in outcome.chunks] == [2, 1, 3]
    assert [chunk.rerank_score for chunk in outcome.chunks] == [9.0, 3.0, 0.0]

    # The request asks for JSON with the configured token limit
    assert completions.request["response_format"] == {"type": "json_object"}
    assert completions.request["max_tokens"] == get_settings().rerank_max_tokens


def test_ties_keep_retrieval_order():
    """Equal scores keep the better retrieval rank first."""

    # All candidates get the same score
    completions = FakeCompletions('{"scores": [5, 5, 5]}')
    outcome = rerank("q", candidates(), client=fake_client(completions))

    # Order unchanged
    assert [chunk.retrieval_rank for chunk in outcome.chunks] == [1, 2, 3]


def test_scores_are_clamped():
    """Scores outside 0 to 10 are moved to the nearest end of the scale."""

    # 14 and -2 are outside the rubric
    assert read_scores('{"scores": [14, -2, 7]}', 3) == [10.0, 0.0, 7.0]


def test_wrong_score_count_keeps_retrieval_order():
    """A list with too few scores cannot be matched and keeps the retrieval order."""

    # Two scores for three candidates
    assert read_scores('{"scores": [9, 1]}', 3) is None
    outcome = rerank("q", candidates(), client=fake_client(FakeCompletions('{"scores": [9, 1]}')))

    # Retrieval order, reason recorded
    assert not outcome.reranked and outcome.reason == "score count did not match candidates"
    assert [chunk.retrieval_rank for chunk in outcome.chunks] == [1, 2, 3]


def test_disabled_keeps_retrieval_order(monkeypatch):
    """With reranking off, no call is made and the order is unchanged."""

    # Switch reranking off
    monkeypatch.setattr(get_settings(), "rerank_enabled", False)
    completions = FakeCompletions("{}")
    outcome = rerank("q", candidates(), client=fake_client(completions))

    # Retrieval order, no scores, no call
    assert not outcome.reranked and outcome.reason == "reranking disabled"
    assert [chunk.rerank_score for chunk in outcome.chunks] == [None, None, None]
    assert completions.request is None


def test_failed_call_keeps_retrieval_order():
    """An API error keeps the candidates instead of failing the query."""

    # Model call raises
    outcome = rerank("q", candidates(), client=fake_client(FakeCompletions(error=TimeoutError("slow"))))

    # Retrieval order with the error type as reason
    assert [chunk.retrieval_rank for chunk in outcome.chunks] == [1, 2, 3]
    assert outcome.reason == "rerank call failed: TimeoutError"


def test_bad_or_empty_reply_keeps_retrieval_order():
    """Plain text or a reply without scores keeps the retrieval order."""

    # Not JSON
    outcome = rerank("q", candidates(), client=fake_client(FakeCompletions("passage 2 is best")))
    assert outcome.reason == "reply was not valid JSON"

    # Scores that are not numbers
    outcome = rerank("q", candidates(), client=fake_client(FakeCompletions('{"scores": ["high", "low", "low"]}')))
    assert outcome.reason == "reply was not valid JSON"
    assert [chunk.retrieval_rank for chunk in outcome.chunks] == [1, 2, 3]


def test_no_candidates():
    """An empty candidate list returns an empty outcome without a call."""

    # Nothing retrieved
    outcome = rerank("q", [], client=fake_client(FakeCompletions("{}")))

    # Empty result
    assert outcome.chunks == [] and outcome.reason == "no candidates"


def test_prompt_numbers_passages_with_sources():
    """Every candidate appears numbered with its source label after the question."""

    # Build the messages
    messages = build_rerank_messages("How does Self-RAG work?", candidates())
    user = messages[1]["content"]

    # Question first, then numbered passages with page labels
    assert user.startswith("QUESTION: How does Self-RAG work?")
    assert "[1] (a.pdf, page 1)\nresults table" in user
    assert "[3] (a.pdf, page 3)\nother paper" in user
