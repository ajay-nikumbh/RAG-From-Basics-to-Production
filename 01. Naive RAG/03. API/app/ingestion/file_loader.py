"""
File loader selection.

This file is the single entry point for loading any supported file. It looks
at the file extension, picks the matching loader (PDF, Excel, Word, text or
Markdown) and returns that loader's list of Documents. Callers never need to
know which loader exists for which file type.

Unsupported extensions raise UnsupportedFileError with the list of allowed
extensions, so the API can return a clear message.
"""

# Imports
from app.ingestion.loaders.excel_loader import load_excel
from app.ingestion.loaders.word_loader import load_word
from app.ingestion.loaders.text_loader import load_text
from app.ingestion.loaders.pdf_loader import load_pdf
from app.ingestion.document import Document
from pathlib import Path


# Which loader handles which file extension
LOADERS = {
    ".pdf": load_pdf,
    ".xlsx": load_excel,
    ".docx": load_word,
    ".txt": load_text,
    ".md": load_text,
}


class UnsupportedFileError(ValueError):
    """Raised when a file extension has no loader."""


def supported_extensions() -> list[str]:
    """Return the allowed extensions, for example ['.docx', '.md', '.pdf']."""

    # Sorted so error messages and docs list them in a stable order
    return sorted(LOADERS)


def load_file(path: Path) -> list[Document]:
    """Load any supported file and return its Documents."""

    # Extension in lower case, so "Report.PDF" works like "report.pdf"
    extension = path.suffix.lower()

    # Find the loader for this extension
    loader = LOADERS.get(extension)

    # Stop with a clear message when the type is not supported
    if loader is None:
        allowed = ", ".join(supported_extensions())
        raise UnsupportedFileError(f"Unsupported file type '{extension}'. Allowed: {allowed}")

    # Run the matching loader
    return loader(path)
