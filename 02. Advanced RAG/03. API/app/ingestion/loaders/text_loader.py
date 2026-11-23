"""
Text and Markdown loader.

This file reads plain text (.txt) and Markdown (.md) files and returns one
Document for the whole file. The text is read as UTF-8; any byte that is not
valid UTF-8 is replaced instead of stopping the upload. Markdown is kept as
it is, because headings and lists help the chunker find natural split points
and help the LLM read structure.
"""

# Imports
from app.ingestion.document import Document
from pathlib import Path


# File type stored in metadata for each supported extension
FILE_TYPES = {
    ".txt": "text",
    ".md": "markdown",
}


def load_text(path: Path) -> list[Document]:
    """Read a .txt or .md file and return one Document, or none if it is empty."""

    # Read the whole file, replacing invalid bytes instead of failing
    text = path.read_text(encoding="utf-8", errors="replace").strip()

    # Nothing to index in an empty file
    if not text:
        return []

    # One Document for the whole file
    return [
        Document(
            text=text,
            metadata={
                "source": path.name,
                "file_type": FILE_TYPES.get(path.suffix.lower(), "text"),
            },
        )
    ]
