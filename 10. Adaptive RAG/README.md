# 10. Adaptive RAG

**Category:** Self-Reflective / Routing  
**Core idea:** Classify query complexity and route to no-retrieval, single-step or multi-step retrieval.  
**Status:** Research collected. Implementation planned.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [When to Use](#when-to-use)
- [Limitations](#limitations)
- [Key Components](#key-components)
- [Research Papers](#research-papers)
- [Navigation](#navigation)

## Overview

Not every question needs the same pipeline. Adaptive-RAG trains a small classifier to predict query complexity: simple queries go straight to the LLM, moderate queries use single-step RAG, and complex queries use iterative multi-step RAG. This balances accuracy against cost and latency.

## Architecture

```mermaid
flowchart LR
    Q[Query] --> C{Complexity<br/>classifier}
    C -- Simple --> L0[LLM only]
    C -- Moderate --> S[Single-step RAG]
    C -- Complex --> M[Multi-step iterative<br/>RAG]
    L0 --> A[Answer]
    S --> A
    M --> A
```

## How It Works

1. Classify the query (A: no retrieval, B: single-step, C: multi-step).
2. Route to the matching strategy.
3. Run the chosen pipeline and return the answer.

## When to Use

- High traffic with mixed difficulty.
- Cost and latency budgets matter.

## Limitations

- Router mistakes cause wrong strategy.
- Classifier needs labelled data or good prompts.

## Key Components

- Query classifier / router
- LLM-only path
- Single-step RAG
- Iterative RAG

## Research Papers

<table width="100%">
<thead><tr><th><img src="../assets/spacer.png" align="right" width="48" height="1">#</th><th><img src="../assets/spacer.png" align="right" width="844" height="1">Paper</th><th><img src="../assets/spacer.png" align="right" width="48" height="1">Year</th><th><img src="../assets/spacer.png" align="right" width="217" height="1">Venue / Org</th><th><img src="../assets/spacer.png" align="right" width="120" height="1">arXiv</th><th><img src="../assets/spacer.png" align="right" width="120" height="1">Local copy</th></tr></thead>
<tbody>
<tr><td>1</td><td>Adaptive-RAG: Learning to Adapt Retrieval-Augmented LLMs through Question Complexity</td><td>2024</td><td>NAACL 2024 (KAIST)</td><td><a href="https://arxiv.org/abs/2403.14403">2403.14403</a></td><td><a href="papers/2403.14403_Adaptive-RAG.pdf">PDF</a></td></tr>
</tbody>
</table>

## Navigation

Previous: [09. Corrective RAG](../09.%20Corrective%20RAG/) | [Home](../README.md) | Next: [11. Active Iterative RAG](../11.%20Active%20Iterative%20RAG/)
