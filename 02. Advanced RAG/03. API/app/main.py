"""
FastAPI application entry point.

This file sets up logging, creates the FastAPI app, makes sure the data
folders exist, adds the request logging middleware and registers all API
routes. When the server starts it logs a short summary of the configuration
and of the loaded index. Start the server from 02. Advanced RAG/03. API with:

    .venv/bin/uvicorn app.main:app --reload --port 8001

Interactive API docs are then available at http://127.0.0.1:8001/docs
"""

# Imports
from app.services.vector_store import get_vector_store
from app.core.logging import get_logger, setup_logging
from app.api.middleware import log_requests
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.api.router import api_router
from fastapi import FastAPI


# Read the shared settings
settings = get_settings()

# Clean, structured logs for the whole app
setup_logging(settings.log_level)
log = get_logger(__name__)

# Create the data folders for uploads and the FAISS index if they are missing
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.index_dir.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Log the configuration and the loaded index once at startup."""

    # Load the index now, so the first request does not pay for it
    store = get_vector_store()

    # Startup summary
    log.info(f"[bold]{settings.app_name}[/] [dim]v{settings.app_version}[/] starting")
    log.info(f"  chat model    [cyan]{settings.azure_openai_deployment_name or 'not set'}[/]")
    log.info(f"  embeddings    [cyan]{settings.azure_openai_embedding_deployment}[/]  dims=[cyan]{settings.embedding_dimensions}[/]")
    log.info(f"  chunking      size=[cyan]{settings.chunk_size}[/]  overlap=[cyan]{settings.chunk_overlap}[/]  top_k=[cyan]{settings.top_k}[/]")
    log.info(f"  index         files=[cyan]{len(store.sources())}[/]  chunks=[cyan]{store.count}[/]")
    yield


# Create the FastAPI app with the name and version shown in the docs
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Advanced RAG: upload documents, then ask questions answered through query rewriting, reranking and filtering.",
    lifespan=lifespan,
)

# Log every request with an id, status and duration
app.middleware("http")(log_requests)

# Register every endpoint group
app.include_router(api_router)
