"""
Tests for the Word loader.

These tests build a small .docx file in a temporary folder with a heading,
paragraphs, an empty paragraph and a table, then check the text and metadata
of the returned Document.
"""

# Imports
from app.ingestion.loaders.word_loader import load_word
from docx import Document as new_docx


def build_word_file(path):
    """Create a Word file with paragraphs and a two-row table."""

    # Heading and paragraphs, including one empty paragraph
    word_file = new_docx()
    word_file.add_heading("Leave Policy", level=1)
    word_file.add_paragraph("New joiners get 12 days of paid leave.")
    word_file.add_paragraph("")

    # Table with a header row and one data row
    table = word_file.add_table(rows=2, cols=2)
    table.rows[0].cells[0].text = "Type"
    table.rows[0].cells[1].text = "Days"
    table.rows[1].cells[0].text = "Sick"
    table.rows[1].cells[1].text = "8"

    # Save to disk
    word_file.save(path)


def test_load_word_reads_paragraphs_and_tables(tmp_path):
    """Paragraphs come first, then table rows as header: value lines."""

    # Build and load the file
    path = tmp_path / "policy.docx"
    build_word_file(path)
    documents = load_word(path)

    # One Document for the whole file
    assert len(documents) == 1

    # Empty paragraph is skipped, table row uses header names
    assert documents[0].text == (
        "Leave Policy\n"
        "New joiners get 12 days of paid leave.\n"
        "Type: Sick, Days: 8"
    )

    # Metadata has no page number for Word files
    assert documents[0].metadata == {"source": "policy.docx", "file_type": "word"}


def test_load_word_returns_nothing_for_empty_file(tmp_path):
    """A Word file with no text gives no Documents."""

    # Save an empty Word file
    path = tmp_path / "empty.docx"
    new_docx().save(path)

    # Nothing to index
    assert load_word(path) == []
