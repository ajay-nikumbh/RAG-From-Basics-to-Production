"""
Request logging middleware.

This file gives every request a short id and logs it, so the flow of one
request can be followed even when several run at the same time.

    - Requests that do work (POST, PUT, DELETE) are separated by an empty
      line and get a start line with the client address and body size, the
      pipeline step lines in between, and an end line with the status, total
      time and response size.
    - Reads (GET) are logged as one line when they finish, because the UI
      polls them often (documents, analytics, evaluation runs).
    - Health checks are logged at debug level only.
"""

# Imports
from app.core.logging import format_duration, get_logger, log_spacer, request_id
from fastapi import Request
import time
import uuid


# Logger for request lines
log = get_logger(__name__)

# Paths that are polled often and only logged at debug level
QUIET_PATHS = {"/health"}

# Methods that change data or run the pipeline; they get the full start and end lines
WORK_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def status_style(status: int) -> str:
    """Green for success, yellow for client errors, red for server errors."""

    # Pick a Rich color by status class
    if status < 400:
        return "green"
    if status < 500:
        return "yellow"
    return "red"


def format_size(value: str | None) -> str:
    """Turn a Content-Length header into "74 B", "3.9 KB" or "1.2 MB"."""

    # Unknown size (for example streamed files)
    if not value:
        return "-"

    # Pick the unit
    size = int(value)
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    return f"{size / 1024 / 1024:.1f} MB"


async def log_requests(request: Request, call_next):
    """Assign a request id and log the request with its metadata."""

    # Short random id, shared by every log line of this request
    token = request_id.set(uuid.uuid4().hex[:4])
    start = time.perf_counter()

    # Route text with the query string, and the kind of request
    query = f"?{request.url.query}" if request.url.query else ""
    route = f"[bold]{request.method} {request.url.path}{query}[/]"
    quiet = request.url.path in QUIET_PATHS
    work = request.method in WORK_METHODS and not quiet
    level = log.debug if quiet else log.info

    # Work requests: empty line, then a start line with client and body size
    if work:
        log_spacer()
        client = request.client.host if request.client else "-"
        level(f"{route}  [dim]started  client={client}  body={format_size(request.headers.get('content-length'))}[/]")

    # Run the request; log unexpected errors with the time spent
    try:
        response = await call_next(request)
    except Exception:
        log.exception(f"{route}  [bold red]500[/]  {format_duration(time.perf_counter() - start)}")
        request_id.reset(token)
        raise

    # End line with the colored status, total time and response size
    style = status_style(response.status_code)
    size = format_size(response.headers.get("content-length"))
    level(f"{route}  [bold {style}]{response.status_code}[/]  {format_duration(time.perf_counter() - start)}  [dim]response={size}[/]")

    # Clear the id for whatever runs next
    request_id.reset(token)
    return response
