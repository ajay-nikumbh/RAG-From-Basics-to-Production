"""
PDF loader.

This file reads a PDF file page by page with pypdf and returns one Document
per page. Each Document keeps the page text and metadata with the file name,
the page number (starting at 1) and the file type, so answers can later cite
the exact page. Empty pages (for example scanned images with no text layer)
are skipped.
"""

# Imports
from app.ingestion.document import Document
from pypdf import PdfReader
from pathlib import Path
import re


def clean_text(text: str) -> str:
    """Tidy raw PDF text: join hyphen-split words and collapse extra spaces."""

    # Join words split across lines with a hyphen, "infor-\nmation" -> "information"
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)

    # Replace runs of spaces and tabs with a single space
    text = re.sub(r"[ \t]+", " ", text)

    # Replace three or more newlines with one blank line
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Remove spaces at the start and end
    return text.strip()


def load_pdf(path: Path) -> list[Document]:
    """Read a PDF and return one Document per page that has text."""

    # Open the PDF
    reader = PdfReader(path)

    # One Document per page
    documents = []

    # Go through the pages, numbering them from 1 like a PDF viewer
    for page_number, page in enumerate(reader.pages, start=1):

        # Extract and clean the page text
        text = clean_text(page.extract_text() or "")

        # Skip pages with no text
        if not text:
            continue

        # Keep the text and where it came from
        documents.append(
            Document(
                text=text,
                metadata={
                    "source": path.name,
                    "page": page_number,
                    "file_type": "pdf",
                },
            )
        )

    return documents
