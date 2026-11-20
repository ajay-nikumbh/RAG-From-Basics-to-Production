"""
RAG service (online query pipeline).

This file runs the full Naive RAG query pipeline for one question:

    retrieve top-k chunks -> build the grounded prompt -> generate the answer

It returns the answer together with the sources used, so the caller can show
citations, and the usage of the run: tokens, cost and duration. If nothing
is indexed (no chunks retrieved), it returns the fixed not-found answer
without calling the chat model. Like the ingestion service, it knows nothing
about HTTP.
"""

# Imports
from app.generation.prompts import NOT_FOUND_ANSWER, build_messages, source_label
from app.generation.generator import generate_answer
from app.core.logging import get_logger, log_step
from app.retrieval.retriever import retrieve
from app.services.usage import track_usage
from app.core.config import get_settings
from dataclasses import dataclass, field
import time


# Logger for pipeline steps
log = get_logger(__name__)


@dataclass
class Source:
    """One retrieved chunk shown to the user as a citation."""

    # Citation number used in the answer, for example 1 for [1]
    number: int

    # Short label, for example "report.pdf, page 3"
    label: str

    # Cosine similarity between the question and the chunk
    score: float

    # The chunk text sent to the model
    text: str

    # File name and page (PDF only), so the UI can open the exact page
    source: str = ""
    page: int | None = None


@dataclass
class Usage:
    """Tokens, cost and time of one query."""

    # Tokens used by the question embedding and the chat model
    embedding_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0

    # Cost in US dollars and Indian rupees, and total time in milliseconds
    cost_usd: float = 0.0
    cost_inr: float = 0.0
    latency_ms: int = 0


@dataclass
class RagAnswer:
    """The answer, the sources it was generated from and the usage of the run."""

    # Answer text from the chat model
    answer: str

    # Retrieved chunks in citation order
    sources: list[Source]

    # Tokens, cost and time
    usage: Usage = field(default_factory=Usage)


def answer_question(question: str, top_k: int | None = None) -> RagAnswer:
    """Retrieve context for the question, generate a grounded answer and return it with sources."""

    # Read the shared settings and start the clock
    settings = get_settings()
    start = time.perf_counter()

    # Measure tokens, cost and time of this query
    with track_usage("query", question=question[:300]) as meter:

        # Step 1: find the most similar chunks
        with log_step(log, "retrieve", top_k=top_k or settings.top_k) as step:
            results = retrieve(question, top_k=top_k)
            step["results"] = len(results)
            step["top_score"] = round(results[0].score, 3) if results else None
            step["tokens"] = meter.embedding_tokens

        # Nothing indexed: answer without calling the chat model
        if not results:
            log.info("  [yellow]no chunks retrieved, returning the not-found answer[/]")
            return RagAnswer(answer=NOT_FOUND_ANSWER, sources=[])

        # Step 2: build the grounded prompt
        with log_step(log, "prompt") as step:
            messages = build_messages(question, results)
            step["context_chars"] = len(messages[1]["content"])

        # Step 3: ask the chat model
        with log_step(log, "generate", model=settings.azure_openai_deployment_name) as step:
            answer = generate_answer(messages)
            step["tokens_in"] = meter.prompt_tokens
            step["tokens_out"] = meter.completion_tokens
            step["cost"] = f"${meter.cost(settings):.6f}"

        # Keep the number of sources with the saved event
        meter.details["sources"] = len(results)

    # Number the sources the same way as the context blocks in the prompt
    sources = [
        Source(
            number=number,
            label=source_label(result.document.metadata),
            score=round(result.score, 4),
            text=result.document.text,
            source=result.document.metadata.get("source", ""),
            page=result.document.metadata.get("page"),
        )
        for number, result in enumerate(results, start=1)
    ]

    # Usage of the whole run
    usage = Usage(
        embedding_tokens=meter.embedding_tokens,
        prompt_tokens=meter.prompt_tokens,
        completion_tokens=meter.completion_tokens,
        cost_usd=round(meter.cost(settings), 6),
        cost_inr=round(meter.cost(settings) * settings.usd_to_inr, 4),
        latency_ms=round((time.perf_counter() - start) * 1000),
    )

    return RagAnswer(answer=answer, sources=sources, usage=usage)
