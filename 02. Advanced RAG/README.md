# 02. Advanced RAG

**Category:** Retrieval Optimization  
**Core idea:** Keep the Naive RAG pipeline, and add a pre-retrieval stage (query rewriting) and a post-retrieval stage (reranking, filtering, compression) around retrieval.  
**Status:** In progress. Basic concept notes done (15); research paper notes are next.

## Table of Contents

- [Overview](#overview)
- [Why Advanced RAG Comes Next](#why-advanced-rag-comes-next)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [When to Use](#when-to-use)
- [Limitations](#limitations)
- [Key Components](#key-components)
- [Folder Contents](#folder-contents)
- [Research Papers](#research-papers)
- [Navigation](#navigation)

## Overview

Advanced RAG keeps the linear retrieve-then-generate pipeline of Naive RAG but optimises the stages around retrieval. Before retrieval, the question is rewritten so it matches the documents better (Rewrite-Retrieve-Read). Retrieval brings back a larger set of candidates. After retrieval, a cross-encoder reranker reads each candidate together with the question, re-scores it, and only the best few chunks are kept, filtered or compressed before generation.

## Why Advanced RAG Comes Next

The [Naive RAG](../01.%20Naive%20RAG/) evaluation showed that generation is reliable but retrieval is not:

<table width="100%">
<thead><tr><th><img src="../assets/spacer.png" align="right" width="246" height="1">Naive RAG result</th><th><img src="../assets/spacer.png" align="right" width="168" height="1">Value</th><th><img src="../assets/spacer.png" align="right" width="803" height="1">What Advanced RAG changes</th><th><img src="../assets/spacer.png" align="right" width="181" height="1">Target</th></tr></thead>
<tbody>
<tr><td>Context precision</td><td>0.41</td><td>Retrieve 20, rerank, keep the best 3, score threshold</td><td>0.65 or higher</td></tr>
<tr><td>Retrieval hit rate</td><td>90%</td><td>Query rewriting, larger candidate set</td><td>95 to 100%</td></tr>
<tr><td>Correctness</td><td>0.85</td><td>Right passage reaches the prompt more often</td><td>0.90 or higher</td></tr>
<tr><td>Faithfulness</td><td>0.95</td><td>Unchanged generator and prompt</td><td>stay at 0.95</td></tr>
<tr><td>Follow-up questions</td><td>Not supported</td><td>Rewrite follow-ups into standalone questions with chat history</td><td>Supported</td></tr>
<tr><td>Cost per question</td><td>Rs 0.02</td><td>Extra rewrite and rerank calls, fewer chunks in the prompt</td><td>under Rs 0.04</td></tr>
</tbody>
</table>

Details of the measured limitations: [Naive RAG API doc 28](../01.%20Naive%20RAG/03.%20API/docs/28.%20Naive%20RAG%20Limitations%2C%20Lessons%20and%20Next%20Steps.md).

## Architecture

```mermaid
flowchart LR
    Q[Question] --> RW[Query rewrite<br/>pre-retrieval]
    RW --> R[Retriever<br/>top 20]
    R --> RR[Cross-encoder<br/>reranker]
    RR --> F[Keep best 3<br/>threshold]
    F --> P[Prompt]
    P --> L[LLM]
    L --> A[Answer with<br/>citations]
```

## How It Works

1. **Rewrite** the question with an LLM: make it standalone (resolve follow-ups with the chat history), clarify it and add the terms the documents are likely to use.
2. **Retrieve** a larger candidate set (for example the top 20) with the same embedding search as Naive RAG.
3. **Rerank** the candidates with a cross-encoder that reads the question and each chunk together and scores real relevance.
4. **Filter** to the best few chunks (for example 3) and drop chunks below a score threshold; optionally compress them to the relevant sentences.
5. **Generate** the answer with the same grounded, cited prompt as Naive RAG.

## When to Use

- Naive RAG retrieves partly relevant chunks (low context precision).
- User questions are short, vague, conversational or follow-ups.
- Documents are similar to each other, so the first ranking is unreliable.

## Limitations

- Extra latency and cost from the rewrite and rerank calls.
- A bad rewrite can drift from the user's intent.
- Still one retrieval step: multi-hop questions need iterative or graph-based methods.
- Exact names and codes still depend on dense search unless hybrid search is added (03. Hybrid Search RAG).

## Key Components

- Query rewriter (LLM)
- Bi-encoder retriever (embeddings and FAISS, from Naive RAG)
- Cross-encoder reranker
- Score threshold and context filter
- Context compressor (extractive or abstractive, from RECOMP)
- Generator and grounded prompt (from Naive RAG)
- Evaluation on the same test set as Naive RAG

## Folder Contents

Read in this order, the same structure as Naive RAG.

<table width="100%">
<thead><tr><th><img src="../assets/spacer.png" align="right" width="58" height="1">#</th><th><img src="../assets/spacer.png" align="right" width="147" height="1">Folder</th><th><img src="../assets/spacer.png" align="right" width="1031" height="1">What it holds</th><th><img src="../assets/spacer.png" align="right" width="162" height="1">Status</th></tr></thead>
<tbody>
<tr><td>1</td><td><a href="01.%20Notes/">01. Notes</a></td><td>Basic concepts of Advanced RAG, the three papers explained section by section, interview preparation</td><td>In progress</td></tr>
<tr><td>2</td><td><a href="02.%20Papers/">02. Papers</a></td><td>The research papers as PDFs</td><td>Done</td></tr>
<tr><td>3</td><td><a href="03.%20API/">03. API</a></td><td>FastAPI implementation built on the Naive RAG API, with numbered design docs</td><td>Planned</td></tr>
<tr><td>4</td><td><a href="04.%20UI/">04. UI</a></td><td>React UI built on the Naive RAG UI, showing rewrites and reranking</td><td>Planned</td></tr>
</tbody>
</table>

## Research Papers

<table width="100%">
<thead><tr><th><img src="../assets/spacer.png" align="right" width="44" height="1">#</th><th><img src="../assets/spacer.png" align="right" width="777" height="1">Paper</th><th><img src="../assets/spacer.png" align="right" width="44" height="1">Year</th><th><img src="../assets/spacer.png" align="right" width="311" height="1">Venue / Org</th><th><img src="../assets/spacer.png" align="right" width="111" height="1">arXiv</th><th><img src="../assets/spacer.png" align="right" width="111" height="1">Local copy</th></tr></thead>
<tbody>
<tr><td>1</td><td>Query Rewriting for Retrieval-Augmented Large Language Models</td><td>2023</td><td>EMNLP 2023 (SJTU, Microsoft)</td><td><a href="https://arxiv.org/abs/2305.14283">2305.14283</a></td><td><a href="02.%20Papers/2305.14283_Query-Rewriting.pdf">PDF</a></td></tr>
<tr><td>2</td><td>Passage Re-ranking with BERT</td><td>2019</td><td>arXiv (NYU)</td><td><a href="https://arxiv.org/abs/1901.04085">1901.04085</a></td><td><a href="02.%20Papers/1901.04085_BERT-Reranker.pdf">PDF</a></td></tr>
<tr><td>3</td><td>RECOMP: Improving Retrieval-Augmented LMs with Compression and Selective Augmentation</td><td>2023</td><td>ICLR 2024 (UT Austin, UW)</td><td><a href="https://arxiv.org/abs/2310.04408">2310.04408</a></td><td><a href="02.%20Papers/2310.04408_RECOMP-Compression.pdf">PDF</a></td></tr>
</tbody>
</table>

## Navigation

Previous: [01. Naive RAG](../01.%20Naive%20RAG/) | [Home](../README.md) | Next: [03. Hybrid Search RAG](../03.%20Hybrid%20Search%20RAG/)
