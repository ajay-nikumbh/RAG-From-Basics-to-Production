"""
Document schemas.

This file defines the responses of the document endpoints: POST /documents
returns what was indexed for one uploaded file, and GET /documents returns the
list of all indexed files.
"""

# Imports
from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    """Response body of POST /documents."""

    # Name of the uploaded file
    source: str

    # Pages, sheets or files read by the loader
    documents: int

    # Chunks created and stored for this file
    chunks: int

    # Chunks in the whole index after this upload
    total_chunks: int


class DocumentInfo(BaseModel):
    """One indexed file in GET /documents."""

    # File name
    source: str

    # pdf, excel, word, text or markdown
    file_type: str

    # Pages, sheets or 1 for whole-file types
    parts: int

    # Chunks stored for this file
    chunks: int


class DocumentListResponse(BaseModel):
    """Response body of GET /documents."""

    # Indexed files in upload order
    documents: list[DocumentInfo]

    # Chunks in the whole index
    total_chunks: int
