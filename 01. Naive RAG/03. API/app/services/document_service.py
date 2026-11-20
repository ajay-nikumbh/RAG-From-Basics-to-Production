"""
Document service.

This file answers questions about the indexed files and manages them:

- list_documents: one summary per file (type, pages or sheets, chunks, size
  and upload time), read from the chunk metadata in the store and the file
  in data/uploads.
- list_chunks: every chunk of one file, in order, for the document viewer.
- uploaded_file: the path of the original file, so the UI can show the PDF.
- delete_document: remove a file's chunks from the index and its upload.
"""

# Imports
from app.services.vector_store import get_vector_store
from app.services.ingestion_service import STORE_LOCK
from app.vectorstore.faiss_store import FaissStore
from app.core.config import get_settings
from datetime import datetime, timezone
from dataclasses import dataclass
from pathlib import Path


class DocumentNotFoundError(LookupError):
    """Raised when no indexed file has the given name."""


@dataclass
class DocumentSummary:
    """One indexed file."""

    # File name
    source: str

    # pdf, excel, word, text or markdown
    file_type: str

    # Pages (PDF), sheets (Excel) or 1 (whole-file types)
    parts: int

    # Chunks stored for this file
    chunks: int

    # Size of the uploaded file in bytes and upload time (ISO, UTC), when the file is present
    size_bytes: int | None = None
    uploaded_at: str | None = None


def uploaded_file(source: str) -> Path:
    """Return the path of an uploaded file, or raise DocumentNotFoundError."""

    # Only the file name is used, never a folder path from the request
    path = get_settings().upload_dir / Path(source).name
    if not path.is_file():
        raise DocumentNotFoundError(f"'{source}' was not found")

    return path


def list_documents(store: FaissStore | None = None) -> list[DocumentSummary]:
    """Return one summary per indexed file, in upload order."""

    # Use the shared store unless a test passes one
    store = store or get_vector_store()

    # Group chunks by file name; dicts keep insertion order, which is upload order
    groups: dict[str, list[dict]] = {}
    for chunk in store.chunks:
        groups.setdefault(chunk.metadata.get("source", "unknown"), []).append(chunk.metadata)

    # Build one summary per file
    summaries = []
    for source, metadatas in groups.items():

        # Distinct pages or sheets; files without either count as one part
        parts = {m.get("page", m.get("sheet")) for m in metadatas}

        # Size and upload time come from the saved upload, if it is there
        path = get_settings().upload_dir / source
        stat = path.stat() if path.is_file() else None

        summaries.append(
            DocumentSummary(
                source=source,
                file_type=metadatas[0].get("file_type", "unknown"),
                parts=len(parts),
                chunks=len(metadatas),
                size_bytes=stat.st_size if stat else None,
                uploaded_at=datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(timespec="seconds") if stat else None,
            )
        )

    return summaries


def list_chunks(source: str, store: FaissStore | None = None) -> list[dict]:
    """Return every chunk of one file in order, or raise DocumentNotFoundError."""

    # Use the shared store unless a test passes one
    store = store or get_vector_store()

    # Chunks of this file with their position and page or sheet
    chunks = [
        {
            "chunk_index": chunk.metadata.get("chunk_index", 0),
            "page": chunk.metadata.get("page"),
            "sheet": chunk.metadata.get("sheet"),
            "text": chunk.text,
        }
        for chunk in store.chunks
        if chunk.metadata.get("source") == source
    ]

    # Unknown file
    if not chunks:
        raise DocumentNotFoundError(f"'{source}' is not indexed")

    return chunks


def delete_document(source: str, store: FaissStore | None = None) -> int:
    """Remove a file from the index and delete its upload; return the chunks removed."""

    # Use the shared store unless a test passes one
    settings = get_settings()
    store = store or get_vector_store()

    # Change the shared store one request at a time, then save it
    with STORE_LOCK:
        removed = store.remove_source(source)
        if removed == 0:
            raise DocumentNotFoundError(f"'{source}' is not indexed")
        store.save(settings.index_dir)

    # Remove the original upload too
    (settings.upload_dir / Path(source).name).unlink(missing_ok=True)

    return removed
