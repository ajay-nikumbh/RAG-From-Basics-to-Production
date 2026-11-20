"""
Document routes.

This file defines the document endpoints. GET /documents lists every indexed
file, GET /documents/{source}/file returns the original file (the UI shows
PDFs from it), GET /documents/{source}/chunks returns its chunks and
DELETE /documents/{source} removes it. POST /documents receives one uploaded
file, checks the
file type and that the file is not already indexed, saves it to data/uploads
and runs the ingestion service (load, chunk, embed, store). Known problems are
returned as clear HTTP errors:

    400 unsupported file type
    409 file already indexed
    422 file has no extractable text
"""

# Imports
from app.services.document_service import DocumentNotFoundError, delete_document, list_chunks, uploaded_file
from app.services.ingestion_service import DuplicateDocumentError, EmptyDocumentError, ingest_file
from app.schemas.documents import DocumentChunksResponse, DocumentDeleteResponse, DocumentInfo
from app.schemas.documents import DocumentListResponse, DocumentUploadResponse, StepTiming
from app.ingestion.file_loader import UnsupportedFileError, supported_extensions
from fastapi import APIRouter, File, HTTPException, UploadFile
from app.services.document_service import list_documents
from app.services.vector_store import get_vector_store
from fastapi.responses import FileResponse
from app.core.config import get_settings
from pathlib import Path
import shutil


# Router for document endpoints, shown under the "Documents" group in the API docs
router = APIRouter(tags=["Documents"])


@router.get("/documents", response_model=DocumentListResponse)
def get_documents() -> DocumentListResponse:
    """List every indexed file with its type, parts and chunk count."""

    # Summaries built from the chunk metadata in the store
    summaries = list_documents()

    # Convert to the response schema
    return DocumentListResponse(
        documents=[
            DocumentInfo(
                source=s.source,
                file_type=s.file_type,
                parts=s.parts,
                chunks=s.chunks,
                size_bytes=s.size_bytes,
                uploaded_at=s.uploaded_at,
            )
            for s in summaries
        ],
        total_chunks=sum(s.chunks for s in summaries),
    )


@router.post("/documents", response_model=DocumentUploadResponse)
def upload_document(file: UploadFile = File(...)) -> DocumentUploadResponse:
    """Upload one file and index it for question answering."""

    # Keep only the file name, never a folder path sent by the client
    file_name = Path(file.filename or "").name

    # Reject unsupported types before saving anything
    if Path(file_name).suffix.lower() not in supported_extensions():
        allowed = ", ".join(supported_extensions())
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {allowed}")

    # Reject files that are already indexed, without overwriting the saved copy
    if file_name in get_vector_store().sources():
        raise HTTPException(status_code=409, detail=f"'{file_name}' is already indexed")

    # Save the upload to data/uploads
    upload_path = get_settings().upload_dir / file_name
    with upload_path.open("wb") as target:
        shutil.copyfileobj(file.file, target)

    # Run the ingestion pipeline; remove the saved file if it fails
    try:
        result = ingest_file(upload_path)
    except (UnsupportedFileError, DuplicateDocumentError, EmptyDocumentError) as error:
        upload_path.unlink(missing_ok=True)
        status = 409 if isinstance(error, DuplicateDocumentError) else 422
        raise HTTPException(status_code=status, detail=str(error))
    except Exception:
        upload_path.unlink(missing_ok=True)
        raise

    # Report what was indexed
    return DocumentUploadResponse(
        source=result.source,
        documents=result.documents,
        chunks=result.chunks,
        total_chunks=result.total_chunks,
        embedding_tokens=result.embedding_tokens,
        cost_usd=result.cost_usd,
        steps=[StepTiming(**step) for step in result.steps],
    )


@router.get("/documents/{source}/file")
def get_document_file(source: str) -> FileResponse:
    """Return the original uploaded file, shown inline in the browser."""

    # Find the saved upload or answer 404
    try:
        path = uploaded_file(source)
    except DocumentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))

    # inline lets the browser and the PDF viewer display it instead of downloading
    return FileResponse(path, filename=path.name, content_disposition_type="inline")


@router.get("/documents/{source}/chunks", response_model=DocumentChunksResponse)
def get_document_chunks(source: str) -> DocumentChunksResponse:
    """Return every chunk of one indexed file, in order."""

    # Chunks from the store or 404
    try:
        chunks = list_chunks(source)
    except DocumentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))

    return DocumentChunksResponse(source=source, chunks=chunks)


@router.delete("/documents/{source}", response_model=DocumentDeleteResponse)
def remove_document(source: str) -> DocumentDeleteResponse:
    """Remove a file from the index and delete its upload."""

    # Delete or 404
    try:
        removed = delete_document(source)
    except DocumentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))

    return DocumentDeleteResponse(source=source, removed_chunks=removed)
