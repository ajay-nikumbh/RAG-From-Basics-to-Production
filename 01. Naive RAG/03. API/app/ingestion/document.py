"""
Document model.

This file defines Document, the single shape every loader returns. A Document
is a piece of text (for example one PDF page or one Excel sheet) plus metadata
that says where the text came from. The chunker, embeddings and vector store
all work with this one shape, no matter which file type it came from.
"""

# Imports
from dataclasses import dataclass, field


@dataclass
class Document:
    """A piece of text and the metadata that describes its source."""

    # The extracted text
    text: str

    # Where the text came from, for example {"source": "report.pdf", "page": 3}
    metadata: dict = field(default_factory=dict)
