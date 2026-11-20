"""
Evaluation runner.

This file evaluates the whole Naive RAG pipeline against the built-in test
set (testset.json) and saves a report. For every test case it:

    1. asks the question through the normal query pipeline
    2. checks retrieval: was the expected file among the retrieved chunks?
    3. grades the answer with the LLM judge, using the reference answer

A run happens in a background thread, so POST /evals/runs returns at once.
The report is saved to data/evals/<id>.json after every case, so the UI can
poll it and show progress. Only one run can be active at a time. The summary
averages each metric, the retrieval hit rate, latency and cost.
"""

# Imports
from app.services.rag_service import answer_question
from app.services.usage import track_usage
from app.core.config import get_settings
from app.evals.judge import judge_answer
from datetime import datetime, timezone
from app.core.logging import get_logger
from dataclasses import asdict
from pathlib import Path
import threading
import json
import uuid


# Logger for run progress
log = get_logger(__name__)

# The built-in test set, versioned with the code
TESTSET_FILE = Path(__file__).with_name("testset.json")

# A case passes when its overall score reaches this value
PASS_SCORE = 0.75

# Metrics averaged in the summary
METRICS = ("faithfulness", "answer_relevance", "context_precision", "correctness")

# Only one run at a time; ACTIVE holds the id of the run in progress
RUN_LOCK = threading.Lock()
ACTIVE: set[str] = set()


class RunInProgressError(Exception):
    """Raised when a run is started while another one is active."""


def load_testset() -> list[dict]:
    """Return the test cases from testset.json."""

    # One JSON list of cases
    return json.loads(TESTSET_FILE.read_text(encoding="utf-8"))


def report_path(run_id: str) -> Path:
    """Path of one saved report."""

    # One JSON file per run in the evals folder
    return get_settings().evals_dir / f"{run_id}.json"


