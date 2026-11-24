# Hybrid Search RAG API

**Status:** Planned. Built after the notes.

The Hybrid Search RAG API will start from the [Advanced RAG API](../../02.%20Advanced%20RAG/03.%20API/) (rewriting, reranking, threshold, trace, per-stage cost, evaluation presets) and add keyword search and fusion step by step, one feature per commit, each with its numbered design doc in `docs/`.

## Planned steps

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="59" height="1">Step</th><th><img src="../../assets/spacer.png" align="right" width="297" height="1">Feature</th><th><img src="../../assets/spacer.png" align="right" width="1042" height="1">What it adds</th></tr></thead>
<tbody>
<tr><td>1</td><td>Project base</td><td>Copy of the Advanced RAG API as the starting point, own data folders, port and settings</td></tr>
<tr><td>2</td><td>Text analysis</td><td>Tokeniser for keyword search: lower-casing, punctuation, stop words, numbers and codes kept</td></tr>
<tr><td>3</td><td>BM25 index</td><td>Keyword index over the same chunks, built at ingestion, saved and loaded with the FAISS index</td></tr>
<tr><td>4</td><td>Keyword retrieval</td><td>Top N chunks by BM25 score for the search query</td></tr>
<tr><td>5</td><td>Fusion</td><td>Reciprocal Rank Fusion and weighted score fusion of the keyword and vector lists</td></tr>
<tr><td>6</td><td>Pipeline integration</td><td>Fused candidates into the existing reranker and threshold; trace shows both lists and the fused order</td></tr>
<tr><td>7</td><td>Settings and logs</td><td>Retriever mode (vector, keyword, hybrid), fusion method, weights, per-stage cost and time</td></tr>
<tr><td>8</td><td>Evaluation</td><td>Chunk-level hit rate, recall of each retriever, presets comparing vector, keyword and hybrid against Advanced RAG</td></tr>
</tbody>
</table>

The stack stays the same: FastAPI, Azure OpenAI (gpt-4o-mini, text-embedding-3-small), FAISS, secrets in the repository root `.env`. Whether BM25 is written in plain Python or taken from a library is decided and documented in step 3.

## Navigation

Previous: [02. Papers](../02.%20Papers/) | [Hybrid Search RAG](../README.md) | Next: [04. UI](../04.%20UI/)
