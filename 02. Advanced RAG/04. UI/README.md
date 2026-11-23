# Advanced RAG UI

**Status:** In progress.

A React app for the Advanced RAG API. It starts from the [Naive RAG UI](../../01.%20Naive%20RAG/04.%20UI/) (chat with PDF citations, Documents, Analytics, Evals) and adds views that make the new stages visible, one feature per commit, each with its numbered design doc in `docs/`.

## Run

1. Start the API (from `02. Advanced RAG/03. API`, see its README):

   ```bash
   .venv/bin/uvicorn app.main:app --reload --port 8001
   ```

2. Start the UI (from `02. Advanced RAG/04. UI`):

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:5174. The Naive RAG UI can run at the same time on 5173.

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="219" height="1">Command</th><th><img src="../../assets/spacer.png" align="right" width="1180" height="1">What it does</th></tr></thead>
<tbody>
<tr><td>npm run dev</td><td>Dev server with hot reload on port 5174; /api is proxied to FastAPI on port 8001</td></tr>
<tr><td>npm run build</td><td>Production build in dist/</td></tr>
<tr><td>npm test</td><td>Unit tests (Vitest)</td></tr>
<tr><td>npm run lint</td><td>Lint (oxlint)</td></tr>
</tbody>
</table>

## Build Steps

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="49" height="1">Step</th><th><img src="../../assets/spacer.png" align="right" width="408" height="1">Feature</th><th><img src="../../assets/spacer.png" align="right" width="867" height="1">What it adds</th><th><img src="../../assets/spacer.png" align="right" width="74" height="1">Status</th></tr></thead>
<tbody>
<tr><td>1</td><td>Project base</td><td>Copy of the Naive RAG UI pointing at the Advanced API (port 8001), served on port 5174</td><td>Done</td></tr>
<tr><td>2</td><td>Follow-up chat</td><td>Earlier turns sent with each question so follow-ups are rewritten into standalone questions</td><td>Done</td></tr>
<tr><td>3</td><td>Pipeline view</td><td>Rewritten question, candidates before and after reranking, kept and dropped chunks, cost and time per stage</td><td>Done</td></tr>
<tr><td>4</td><td>Evaluation presets and comparison</td><td>Run presets A to E and compare runs metric by metric against the Naive baseline</td><td>Done</td></tr>
<tr><td>5</td><td>Stage analytics</td><td>Average cost and time per stage across questions</td><td>Done</td></tr>
<tr><td>6</td><td>Settings display and showcase</td><td>Stage settings in the sidebar, screenshots of every view</td><td>Next</td></tr>
</tbody>
</table>

## Docs

<table width="100%">
<thead><tr><th><img src="../../assets/spacer.png" align="right" width="52" height="1">#</th><th><img src="../../assets/spacer.png" align="right" width="431" height="1">Doc</th><th><img src="../../assets/spacer.png" align="right" width="915" height="1">Topic</th></tr></thead>
<tbody>
<tr><td>01</td><td><a href="docs/01.%20UI%20Project%20Base.md">UI Project Base</a></td><td>Why the UI starts from the Naive UI, what changed, ports for side by side running</td></tr>
<tr><td>02</td><td><a href="docs/02.%20Follow-up%20Chat.md">Follow-up Chat</a></td><td>Earlier turns sent with each question, Understood as line, top k menu removed</td></tr>
<tr><td>03</td><td><a href="docs/03.%20Pipeline%20Panel.md">Pipeline Panel</a></td><td>Questions at each step, time and cost per stage, all candidates before and after reranking, scores on source cards</td></tr>
<tr><td>04</td><td><a href="docs/04.%20Evaluation%20Presets%20and%20Comparison.md">Evaluation Presets and Comparison</a></td><td>Preset menu, comparison card against the Naive baseline, preset and stages in run summary and history</td></tr>
<tr><td>05</td><td><a href="docs/05.%20Stage%20Analytics.md">Stage Analytics</a></td><td>Cost and time per stage card on the Analytics page, stageAverages()</td></tr>
</tbody>
</table>

## Navigation

Previous: [03. API](../03.%20API/) | [Advanced RAG](../README.md)
