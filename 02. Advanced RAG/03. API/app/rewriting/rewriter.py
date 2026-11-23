"""
Query rewriter.

This file turns the user question into a standalone question and a search
query before retrieval. It first decides whether the rewrite call is needed:
it is skipped when rewriting is switched off, and when the question is long
and clear and does not lean on earlier turns. Otherwise it makes one
gpt-4o-mini call that condenses and rewrites together, using the last few
chat turns. If the call fails or the reply is not valid JSON, the original
question is used, so a rewrite problem never stops the answer.
"""

# Imports
from app.rewriting.prompts import build_rewrite_messages
from app.core.azure_client import get_azure_client
from app.services.usage import add_chat_tokens
from app.core.config import get_settings
from dataclasses import dataclass
import json
import re


# A first question with at least this many words is treated as clear enough to search with
MIN_CLEAR_WORDS = 8

# Words that show a question depends on earlier turns
FOLLOW_UP_WORDS = {"it", "its", "they", "them", "their", "this", "these", "those", "he", "she", "his", "her"}

# Openings that show a follow-up question
FOLLOW_UP_STARTS = ("and ", "also ", "what about", "how about", "and what", "same for", "why not")


@dataclass
class RewriteResult:
    """The question at each step of rewriting, and why the call ran or was skipped."""

    # The question exactly as the user typed it
    original_question: str

    # The question made understandable without the chat history (used to answer)
    standalone_question: str

    # The query used to search the index
    search_query: str

    # True when the model was called, False when the step was skipped or failed
    rewritten: bool

    # Short reason, for logs and the trace
    reason: str


def is_follow_up(question: str) -> bool:
    """True when the question uses pronouns or openings that point to earlier turns."""

    # Lower-case words without punctuation
    text = question.lower().strip()
    words = set(re.findall(r"[a-z']+", text))

    # Pronoun or follow-up opening
    return bool(words & FOLLOW_UP_WORDS) or text.startswith(FOLLOW_UP_STARTS)


def skip_reason(question: str, history: list[dict]) -> str | None:
    """Return why the rewrite call can be skipped, or None when it is needed."""

    # Switched off in settings
    if not get_settings().rewrite_enabled:
        return "rewriting disabled"

    # Long, clear question that does not lean on earlier turns
    long_enough = len(question.split()) >= MIN_CLEAR_WORDS
    if long_enough and not history:
        return "clear first question"
    if long_enough and not is_follow_up(question):
        return "clear standalone question"

    # Short or follow-up questions are rewritten
    return None


def unchanged(question: str, reason: str) -> RewriteResult:
    """Result that keeps the original question for both answering and searching."""

    # No rewrite: the same text is used everywhere
    return RewriteResult(question, question, question, rewritten=False, reason=reason)


def rewrite_query(question: str, history: list[dict] | None = None, client=None) -> RewriteResult:
    """Condense and rewrite the question with one model call, or skip when not needed."""

    # Only the last few turns are sent to the model
    settings = get_settings()
    turns = settings.rewrite_history_turns
    history = (history or [])[-turns:] if turns > 0 else []

    # Skip the call when it is not needed
    reason = skip_reason(question, history)
    if reason:
        return unchanged(question, reason)

    # One chat completion that must return JSON
    try:
        client = client or get_azure_client()
        response = client.chat.completions.create(
            model=settings.azure_openai_deployment_name,
            messages=build_rewrite_messages(question, history),
            temperature=0.0,
            max_tokens=settings.rewrite_max_tokens,
            response_format={"type": "json_object"},
        )
    except Exception as error:
        return unchanged(question, f"rewrite call failed: {type(error).__name__}")

    # Count the tokens of this call in the running query
    if getattr(response, "usage", None):
        add_chat_tokens(response.usage.prompt_tokens, response.usage.completion_tokens)

    # Read the two strings from the JSON reply
    try:
        reply = json.loads(response.choices[0].message.content or "")
        standalone = str(reply.get("standalone_question", "")).strip()
        search_query = str(reply.get("search_query", "")).strip()
    except (json.JSONDecodeError, AttributeError):
        return unchanged(question, "reply was not valid JSON")

    # Fall back to the original text for any empty field
    standalone = standalone or question
    search_query = search_query or standalone
    return RewriteResult(question, standalone, search_query, rewritten=True, reason="rewritten")
