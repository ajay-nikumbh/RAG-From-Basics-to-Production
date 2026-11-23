# Advanced RAG API

**Status:** In progress.

The Advanced RAG API starts from the [Naive RAG API](../../01.%20Naive%20RAG/03.%20API/) (same FastAPI structure, loaders, chunker, embeddings, FAISS, logging, cost tracking and evaluation) and adds the Advanced RAG query stages step by step, one feature per commit, each with its numbered design doc in `docs/`.

The stack stays the same: FastAPI, Azure OpenAI (gpt-4o-mini for answers, rewriting and reranking; text-embedding-3-small for embeddings), FAISS, secrets in the repository root `.env`.

## Run

```bash
cd "02. Advanced RAG/03. API"
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8001
```

API docs: http://127.0.0.1:8001/docs. Tests: `.venv/bin/python -m pytest -q`.

Port 8001 lets the Naive RAG API keep running on 8000 for side by side comparison.

## Build Steps

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="52" height="1">Step</th><th><img src="../../assets/spacer.png" align="right" width="330" height="1">Feature</th><th><img src="../../assets/spacer.png" align="right" width="924" height="1">What it adds</th><th><img src="../../assets/spacer.png" align="right" width="92" height="1">Status</th></tr></thead>
<tbody>
<tr><td>1</td><td>Project base</td><td>Copy of the Naive RAG API with its own data folders, port and the new rewriting, reranking and compression packages</td><td>Done</td></tr>
<tr><td>2</td><td>Pipeline settings</td><td>Settings to switch each stage on or off and tune it</td><td>Done</td></tr>
<tr><td>3</td><td>Query rewriter</td><td>One gpt-4o-mini call that condenses follow-ups with the chat history and rewrites the question into a search query; skipped when not needed</td><td>Done</td></tr>
<tr><td>4</td><td>Candidate retrieval</td><td>Retrieve a larger candidate set (top N) for the reranker</td><td>Done</td></tr>
<tr><td>5</td><td>Reranker</td><td>gpt-4o-mini scores every candidate chunk for relevance to the question</td><td>Done</td></tr>
<tr><td>6</td><td>Threshold and dynamic k</td><td>Keep 1 to 5 chunks whose relevance score passes a threshold, with fallbacks</td><td>Done</td></tr>
<tr><td>7</td><td>RAG service and query API</td><td>The full pipeline, returning the answer with a trace of every stage</td><td>Done</td></tr>
<tr><td>8</td><td>Context compression</td><td>Optional: keep only the relevant sentences of each chunk</td><td>Done</td></tr>
<tr><td>9</td><td>Logs, usage and cost</td><td>Every stage visible in the logs, with tokens, cost and time per stage</td><td>Next</td></tr>
<tr><td>10</td><td>Evaluation and comparison</td><td>Same test set and judge as Naive RAG, ablation runs, and the change in every metric, cost and latency</td><td>Planned</td></tr>
</tbody>
</table>

## Docs

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="52" height="1">#</th><th><img src="../../assets/spacer.png" align="right" width="431" height="1">Doc</th><th><img src="../../assets/spacer.png" align="right" width="915" height="1">Topic</th></tr></thead>
<tbody>
<tr><td>01</td><td><a href="docs/01.%20Project%20Base%20and%20Folder%20Structure.md">Project Base and Folder Structure</a></td><td>Why the API starts from Naive RAG, what changed, the new packages and the build order</td></tr>
<tr><td>02</td><td><a href="docs/02.%20Advanced%20Pipeline%20Settings.md">Advanced Pipeline Settings</a></td><td>Stage switches and limits, why 10 candidates, threshold and chunk limits, fallback to Naive RAG</td></tr>
<tr><td>03</td><td><a href="docs/03.%20Query%20Rewriter.md">Query Rewriter</a></td><td>One gpt-4o-mini call for standalone question and search query, skip rules, prompt, fallbacks, live examples and cost</td></tr>
<tr><td>04</td><td><a href="docs/04.%20Candidate%20Retrieval.md">Candidate Retrieval</a></td><td>Recall vs precision split, hit rate at 1, 4, 10 and 20 measured on the test set, why 10 candidates</td></tr>
<tr><td>05</td><td><a href="docs/05.%20LLM%20Reranker.md">LLM Reranker</a></td><td>gpt-4o-mini as relevance judge, rubric, one batched call, plain list reply, live MRR, latency and cost</td></tr>
<tr><td>06</td><td><a href="docs/06.%20Threshold%20and%20Dynamic%20k.md">Threshold and Dynamic k</a></td><td>Selector rules, not-found floor, threshold tuned on the test set, chunks kept per question</td></tr>
<tr><td>07</td><td><a href="docs/07.%20RAG%20Service%20and%20Query%20API.md">RAG Service and Query API</a></td><td>Five-stage pipeline, request with history, response with trace, not-found path, logs, live runs, evaluation runner changes</td></tr>
<tr><td>08</td><td><a href="docs/08.%20Context%20Compression.md">Context Compression</a></td><td>Optional extractive compression by sentence numbers, the et al. bug, measured cost and time, why it stays off</td></tr>
</tbody>
</table>

## Navigation

Previous: [02. Papers](../02.%20Papers/) | [Advanced RAG](../README.md) | Next: [04. UI](../04.%20UI/)
