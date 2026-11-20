"""
Logging setup.

This file makes the API logs easy to read in the terminal. Every line shows
the time, the level, a short request id and a message, rendered with Rich so
levels and numbers stand out. Inside a request, each pipeline step is logged
as one aligned line with its metadata and how long it took, for example:

    [12:04:31] INFO  a1b2  POST /query  started
    [12:04:31] INFO  a1b2    retrieve      results=4  top_score=0.544     412 ms
    [12:04:33] INFO  a1b2    generate      tokens_in=1150  tokens_out=86  1.84 s
    [12:04:33] INFO  a1b2  POST /query  200  2.31 s

Use get_logger(__name__) in any file and log_step(...) around any step.
"""

# Imports
from contextlib import contextmanager
from rich.logging import RichHandler
from contextvars import ContextVar
from rich.console import Console
import logging
import time


# Request id of the request being handled; "-" outside a request
request_id: ContextVar[str] = ContextVar("request_id", default="-")

# Width of the step name column, so step metadata lines up
STEP_WIDTH = 12


class RequestIdFilter(logging.Filter):
    """Adds the current request id to every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Attach request_id so the formatter can print it."""

        # Read the id of the request this code is running for
        record.request_id = request_id.get()
        return True


def setup_logging(level: str = "INFO") -> None:
    """Send all app logs through one Rich handler with a clean format."""

    # Rich renders levels in color, highlights numbers and wraps long lines
    handler = RichHandler(
        console=Console(width=140),
        show_time=True,
        show_level=True,
        show_path=False,
        markup=True,
        rich_tracebacks=True,
        log_time_format="[%H:%M:%S]",
    )

    # Message format: request id first, then the message
    handler.setFormatter(logging.Formatter("[dim]%(request_id)-4s[/]  %(message)s"))
    handler.addFilter(RequestIdFilter())

    # App loggers use this handler at the chosen level
    app_logger = logging.getLogger("app")
    app_logger.handlers = [handler]
    app_logger.setLevel(level)
    app_logger.propagate = False

    # Our middleware logs every request, so the default access log is turned off
    logging.getLogger("uvicorn.access").disabled = True

    # Libraries only report warnings and errors
    for noisy in ("httpx", "openai", "faiss", "multipart"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a logger under the "app" namespace."""

    # Files pass __name__, which already starts with "app."
    return logging.getLogger(name if name.startswith("app") else f"app.{name}")


def format_duration(seconds: float) -> str:
    """Show short durations in ms and long ones in seconds."""

    # Under one second: whole milliseconds
    if seconds < 1:
        return f"{seconds * 1000:.0f} ms"

    return f"{seconds:.2f} s"


def format_meta(meta: dict) -> str:
    """Turn {"results": 4, "top_score": 0.544} into "results=4  top_score=0.544"."""

    # Two spaces between pairs keep the line readable
    return "  ".join(f"{key}=[cyan]{value}[/]" for key, value in meta.items())


@contextmanager
def log_step(logger: logging.Logger, name: str, **meta):
    """Time a block of code and log one aligned line when it finishes.

    The block can add results to the yielded dict, and they are logged too:

        with log_step(log, "chunk") as step:
            chunks = chunk_documents(...)
            step["chunks"] = len(chunks)
    """

    # Metadata known before the step plus anything the block adds
    details = dict(meta)
    start = time.perf_counter()

    # Run the step; log a failure line if it raises, then re-raise
    try:
        yield details
    except Exception as error:
        elapsed = format_duration(time.perf_counter() - start)
        logger.error(f"  [bold red]{name:<{STEP_WIDTH}}[/]  failed: {error}  [dim]{elapsed}[/]")
        raise

    # One line: step name, metadata, duration
    elapsed = format_duration(time.perf_counter() - start)
    logger.info(f"  [bold]{name:<{STEP_WIDTH}}[/]  {format_meta(details)}  [dim]{elapsed}[/]")
