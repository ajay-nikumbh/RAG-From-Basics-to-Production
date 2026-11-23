# Advanced RAG UI

**Status:** Planned. Built after the API.

The Advanced RAG UI will start from the [Naive RAG UI](../../01.%20Naive%20RAG/04.%20UI/) (chat with PDF citations, Documents, Analytics, Evals) and add views that make the new stages visible, one feature per commit, each with its numbered design doc in `docs/`.

## Planned additions

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="298" height="1">Feature</th><th><img src="../../assets/spacer.png" align="right" width="1101" height="1">What it shows</th></tr></thead>
<tbody>
<tr><td>Rewrite view</td><td>The original question next to the rewritten question used for retrieval</td></tr>
<tr><td>Rerank view</td><td>Candidates before and after reranking, with both scores, and which chunks were kept or dropped</td></tr>
<tr><td>Pipeline timing</td><td>Time and cost of each stage (rewrite, retrieve, rerank, generate) per answer</td></tr>
<tr><td>Follow-up questions</td><td>Chat that keeps context across turns</td></tr>
<tr><td>Baseline comparison</td><td>Evals page comparing Advanced RAG runs with the Naive RAG baseline, metric by metric</td></tr>
</tbody>
</table>

## Navigation

Previous: [03. API](../03.%20API/) | [Advanced RAG](../README.md)
