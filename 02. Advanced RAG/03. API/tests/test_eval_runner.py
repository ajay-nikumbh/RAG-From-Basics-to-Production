"""
Tests for the evaluation runner and the run endpoints.

The query pipeline and the judge are replaced by stubs, and the background
thread runs synchronously, so a whole run finishes inside the test. The
tests check one case result (retrieval hit, metrics, costs), the summary,
the saved report, the one-run-at-a-time rule and the endpoints.
"""

# Imports
from app.services.rag_service import RagAnswer, Source, Usage
from app.evals.judge import Judgement, Metric
from fastapi.testclient import TestClient
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

    # Every question retrieves one chunk from the RAG paper
    def fake_answer(question, top_k=None, usage_kind="query"):
        source = Source(number=1, label="2005.11401_RAG-Lewis.pdf, page 2", score=0.6, text="RAG-Sequence and RAG-Token", source="2005.11401_RAG-Lewis.pdf", page=2)
        return RagAnswer(answer="RAG-Sequence and RAG-Token [1].", sources=[source], usage=Usage(cost_usd=0.0002, latency_ms=1500))

    # The judge gives fixed scores
    def fake_judge(question, answer, contexts, reference=None):
        return Judgement(Metric(1.0, "ok"), Metric(1.0, "ok"), Metric(1.0, "1 of 1"), Metric(0.5, "half"), [1])

    monkeypatch.setattr(runner, "answer_question", fake_answer)
    monkeypatch.setattr(runner, "judge_answer", fake_judge)
    monkeypatch.setattr(runner.threading, "Thread", InlineThread)


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
    result = runner.evaluate_case({"id": "x", "question": "Q?", "reference": "R", "expected_source": "2005.11401_RAG-Lewis.pdf"}, top_k=4)
    assert result["retrieval_hit"] is True
    assert result["metrics"]["correctness"]["score"] == 0.5
    assert result["overall"] == 0.875
    assert result["answer_cost_usd"] == 0.0002

    # Other file expected, and no expected file
    assert runner.evaluate_case({"id": "y", "question": "Q?", "expected_source": "hr_policy.md"}, 4)["retrieval_hit"] is False
    assert runner.evaluate_case({"id": "z", "question": "Q?", "expected_source": None}, 4)["retrieval_hit"] is None


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
