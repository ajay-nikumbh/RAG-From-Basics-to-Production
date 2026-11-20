"""
FastAPI application entry point.

This file creates the FastAPI app, makes sure the data folders exist and
registers all API routes. Start the server from 01. Naive RAG/implementation
with:

    .venv/bin/uvicorn app.main:app --reload

Interactive API docs are then available at http://127.0.0.1:8000/docs
"""

# Imports
from app.core.config import get_settings
from app.api.router import api_router
from fastapi import FastAPI


# Read the shared settings
settings = get_settings()

# Create the data folders for uploads and the FAISS index if they are missing
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.index_dir.mkdir(parents=True, exist_ok=True)

# Create the FastAPI app with the name and version shown in the docs
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Naive RAG: upload documents, then ask questions answered from them.",
)

# Register every endpoint group
app.include_router(api_router)
