"""
Main API router.

This file collects the routers from every route module into one api_router.
main.py registers only this router, so adding a new endpoint group means
adding one include_router line here.
"""

# Imports
from app.api.routes import analytics, documents, evals, health, query
from fastapi import APIRouter


# One router that holds all endpoint groups
api_router = APIRouter()

# Health endpoints: GET /health
api_router.include_router(health.router)

# Document endpoints: POST /documents
api_router.include_router(documents.router)

# Query endpoints: POST /query
api_router.include_router(query.router)

# Analytics endpoints: GET /analytics
api_router.include_router(analytics.router)

# Evaluation endpoints: POST /evals/answer
api_router.include_router(evals.router)
