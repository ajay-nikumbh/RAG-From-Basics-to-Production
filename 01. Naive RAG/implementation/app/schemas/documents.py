"""
Document upload schemas.

This file defines the response returned by POST /documents after a file has
been uploaded and indexed: the file name and how many documents and chunks
were created.
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