def save_report(report: dict) -> None:
    """Write the report to its file."""

    # Create the folder on first use and replace the file
    path = report_path(report["id"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


def get_report(run_id: str) -> dict | None:
    """Return one saved report, or None if it does not exist."""

    # Ids are generated hex strings; anything else cannot be a report
    if not run_id.isalnum():
        return None
    path = report_path(run_id)
    if not path.exists():
        return None

    # A "running" report whose thread is gone was interrupted (for example by a server restart)
    report = json.loads(path.read_text(encoding="utf-8"))
    if report["status"] == "running" and run_id not in ACTIVE:
        report["status"] = "interrupted"
    return report


def list_reports() -> list[dict]:
    """Return every report without its per-case results, newest first."""

    # No folder yet means no runs yet
    folder = get_settings().evals_dir
    if not folder.exists():
        return []

    # Read each report and drop the long results list
    reports = [get_report(path.stem) for path in folder.glob("*.json")]
    summaries = [{key: value for key, value in report.items() if key != "results"} for report in reports if report]
    return sorted(summaries, key=lambda report: report["created_at"], reverse=True)


def summarize_results(results: list[dict]) -> dict:
    """Average the metrics, retrieval hit rate, latency and cost of finished cases."""

    # Cases that finished without an error
    done = [result for result in results if not result.get("error")]

    # Mean of one metric over the cases where it applies
    def mean(values):
        values = [value for value in values if value is not None]
        return round(sum(values) / len(values), 3) if values else None

    # Retrieval is only checked for cases with an expected file
    hits = [result["retrieval_hit"] for result in done if result["retrieval_hit"] is not None]

    # Costs of answering and grading, in US dollars and rupees
    cost = sum(result["answer_cost_usd"] + result["judge_cost_usd"] for result in done)
    rate = get_settings().usd_to_inr

    return {
        **{name: mean(result["metrics"][name]["score"] if result["metrics"].get(name) else None for result in done) for name in METRICS},
        "overall": mean(result["overall"] for result in done),
        "retrieval_hit_rate": round(sum(hits) / len(hits), 3) if hits else None,
        "passed": sum(1 for result in done if (result["overall"] or 0) >= PASS_SCORE),
        "failed_cases": len(results) - len(done),
        "avg_latency_ms": round(sum(result["latency_ms"] for result in done) / len(done)) if done else 0,
        "cost_usd": round(cost, 6),
        "cost_inr": round(cost * rate, 4),
    }


def evaluate_case(case: dict, top_k: int | None) -> dict:
    """Answer one test case, check retrieval and grade the answer."""

    # Step 1: ask the question through the normal pipeline, recorded as an evaluation question
    rag = answer_question(case["question"], top_k=top_k, usage_kind="eval_query")
    sources = [source.source for source in rag.sources]

    # Step 2: retrieval hit when the expected file is among the retrieved chunks
    expected = case.get("expected_source")
    hit = (expected in sources) if expected else None

    # Step 3: grade the answer against the retrieved context and the reference
    with track_usage("eval_judge", question=case["question"][:300]) as meter:
        judgement = judge_answer(case["question"], rag.answer, [source.text for source in rag.sources], case.get("reference"))
        judge_cost = meter.cost(get_settings())

    return {
        "id": case["id"],
        "question": case["question"],
        "reference": case.get("reference"),
        "expected_source": expected,
        "answer": rag.answer,
        "sources": [
            {"number": s.number, "label": s.label, "source": s.source, "page": s.page, "score": s.score}
            for s in rag.sources
        ],
        "metrics": {
            "faithfulness": asdict(judgement.faithfulness),
            "answer_relevance": asdict(judgement.answer_relevance),
            "context_precision": asdict(judgement.context_precision),
            "correctness": asdict(judgement.correctness) if judgement.correctness else None,
        },
        "relevant_chunks": judgement.relevant_chunks,
        "overall": judgement.overall(),
        "retrieval_hit": hit,
        "latency_ms": rag.usage.latency_ms,
        "answer_cost_usd": rag.usage.cost_usd,
        "judge_cost_usd": round(judge_cost, 6),
        "error": None,
    }


def run_evaluation(report: dict, cases: list[dict]) -> None:
    """Evaluate every case, saving the report after each one."""

    # Work through the cases in order
    try:
        for index, case in enumerate(cases, start=1):

            # One failing case is recorded and the run continues
            try:
                result = evaluate_case(case, report["top_k"])
            except Exception as error:
                result = {"id": case["id"], "question": case["question"], "error": str(error)}
                log.warning(f"  case [bold]{case['id']}[/] failed: {error}")

            # Progress after each case
            report["results"].append(result)
            report["completed"] = index
            report["summary"] = summarize_results(report["results"])
            save_report(report)
            log.info(f"  eval  {index}/{len(cases)}  [cyan]{case['id']}[/]  overall={result.get('overall')}")

        # All cases done
        report["status"] = "done"

    # Anything unexpected ends the run as failed
    except Exception as error:
        report["status"] = "failed"
        report["error"] = str(error)

    # Save the final state and free the run slot
    finally:
        report["finished_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        save_report(report)
        ACTIVE.discard(report["id"])
        log.info(f"  eval run [bold]{report['id']}[/] {report['status']}  overall={report['summary'].get('overall')}")


def start_run(top_k: int | None = None, case_ids: list[str] | None = None) -> dict:
    """Create a report and start evaluating in a background thread."""

    # Only one run at a time
    with RUN_LOCK:
        if ACTIVE:
            raise RunInProgressError("An evaluation run is already in progress.")

        # Pick the cases: all, or the requested ids in test set order
        cases = load_testset()
        if case_ids:
            cases = [case for case in cases if case["id"] in case_ids]

        # Empty report that the thread fills in
        settings = get_settings()
        report = {
            "id": uuid.uuid4().hex[:12],
            "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "finished_at": None,
            "status": "running",
            "top_k": top_k or settings.top_k,
            "chat_model": settings.azure_openai_deployment_name,
            "embedding_model": settings.azure_openai_embedding_deployment,
            "chunk_size": settings.chunk_size,
            "chunk_overlap": settings.chunk_overlap,
            "total": len(cases),
            "completed": 0,
            "summary": summarize_results([]),
            "results": [],
            "error": None,
        }
        save_report(report)
        ACTIVE.add(report["id"])

    # Evaluate in the background so the request returns at once
    log.info(f"  eval run [bold]{report['id']}[/] started  cases={len(cases)}  top_k={report['top_k']}")
    threading.Thread(target=run_evaluation, args=(report, cases), daemon=True).start()
    return report
