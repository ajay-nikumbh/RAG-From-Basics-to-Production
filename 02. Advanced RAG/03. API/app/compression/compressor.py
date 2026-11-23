"""
Context compressor (optional, extractive).

This file shortens the kept chunks before generation. Each chunk is split
into sentences, one gpt-4o-mini call returns the numbers of the sentences
that help answer the question, and only those original sentences are kept,
in their original order. A chunk with no kept sentence is removed.

Compression is off by default (COMPRESSION_ENABLED). If it is off, the call
fails, the reply cannot be read or every sentence would be removed, the
chunks are returned unchanged, so compression never stops an answer.
"""

# Imports
from app.compression.prompts import build_compression_messages, split_sentences
from app.core.azure_client import get_azure_client
from app.services.usage import add_chat_tokens
from app.ingestion.document import Document
from app.core.config import get_settings
from dataclasses import dataclass, field
import json


@dataclass
class CompressionOutcome:
    """The compressed chunks, which original chunks they came from, and why."""

    # Compressed chunks, in the original order
    chunks: list[Document] = field(default_factory=list)

    # Position (0-based) of each compressed chunk in the input list
    kept_indexes: list[int] = field(default_factory=list)

    # True only when the model's selection was used
    compressed: bool = False

    # Short reason, for logs and the trace
    reason: str = ""

    # Context size before and after, in characters
    chars_before: int = 0
    chars_after: int = 0


def unchanged(chunks: list[Document], reason: str) -> CompressionOutcome:
    """Outcome that keeps every chunk as it is."""

    # Same text before and after
    size = sum(len(chunk.text) for chunk in chunks)
    return CompressionOutcome(list(chunks), list(range(len(chunks))), False, reason, size, size)


def read_selection(reply_text: str) -> dict[int, set[int]]:
    """Turn the JSON reply into {chunk number: set of sentence numbers}."""

    # The reply must hold an object under "keep"
    keep = json.loads(reply_text).get("keep", {})

    # Chunk numbers come as strings in JSON keys
    return {int(number): {int(index) for index in indexes} for number, indexes in keep.items()}


def compress_chunks(question: str, chunks: list[Document], client=None) -> CompressionOutcome:
    """Keep only the sentences that help answer the question."""

    # Switched off, or nothing to compress
    settings = get_settings()
    if not settings.compression_enabled:
        return unchanged(chunks, "compression disabled")
    if not chunks:
        return unchanged(chunks, "no chunks")

    # One chat completion that returns the sentence numbers to keep
    try:
        client = client or get_azure_client()
        response = client.chat.completions.create(
            model=settings.azure_openai_deployment_name,
            messages=build_compression_messages(question, chunks),
            temperature=0.0,
            max_tokens=settings.compression_max_tokens,
            response_format={"type": "json_object"},
        )
    except Exception as error:
        return unchanged(chunks, f"compression call failed: {type(error).__name__}")

    # Count the tokens of this call in the running query
    if getattr(response, "usage", None):
        add_chat_tokens(response.usage.prompt_tokens, response.usage.completion_tokens)

    # Read the selected sentence numbers
    try:
        selection = read_selection(response.choices[0].message.content or "")
    except (json.JSONDecodeError, AttributeError, TypeError, ValueError):
        return unchanged(chunks, "reply was not valid JSON")

    # Rebuild each chunk from its kept sentences, in their original order
    compressed = []
    kept_indexes = []
    for position, chunk in enumerate(chunks):
        sentences = split_sentences(chunk.text)
        wanted = selection.get(position + 1, set())
        kept = [sentence for index, sentence in enumerate(sentences, start=1) if index in wanted]
        if kept:
            compressed.append(Document(text=" ".join(kept), metadata=chunk.metadata))
            kept_indexes.append(position)

    # Removing everything would leave nothing to answer from: keep the original chunks
    if not compressed:
        return unchanged(chunks, "no sentence selected, kept original chunks")

    # Sizes for the trace
    before = sum(len(chunk.text) for chunk in chunks)
    after = sum(len(chunk.text) for chunk in compressed)
    return CompressionOutcome(compressed, kept_indexes, True, "compressed", before, after)
