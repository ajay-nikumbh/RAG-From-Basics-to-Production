"""
Tests for the text and Markdown loader.

These tests write small files to a temporary folder and check the returned
text, the file type in metadata, empty-file handling and that invalid UTF-8
bytes do not stop loading.
"""

# Imports
from app.ingestion.loaders.text_loader import load_text


def test_load_text_reads_markdown(tmp_path):
    """A Markdown file keeps its text and is marked as markdown."""

    # Write a small Markdown file with surrounding blank lines
    path = tmp_path / "guide.md"
    path.write_text("\n# Guide\n\nStep one.\n\n", encoding="utf-8")

    # Load it
    documents = load_text(path)

    # Text is kept, outer blank lines are removed
    assert documents[0].text == "# Guide\n\nStep one."

    # Metadata names the file and its type
    assert documents[0].metadata == {"source": "guide.md", "file_type": "markdown"}


def test_load_text_skips_empty_file(tmp_path):
    """A file with only whitespace gives no Documents."""

    # Write a whitespace-only file
    path = tmp_path / "empty.txt"
    path.write_text("   \n\n", encoding="utf-8")

    # Nothing to index
    assert load_text(path) == []


def test_load_text_replaces_invalid_bytes(tmp_path):
    """Invalid UTF-8 bytes are replaced instead of raising an error."""

    # Write bytes that are not valid UTF-8
    path = tmp_path / "notes.txt"
    path.write_bytes(b"caf\xe9 menu")

    # Loading works and keeps the readable text
    documents = load_text(path)
    assert documents[0].text.startswith("caf")
    assert documents[0].text.endswith("menu")
    assert documents[0].metadata["file_type"] == "text"
