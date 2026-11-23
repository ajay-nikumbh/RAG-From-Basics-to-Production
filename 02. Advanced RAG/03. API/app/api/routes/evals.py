"""
Evaluation routes.

This file defines the evaluation endpoints:

    POST /evals/answer      grade one answer with the LLM judge
    GET  /evals/testset     the built-in test cases
    POST /evals/runs        start evaluating the pipeline on the test set
    GET  /evals/runs        every saved run, newest first, without results
    GET  /evals/runs/{id}   one run with its per-case results

POST /evals/answer returns faithfulness, answer relevance, context precision
and, with a reference, correctness, with reasons and the cost of grading; the
chat UI calls it from the "Evaluate" button. Runs execute in the background
and save a report after every case, so the UI polls GET /evals/runs/{id} for
progress. Judge calls are recorded as "eval_judge" runs and evaluation
questions as "eval_query" runs, so evaluation cost appears in analytics
separately from user questions.
"""

# Imports
from app.schemas.evals import EvalAnswerRequest, EvalAnswerResponse, EvalRunRequest, JudgeUsage, MetricResponse
from app.evals.runner import RunInProgressError, get_report, list_reports, load_testset, start_run
from app.core.logging import get_logger, log_detail, log_step, preview
from fastapi import APIRouter, HTTPException, status
from app.services.usage import track_usage
from app.core.config import get_settings
from app.evals.judge import judge_answer
from dataclasses import asdict
import time


# Router for evaluation endpoints, shown under the "Evals" group in the API docs
router = APIRouter(tags=["Evals"])

# Logger for evaluation steps
log = get_logger(__name__)


def log_judgement(judgement) -> None:
    """Log every metric of a judgement with its score and reason."""

    # Metrics in display order; correctness only with a reference
    metrics = [("faithful", judgement.faithfulness), ("relevance", judgement.answer_relevance), ("precision", judgement.context_precision), ("correct", judgement.correctness)]
    for label, metric in metrics:
        if metric is None:
            continue
        score = "-" if metric.score is None else f"{metric.score:.2f}"
        log_detail(log, label, f"[cyan]{score}[/]  [dim]{preview(metric.reason, 110)}[/]")

    # Chunks the judge found relevant
    log_detail(log, "relevant", f"{judgement.relevant_chunks or 'none'}")


@router.post("/evals/answer", response_model=EvalAnswerResponse)
def evaluate_answer(request: EvalAnswerRequest) -> EvalAnswerResponse:
    """Grade one answer against its retrieved context with the LLM judge."""

    # Read the shared settings and start the clock
    settings = get_settings()
    start = time.perf_counter()

    # Measure the judge call as its own run
    with track_usage("eval_judge", question=request.question[:300]) as meter:
        with log_step(log, "judge", chunks=len(request.contexts), reference=bool(request.reference)) as step:
            judgement = judge_answer(request.question, request.answer, request.contexts, request.reference)
            step["overall"] = judgement.overall()
            step["tokens_in"] = meter.prompt_tokens
            step["tokens_out"] = meter.completion_tokens
        meter.details["overall"] = judgement.overall()
        cost = meter.cost(settings)

    # What was graded, then one line per metric with its reason
    log_detail(log, "question", f"\"{preview(request.question, 120)}\"")
    log_judgement(judgement)

    # Convert the judgement into the response schema
    return EvalAnswerResponse(
        faithfulness=MetricResponse(**asdict(judgement.faithfulness)),
        answer_relevance=MetricResponse(**asdict(judgement.answer_relevance)),
        context_precision=MetricResponse(**asdict(judgement.context_precision)),
        correctness=MetricResponse(**asdict(judgement.correctness)) if judgement.correctness else None,
        relevant_chunks=judgement.relevant_chunks,
        overall=judgement.overall(),
        usage=JudgeUsage(
            prompt_tokens=meter.prompt_tokens,
            completion_tokens=meter.completion_tokens,
            cost_usd=round(cost, 6),
            cost_inr=round(cost * settings.usd_to_inr, 4),
            latency_ms=round((time.perf_counter() - start) * 1000),
        ),
    )


@router.get("/evals/testset")
def testset() -> dict:
    """The built-in test cases: question, reference answer and expected file."""

    # Cases as stored in testset.json
    return {"cases": load_testset()}


@router.post("/evals/runs", status_code=status.HTTP_202_ACCEPTED)
def create_run(request: EvalRunRequest) -> dict:
    """Start evaluating the pipeline on the test set; returns the new run at once."""

    # Start the background run; only one may be active
    try:
        report = start_run(case_ids=request.case_ids)
    except RunInProgressError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    # The run without its (still empty) results
    return {key: value for key, value in report.items() if key != "results"}


@router.get("/evals/runs")
def runs() -> dict:
    """Every saved run with its summary, newest first."""

    # Summaries only; results are loaded per run
    return {"runs": list_reports()}


@router.get("/evals/runs/{run_id}")
def run_detail(run_id: str) -> dict:
    """One run with its per-case results."""

    # Unknown ids are a clear 404
    report = get_report(run_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Evaluation run '{run_id}' not found")
    return report
