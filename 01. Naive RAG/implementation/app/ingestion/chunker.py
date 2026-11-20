"""
Text chunker.

This file splits Documents into smaller chunks that fit the embedding model and
the prompt. It uses recursive splitting: try to cut at paragraph breaks first,
then line breaks, then sentence ends, then spaces, and only cut inside a word
when nothing else works. Small pieces are then packed together into chunks of
at most chunk_size characters, and the end of each chunk is repeated at the
start of the next one (chunk_overlap) so text on a boundary is never lost.

Each chunk is a Document that keeps the metadata of its parent plus a
chunk_index (its position inside the parent).
"""

# Imports
from app.ingestion.document import Document


# Split points from the biggest to the smallest unit of text
SEPARATORS = ["\n\n", "\n", ". ", " "]


def split_into_pieces(text: str, chunk_size: int, separators: list[str]) -> list[str]:
    """Cut text into pieces no longer than chunk_size, using the biggest separator possible."""

    # Small enough already: keep it whole
    if len(text) <= chunk_size:
        return [text]

    # No separator left: cut every chunk_size characters
    if not separators:
        return [text[start:start + chunk_size] for start in range(0, len(text), chunk_size)]

    # Try the biggest separator first, keep the rest for parts that are still too long
    separator, smaller_separators = separators[0], separators[1:]
    parts = text.split(separator)

    # Put the separator back on every part except the last, so no text is lost
    pieces = []
    for position, part in enumerate(parts):
        if position < len(parts) - 1:
            part += separator

        # Split again with smaller separators if this part is still too long
        pieces.extend(split_into_pieces(part, chunk_size, smaller_separators))

    return pieces


def overlap_tail(text: str, chunk_overlap: int) -> str:
    """Return the last chunk_overlap characters of text, starting at a whole word."""

    # No overlap wanted
    if chunk_overlap <= 0:
        return ""

    # Whole text is shorter than the overlap: repeat all of it
    if len(text) <= chunk_overlap:
        return text

    # Take the end of the text
    tail = text[-chunk_overlap:]

    # Nothing to trim when the tail already starts at a word boundary
    if text[-chunk_overlap - 1].isspace():
        return tail

    # Otherwise drop the partial word at the start, up to the first whitespace
    for position, character in enumerate(tail):
        if character.isspace():
            return tail[position + 1:]

    # No whitespace at all: keep the tail as it is
    return tail


def merge_pieces(pieces: list[str], chunk_size: int, chunk_overlap: int) -> list[str]:
    """Pack small pieces into chunks of at most chunk_size, with overlap between chunks."""

    # Finished chunks and the chunk being filled
    chunks = []
    current = ""

    # Add pieces one by one
    for piece in pieces:

        # Close the current chunk when the next piece would not fit
        if current and len(current) + len(piece) > chunk_size:
            chunks.append(current.strip())

            # Start the next chunk with the end of the previous one, if it still fits
            current = overlap_tail(current, chunk_overlap)
            if len(current) + len(piece) > chunk_size:
                current = ""

        current += piece

    # Keep the last chunk
    if current.strip():
        chunks.append(current.strip())

    return chunks


def split_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """Split one text into overlapping chunks of at most chunk_size characters."""

    # Cut into small pieces at natural boundaries, then pack them into chunks
    pieces = split_into_pieces(text, chunk_size, SEPARATORS)
    return merge_pieces(pieces, chunk_size, chunk_overlap)


def chunk_documents(documents: list[Document], chunk_size: int, chunk_overlap: int) -> list[Document]:
    """Split every Document into chunk Documents that keep the parent metadata."""

    # The overlap must be smaller than the chunk, or chunks would never move forward
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    # All chunks from all documents
    chunks = []

    # Split each document and number its chunks from 0
    for document in documents:
        for chunk_index, text in enumerate(split_text(document.text, chunk_size, chunk_overlap)):
            chunks.append(
                Document(
                    text=text,
                    metadata={**document.metadata, "chunk_index": chunk_index},
                )
            )

    return chunks
