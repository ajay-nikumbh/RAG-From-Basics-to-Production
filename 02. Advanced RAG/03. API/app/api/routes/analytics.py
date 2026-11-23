"""
Analytics route.

This file defines GET /analytics. It reads every recorded query and
ingestion run from the usage file and returns the totals, the daily series
and the most recent runs used by the analytics page in the UI, plus the USD
to INR rate so the UI can show costs in rupees.
"""

# Imports
from app.services.usage import read_events, summarize
from app.schemas.analytics import AnalyticsResponse
from app.core.config import get_settings
from fastapi import APIRouter


# Router for analytics endpoints, shown under the "Analytics" group in the API docs
router = APIRouter(tags=["Analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics() -> AnalyticsResponse:
    """Usage totals, daily cost and tokens, and recent runs."""

    # Summarise every recorded run and add the rupee exchange rate
    return AnalyticsResponse(**summarize(read_events()), usd_to_inr=get_settings().usd_to_inr)
