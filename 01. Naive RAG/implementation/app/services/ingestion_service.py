"""
Ingestion service (offline indexing pipeline).

This file runs the full Naive RAG indexing pipeline for one file:

    load the file -> split into chunks -> embed the chunks -> add to FAISS -> save

It connects the building blocks from the ingestion, embeddings and vectorstore
packages and knows nothing about HTTP. A file whose name is already in the
store is rejected with DuplicateDocumentError, so the same text is never
indexed twice.
"""

# Imports
from app.services.vector_store import get_vector_store
from app.vectorstore.faiss_store import FaissStore
from app.ingestion.chunker import chunk_documents
from app.embeddings.embedder import embed_texts
from app.ingestion.file_loader import load_file
from app.core.config import get_settings
from dataclasses import dataclass
from pathlib import Path


class DuplicateDocumentError(ValueError):
    """Raised when a file with the same name is already indexed."""


class EmptyDocumentError(ValueError):
    """Raised when a file has no text to index."""


@dataclass
class IngestionResult:
    """Summary of one ingested file."""

    # File name
    source: str

    # Pages, sheets or files read by the loader
    documents: int

    # Chunks created and stored for this file
    chunks: int

    # Chunks in the whole store after this file
    total_chunks: int


def ingest_file(path: Path, store: FaissStore | None = None) -> IngestionResult:
    """Load, chunk, embed and store one file, then save the index."""

    # Read the shared settings and use the shared store unless a test passes one
    settings = get_settings()
    store = store or get_vector_store()

    # Do not index the same file twice
    if path.name in store.sources():
        raise DuplicateDocumentError(f"'{path.name}' is already indexed")

    # Step 1: read the file into Documents (pages, sheets or whole file)
    documents = load_file(path)

    # Step 2: split the Documents into chunks
    chunks = chunk_documents(documents, settings.chunk_size, settings.chunk_overlap)

    # Stop if there is nothing to index, for example a scanned PDF
    if not chunks:
        raise EmptyDocumentError(f"'{path.name}' has no extractable text")

    # Step 3: turn every chunk into a vector
    vectors = embed_texts([chunk.text for chunk in chunks])

    # Step 4: add the vectors and chunks to the store
    store.add(vectors, chunks)

    # Step 5: save the index so it survives a restart
    store.save(settings.index_dir)

    # Report what was done
    return IngestionResult(
        source=path.name,
        documents=len(documents),
        chunks=len(chunks),
        total_chunks=store.count,
    )
