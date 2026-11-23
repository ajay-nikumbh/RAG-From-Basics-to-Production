"""
Analytics schemas.

This file defines the response of GET /analytics: totals over every recorded
query and ingestion (runs, tokens, cost, average query time), one point per
day for the charts, the average cost, tokens and time of each query pipeline
stage, the most recent runs for the activity table, and the USD to INR rate
used to show costs in rupees.
"""

# Imports
from pydantic import BaseModel


class AnalyticsTotals(BaseModel):
    """Totals over all recorded runs."""

    # Number of runs (evaluation runs are counted on their own)
    queries: int
    ingestions: int
    evals: int = 0

    # Tokens by type and in total
    embedding_tokens: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

    # Cost in US dollars and average query time in milliseconds
    cost_usd: float
    avg_query_latency_ms: int


class DailyPoint(BaseModel):
    """Usage on one day (UTC)."""

    # Day as YYYY-MM-DD
    date: str

    # Cost, tokens and runs on that day
    cost_usd: float
    tokens: int
    queries: int
    ingestions: int
    evals: int = 0


class AnalyticsResponse(BaseModel):
    """Response body of GET /analytics."""

    # Totals over all runs
    totals: AnalyticsTotals

    # One point per day, oldest first
    daily: list[DailyPoint]

    # Average cost, tokens and time per pipeline stage of a question
    stages: dict[str, dict] = {}

    # Most recent runs, newest first, as recorded (kind, tokens, cost, latency, question or file)
    recent: list[dict]

    # Exchange rate the UI uses to show costs in Indian rupees
    usd_to_inr: float
