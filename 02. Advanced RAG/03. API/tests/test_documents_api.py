"""
Tests for POST /documents.

These tests call the real FastAPI app through TestClient, with the embedding
call replaced by a fake and the upload and index folders moved to a temporary
folder. They check a successful upload and the 400, 409 and 422 errors.
"""

# Imports
from app.services.vector_store import get_vector_store
from app.services import ingestion_service
from fastapi.testclient import TestClient
from app.core.config import get_settings
from app.main import app
import numpy as np
import pytest


def fake_embed_texts(texts):
    """Return one random vector per text with the configured dimensions."""

    # Same length as real vectors so the shared store accepts them
    dimensions = get_settings().embedding_dimensions
    return np.random.rand(len(texts), dimensions).astype("float32")


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A test client with fake embeddings and temporary data folders."""

    # Replace the real embedding call
    monkeypatch.setattr(ingestion_service, "embed_texts", fake_embed_texts)

    # Use temporary upload and index folders
    settings = get_settings()
    monkeypatch.setattr(settings, "upload_dir", tmp_path / "uploads")
    monkeypatch.setattr(settings, "index_dir", tmp_path / "index")
    settings.upload_dir.mkdir()

    # Start every test with a fresh, empty shared store
    get_vector_store.cache_clear()
    yield TestClient(app)
    get_vector_store.cache_clear()


def test_upload_indexes_file(client):
    """A text file is saved, indexed and summarised."""

    # Upload a small text file
    response = client.post("/documents", files={"file": ("policy.txt", b"Employees get 8 sick days.")})

    # Success with the expected counts
    assert response.status_code == 200
    body = response.json()
    assert (body["source"], body["documents"], body["chunks"], body["total_chunks"]) == ("policy.txt", 1, 1, 1)

    # Every pipeline step reports its duration
    assert [step["name"] for step in body["steps"]] == ["load", "chunk", "embed", "store", "save"]

    # The file was saved to the upload folder
    assert (get_settings().upload_dir / "policy.txt").exists()


def test_upload_rejects_unsupported_type(client):
    """A .png upload gives 400."""

    # Upload an image
    response = client.post("/documents", files={"file": ("photo.png", b"fake image")})

    # Rejected before saving
    assert response.status_code == 400
    assert not (get_settings().upload_dir / "photo.png").exists()


def test_upload_rejects_duplicate(client):
    """Uploading the same file name twice gives 409."""

    # First upload works, second is a conflict
    client.post("/documents", files={"file": ("notes.md", b"# Notes")})
    response = client.post("/documents", files={"file": ("notes.md", b"# Notes")})
    assert response.status_code == 409


def test_upload_rejects_empty_file(client):
    """A file with no text gives 422 and is not kept."""

    # Upload whitespace only
    response = client.post("/documents", files={"file": ("empty.txt", b"   ")})

    # Rejected and removed from the upload folder
    assert response.status_code == 422
    assert not (get_settings().upload_dir / "empty.txt").exists()


def test_list_documents_after_uploads(client):
    """GET /documents lists every uploaded file with its counts."""

    # Nothing indexed yet
    assert client.get("/documents").json() == {"documents": [], "total_chunks": 0}

    # Upload two files
    client.post("/documents", files={"file": ("policy.txt", b"Employees get 8 sick days.")})
    client.post("/documents", files={"file": ("notes.md", b"# Notes\n\nShort text.")})

    # Both listed in upload order with their type, counts, size and upload time
    body = client.get("/documents").json()
    assert body["total_chunks"] == 2
    assert [(d["source"], d["file_type"], d["chunks"]) for d in body["documents"]] == [
        ("policy.txt", "text", 1),
        ("notes.md", "markdown", 1),
    ]
    assert body["documents"][0]["size_bytes"] == len(b"Employees get 8 sick days.")
    assert body["documents"][0]["uploaded_at"]


def test_file_chunks_and_delete(client):
    """A file can be downloaded, its chunks listed, and then deleted."""

    # Upload one file
    client.post("/documents", files={"file": ("policy.txt", b"Employees get 8 sick days.")})

    # The original file comes back unchanged
    assert client.get("/documents/policy.txt/file").content == b"Employees get 8 sick days."

    # Its chunks are listed
    chunks = client.get("/documents/policy.txt/chunks").json()["chunks"]
    assert chunks[0]["text"] == "Employees get 8 sick days."

    # Delete removes the chunks and the upload
    assert client.delete("/documents/policy.txt").json() == {"source": "policy.txt", "removed_chunks": 1}
    assert client.get("/documents").json()["documents"] == []
    assert client.get("/documents/policy.txt/file").status_code == 404


def test_unknown_document_gives_404(client):
    """Chunks and delete for a file that is not indexed give 404."""

    # Nothing indexed
    assert client.get("/documents/missing.pdf/chunks").status_code == 404
    assert client.delete("/documents/missing.pdf").status_code == 404
