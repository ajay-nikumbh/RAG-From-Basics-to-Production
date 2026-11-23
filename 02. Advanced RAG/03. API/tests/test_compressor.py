"""
Tests for the context compressor.

These tests use a fake chat client instead of Azure OpenAI. They check the
sentence splitting and numbering, that only the selected original sentences
are kept in order, that a chunk with no kept sentence is removed, and that
switching compression off, a failed call, a bad reply or an empty selection
keeps the chunks unchanged.
"""

# Imports
from app.compression.prompts import build_compression_messages, split_sentences
from app.compression.compressor import compress_chunks
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


def chunks() -> list[Document]:
    """Two chunks of three sentences each."""

    # A policy chunk and an unrelated chunk
    return [
        Document("Leave policy. Employees get 8 sick days. Unused days expire.", {"source": "hr.md"}),
        Document("Laptops are replaced every 3 years. Ask IT. Thanks.", {"source": "it.md"}),
    ]


@pytest.fixture(autouse=True)
def compression_settings(monkeypatch):
    """Compression on and a deployment name for every test."""

    # Settings used by the compressor
    settings = get_settings()
    monkeypatch.setattr(settings, "compression_enabled", True)
    monkeypatch.setattr(settings, "azure_openai_deployment_name", "chat-test")


def test_split_sentences():
    """Sentences split at end punctuation and line breaks."""

    # Three sentences, one after a line break
    assert split_sentences("One. Two?\nThree") == ["One.", "Two?", "Three"]

    # Abbreviations in papers do not end a sentence
    text = "As shown by Asai et al. in Fig. 2, it works, e.g. on QA. Next one."
    assert split_sentences(text) == ["As shown by Asai et al. in Fig. 2, it works, e.g. on QA.", "Next one."]


def test_prompt_numbers_sentences():
    """Each sentence is shown as (chunk.sentence) under its chunk label."""

    # Build the messages
    user = build_compression_messages("How many sick days?", chunks())[1]["content"]

    # Question first, numbered sentences
    assert user.startswith("QUESTION: How many sick days?")
    assert "[1] (hr.md)\n(1.1) Leave policy.\n(1.2) Employees get 8 sick days." in user
    assert "(2.3) Thanks." in user


def test_keeps_selected_sentences_and_removes_empty_chunks():
    """Only the chosen sentences remain, in order; the chunk with none is removed."""

    # Model keeps sentences 1 and 2 of chunk 1, nothing of chunk 2
    completions = FakeCompletions('{"keep": {"1": [2, 1], "2": []}}')
    outcome = compress_chunks("How many sick days?", chunks(), client=fake_client(completions))

    # Original sentences in original order, metadata kept
    assert outcome.compressed and outcome.reason == "compressed"
    assert [chunk.text for chunk in outcome.chunks] == ["Leave policy. Employees get 8 sick days."]
    assert outcome.chunks[0].metadata == {"source": "hr.md"}
    assert outcome.kept_indexes == [0]
    assert outcome.chars_after < outcome.chars_before

    # The request asks for JSON with the configured token limit
    assert completions.request["response_format"] == {"type": "json_object"}
    assert completions.request["max_tokens"] == get_settings().compression_max_tokens


def test_disabled_keeps_chunks(monkeypatch):
    """With compression off, no call is made and the chunks are unchanged."""

    # Switch compression off
    monkeypatch.setattr(get_settings(), "compression_enabled", False)
    completions = FakeCompletions("{}")
    outcome = compress_chunks("q", chunks(), client=fake_client(completions))

    # Unchanged, no call
    assert outcome.chunks == chunks() and outcome.kept_indexes == [0, 1]
    assert outcome.reason == "compression disabled" and completions.request is None


def test_failures_keep_chunks():
    """A failed call, a bad reply or an empty selection keeps the chunks unchanged."""

    # API error
    outcome = compress_chunks("q", chunks(), client=fake_client(FakeCompletions(error=TimeoutError("slow"))))
    assert outcome.reason == "compression call failed: TimeoutError" and outcome.chunks == chunks()

    # Not JSON
    outcome = compress_chunks("q", chunks(), client=fake_client(FakeCompletions("sentence 2")))
    assert outcome.reason == "reply was not valid JSON" and outcome.chunks == chunks()

    # Nothing selected at all
    outcome = compress_chunks("q", chunks(), client=fake_client(FakeCompletions('{"keep": {"1": [], "2": []}}')))
    assert outcome.reason == "no sentence selected, kept original chunks" and outcome.chunks == chunks()
