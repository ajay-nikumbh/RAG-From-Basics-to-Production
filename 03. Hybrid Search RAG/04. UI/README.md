# Hybrid Search RAG UI

**Status:** Planned. Built after the API.

The Hybrid Search RAG UI will start from the [Advanced RAG UI](../../02.%20Advanced%20RAG/04.%20UI/) (follow-up chat, pipeline panel, evaluation presets, stage analytics) and add views that make keyword search and fusion visible, one feature per commit, each with its numbered design doc in `docs/`.

## Planned additions

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="273" height="1">Feature</th><th><img src="../../assets/spacer.png" align="right" width="1126" height="1">What it shows</th></tr></thead>
<tbody>
<tr><td>Two result lists</td><td>Keyword (BM25) and vector results side by side for each answer, with their ranks and scores</td></tr>
<tr><td>Fusion view</td><td>How each chunk's fused rank came from its keyword and vector ranks</td></tr>
<tr><td>Matched terms</td><td>The question words that matched in each keyword result</td></tr>
<tr><td>Retriever presets</td><td>Evals page comparing vector only, keyword only and hybrid against Advanced RAG</td></tr>
</tbody>
</table>

## Navigation

Previous: [03. API](../03.%20API/) | [Hybrid Search RAG](../README.md)
