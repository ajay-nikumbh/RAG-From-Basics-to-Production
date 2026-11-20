"""
Document listing service.

This file summarises what is in the vector store, one entry per indexed
file: its name, file type, how many pages or sheets it had and how many
chunks it was split into. The UI uses this to show the list of uploaded
documents. Everything is read from the chunk metadata already in the store,
so no extra database is needed.
"""

# Imports
from app.services.vector_store import get_vector_store
from app.vectorstore.faiss_store import FaissStore
from dataclasses import dataclass


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

        summaries.append(
            DocumentSummary(
                source=source,
                file_type=metadatas[0].get("file_type", "unknown"),
                parts=len(parts),
                chunks=len(metadatas),
            )
        )

    return summaries
