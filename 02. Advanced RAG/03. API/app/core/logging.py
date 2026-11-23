"""
Logging setup.

This file makes the API logs easy to read in the terminal. Every line shows
the time, the level, a short request id and a message, rendered with Rich so
levels and numbers stand out. Inside a request, each pipeline step is logged
as one aligned line with its metadata and how long it took, and detail lines
under a step show what the step produced (retrieved chunks, the answer,
judge scores), for example:

    [12:04:31] INFO  a1b2  POST /query  client=127.0.0.1  body=74 B
    [12:04:31] INFO  a1b2    question      "How does Self-RAG decide when to retrieve?"
    [12:04:31] INFO  a1b2    retrieve      results=4  top_score=0.544     412 ms
    [12:04:31] INFO  a1b2        #1  0.544  2310.11511_Self-RAG.pdf  p.2  "Self-RAG trains..."
    [12:04:33] INFO  a1b2    generate      tokens_in=1150  tokens_out=86  1.84 s
    [12:04:33] INFO  a1b2        answer    "Self-RAG decides ... [1]"
    [12:04:33] INFO  a1b2  POST /query  200  2.31 s  response=3.9 KB

Use get_logger(__name__) in any file, log_step(...) around any step and
log_detail(...) for the lines under a step. preview() shortens long text
safely; at DEBUG level previews are longer and the full prompt is logged.
"""

# Imports
from contextlib import contextmanager
from rich.logging import RichHandler
from contextvars import ContextVar
from rich.console import Console
from rich.markup import escape
import logging
import time


# Request id of the request being handled; "-" outside a request
request_id: ContextVar[str] = ContextVar("request_id", default="-")

# Width of the step name column, so step metadata lines up
STEP_WIDTH = 12

# Width of the label column of detail lines
DETAIL_WIDTH = 10

# Terminal console shared by the log handler and spacer lines
CONSOLE = Console(width=160)


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
        console=CONSOLE,
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
    seconds = time.perf_counter() - start
    logger.info(f"  [bold]{name:<{STEP_WIDTH}}[/]  {format_meta(details)}  [dim]{format_duration(seconds)}[/]")

    # Leave the duration in the dict for callers that report step timings
    details["duration_ms"] = round(seconds * 1000)


def preview(text: str, limit: int = 90) -> str:
    """Return text on one line, cut to limit characters, safe to print with Rich markup."""

    # Collapse newlines and runs of spaces
    flat = " ".join(str(text).split())

    # Cut long text and mark the cut
    if len(flat) > limit:
        flat = flat[: limit - 3] + "..."

    # Square brackets (for example citations [1]) must not be read as Rich markup
    return escape(flat)


def log_detail(logger: logging.Logger, label: str, message: str, level: int = logging.INFO) -> None:
    """Log one indented detail line under a step, for example a retrieved chunk."""

    # Deeper indent than step lines, with an aligned label column
    logger.log(level, f"      [dim]{label:<{DETAIL_WIDTH}}[/] {message}")


def log_spacer() -> None:
    """Print an empty line, used to separate requests that do real work."""

    # Straight to the console, so the line has no time or level
    CONSOLE.print()


def is_debug(logger: logging.Logger) -> bool:
    """True when DEBUG lines of this logger are shown."""

    # Used to switch between short and long previews
    return logger.isEnabledFor(logging.DEBUG)
