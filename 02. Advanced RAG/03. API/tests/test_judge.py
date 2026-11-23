"""
Tests for the LLM judge and POST /evals/answer.

The judge's parsing is tested with fixed JSON replies (scores snapped to
the five levels, context precision computed from relevant chunks, bad
replies handled). The request is tested with a fake chat client, and the
endpoint with the judge replaced by a stub.
"""

# Imports
from app.evals.judge import build_judge_messages, judge_answer, parse_judgement, snap
from app.evals.judge import Judgement, Metric
from fastapi.testclient import TestClient
from app.core.config import get_settings
from types import SimpleNamespace
from app.main import app
import json


# A typical judge reply
REPLY = {
    "faithfulness": {"score": 0.9, "reason": "All claims are supported."},
    "answer_relevance": {"score": 1, "reason": "Answers the question."},
    "relevant_chunks": [1, 3, 7],
    "correctness": {"score": 0.6, "reason": "Misses one fact."},
}


def test_snap_rounds_to_levels():
    """Scores are clamped and rounded to 0, 0.25, 0.5, 0.75 or 1."""

    # Rounding, clamping and bad values
    assert snap(0.9) == 1.0
    assert snap(0.6) == 0.5
    assert snap(1.7) == 1.0
    assert snap("bad") == 0.0


def test_parse_judgement_computes_precision():
    """Context precision is relevant chunks over retrieved chunks; chunk 7 does not exist."""

    # Four chunks retrieved, with a reference answer
    judgement = parse_judgement(json.dumps(REPLY), chunk_count=4, has_reference=True)

    # Scores and computed precision
    assert judgement.faithfulness.score == 1.0
    assert judgement.relevant_chunks == [1, 3]
    assert judgement.context_precision.score == 0.5
    assert judgement.correctness.score == 0.5
    assert judgement.overall() == round((1.0 + 1.0 + 0.5 + 0.5) / 4, 3)


def test_parse_judgement_handles_bad_reply_and_no_reference():
    """An unreadable reply gives zero scores; no reference means no correctness."""

    # Not JSON
    judgement = parse_judgement("not json", chunk_count=0, has_reference=False)

    # Zero scores, no precision without chunks, no correctness
    assert judgement.faithfulness.score == 0.0
    assert judgement.context_precision.score is None
    assert judgement.correctness is None


def test_judge_messages_number_the_context():
    """Context chunks are numbered like the answer's citations and the reference is included."""

    # Build the messages
    messages = build_judge_messages("Q?", "A [1].", ["first", "second"], reference="R")

    # Numbered chunks and the reference in the user message
    assert "[1] first" in messages[1]["content"]
    assert "[2] second" in messages[1]["content"]
    assert "REFERENCE:\nR" in messages[1]["content"]


def test_judge_answer_uses_json_mode(monkeypatch):
    """The judge request uses JSON mode at temperature 0 and the configured deployment."""

    # Fake chat client that returns the typical reply
    monkeypatch.setattr(get_settings(), "azure_openai_deployment_name", "chat-test")
    requests = []

    def create(**kwargs):
        requests.append(kwargs)
        message = SimpleNamespace(content=json.dumps(REPLY))
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))

    # Grade one answer
    judgement = judge_answer("Q?", "A [1].", ["c1", "c2", "c3", "c4"], client=client)

    # Request settings and parsed result (no reference, so no correctness)
    assert requests[0]["response_format"] == {"type": "json_object"}
    assert requests[0]["temperature"] == 0
    assert requests[0]["model"] == "chat-test"
    assert judgement.correctness is None


def test_evals_answer_endpoint(monkeypatch):
    """The endpoint returns every metric, the overall score and usage."""

    # Replace the judge with a fixed judgement
    judgement = Judgement(
        faithfulness=Metric(1.0, "ok"),
        answer_relevance=Metric(0.75, "mostly"),
        context_precision=Metric(0.5, "2 of 4"),
        correctness=None,
        relevant_chunks=[1, 2],
    )
    monkeypatch.setattr("app.api.routes.evals.judge_answer", lambda *args: judgement)

    # Call the endpoint
    body = TestClient(app).post("/evals/answer", json={"question": "Q?", "answer": "A", "contexts": ["a", "b", "c", "d"]}).json()

    # Metrics, overall and usage
    assert body["faithfulness"]["score"] == 1.0
    assert body["correctness"] is None
    assert body["overall"] == 0.75
    assert body["usage"]["cost_usd"] == 0.0
