# Hybrid Search RAG: Basic Concepts

These notes explain every building block of hybrid search, in simple terms, with diagrams, formulas and worked examples. Each note ends with links to the previous and next note. They assume the [Advanced RAG basic concepts](../../../02.%20Advanced%20RAG/01.%20Notes/01.%20Basic%20Concepts/).

## How the notes connect

```mermaid
flowchart LR
    N1[01 What is<br/>Hybrid Search RAG] --> N2[02 From Advanced<br/>to Hybrid]
    N2 --> N3[03 Sparse retrieval<br/>and BM25]
    N3 --> N4[04 Text analysis<br/>for keywords]
    N4 --> N5[05 Dense retrieval<br/>blind spots]
    N5 --> N6[06 Sparse vs<br/>dense]
    N6 --> N7[07 Learned sparse<br/>SPLADE]
    N7 --> N8[08 Why scores<br/>do not add]
    N8 --> N9[09 Reciprocal<br/>Rank Fusion]
    N9 --> N10[10 Weighted<br/>fusion]
    N10 --> N11[11 Hybrid plus<br/>reranking]
    N11 --> N12[12 End to end]
    N12 --> N13[13 Evaluation]
    N13 --> N14[14 Cost and<br/>limitations]
    N14 --> N15[15 Glossary]
```

## Reading order

<table width="100%">
<thead><tr><th><img src="../../../assets/spacer.png" align="right" width="40" height="1">#</th><th><img src="../../../assets/spacer.png" align="right" width="453" height="1">Note</th><th><img src="../../../assets/spacer.png" align="right" width="705" height="1">What you will learn</th><th><img src="../../../assets/spacer.png" align="right" width="141" height="1">Pipeline stage</th><th><img src="../../../assets/spacer.png" align="right" width="60" height="1">Status</th></tr></thead>
<tbody>
<tr><td>01</td><td><a href="01.%20What%20is%20Hybrid%20Search%20RAG.md">What is Hybrid Search RAG</a></td><td>Definition, the two retrievers, fusion, where it sits among the 22 architectures</td><td>Overview</td><td>Done</td></tr>
<tr><td>02</td><td><a href="02.%20From%20Advanced%20RAG%20to%20Hybrid%20Search.md">From Advanced RAG to Hybrid Search</a></td><td>Which Advanced RAG failures are retrieval failures, and why a second retriever helps</td><td>Overview</td><td>Done</td></tr>
<tr><td>03</td><td><a href="03.%20Sparse%20Retrieval%20and%20BM25.md">Sparse Retrieval and BM25</a></td><td>Inverted index, term frequency, inverse document frequency, length normalisation, the BM25 formula with a worked example</td><td>Retrieval</td><td>Done</td></tr>
<tr><td>04</td><td><a href="04.%20Text%20Analysis%20for%20Keyword%20Search.md">Text Analysis for Keyword Search</a></td><td>Tokenising, lower-casing, stop words, stemming, numbers and codes, n-grams</td><td>Indexing</td><td>Done</td></tr>
<tr><td>05</td><td><a href="05.%20Dense%20Retrieval%20Strengths%20and%20Blind%20Spots.md">Dense Retrieval Strengths and Blind Spots</a></td><td>What embeddings capture well and where they fail: rare terms, exact numbers, names, negation</td><td>Retrieval</td><td>Done</td></tr>
<tr><td>06</td><td><a href="06.%20Sparse%20vs%20Dense%20When%20Each%20Wins.md">Sparse vs Dense: When Each Wins</a></td><td>Side by side on real question types, why they are complementary</td><td>Retrieval</td><td>Done</td></tr>
<tr><td>07</td><td><a href="07.%20Learned%20Sparse%20Retrieval%20SPLADE.md">Learned Sparse Retrieval (SPLADE)</a></td><td>Sparse vectors learned by a model, term expansion, trade-offs against BM25 and dense</td><td>Retrieval</td><td>Done</td></tr>
<tr><td>08</td><td><a href="08.%20Why%20Retrieval%20Scores%20Cannot%20Be%20Added%20Directly.md">Why Retrieval Scores Cannot Be Added Directly</a></td><td>Score ranges and distributions, min-max and z-score normalisation</td><td>Fusion</td><td>Done</td></tr>
<tr><td>09</td><td><a href="09.%20Reciprocal%20Rank%20Fusion.md">Reciprocal Rank Fusion</a></td><td>The RRF formula, the constant 60, worked example, strengths and weaknesses</td><td>Fusion</td><td>Done</td></tr>
<tr><td>10</td><td><a href="10.%20Weighted%20Score%20Fusion%20and%20Alpha%20Tuning.md">Weighted Score Fusion and Alpha Tuning</a></td><td>Convex combination of normalised scores, choosing alpha on a test set</td><td>Fusion</td><td>Done</td></tr>
<tr><td>11</td><td><a href="11.%20Hybrid%20Search%20Plus%20Reranking.md">Hybrid Search Plus Reranking</a></td><td>Why fusion and reranking work together, candidate counts, deduplication</td><td>Post-retrieval</td><td>Done</td></tr>
<tr><td>12</td><td><a href="12.%20Hybrid%20Search%20RAG%20Architecture%20End%20to%20End.md">Hybrid Search RAG Architecture End to End</a></td><td>The full pipeline, data flow, trace fields, latency and cost budget</td><td>Overview</td><td>Done</td></tr>
<tr><td>13</td><td><a href="13.%20Evaluating%20Hybrid%20Search.md">Evaluating Hybrid Search</a></td><td>Recall of each retriever, overlap, fusion gain, chunk-level hit rate, ablation plan</td><td>Evaluation</td><td>Done</td></tr>
<tr><td>14</td><td><a href="14.%20Cost%20Latency%20and%20Limitations.md">Cost, Latency and Limitations</a></td><td>Index size and updates, query time, where hybrid search does not help</td><td>Overview</td><td>Done</td></tr>
<tr><td>15</td><td><a href="15.%20Glossary.md">Glossary</a></td><td>Every term used in these notes in one table</td><td>Reference</td><td>Done</td></tr>
</tbody>
</table>

## Navigation

[Notes](../README.md) | Next: [02. Research Paper Explained](../02.%20Research%20Paper%20Explained/)
