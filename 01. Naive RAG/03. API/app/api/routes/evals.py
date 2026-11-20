"""
Evaluation routes.

This file defines POST /evals/answer. It grades one answer with the LLM
judge (faithfulness, answer relevance, context precision and, with a
reference, correctness) and returns the scores with their reasons and the
cost of grading. The chat UI calls it from the "Evaluate" button under an
answer. The judge call is recorded as an "eval_judge" run, so evaluation
cost appears in analytics separately from questions.
"""

# Imports
from app.schemas.evals import EvalAnswerRequest, EvalAnswerResponse, JudgeUsage, MetricResponse
from app.core.logging import get_logger, log_step
from app.services.usage import track_usage
from app.core.config import get_settings
from app.evals.judge import judge_answer
from dataclasses import asdict
from fastapi import APIRouter
import time


# Router for evaluation endpoints, shown under the "Evals" group in the API docs
router = APIRouter(tags=["Evals"])

# Logger for evaluation steps
log = get_logger(__name__)


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
