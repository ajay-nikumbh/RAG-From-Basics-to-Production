"""
Document schemas.

This file defines the responses of the document endpoints: what was indexed
for one upload (with step timings), the list of indexed files, the chunks of
one file and the result of deleting a file.
"""

# Imports
from pydantic import BaseModel


class StepTiming(BaseModel):
    """Duration of one ingestion step."""

    # load, chunk, embed, store or save
    name: str

    # Milliseconds the step took
    ms: int


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

    # Embedding tokens used and their cost in US dollars
    embedding_tokens: int = 0
    cost_usd: float = 0.0

    # Duration of each pipeline step
    steps: list[StepTiming] = []


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

    # Upload size in bytes and upload time (ISO, UTC), when the file is present
    size_bytes: int | None = None
    uploaded_at: str | None = None


class DocumentListResponse(BaseModel):
    """Response body of GET /documents."""

    # Indexed files in upload order
    documents: list[DocumentInfo]

    # Chunks in the whole index
    total_chunks: int


class ChunkInfo(BaseModel):
    """One chunk of a file in GET /documents/{source}/chunks."""

    # Position of the chunk inside its page, sheet or file
    chunk_index: int

    # PDF page or Excel sheet, when the file has them
    page: int | None = None
    sheet: str | None = None

    # The chunk text
    text: str


class DocumentChunksResponse(BaseModel):
    """Response body of GET /documents/{source}/chunks."""

    # File name
    source: str

    # Chunks in index order
    chunks: list[ChunkInfo]


class DocumentDeleteResponse(BaseModel):
    """Response body of DELETE /documents/{source}."""

    # File name
    source: str

    # Chunks removed from the index
    removed_chunks: int
