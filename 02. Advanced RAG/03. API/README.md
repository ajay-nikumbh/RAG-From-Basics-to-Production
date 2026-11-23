# Advanced RAG Implementation

**Status:** Planned. Built after the notes.

The Advanced RAG API will start from the [Naive RAG API](../../01.%20Naive%20RAG/03.%20API/) (same FastAPI structure, loaders, chunker, embeddings, FAISS, logging, cost tracking and evaluation) and add the Advanced RAG stages step by step, one feature per commit, each with its numbered design doc in `docs/`.

## Planned steps

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="56" height="1">Step</th><th><img src="../../assets/spacer.png" align="right" width="364" height="1">Feature</th><th><img src="../../assets/spacer.png" align="right" width="980" height="1">What it adds</th></tr></thead>
<tbody>
<tr><td>1</td><td>Project base</td><td>Copy of the Naive RAG API as the starting point, own data folders and settings</td></tr>
<tr><td>2</td><td>Query rewriter</td><td>LLM rewrite of the question before retrieval, logged and returned with the answer</td></tr>
<tr><td>3</td><td>Conversational rewriting</td><td>Follow-up questions rewritten into standalone questions using the chat history</td></tr>
<tr><td>4</td><td>Candidate retrieval</td><td>Retrieve a larger candidate set (for example 20) for the reranker</td></tr>
<tr><td>5</td><td>Reranker</td><td>Cross-encoder reranking of the candidates</td></tr>
<tr><td>6</td><td>Threshold and top n</td><td>Keep the best few chunks and drop weak ones</td></tr>
<tr><td>7</td><td>Context compression</td><td>Optional: keep only the relevant sentences of each chunk</td></tr>
<tr><td>8</td><td>Pipeline settings and logs</td><td>Every stage configurable and visible in the logs (original and rewritten query, scores before and after reranking)</td></tr>
<tr><td>9</td><td>Evaluation and comparison</td><td>Same test set and judge as Naive RAG; report the change in every metric, cost and latency</td></tr>
</tbody>
</table>

The stack stays the same: FastAPI, Azure OpenAI (gpt-4o-mini, text-embedding-3-small), FAISS, secrets in the repository root `.env`.

## Navigation

Previous: [02. Papers](../02.%20Papers/) | [Advanced RAG](../README.md) | Next: [04. UI](../04.%20UI/)
