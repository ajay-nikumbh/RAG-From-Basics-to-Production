"""
Evaluation schemas.

This file defines the request and response of POST /evals/answer: the
question, the answer and the context chunks it was generated from (plus an
optional reference answer) go in; every metric with its reason, the overall
score and the cost of the judge call come out. It also defines the request
of POST /evals/runs, which starts an evaluation of the built-in test set.
"""

# Imports
from pydantic import BaseModel, Field


class EvalAnswerRequest(BaseModel):
    """Request body of POST /evals/answer."""

    # The question and the answer to grade
    question: str = Field(min_length=1, max_length=2000)
    answer: str = Field(min_length=1, max_length=8000)

    # Retrieved chunk texts in citation order ([1] is the first)
    contexts: list[str] = Field(default_factory=list, max_length=20)

    # Optional reference answer; enables the correctness metric
    reference: str | None = Field(default=None, max_length=4000)


class MetricResponse(BaseModel):
    """One score between 0 and 1 with its reason."""

    # Score, or null when the metric does not apply
    score: float | None

    # One sentence explaining the score
    reason: str


class JudgeUsage(BaseModel):
    """Tokens and cost of the judge call."""

    # Chat tokens of the judge request
    prompt_tokens: int
    completion_tokens: int

    # Cost in US dollars and Indian rupees, and time in milliseconds
    cost_usd: float
    cost_inr: float
    latency_ms: int


class EvalAnswerResponse(BaseModel):
    """Response body of POST /evals/answer."""

    # Metrics from the judge and the computed context precision
    faithfulness: MetricResponse
    answer_relevance: MetricResponse
    context_precision: MetricResponse
    correctness: MetricResponse | None

    # Context chunk numbers the judge found relevant
    relevant_chunks: list[int]

    # Mean of the scores that apply
    overall: float | None

    # Tokens and cost of grading
    usage: JudgeUsage


class EvalRunRequest(BaseModel):
    """Request body of POST /evals/runs."""

    # Number of chunks to retrieve per question; uses TOP_K from settings when missing
    top_k: int | None = Field(default=None, ge=1, le=20)

    # Test case ids to run; every case when missing
    case_ids: list[str] | None = None
