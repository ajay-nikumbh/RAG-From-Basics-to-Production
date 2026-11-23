"""
Tests for the evaluation runner and the run endpoints.

The query pipeline and the judge are replaced by stubs, and the background
thread runs synchronously, so a whole run finishes inside the test. The
tests check one case result (retrieval hit, metrics, costs), the summary,
the saved report, the one-run-at-a-time rule and the endpoints.
"""

# Imports
from app.services.rag_service import RagAnswer, Source, Trace, TraceCandidate, Usage
from app.evals.judge import Judgement, Metric
from fastapi.testclient import TestClient
from app.core.config import get_settings
from app.evals import runner
from app.main import app
import pytest


class InlineThread:
    """Runs the target immediately instead of in a new thread."""

    def __init__(self, target, args, daemon):
        """Remember what to run."""

        # Function and its arguments
        self.target = target
        self.args = args

    def start(self):
        """Run the target now."""

        # Synchronous run
        self.target(*self.args)


@pytest.fixture
def stubbed(monkeypatch):
    """Replace the pipeline, the judge and the thread with fast stubs."""

    # Every question keeps one chunk from the RAG paper, out of two candidates
    def fake_answer(question, history=None, usage_kind="query"):
        seen.append(get_settings().rerank_enabled)
        source = Source(number=1, label="2005.11401_RAG-Lewis.pdf, page 2", score=0.6, text="RAG-Sequence and RAG-Token", source="2005.11401_RAG-Lewis.pdf", page=2, rerank_score=9.0, retrieval_rank=1)
        candidates = [
            TraceCandidate(1, 1, "2005.11401_RAG-Lewis.pdf, page 2", "2005.11401_RAG-Lewis.pdf", 2, 0.6, 9.0, kept=True, citation=1),
            TraceCandidate(2, 2, "hr_policy.md", "hr_policy.md", None, 0.3, 0.0, kept=False),
        ]
        trace = Trace(original_question=question, standalone_question=question, search_query=question, candidates=candidates)
        return RagAnswer(answer="RAG-Sequence and RAG-Token [1].", sources=[source], usage=Usage(cost_usd=0.0002, latency_ms=1500), trace=trace)

    # The judge gives fixed scores
    def fake_judge(question, answer, contexts, reference=None):
        return Judgement(Metric(1.0, "ok"), Metric(1.0, "ok"), Metric(1.0, "1 of 1"), Metric(0.5, "half"), [1])

    seen = []
    monkeypatch.setattr(runner, "answer_question", fake_answer)
    monkeypatch.setattr(runner, "judge_answer", fake_judge)
    monkeypatch.setattr(runner.threading, "Thread", InlineThread)
    return seen


def test_testset_cases_are_complete():
    """Every built-in case has a unique id, a question and a reference."""

    # Load the test set
    cases = runner.load_testset()

    # Fields and unique ids
    assert len(cases) >= 10
    assert len({case["id"] for case in cases}) == len(cases)
    assert all(case["question"] and case["reference"] for case in cases)


def test_evaluate_case_checks_retrieval_and_grades(stubbed):
    """A case result has the retrieval hit, metrics, overall score and costs."""

    # Expected file retrieved
    result = runner.evaluate_case({"id": "x", "question": "Q?", "reference": "R", "expected_source": "2005.11401_RAG-Lewis.pdf"})
    assert result["retrieval_hit"] is True
    assert result["candidate_hit"] is True
    assert result["trace"]["candidates"][0]["kept"] is True
    assert result["metrics"]["correctness"]["score"] == 0.5
    assert result["overall"] == 0.875
    assert result["answer_cost_usd"] == 0.0002

    # HR file was a candidate but not kept; no expected file gives None
    other = runner.evaluate_case({"id": "y", "question": "Q?", "expected_source": "hr_policy.md"})
    assert other["retrieval_hit"] is False and other["candidate_hit"] is True
    assert runner.evaluate_case({"id": "z", "question": "Q?", "expected_source": None})["retrieval_hit"] is None


def test_summary_averages_and_skips_failed_cases():
    """Failed cases are counted but left out of the averages."""

    # One good case and one failed case
    good = {"metrics": {"faithfulness": {"score": 1.0}, "answer_relevance": {"score": 0.5}, "context_precision": {"score": 0.25}, "correctness": None},
            "overall": 0.583, "retrieval_hit": True, "latency_ms": 2000, "answer_cost_usd": 0.0002, "judge_cost_usd": 0.0003}
    summary = runner.summarize_results([good, {"id": "bad", "error": "timeout"}])

    # Averages from the good case only
    assert summary["faithfulness"] == 1.0
    assert summary["correctness"] is None
    assert summary["retrieval_hit_rate"] == 1.0
    assert summary["passed"] == 0
    assert summary["failed_cases"] == 1
    assert summary["cost_usd"] == 0.0005


def test_run_saves_report_and_endpoints_return_it(stubbed):
    """A run over two cases finishes, is saved and is returned by the endpoints."""

    # Start a run over two cases through the API
    client = TestClient(app)
    response = client.post("/evals/runs", json={"case_ids": ["rag-variants", "hr-sick-days"]})
    assert response.status_code == 202
    run_id = response.json()["id"]

    # The saved report is complete
    report = client.get(f"/evals/runs/{run_id}").json()
    assert report["status"] == "done"
    assert report["completed"] == 2
    assert [result["id"] for result in report["results"]] == ["rag-variants", "hr-sick-days"]
    assert report["summary"]["retrieval_hit_rate"] == 0.5
    assert report["summary"]["candidate_hit_rate"] == 1.0
    assert report["pipeline"]["rerank_enabled"] in (True, False)

    # The list holds the run without results; unknown ids are 404
    runs = client.get("/evals/runs").json()["runs"]
    assert runs[0]["id"] == run_id and "results" not in runs[0]
    assert client.get("/evals/runs/unknown").status_code == 404


def test_only_one_run_at_a_time(monkeypatch):
    """Starting a run while one is active gives 409."""

    # Pretend a run is active
    monkeypatch.setattr(runner, "ACTIVE", {"abc"})

    # The API refuses a second run
    response = TestClient(app).post("/evals/runs", json={})
    assert response.status_code == 409


def test_preset_changes_settings_for_the_run_only(stubbed):
    """Preset A runs every question with reranking off, and the shared settings stay unchanged."""

    # Shared value before the run
    shared_rerank = get_settings().rerank_enabled

    # Run one case with preset A
    client = TestClient(app)
    run_id = client.post("/evals/runs", json={"case_ids": ["rag-variants"], "preset": "A"}).json()["id"]
    report = client.get(f"/evals/runs/{run_id}").json()

    # The question ran without reranking and the report records the preset
    assert stubbed == [False]
    assert report["preset"] == "A" and report["preset_name"] == "Naive RAG baseline"
    assert report["pipeline"]["rerank_enabled"] is False and report["pipeline"]["rewrite_enabled"] is False

    # The shared settings did not change
    assert get_settings().rerank_enabled is shared_rerank


def test_presets_endpoint_and_unknown_preset():
    """GET /evals/presets lists A to E; an unknown preset gives 422."""

    # Five presets, C keeps exactly four chunks
    presets = TestClient(app).get("/evals/presets").json()["presets"]
    assert list(presets) == ["A", "B", "C", "D", "E"]
    assert presets["C"]["changes"]["min_chunks"] == presets["C"]["changes"]["max_chunks"] == 4

    # Unknown preset rejected by the schema
    assert TestClient(app).post("/evals/runs", json={"preset": "Z"}).status_code == 422
