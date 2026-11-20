"""
Word loader.

This file reads a Word document (.docx) with python-docx and returns one
Document for the whole file. Paragraph text comes first, in reading order.
Tables follow, and each table row is written as "header: value" pairs (the
same format as the Excel loader) so table rows stay meaningful after chunking.

Word files have no fixed pages (page breaks depend on fonts and screen size),
so the metadata has no page number.
"""

# Imports
from app.ingestion.loaders.excel_loader import make_headers, row_to_text
from app.ingestion.document import Document
from docx import Document as open_docx
from pathlib import Path


def table_to_lines(table) -> list[str]:
    """Turn a Word table into header: value lines, first row as the header."""

    # Read every row as a tuple of cell texts
    rows = [tuple(cell.text.strip() for cell in row.cells) for row in table.rows]

    # A table needs a header row and at least one data row
    if len(rows) < 2:
        return []

    # First row gives the column names
    headers = make_headers(rows[0])

    # Every other row becomes one line, empty rows are dropped
    lines = []
    for row in rows[1:]:
        line = row_to_text(headers, row)
        if line:
            lines.append(line)

    return lines


def load_word(path: Path) -> list[Document]:
    """Read a .docx file and return one Document with its paragraphs and tables."""

    # Open the Word file
    word_file = open_docx(path)

    # Paragraph text, skipping empty paragraphs
    lines = [p.text.strip() for p in word_file.paragraphs if p.text.strip()]

    # Table rows, added after the paragraphs
    for table in word_file.tables:
        lines.extend(table_to_lines(table))

    # Nothing to index in an empty document
    if not lines:
        return []

    # One Document for the whole file
    return [
        Document(
            text="\n".join(lines),
            metadata={
                "source": path.name,
                "file_type": "word",
            },
        )
    ]
