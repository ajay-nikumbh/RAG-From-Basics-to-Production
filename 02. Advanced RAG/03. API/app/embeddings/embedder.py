"""
Text embedder.

This file turns text into vectors with the Azure OpenAI embedding deployment
(text-embedding-3-small, 1536 numbers per text). Chunks are sent in batches to
keep each request small, and the result is a NumPy float32 matrix with one row
per text, which is the format FAISS expects. The token count of every request
is added to the usage meter of the running query or ingestion.

embed_texts is used at ingestion time for many chunks; embed_query is used at
question time for one question.
"""

# Imports
from app.services.usage import add_embedding_tokens
from app.core.azure_client import get_azure_client
from app.core.config import get_settings
import numpy as np


# Number of texts sent in one embeddings request
BATCH_SIZE = 100


def embed_texts(texts: list[str], client=None) -> np.ndarray:
    """Return a (number of texts, dimensions) float32 matrix of embeddings."""

    # Read the shared settings and use the shared client unless a test passes one
    settings = get_settings()
    client = client or get_azure_client()

    # Collect vectors batch by batch, in the same order as the texts
    vectors = []
    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start:start + BATCH_SIZE]

        # One request for the whole batch
        response = client.embeddings.create(
            model=settings.azure_openai_embedding_deployment,
            input=batch,
        )

        # The API returns one embedding per input, in input order
        vectors.extend(item.embedding for item in response.data)

        # Count the tokens of this request for usage and cost
        if getattr(response, "usage", None):
            add_embedding_tokens(response.usage.prompt_tokens)

    # FAISS works with float32 matrices
    return np.array(vectors, dtype="float32").reshape(len(vectors), -1)


def embed_query(text: str, client=None) -> np.ndarray:
    """Return the embedding of one question as a (1, dimensions) matrix."""

    # Same model as the chunks, so question and chunk vectors are comparable
    return embed_texts([text], client=client)
