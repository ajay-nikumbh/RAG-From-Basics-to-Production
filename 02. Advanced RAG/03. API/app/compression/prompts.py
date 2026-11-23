"""
Context compression prompt.

This file splits each kept chunk into numbered sentences and builds the chat
messages for the one gpt-4o-mini call that picks which sentences to keep.
The model only returns sentence numbers, never text, so the compressed
context is always made of original sentences (extractive compression).
"""

# Imports
from app.generation.prompts import source_label
from app.ingestion.document import Document
import re


# Rules for the compression call
SYSTEM_PROMPT = """You select sentences for a question answering system.

You get a question and numbered passages split into numbered sentences, like (2.3) for passage 2, sentence 3.
Keep every sentence that helps answer the question, and any sentence needed to understand a kept sentence (for example the sentence that says what "it" refers to).
Drop sentences that do not help. When unsure, keep the sentence. A passage may keep no sentences.
Do not answer the question and do not rewrite anything.
Reply with JSON only, in this form: {"keep": {"1": [1, 2], "2": []}}
List the kept sentence numbers for every passage number."""

# Sentence ends: ., ! or ? followed by space, or a line break, but not after
# abbreviations common in papers ("et al.", "e.g.", "i.e.", "Fig.", "Eq.")
SENTENCE_END = re.compile(r"(?<!\bal\.)(?<!e\.g\.)(?<!i\.e\.)(?<!\bFig\.)(?<!\bEq\.)(?<=[.!?])\s+|\n+")


def split_sentences(text: str) -> list[str]:
    """Split a chunk into sentences, dropping empty pieces."""

    # Split at sentence ends and line breaks, trim each piece
    return [piece.strip() for piece in SENTENCE_END.split(text) if piece.strip()]


def format_passages(chunks: list[Document]) -> str:
    """Number each chunk and each of its sentences as (chunk.sentence)."""

    # One block per chunk with its source label and numbered sentences
    blocks = []
    for number, chunk in enumerate(chunks, start=1):
        lines = [f"[{number}] ({source_label(chunk.metadata)})"]
        for index, sentence in enumerate(split_sentences(chunk.text), start=1):
            lines.append(f"({number}.{index}) {sentence}")
        blocks.append("\n".join(lines))

    # Blank line between blocks
    return "\n\n".join(blocks)


def build_compression_messages(question: str, chunks: list[Document]) -> list[dict]:
    """Return the system and user messages for the compression call."""

    # User message: the question first, then the numbered sentences
    user_message = f"QUESTION: {question}\n\nPASSAGES:\n{format_passages(chunks)}"

    # Chat messages in the format the OpenAI API expects
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]
