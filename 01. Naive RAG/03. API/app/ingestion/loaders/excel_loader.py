"""
Excel loader.

This file reads an Excel workbook (.xlsx) with openpyxl and returns one
Document per sheet. The first row of each sheet is treated as the header row.
Every data row is turned into one line of "header: value" pairs, so each line
still makes sense on its own after chunking, for example:

    Name: Asha, Department: HR, Leave days: 12

Empty rows and empty sheets are skipped.
"""

# Imports
from app.ingestion.document import Document
from openpyxl import load_workbook
from pathlib import Path


def make_headers(header_row: tuple) -> list[str]:
    """Turn the first row into column names, filling blanks with column_N."""

    # Use the cell text, or a placeholder name when the header cell is empty
    headers = []
    for position, cell in enumerate(header_row, start=1):
        name = str(cell).strip() if cell is not None else ""
        headers.append(name or f"column_{position}")

    return headers


def row_to_text(headers: list[str], row: tuple) -> str:
    """Join one row into "header: value" pairs, leaving out empty cells."""

    # Pair each value with its column name
    parts = []
    for header, value in zip(headers, row):

        # Skip empty cells
        if value is None or str(value).strip() == "":
            continue

        parts.append(f"{header}: {value}")

    return ", ".join(parts)


def load_excel(path: Path) -> list[Document]:
    """Read an .xlsx workbook and return one Document per non-empty sheet."""

    # Open the workbook; data_only gives cell values instead of formulas
    workbook = load_workbook(path, read_only=True, data_only=True)

    # One Document per sheet
    documents = []

    # Go through every sheet
    for sheet in workbook.worksheets:

        # Read rows as plain value tuples
        rows = sheet.iter_rows(values_only=True)

        # The first row holds the column names; skip sheets with no rows
        header_row = next(rows, None)
        if header_row is None:
            continue
        headers = make_headers(header_row)

        # Turn every data row into one line of text
        lines = []
        for row in rows:
            line = row_to_text(headers, row)
            if line:
                lines.append(line)

        # Skip sheets that only have a header
        if not lines:
            continue

        # Keep the sheet text and where it came from
        documents.append(
            Document(
                text="\n".join(lines),
                metadata={
                    "source": path.name,
                    "sheet": sheet.title,
                    "rows": len(lines),
                    "file_type": "excel",
                },
            )
        )

    # Release the file
    workbook.close()

    return documents
