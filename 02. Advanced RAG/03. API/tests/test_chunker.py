"""
Tests for the chunker.

These tests check that short text stays whole, that long text is split into
chunks no longer than chunk_size, that paragraph breaks are preferred as split
points, that neighbouring chunks overlap, and that chunk metadata keeps the
parent metadata plus a chunk_index.
"""

# Imports
from app.ingestion.chunker import chunk_documents, split_text
from app.ingestion.document import Document
import pytest


def test_short_text_stays_one_chunk():
    """Text shorter than chunk_size is returned as one chunk."""

    # One short sentence
    assert split_text("Hello world.", chunk_size=100, chunk_overlap=10) == ["Hello world."]


def test_chunks_respect_size_and_prefer_paragraphs():
    """Two paragraphs that do not fit together become two chunks, split at the blank line."""

    # Two paragraphs of 60 characters each
    first = "A" * 59 + "."
    second = "B" * 59 + "."
    chunks = split_text(f"{first}\n\n{second}", chunk_size=80, chunk_overlap=0)

    # Split exactly at the paragraph break
    assert chunks == [first, second]


def test_neighbouring_chunks_overlap():
    """The end of one chunk is repeated at the start of the next."""

    # Forty numbered words, about 300 characters
    text = " ".join(f"word{number}" for number in range(40))
    chunks = split_text(text, chunk_size=100, chunk_overlap=30)

    # Every chunk respects the size limit
    assert all(len(chunk) <= 100 for chunk in chunks)

    # The last word of chunk 1 appears again in chunk 2
    last_word = chunks[0].split()[-1]
    assert last_word in chunks[1].split()


def test_chunk_documents_keeps_metadata():
    """Chunks copy the parent metadata and add a chunk_index from 0."""

    # One long document
    document = Document(text="one two three " * 20, metadata={"source": "a.pdf", "page": 2})
    chunks = chunk_documents([document], chunk_size=50, chunk_overlap=10)

    # Several chunks, numbered in order, with parent metadata
    assert len(chunks) > 1
    assert chunks[0].metadata == {"source": "a.pdf", "page": 2, "chunk_index": 0}
    assert chunks[1].metadata["chunk_index"] == 1


def test_overlap_must_be_smaller_than_chunk_size():
    """An overlap equal to the chunk size is rejected."""

    # Invalid settings
    with pytest.raises(ValueError):
        chunk_documents([Document(text="x")], chunk_size=10, chunk_overlap=10)
