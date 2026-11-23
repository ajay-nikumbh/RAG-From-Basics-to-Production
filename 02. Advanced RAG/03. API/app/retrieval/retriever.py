"""
Retriever.

This file is the first step of the online query pipeline. It embeds the user
question with the same model used for the chunks and asks the FAISS store for
the top_k most similar chunks. The result is a list of SearchResult (chunk plus
cosine similarity score), best first.

For Advanced RAG, retrieve_candidates() asks for a larger candidate set
(candidate_k) when reranking is on, so the reranker has more chunks to choose
from. With reranking off it asks for top_k, exactly like Naive RAG.
"""

# Imports
from app.vectorstore.faiss_store import FaissStore, SearchResult
from app.services.vector_store import get_vector_store
from app.embeddings.embedder import embed_query
from app.core.config import get_settings


def retrieve(question: str, top_k: int | None = None, store: FaissStore | None = None) -> list[SearchResult]:
    """Return the top_k chunks most similar to the question, best first."""

    # Use the configured top_k and the shared store unless the caller passes them
    top_k = top_k or get_settings().top_k
    store = store or get_vector_store()

    # Nothing indexed yet: skip the embedding call
    if store.count == 0:
        return []

    # Turn the question into a vector with the same model as the chunks
    query_vector = embed_query(question)

    # Find the most similar chunks
    return store.search(query_vector, top_k)


def candidate_count() -> int:
    """Number of chunks to retrieve: candidate_k for the reranker, or top_k without it."""

    # Reranking needs a wider set; without it the Naive top_k is used
    settings = get_settings()
    return settings.candidate_k if settings.rerank_enabled else settings.top_k


def retrieve_candidates(search_query: str, store: FaissStore | None = None) -> list[SearchResult]:
    """Return the candidate chunks for the search query, best first by similarity."""

    # Same search as Naive RAG, only the number of results changes
    return retrieve(search_query, top_k=candidate_count(), store=store)
