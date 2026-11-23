"""
Tests for the document listing service.

These tests fill a small store with chunks from a PDF (two pages) and an Excel
file (one sheet) and check that each file is summarised once with the right
type, number of parts and number of chunks.
"""

# Imports
from app.services.document_service import DocumentSummary, list_documents
from app.vectorstore.faiss_store import FaissStore
from app.ingestion.document import Document
import numpy as np


def test_list_documents_groups_chunks_by_file():
    """Three PDF chunks on two pages and one Excel chunk give two summaries."""

    # Chunks from two files
    chunks = [
        Document("a", {"source": "paper.pdf", "page": 1, "file_type": "pdf"}),
        Document("b", {"source": "paper.pdf", "page": 1, "file_type": "pdf"}),
        Document("c", {"source": "paper.pdf", "page": 2, "file_type": "pdf"}),
        Document("d", {"source": "leave.xlsx", "sheet": "Leave", "file_type": "excel"}),
    ]
    store = FaissStore(dimensions=3)
    store.add(np.random.rand(4, 3).astype("float32"), chunks)

    # One summary per file, in upload order
    assert list_documents(store) == [
        DocumentSummary(source="paper.pdf", file_type="pdf", parts=2, chunks=3),
        DocumentSummary(source="leave.xlsx", file_type="excel", parts=1, chunks=1),
    ]
