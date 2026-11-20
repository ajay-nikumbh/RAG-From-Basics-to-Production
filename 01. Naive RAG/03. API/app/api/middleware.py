"""
Request logging middleware.

This file gives every request a short id and logs one line when it starts
and one when it ends, with the status code and total time. All step lines
logged while the request runs carry the same id, so the flow of one request
can be followed even when several run at the same time. Health checks are
logged at debug level so the UI's regular status polling does not flood the
terminal.
"""

# Imports
from app.core.logging import format_duration, get_logger, request_id
from fastapi import Request
import time
import uuid


# Logger for request lines
log = get_logger(__name__)

# Paths that are polled often and only logged at debug level
QUIET_PATHS = {"/health"}


def status_style(status: int) -> str:
    """Green for success, yellow for client errors, red for server errors."""

    # Pick a Rich color by status class
    if status < 400:
        return "green"
    if status < 500:
        return "yellow"
    return "red"


async def log_requests(request: Request, call_next):
    """Assign a request id, log the start and the end of the request."""

    # Short random id, shared by every log line of this request
    token = request_id.set(uuid.uuid4().hex[:4])
    start = time.perf_counter()

    # Quiet paths use debug level
    level = log.debug if request.url.path in QUIET_PATHS else log.info
    route = f"[bold]{request.method} {request.url.path}[/]"

    # Start line
    level(f"{route}  [dim]started[/]")

    # Run the request; log unexpected errors with the time spent
    try:
        response = await call_next(request)
    except Exception:
        log.exception(f"{route}  [bold red]500[/]  {format_duration(time.perf_counter() - start)}")
        request_id.reset(token)
        raise

    # End line with the colored status and total time
    style = status_style(response.status_code)
    level(f"{route}  [bold {style}]{response.status_code}[/]  {format_duration(time.perf_counter() - start)}")

    # Clear the id for whatever runs next
    request_id.reset(token)
    return response
