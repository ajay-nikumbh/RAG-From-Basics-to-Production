"""
Reranking package (online query, after retrieval).

Re-scores the retrieved candidate chunks against the question with
gpt-4o-mini acting as a reranker, then keeps the best few chunks using a
score threshold and a minimum and maximum number of chunks.
"""
