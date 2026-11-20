"""
Tests for the Excel loader.

These tests build a small workbook in a temporary folder, load it and check
that each sheet becomes one Document, that rows become "header: value" lines,
and that empty cells, empty rows and empty sheets are left out.
"""

# Imports
from app.ingestion.loaders.excel_loader import load_excel, make_headers
from openpyxl import Workbook


def build_workbook(path):
    """Create a workbook with one data sheet and one empty sheet."""

    # First sheet: header row, two data rows and one empty row
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Leave"
    sheet.append(["Name", "Department", "Leave days"])
    sheet.append(["Asha", "HR", 12])
    sheet.append([None, None, None])
    sheet.append(["Ravi", None, 8])

    # Second sheet: no rows at all
    workbook.create_sheet("Empty")

    # Save to disk
    workbook.save(path)


def test_load_excel_turns_rows_into_lines(tmp_path):
    """Rows become header: value lines and empty parts are skipped."""

    # Build and load the workbook
    path = tmp_path / "leave.xlsx"
    build_workbook(path)
    documents = load_excel(path)

    # Only the non-empty sheet becomes a Document
    assert len(documents) == 1

    # Each data row is one line, empty cells are left out
    assert documents[0].text == (
        "Name: Asha, Department: HR, Leave days: 12\n"
        "Name: Ravi, Leave days: 8"
    )

    # Metadata names the file, sheet and number of rows
    assert documents[0].metadata == {
        "source": "leave.xlsx",
        "sheet": "Leave",
        "rows": 2,
        "file_type": "excel",
    }


def test_make_headers_fills_blank_names():
    """Blank header cells get a column_N placeholder."""

    # Second header cell is empty
    assert make_headers(("Name", None, " Age ")) == ["Name", "column_2", "Age"]
