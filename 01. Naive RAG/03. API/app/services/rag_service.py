"""
RAG service (online query pipeline).

This file runs the full Naive RAG query pipeline for one question:

    retrieve top-k chunks -> build the grounded prompt -> generate the answer

It returns the answer together with the sources used, so the caller can show
citations. If nothing is indexed (no chunks retrieved), it returns the fixed
not-found answer without calling the chat model. Like the ingestion service,
it knows nothing about HTTP.
"""

# Imports
from app.generation.prompts import NOT_FOUND_ANSWER, build_messages, source_label
from app.generation.generator import generate_answer
from app.core.logging import get_logger, log_step
from app.retrieval.retriever import retrieve
from dataclasses import dataclass


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


@dataclass
class RagAnswer:
    """The answer and the sources it was generated from."""

    # Answer text from the chat model
    answer: str

    # Retrieved chunks in citation order
    sources: list[Source]


def answer_question(question: str, top_k: int | None = None) -> RagAnswer:
    """Retrieve context for the question, generate a grounded answer and return it with sources."""

    # Step 1: find the most similar chunks
    with log_step(log, "retrieve", top_k=top_k or "default") as step:
        results = retrieve(question, top_k=top_k)
        step["results"] = len(results)
        step["top_score"] = round(results[0].score, 3) if results else None

    # Nothing indexed: answer without calling the chat model
    if not results:
        log.info("  [yellow]no chunks retrieved, returning the not-found answer[/]")
        return RagAnswer(answer=NOT_FOUND_ANSWER, sources=[])

    # Step 2: build the grounded prompt
    with log_step(log, "prompt") as step:
        messages = build_messages(question, results)
        step["context_chars"] = len(messages[1]["content"])

    # Step 3: ask the chat model
    with log_step(log, "generate") as step:
        answer = generate_answer(messages)
        step["answer_chars"] = len(answer)

    # Number the sources the same way as the context blocks in the prompt
    sources = [
        Source(
            number=number,
            label=source_label(result.document.metadata),
            score=round(result.score, 4),
            text=result.document.text,
        )
        for number, result in enumerate(results, start=1)
    ]

    return RagAnswer(answer=answer, sources=sources)
