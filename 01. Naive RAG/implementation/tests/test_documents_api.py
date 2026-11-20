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
    assert response.json() == {"source": "policy.txt", "documents": 1, "chunks": 1, "total_chunks": 1}

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

    # Both listed in upload order with their type and counts
    assert client.get("/documents").json() == {
        "documents": [
            {"source": "policy.txt", "file_type": "text", "parts": 1, "chunks": 1},
            {"source": "notes.md", "file_type": "markdown", "parts": 1, "chunks": 1},
        ],
        "total_chunks": 2,
    }
