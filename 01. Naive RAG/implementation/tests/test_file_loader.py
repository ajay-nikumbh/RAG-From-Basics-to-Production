"""
Tests for file loader selection.

These tests check that load_file picks the right loader by extension (in any
letter case), and that an unsupported extension raises UnsupportedFileError
with the allowed extensions in the message.
"""

# Imports
from app.ingestion.file_loader import UnsupportedFileError, load_file, supported_extensions
import pytest


def test_load_file_picks_loader_by_extension(tmp_path):
    """An upper-case .MD file is routed to the text loader."""

    # Write a Markdown file with an upper-case extension
    path = tmp_path / "README.MD"
    path.write_text("# Title", encoding="utf-8")

    # The text loader handles it and marks it as markdown
    documents = load_file(path)
    assert documents[0].metadata["file_type"] == "markdown"


def test_load_file_rejects_unsupported_type(tmp_path):
    """A .png file raises UnsupportedFileError listing the allowed types."""

    # Create a file with an unsupported extension
    path = tmp_path / "photo.png"
    path.write_bytes(b"not really an image")

    # The error names the bad type and the allowed ones
    with pytest.raises(UnsupportedFileError) as error:
        load_file(path)
    assert "'.png'" in str(error.value)
    assert ".pdf" in str(error.value)


def test_supported_extensions_are_sorted():
    """All five extensions are listed in sorted order."""

    # Stable, sorted list
    assert supported_extensions() == [".docx", ".md", ".pdf", ".txt", ".xlsx"]
