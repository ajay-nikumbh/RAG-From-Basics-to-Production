"""
Tests for the query rewriter.

These tests use a fake chat client instead of Azure OpenAI. They check when
the rewrite call is skipped, that the JSON reply becomes a standalone
question and a search query, that only the last turns are sent, and that a
failed call or a bad reply falls back to the original question.
"""

# Imports
from app.rewriting.rewriter import is_follow_up, rewrite_query
from app.rewriting.prompts import build_rewrite_messages
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


@pytest.fixture(autouse=True)
def rewrite_settings(monkeypatch):
    """Rewriting on, 3 history turns and a deployment name for every test."""

    # Settings used by the rewriter
    settings = get_settings()
    monkeypatch.setattr(settings, "rewrite_enabled", True)
    monkeypatch.setattr(settings, "rewrite_history_turns", 3)
    monkeypatch.setattr(settings, "azure_openai_deployment_name", "chat-test")


def test_follow_up_detection():
    """Pronouns and follow-up openings are detected, plain questions are not."""

    # Follow-ups
    assert is_follow_up("How many layers does it have?")
    assert is_follow_up("what about Self-RAG?")

    # Standalone
    assert not is_follow_up("How many sick days do employees get per year?")


def test_skips_when_disabled(monkeypatch):
    """With rewriting off, the model is never called."""

    # Switch rewriting off
    monkeypatch.setattr(get_settings(), "rewrite_enabled", False)
    completions = FakeCompletions("{}")

    # Rewrite a short question
    result = rewrite_query("sick leave?", client=fake_client(completions))

    # Original question kept, no call made
    assert result.search_query == "sick leave?"
    assert not result.rewritten and result.reason == "rewriting disabled"
    assert completions.request is None


def test_skips_clear_first_question():
    """A long first question is searched as it is."""

    # Long question, no history
    completions = FakeCompletions("{}")
    question = "How many days of sick leave do full time employees get each year?"
    result = rewrite_query(question, client=fake_client(completions))

    # No call, reason recorded
    assert result.standalone_question == question
    assert result.reason == "clear first question"
    assert completions.request is None


def test_rewrites_follow_up_with_history():
    """A follow-up is sent with the history and the JSON reply is used."""

    # Fake model reply
    reply = '{"standalone_question": "How many sick days do interns get?", "search_query": "intern sick leave days per year"}'
    completions = FakeCompletions(reply)
    history = [{"question": "How many sick days do employees get?", "answer": "8 days [1]."}]

    # Rewrite the follow-up
    result = rewrite_query("and interns?", history, client=fake_client(completions))

    # Both strings come from the reply
    assert result.rewritten and result.reason == "rewritten"
    assert result.original_question == "and interns?"
    assert result.standalone_question == "How many sick days do interns get?"
    assert result.search_query == "intern sick leave days per year"

    # The request asks for JSON and includes the history
    assert completions.request["response_format"] == {"type": "json_object"}
    assert completions.request["max_tokens"] == get_settings().rewrite_max_tokens
    assert "How many sick days do employees get?" in completions.request["messages"][1]["content"]


def test_only_last_turns_are_sent():
    """Older turns beyond rewrite_history_turns are dropped."""

    # Five turns, only the last three may be sent
    history = [{"question": f"question {n}", "answer": f"answer {n}"} for n in range(5)]
    completions = FakeCompletions('{"standalone_question": "q", "search_query": "q"}')
    rewrite_query("why?", history, client=fake_client(completions))

    # Turns 0 and 1 are not in the prompt, turns 2 to 4 are
    prompt = completions.request["messages"][1]["content"]
    assert "question 1" not in prompt
    assert "question 2" in prompt and "question 4" in prompt


def test_long_answers_are_shortened_in_prompt():
    """Earlier answers are cut to keep the rewrite prompt small."""

    # One turn with a very long answer
    messages = build_rewrite_messages("why?", [{"question": "q", "answer": "x" * 1000}])

    # The answer is shortened and marked
    assert "x" * 300 + "..." in messages[1]["content"]
    assert "x" * 301 not in messages[1]["content"]


def test_bad_json_falls_back_to_original():
    """A reply that is not JSON keeps the original question."""

    # Model replies with plain text
    completions = FakeCompletions("intern sick leave")
    result = rewrite_query("and interns?", [{"question": "q", "answer": "a"}], client=fake_client(completions))

    # Original kept, reason recorded
    assert result.search_query == "and interns?"
    assert not result.rewritten and result.reason == "reply was not valid JSON"


def test_failed_call_falls_back_to_original():
    """An API error keeps the original question instead of failing the query."""

    # Model call raises
    completions = FakeCompletions(error=TimeoutError("slow"))
    result = rewrite_query("and interns?", [{"question": "q", "answer": "a"}], client=fake_client(completions))

    # Original kept, error type recorded
    assert result.standalone_question == "and interns?"
    assert result.reason == "rewrite call failed: TimeoutError"


def test_empty_fields_fall_back():
    """Missing fields in the JSON fall back to the question or the standalone question."""

    # Only the standalone question is returned
    completions = FakeCompletions('{"standalone_question": "How many sick days do interns get?"}')
    result = rewrite_query("and interns?", [{"question": "q", "answer": "a"}], client=fake_client(completions))

    # Search query falls back to the standalone question
    assert result.search_query == "How many sick days do interns get?"
