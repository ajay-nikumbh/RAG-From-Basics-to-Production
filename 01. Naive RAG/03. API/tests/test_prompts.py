"""
Tests for the prompt builder.

These tests check the source labels for PDF, Excel and Word chunks, the
numbering and layout of the context blocks, and the final system and user
messages.
"""

# Imports
from app.generation.prompts import SYSTEM_PROMPT, build_messages, format_context, source_label
from app.vectorstore.faiss_store import SearchResult
from app.ingestion.document import Document


def make_result(text: str, metadata: dict) -> SearchResult:
    """Wrap text and metadata as a search result with a dummy score."""

    # Score does not matter for prompt building
    return SearchResult(document=Document(text=text, metadata=metadata), score=0.5)


def test_source_label_by_file_type():
    """PDF shows the page, Excel shows the sheet, Word shows only the file."""

    # One label per file type
    assert source_label({"source": "hr.pdf", "page": 4}) == "hr.pdf, page 4"
    assert source_label({"source": "leave.xlsx", "sheet": "Leave"}) == "leave.xlsx, sheet Leave"
    assert source_label({"source": "policy.docx"}) == "policy.docx"


def test_format_context_numbers_blocks():
    """Blocks are numbered from 1 and separated by a blank line."""

    # Two retrieved chunks
    results = [
        make_result("Employees get 8 sick days.", {"source": "hr.pdf", "page": 4}),
        make_result("Name: Ravi, Leave days: 8", {"source": "leave.xlsx", "sheet": "Leave"}),
    ]

    # Exact layout
    assert format_context(results) == (
        "[1] (hr.pdf, page 4)\nEmployees get 8 sick days.\n\n"
        "[2] (leave.xlsx, sheet Leave)\nName: Ravi, Leave days: 8"
    )


def test_build_messages_has_system_rules_and_question():
    """The system message holds the rules, the user message ends with the question."""

    # One chunk and a question
    results = [make_result("Employees get 8 sick days.", {"source": "hr.pdf", "page": 4})]
    messages = build_messages("How many sick days?", results)

    # System message with the rules
    assert messages[0] == {"role": "system", "content": SYSTEM_PROMPT}

    # User message with context first and the question last
    assert messages[1]["role"] == "user"
    assert messages[1]["content"].startswith("CONTEXT:\n[1] (hr.pdf, page 4)")
    assert messages[1]["content"].endswith("QUESTION: How many sick days?")
