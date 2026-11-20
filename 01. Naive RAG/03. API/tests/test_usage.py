"""
Tests for usage and cost tracking.

These tests run fake pipeline runs inside track_usage, add token counts the
way the embedder and generator do, and check the saved events, the cost
calculation and the analytics summary.
"""

# Imports
from app.services.usage import add_chat_tokens, add_embedding_tokens, read_events, summarize, track_usage
from app.core.config import get_settings


def test_track_usage_saves_one_event_with_cost():
    """Tokens added during a run are saved with the right cost."""

    # One query: 10 embedding tokens, 1000 prompt tokens, 100 answer tokens
    with track_usage("query", question="How many sick days?") as meter:
        add_embedding_tokens(10)
        add_chat_tokens(1000, 100)
        meter.details["sources"] = 4

    # One event with tokens, cost and context
    event = read_events()[0]
    settings = get_settings()
    expected = (10 * settings.price_embedding_per_million + 1000 * settings.price_chat_input_per_million + 100 * settings.price_chat_output_per_million) / 1_000_000
    assert event["kind"] == "query"
    assert event["total_tokens"] == 1110
    assert event["cost_usd"] == round(expected, 8)
    assert event["question"] == "How many sick days?"
    assert event["sources"] == 4


def test_tokens_outside_a_run_are_ignored_and_failed_runs_not_saved():
    """Calls outside a run do nothing; a run that raises saves no event."""

    # Outside a run
    add_embedding_tokens(50)

    # A run that fails
    try:
        with track_usage("ingest", file="bad.pdf"):
            add_embedding_tokens(5)
            raise ValueError("boom")
    except ValueError:
        pass

    # Nothing saved
    assert read_events() == []


def test_summarize_totals_and_daily():
    """Two runs give correct totals, one daily point and newest-first recent list."""

    # An ingestion and a query
    with track_usage("ingest", file="a.pdf"):
        add_embedding_tokens(2000)
    with track_usage("query", question="Q"):
        add_embedding_tokens(10)
        add_chat_tokens(500, 50)

    # Summary
    summary = summarize(read_events())
    assert summary["totals"]["queries"] == 1
    assert summary["totals"]["ingestions"] == 1
    assert summary["totals"]["total_tokens"] == 2560
    assert len(summary["daily"]) == 1
    assert summary["recent"][0]["kind"] == "query"
