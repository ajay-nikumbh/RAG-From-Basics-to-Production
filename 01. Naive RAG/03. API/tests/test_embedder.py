"""
Tests for the embedder.

These tests use a fake client instead of the real Azure OpenAI API, so they
run offline and cost nothing. They check that texts are sent in batches, that
the output keeps the input order and that the result is a float32 matrix.
"""

# Imports
from app.embeddings.embedder import BATCH_SIZE, embed_query, embed_texts
from types import SimpleNamespace
import numpy as np


class FakeEmbeddings:
    """Stands in for client.embeddings and records every request."""

    def __init__(self):
        """Start with no recorded requests."""

        # Batch sizes seen so far
        self.batch_sizes = []

    def create(self, model, input):
        """Return a 3-number vector per text: [text length, batch number, 1]."""

        # Remember the size of this batch
        self.batch_sizes.append(len(input))
        batch_number = len(self.batch_sizes)

        # Build a response shaped like the real API response
        data = [SimpleNamespace(embedding=[len(text), batch_number, 1.0]) for text in input]
        return SimpleNamespace(data=data)


def test_embed_texts_batches_and_keeps_order():
    """250 texts are sent as batches of 100, 100 and 50, in order."""

    # Fake client and 250 texts of growing length
    client = SimpleNamespace(embeddings=FakeEmbeddings())
    texts = ["x" * (number + 1) for number in range(250)]

    # Embed them
    vectors = embed_texts(texts, client=client)

    # Three requests with the expected sizes
    assert client.embeddings.batch_sizes == [BATCH_SIZE, BATCH_SIZE, 50]

    # One float32 row per text, in the original order
    assert vectors.shape == (250, 3)
    assert vectors.dtype == np.float32
    assert vectors[0][0] == 1 and vectors[249][0] == 250
    assert vectors[249][1] == 3


def test_embed_query_returns_one_row():
    """A single question gives a (1, dimensions) matrix."""

    # Fake client
    client = SimpleNamespace(embeddings=FakeEmbeddings())

    # Embed one question
    assert embed_query("What is RAG?", client=client).shape == (1, 3)
