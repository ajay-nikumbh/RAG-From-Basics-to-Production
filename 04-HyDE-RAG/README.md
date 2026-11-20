# 04. HyDE RAG

> **Category:** Query Transformation  
> **Core idea:** Generate a hypothetical answer document first, embed it, and use it to retrieve real documents.  
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

Hypothetical Document Embeddings (HyDE) closes the gap between short questions and long answer passages. The LLM writes a fake answer, the fake answer is embedded, and the vector search finds real passages near that answer. The fake answer is never shown to the user.

## Architecture

```mermaid
flowchart LR
    Q[Query] --> G[LLM writes hypothetical answer] --> E[Embed hypothetical doc]
    E --> R[Vector search] --> C[Real documents] --> L[LLM] --> A[Answer]
```

## How It Works

1. Prompt the LLM to write a plausible answer passage for the query.
2. Embed the passage (optionally average several samples).
3. Retrieve real documents with that embedding.
4. Generate the final answer only from the real documents.

## When to Use

- Zero-shot domains with no labelled relevance data.
- Questions are much shorter than documents.

## Limitations

- Hallucinated hypothetical can steer retrieval wrong.
- One extra LLM call per query.

## Key Components

- Generator LLM
- Embedding model
- Vector DB

## Research Papers

<table width="100%">
<thead><tr><th>#</th><th>Paper</th><th>Year</th><th>Venue / Org</th><th>arXiv</th><th>Local copy</th></tr></thead>
<tbody>
<tr><td>1</td><td>Precise Zero-Shot Dense Retrieval without Relevance Labels</td><td>2022</td><td>ACL 2023 (CMU)</td><td><a href="https://arxiv.org/abs/2212.10496">2212.10496</a></td><td><a href="papers/2212.10496_HyDE.pdf">PDF</a></td></tr>
</tbody>
</table>

## Folder Structure

```text
04-HyDE-RAG/
├── README.md        # This file
└── papers/         # Research papers (PDF)
```

Implementation code (`src/`, `notebooks/`, `requirements.txt`) will be added when this architecture is built end to end.

## Navigation

[← Hybrid Search RAG](../03-Hybrid-Search-RAG/) | [Home](../README.md) | [RAG-Fusion (Multi-Query) →](../05-RAG-Fusion/)
