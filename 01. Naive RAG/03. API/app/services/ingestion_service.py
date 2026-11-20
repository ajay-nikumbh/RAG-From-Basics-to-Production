"""
Ingestion service (offline indexing pipeline).

This file runs the full Naive RAG indexing pipeline for one file:

    load the file -> split into chunks -> embed the chunks -> add to FAISS -> save

It connects the building blocks from the ingestion, embeddings and vectorstore
packages and knows nothing about HTTP. A file whose name is already in the
store is rejected with DuplicateDocumentError, so the same text is never
indexed twice.

A lock makes sure only one file is added to the shared store at a time, because
FastAPI can run two upload requests in parallel threads.
"""

# Imports
from app.services.vector_store import get_vector_store
from app.vectorstore.faiss_store import FaissStore
from app.ingestion.chunker import chunk_documents
from app.core.logging import get_logger, log_step
from app.embeddings.embedder import embed_texts
from app.ingestion.file_loader import load_file
from app.services.usage import track_usage
from app.core.config import get_settings
from dataclasses import dataclass, field
from pathlib import Path
import threading


# Only one ingestion may change the shared store at a time
STORE_LOCK = threading.Lock()

# Logger for pipeline steps
log = get_logger(__name__)


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

    # Embedding tokens used and their cost in US dollars
    embedding_tokens: int = 0
    cost_usd: float = 0.0

    # Duration of each pipeline step, for example [{"name": "load", "ms": 12}]
    steps: list = field(default_factory=list)


def ingest_file(path: Path, store: FaissStore | None = None) -> IngestionResult:
    """Load, chunk, embed and store one file, then save the index."""

    # Read the shared settings and use the shared store unless a test passes one
    settings = get_settings()
    store = store or get_vector_store()

    # Do not index the same file twice
    if path.name in store.sources():
        raise DuplicateDocumentError(f"'{path.name}' is already indexed")

    # Measure tokens, cost and time of this ingestion
    with track_usage("ingest", file=path.name) as meter:

        # Step 1: read the file into Documents (pages, sheets or whole file)
        with log_step(log, "load", file=path.name) as step:
            documents = load_file(path)
            step["documents"] = len(documents)
            step["characters"] = sum(len(d.text) for d in documents)
        steps = [{"name": "load", "ms": step["duration_ms"]}]

        # Step 2: split the Documents into chunks
        with log_step(log, "chunk", size=settings.chunk_size, overlap=settings.chunk_overlap) as step:
            chunks = chunk_documents(documents, settings.chunk_size, settings.chunk_overlap)
            step["chunks"] = len(chunks)
            meter.details["chunks"] = len(chunks)
        steps.append({"name": "chunk", "ms": step["duration_ms"]})

        # Stop if there is nothing to index, for example a scanned PDF
        if not chunks:
            raise EmptyDocumentError(f"'{path.name}' has no extractable text")

        # Step 3: turn every chunk into a vector
        with log_step(log, "embed", model=settings.azure_openai_embedding_deployment) as step:
            vectors = embed_texts([chunk.text for chunk in chunks])
            step["vectors"] = len(vectors)
            step["tokens"] = meter.embedding_tokens
        steps.append({"name": "embed", "ms": step["duration_ms"]})

        # Steps 4 and 5 change the shared store, so one request at a time
        with STORE_LOCK:

            # Check again: another request may have added this file in the meantime
            if path.name in store.sources():
                raise DuplicateDocumentError(f"'{path.name}' is already indexed")

            # Step 4: add the vectors and chunks to the store
            with log_step(log, "store") as step:
                store.add(vectors, chunks)
                step["total_chunks"] = store.count
            steps.append({"name": "store", "ms": step["duration_ms"]})

            # Step 5: save the index so it survives a restart
            with log_step(log, "save", folder=settings.index_dir.name) as step:
                store.save(settings.index_dir)
            steps.append({"name": "save", "ms": step["duration_ms"]})

    # Report what was done
    return IngestionResult(
        source=path.name,
        documents=len(documents),
        chunks=len(chunks),
        total_chunks=store.count,
        embedding_tokens=meter.embedding_tokens,
        cost_usd=round(meter.cost(settings), 6),
        steps=steps,
    )
