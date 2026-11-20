"""
FAISS vector store.

This file stores chunk vectors in a FAISS index and keeps the matching chunk
text and metadata in a Python list, so row i of the index always belongs to
chunk i of the list. It can add chunks, search for the chunks most similar to
a question vector, and save to or load from the data/index folder.

The index is IndexFlatIP (exact inner-product search). Vectors are normalised
to length 1 before they are added or searched, so the inner product is the
cosine similarity: 1.0 means same meaning, near 0 means unrelated.
"""

# Imports
from app.ingestion.document import Document
from dataclasses import dataclass
from pathlib import Path
import numpy as np
import faiss
import json


# File names inside the index folder
INDEX_FILE = "index.faiss"
CHUNKS_FILE = "chunks.json"


@dataclass
class SearchResult:
    """One search hit: the chunk and its cosine similarity to the question."""

    # The matching chunk
    document: Document

    # Cosine similarity between the question and the chunk
    score: float


class FaissStore:
    """A FAISS index plus the chunk text and metadata for every vector."""

    def __init__(self, dimensions: int):
        """Create an empty store for vectors of the given length."""

        # Exact search by inner product (cosine, because vectors are normalised)
        self.index = faiss.IndexFlatIP(dimensions)

        # Chunk text and metadata, in the same order as the index rows
        self.chunks: list[Document] = []

    @property
    def count(self) -> int:
        """Number of chunks in the store."""

        # One index row per chunk
        return self.index.ntotal

    def sources(self) -> set[str]:
        """Names of all files that have chunks in the store."""

        # Every chunk keeps its file name in metadata
        return {chunk.metadata.get("source") for chunk in self.chunks}

    def add(self, vectors: np.ndarray, chunks: list[Document]) -> None:
        """Add chunk vectors and their chunks, keeping both in the same order."""

        # Every vector needs its chunk
        if len(vectors) != len(chunks):
            raise ValueError("vectors and chunks must have the same length")

        # Normalise a float32 copy so inner product equals cosine similarity
        vectors = np.array(vectors, dtype="float32")
        faiss.normalize_L2(vectors)

        # Append to the index and to the chunk list
        self.index.add(vectors)
        self.chunks.extend(chunks)

    def search(self, query_vector: np.ndarray, top_k: int) -> list[SearchResult]:
        """Return the top_k chunks most similar to the query, best first."""

        # Nothing to search in an empty store
        if self.count == 0:
            return []

        # Normalise the question vector the same way as the chunk vectors
        query = np.array(query_vector, dtype="float32").reshape(1, -1)
        faiss.normalize_L2(query)

        # FAISS returns the scores and row numbers of the best matches
        scores, rows = self.index.search(query, min(top_k, self.count))

        # Turn row numbers back into chunks
        return [
            SearchResult(document=self.chunks[row], score=float(score))
            for score, row in zip(scores[0], rows[0])
        ]

    def save(self, folder: Path) -> None:
        """Write the index and the chunks to the folder."""

        # Make sure the folder exists
        folder.mkdir(parents=True, exist_ok=True)

        # The vectors, in FAISS binary format
        faiss.write_index(self.index, str(folder / INDEX_FILE))

        # The chunk text and metadata, as readable JSON
        records = [{"text": chunk.text, "metadata": chunk.metadata} for chunk in self.chunks]
        (folder / CHUNKS_FILE).write_text(json.dumps(records, ensure_ascii=False), encoding="utf-8")

    @classmethod
    def load(cls, folder: Path, dimensions: int) -> "FaissStore":
        """Load a saved store from the folder, or return an empty one if none exists."""

        # Start with an empty store
        store = cls(dimensions)

        # Nothing saved yet
        index_path = folder / INDEX_FILE
        chunks_path = folder / CHUNKS_FILE
        if not index_path.exists() or not chunks_path.exists():
            return store

        # Read the vectors and the chunks
        store.index = faiss.read_index(str(index_path))
        records = json.loads(chunks_path.read_text(encoding="utf-8"))
        store.chunks = [Document(text=r["text"], metadata=r["metadata"]) for r in records]

        return store
