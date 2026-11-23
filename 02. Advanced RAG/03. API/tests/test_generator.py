"""
Tests for the answer generator.

These tests use a fake chat client instead of Azure OpenAI. They check that
the request uses the configured deployment, temperature and token limit, that
the messages are passed through unchanged, and that the answer is trimmed.
"""

# Imports
from app.generation.generator import generate_answer
from app.core.config import get_settings
from types import SimpleNamespace


class FakeCompletions:
    """Stands in for client.chat.completions and records the request."""

    def __init__(self, answer: str):
        """Remember the answer to return."""

        # Text the fake model replies with
        self.answer = answer

        # Arguments of the last request
        self.request = None

    def create(self, **kwargs):
        """Record the request and return a response shaped like the real one."""

        # Keep the arguments for the test to inspect
        self.request = kwargs

        # One choice with one message
        message = SimpleNamespace(content=self.answer)
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])


def test_generate_answer_sends_settings_and_trims(monkeypatch):
    """The request uses settings values and the reply is stripped."""

    # Make sure a deployment name is set for the test
    monkeypatch.setattr(get_settings(), "azure_openai_deployment_name", "chat-test")

    # Fake client that answers with extra spaces
    completions = FakeCompletions("  You get 8 sick days [1].  ")
    client = SimpleNamespace(chat=SimpleNamespace(completions=completions))
    messages = [{"role": "user", "content": "How many sick days?"}]

    # Generate the answer
    answer = generate_answer(messages, client=client)

    # Answer trimmed, request built from settings
    assert answer == "You get 8 sick days [1]."
    assert completions.request["model"] == "chat-test"
    assert completions.request["messages"] == messages
    assert completions.request["temperature"] == get_settings().llm_temperature
    assert completions.request["max_tokens"] == get_settings().llm_max_tokens
