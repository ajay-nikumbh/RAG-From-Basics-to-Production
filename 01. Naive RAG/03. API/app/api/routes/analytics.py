"""
Analytics route.

This file defines GET /analytics. It reads every recorded query and
ingestion run from the usage file and returns the totals, the daily series
and the most recent runs used by the analytics page in the UI.
"""

# Imports
from app.services.usage import read_events, summarize
from app.schemas.analytics import AnalyticsResponse
from fastapi import APIRouter


# Router for analytics endpoints, shown under the "Analytics" group in the API docs
router = APIRouter(tags=["Analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics() -> AnalyticsResponse:
    """Usage totals, daily cost and tokens, and recent runs."""

    # Summarise every recorded run
    return AnalyticsResponse(**summarize(read_events()))
