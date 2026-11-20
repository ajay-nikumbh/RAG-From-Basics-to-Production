# 02. Advanced RAG

> **Category:** Retrieval Optimization  
> **Core idea:** Add pre-retrieval (query rewriting) and post-retrieval (re-ranking, compression) stages to Naive RAG.  
> **Status:** Research collected. Implementation planned.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [When to Use](#when-to-use)
- [Limitations](#limitations)
- [Key Components](#key-components)
- [Research Papers](#research-papers)
- [Folder Structure](#folder-structure)
- [Navigation](#navigation)

## Overview

Advanced RAG keeps the linear pipeline but optimizes the stages around retrieval. Before retrieval, the query is rewritten or expanded so it matches the corpus better (Rewrite-Retrieve-Read). After retrieval, a cross-encoder re-ranker re-scores candidates and context compression removes noise before generation.

## Architecture

```mermaid
flowchart LR
    Q[Query] --> RW[Query rewrite / expansion] --> R[Retriever top-50]
    R --> RR[Cross-encoder re-ranker] --> K[Top-5] --> CC[Context compression]
    CC --> L[LLM] --> A[Answer]
```

## How It Works

1. Rewrite the user query with an LLM (clarify, expand, fix spelling).
2. Retrieve a large candidate set (for example top-50).
3. Re-rank candidates with a cross-encoder and keep the best few.
4. Compress or filter the context to remove irrelevant sentences.
5. Generate the answer.

## When to Use

- Naive RAG retrieves partly relevant chunks.
- User queries are short, vague or conversational.

## Limitations

- Extra latency and cost from rewrite and re-rank calls.

## Key Components

- Query rewriter (LLM)
- Bi-encoder retriever
- Cross-encoder re-ranker
- Context compressor

## Research Papers

<table width="100%">
<thead><tr><th>#</th><th>Paper</th><th>Year</th><th>Venue / Org</th><th>arXiv</th><th>Local copy</th></tr></thead>
<tbody>
<tr><td>1</td><td>Query Rewriting for Retrieval-Augmented Large Language Models</td><td>2023</td><td>EMNLP 2023</td><td><a href="https://arxiv.org/abs/2305.14283">2305.14283</a></td><td><a href="papers/2305.14283_Query-Rewriting.pdf">PDF</a></td></tr>
<tr><td>2</td><td>Passage Re-ranking with BERT</td><td>2019</td><td>arXiv (NYU)</td><td><a href="https://arxiv.org/abs/1901.04085">1901.04085</a></td><td><a href="papers/1901.04085_BERT-Reranker.pdf">PDF</a></td></tr>
</tbody>
</table>

## Folder Structure

```text
02-Advanced-RAG/
├── README.md        # This file
└── papers/         # Research papers (PDF)
```

Implementation code (`src/`, `notebooks/`, `requirements.txt`) will be added when this architecture is built end to end.

## Navigation

[← Naive (Basic) RAG](../01-Naive-RAG/) | [Home](../README.md) | [Hybrid Search RAG →](../03-Hybrid-Search-RAG/)
