"""
LLM judge.

This file scores one RAG answer with the chat model acting as a strict
grader ("LLM as a judge"). One request returns every metric at once, in
JSON:

    faithfulness       share of the answer's claims supported by the context
    answer_relevance   how directly the answer addresses the question
    relevant_chunks    which retrieved chunks are relevant to the question
    correctness        agreement with a reference answer (only when given)

Scores are snapped to five levels (0, 0.25, 0.5, 0.75, 1) so they are
stable and easy to read. Context precision is not asked from the model as a
number: it is computed from relevant_chunks as relevant / retrieved, which
keeps it exact and explainable. The judge's tokens are added to the usage
meter of the running evaluation, so evaluation cost shows up in analytics.
"""

# Imports
from app.core.azure_client import get_azure_client
from app.services.usage import add_chat_tokens
from app.core.config import get_settings
from dataclasses import dataclass
import json


# Rules and output format for the judge
JUDGE_PROMPT = """You are a strict evaluator of a retrieval-augmented question answering system.
You get a QUESTION, numbered CONTEXT chunks retrieved for it, the system's ANSWER and sometimes a REFERENCE answer.

Score each metric with one of: 0, 0.25, 0.5, 0.75, 1.

faithfulness: What share of the claims in the ANSWER is directly supported by the CONTEXT?
  1 = every claim is supported, 0 = the answer is mostly unsupported or contradicts the context.
  Judge faithfulness against the CONTEXT only; ignore the REFERENCE for this metric.
  An answer that only says the information was not found makes no claims: score 1.
answer_relevance: How directly and completely does the ANSWER address the QUESTION?
  If the CONTEXT does not contain the answer and the ANSWER says so, score 1.
relevant_chunks: The numbers of the CONTEXT chunks that contain information useful for answering the QUESTION.
correctness: Only if a REFERENCE is given. How well does the ANSWER agree with the REFERENCE in meaning?
  Extra correct detail is fine; missing or wrong key facts lower the score. Use null when there is no REFERENCE.

Give each reason in one short sentence.
Reply with JSON only, in this shape:
{"faithfulness": {"score": 1, "reason": "..."},
 "answer_relevance": {"score": 1, "reason": "..."},
 "relevant_chunks": [1, 2],
 "correctness": {"score": 1, "reason": "..."} or null}"""

# Allowed score levels
LEVELS = (0.0, 0.25, 0.5, 0.75, 1.0)


@dataclass
class Metric:
    """One score between 0 and 1 with a short reason."""

    # Score, or None when the metric does not apply
    score: float | None

    # One sentence explaining the score
    reason: str


@dataclass
class Judgement:
    """All metrics for one answer."""

    # Scores from the judge
    faithfulness: Metric
    answer_relevance: Metric

    # Computed from relevant_chunks
    context_precision: Metric

    # Only when a reference answer was given
    correctness: Metric | None

    # Context chunk numbers the judge found relevant
    relevant_chunks: list[int]

    def overall(self) -> float | None:
        """Mean of the scores that apply."""

        # Collect every score that is present
        metrics = [self.faithfulness, self.answer_relevance, self.context_precision, self.correctness]
        scores = [m.score for m in metrics if m and m.score is not None]
        return round(sum(scores) / len(scores), 3) if scores else None


def snap(value) -> float:
    """Clamp a score to 0..1 and round it to the nearest allowed level."""

    # Anything that is not a number counts as 0
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0

    # Nearest level
    return min(LEVELS, key=lambda level: abs(level - max(0.0, min(1.0, number))))


def build_judge_messages(question: str, answer: str, contexts: list[str], reference: str | None = None) -> list[dict]:
    """Return the system and user messages for the judge."""

    # Numbered context chunks, the same numbering the answer cites
    context = "\n\n".join(f"[{number}] {text}" for number, text in enumerate(contexts, start=1)) or "(no context retrieved)"

    # Question, context, answer and the optional reference
    parts = [f"QUESTION:\n{question}", f"CONTEXT:\n{context}", f"ANSWER:\n{answer}"]
    if reference:
        parts.append(f"REFERENCE:\n{reference}")

    return [
        {"role": "system", "content": JUDGE_PROMPT},
        {"role": "user", "content": "\n\n".join(parts)},
    ]


def read_metric(data: dict, name: str) -> Metric:
    """Read one {"score", "reason"} metric from the judge reply."""

    # Missing or malformed metrics count as 0 with an explanation
    item = data.get(name)
    if not isinstance(item, dict):
        return Metric(score=0.0, reason="The judge did not return this metric.")
    return Metric(score=snap(item.get("score")), reason=str(item.get("reason", "")).strip())


def parse_judgement(raw: str, chunk_count: int, has_reference: bool) -> Judgement:
    """Turn the judge's JSON reply into a Judgement."""

    # Parse the reply; an unreadable reply becomes an empty object
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {}

    # Relevant chunk numbers, kept only when they point at a real chunk
    numbers = data.get("relevant_chunks") or []
    relevant = sorted({int(n) for n in numbers if isinstance(n, (int, float)) and 1 <= int(n) <= chunk_count})

    # Context precision: relevant chunks out of all retrieved chunks
    if chunk_count:
        precision = Metric(score=round(len(relevant) / chunk_count, 3), reason=f"{len(relevant)} of {chunk_count} retrieved chunks are relevant to the question.")
    else:
        precision = Metric(score=None, reason="No chunks were retrieved.")

    # Correctness only when a reference was given
    correctness = read_metric(data, "correctness") if has_reference else None

    return Judgement(
        faithfulness=read_metric(data, "faithfulness"),
        answer_relevance=read_metric(data, "answer_relevance"),
        context_precision=precision,
        correctness=correctness,
        relevant_chunks=relevant,
    )


def judge_answer(question: str, answer: str, contexts: list[str], reference: str | None = None, client=None) -> Judgement:
    """Score one answer with the chat model and return every metric."""

    # Read the shared settings and use the shared client unless a test passes one
    settings = get_settings()
    client = client or get_azure_client()

    # One JSON-mode request at temperature 0, so scores are repeatable
    response = client.chat.completions.create(
        model=settings.azure_openai_deployment_name,
        messages=build_judge_messages(question, answer, contexts, reference),
        temperature=0,
        max_tokens=settings.eval_judge_max_tokens,
        response_format={"type": "json_object"},
    )

    # Count the judge's tokens for usage and cost
    if getattr(response, "usage", None):
        add_chat_tokens(response.usage.prompt_tokens, response.usage.completion_tokens)

    # Parse the reply into metrics
    return parse_judgement(response.choices[0].message.content or "", len(contexts), bool(reference))
