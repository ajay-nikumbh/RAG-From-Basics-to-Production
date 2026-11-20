# 00. RAG Surveys and Foundations

**Category:** Reference  
**Core idea:** Survey papers, historical roots and evaluation frameworks used across every architecture.  
**Status:** Research collected. Implementation planned.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [When to Use](#when-to-use)
- [Limitations](#limitations)
- [Key Components](#key-components)
- [Research Papers](#research-papers)
- [Navigation](#navigation)

## Overview

This folder is not an architecture. It holds the reference papers that frame the whole repository: the main RAG survey (Naive / Advanced / Modular taxonomy), the early retrieval-augmented language models (REALM, RETRO), the topic surveys for Graph, Agentic and Multimodal RAG, and the evaluation frameworks (RAGAS, ARES) that every implementation in this repo will be measured with.

## How It Works

1. Read the RAG survey (2312.10997) first. It defines the Naive, Advanced and Modular RAG paradigms used to order this repo.
2. Read REALM and RETRO for the historical roots: retrieval inside pre-training, not only at inference.
3. Use the Graph, Agentic and Multimodal surveys as the map for folders 13-18.
4. Use RAGAS and ARES metrics (faithfulness, answer relevance, context precision / recall) to evaluate every implementation.

## When to Use

- Starting the learning path.
- Choosing an evaluation method for a pipeline.

## Limitations

- Surveys age fast. Check the latest arXiv versions.

## Key Components

- Evaluation harness (RAGAS) shared by all architectures

## Research Papers

<table width="100%">
<thead><tr><th>#</th><th>Paper</th><th>Year</th><th>Venue / Org</th><th>arXiv</th><th>Local copy</th></tr></thead>
<tbody>
<tr><td>1</td><td>Retrieval-Augmented Generation for Large Language Models: A Survey</td><td>2023</td><td>arXiv (Tongji / Fudan)</td><td><a href="https://arxiv.org/abs/2312.10997">2312.10997</a></td><td><a href="papers/2312.10997_RAG-Survey.pdf">PDF</a></td></tr>
<tr><td>2</td><td>REALM: Retrieval-Augmented Language Model Pre-Training</td><td>2020</td><td>ICML 2020 (Google)</td><td><a href="https://arxiv.org/abs/2002.08909">2002.08909</a></td><td><a href="papers/2002.08909_REALM.pdf">PDF</a></td></tr>
<tr><td>3</td><td>Improving Language Models by Retrieving from Trillions of Tokens</td><td>2021</td><td>ICML 2022 (DeepMind)</td><td><a href="https://arxiv.org/abs/2112.04426">2112.04426</a></td><td><a href="papers/2112.04426_RETRO.pdf">PDF</a></td></tr>
<tr><td>4</td><td>Graph Retrieval-Augmented Generation: A Survey</td><td>2024</td><td>arXiv</td><td><a href="https://arxiv.org/abs/2408.08921">2408.08921</a></td><td><a href="papers/2408.08921_GraphRAG-Survey.pdf">PDF</a></td></tr>
<tr><td>5</td><td>Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG</td><td>2025</td><td>arXiv</td><td><a href="https://arxiv.org/abs/2501.09136">2501.09136</a></td><td><a href="papers/2501.09136_AgenticRAG-Survey.pdf">PDF</a></td></tr>
<tr><td>6</td><td>Ask in Any Modality: A Comprehensive Survey on Multimodal RAG</td><td>2025</td><td>arXiv</td><td><a href="https://arxiv.org/abs/2502.08826">2502.08826</a></td><td><a href="papers/2502.08826_MultimodalRAG-Survey.pdf">PDF</a></td></tr>
<tr><td>7</td><td>Ragas: Automated Evaluation of Retrieval Augmented Generation</td><td>2023</td><td>EACL 2024 (Demo)</td><td><a href="https://arxiv.org/abs/2309.15217">2309.15217</a></td><td><a href="papers/2309.15217_RAGAS.pdf">PDF</a></td></tr>
<tr><td>8</td><td>ARES: An Automated Evaluation Framework for RAG Systems</td><td>2023</td><td>NAACL 2024 (Stanford)</td><td><a href="https://arxiv.org/abs/2311.09476">2311.09476</a></td><td><a href="papers/2311.09476_ARES.pdf">PDF</a></td></tr>
</tbody>
</table>

## Navigation

[Home](../README.md) | Next: [01. Naive RAG](../01.%20Naive%20RAG/)
