"""
Analytics schemas.

This file defines the response of GET /analytics: totals over every recorded
query and ingestion (runs, tokens, cost, average query time), one point per
day for the charts, and the most recent runs for the activity table.
"""

# Imports
from pydantic import BaseModel


class AnalyticsTotals(BaseModel):
    """Totals over all recorded runs."""

    # Number of runs
    queries: int
    ingestions: int

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


class AnalyticsResponse(BaseModel):
    """Response body of GET /analytics."""

    # Totals over all runs
    totals: AnalyticsTotals

    # One point per day, oldest first
    daily: list[DailyPoint]

    # Most recent runs, newest first, as recorded (kind, tokens, cost, latency, question or file)
    recent: list[dict]
