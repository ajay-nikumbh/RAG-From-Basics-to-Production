"""
Reranking prompt.

This file builds the chat messages for the one gpt-4o-mini call that scores
every candidate chunk for relevance to the question. Each candidate is shown
with a number and its source, the model scores each one on its own from 0 to
10 with a fixed rubric, and replies with JSON: a list with one score per
candidate, in candidate order. A plain list keeps the reply short (about 33
tokens for 10 candidates), which roughly halves the time of the call.
"""

# Imports
from app.vectorstore.faiss_store import SearchResult
from app.generation.prompts import source_label


# Rules and scoring rubric for the rerank call
SYSTEM_PROMPT = """You are a relevance judge for a document search system.

You get a question and numbered passages. Score each passage on its own: how useful is it for answering the question?
Use this scale:
10 = directly answers the question
7 to 9 = contains most of the answer
4 to 6 = related and partly useful
1 to 3 = same general topic, but does not help answer
0 = unrelated

Judge only what the passage says, not what you know. Do not answer the question.
Reply with JSON only, in this form: {"scores": [8, 0, 5]}
The list must hold exactly one integer score per passage, in passage order."""


def format_passages(candidates: list[SearchResult]) -> str:
    """Number each candidate and put its source label above its text."""

    # One block per candidate: [n] (source label) followed by the chunk text
    blocks = []
    for number, candidate in enumerate(candidates, start=1):
        blocks.append(f"[{number}] ({source_label(candidate.document.metadata)})\n{candidate.document.text}")

    # Blank line between blocks
    return "\n\n".join(blocks)


def build_rerank_messages(question: str, candidates: list[SearchResult]) -> list[dict]:
    """Return the system and user messages for the rerank call."""

    # User message: the question first, then all passages
    user_message = f"QUESTION: {question}\n\nPASSAGES:\n{format_passages(candidates)}"

    # Chat messages in the format the OpenAI API expects
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]
