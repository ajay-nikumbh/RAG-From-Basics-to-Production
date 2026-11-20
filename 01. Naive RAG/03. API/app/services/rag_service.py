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
from app.retrieval.retriever import retrieve
from dataclasses import dataclass


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
    results = retrieve(question, top_k=top_k)

    # Nothing indexed: answer without calling the chat model
    if not results:
        return RagAnswer(answer=NOT_FOUND_ANSWER, sources=[])

    # Step 2: build the grounded prompt
    messages = build_messages(question, results)

    # Step 3: ask the chat model
    answer = generate_answer(messages)

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
