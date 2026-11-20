"""
Tests for the PDF loader.

These tests load the RAG paper PDF stored in this repository and check that
every page with text becomes a Document with the right metadata, and that the
text cleaning joins hyphen-split words and removes extra spaces.
"""

# Imports
from app.ingestion.loaders.pdf_loader import clean_text, load_pdf
from pathlib import Path


# The RAG paper PDF in 01. Naive RAG/papers
PAPER_PDF = Path(__file__).resolve().parents[2] / "papers" / "2005.11401_RAG-Lewis.pdf"


def test_load_pdf_returns_one_document_per_page():
    """The 19-page paper gives 19 Documents with page metadata."""

    # Load the paper
    documents = load_pdf(PAPER_PDF)

    # Every page of the paper has text
    assert len(documents) == 19

    # Metadata of the first page
    assert documents[0].metadata == {
        "source": "2005.11401_RAG-Lewis.pdf",
        "page": 1,
        "file_type": "pdf",
    }

    # The title is on the first page
    assert "Retrieval-Augmented Generation" in documents[0].text


def test_clean_text_joins_hyphenated_words_and_spaces():
    """Hyphen line breaks are joined and repeated spaces collapse to one."""

    # Raw text with a hyphen line break and extra spaces
    raw = "infor-\nmation   retrieval\n\n\n\nnext"

    # Cleaned text
    assert clean_text(raw) == "information retrieval\n\nnext"
