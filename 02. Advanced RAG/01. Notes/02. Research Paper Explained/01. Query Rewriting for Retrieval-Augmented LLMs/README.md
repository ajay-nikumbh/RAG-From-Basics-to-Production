# Query Rewriting for Retrieval-Augmented Large Language Models

These notes go through the paper one section at a time, with one note per section of the paper.

## Paper Card

<table width="100%">
<thead><tr><th><img src="../../../../assets/spacer.png" align="right" width="233" height="1">Field</th><th><img src="../../../../assets/spacer.png" align="right" width="1166" height="1">Value</th></tr></thead>
<tbody>
<tr><td>Title</td><td>Query Rewriting for Retrieval-Augmented Large Language Models</td></tr>
<tr><td>Authors</td><td>Xinbei Ma, Yeyun Gong, Pengcheng He, Hai Zhao, Nan Duan</td></tr>
<tr><td>Organizations</td><td>Shanghai Jiao Tong University, Microsoft Research Asia, Microsoft Azure AI</td></tr>
<tr><td>Year and venue</td><td>2023, EMNLP 2023</td></tr>
<tr><td>arXiv</td><td><a href="https://arxiv.org/abs/2305.14283">2305.14283</a></td></tr>
<tr><td>Local PDF</td><td><a href="../../../02.%20Papers/2305.14283_Query-Rewriting.pdf">2305.14283_Query-Rewriting.pdf</a></td></tr>
<tr><td>Code</td><td><a href="https://github.com/xbmxb/RAG-query-rewriting">github.com/xbmxb/RAG-query-rewriting</a></td></tr>
<tr><td>Core idea</td><td>Rewrite-Retrieve-Read: adapt the query to the retriever and the reader, instead of adapting the retriever or the reader</td></tr>
</tbody>
</table>

## Notes (one per paper section)

<table width="100%">
<thead><tr><th><img src="../../../../assets/spacer.png" align="right" width="52" height="1">#</th><th><img src="../../../../assets/spacer.png" align="right" width="340" height="1">Note</th><th><img src="../../../../assets/spacer.png" align="right" width="915" height="1">Paper section</th><th><img src="../../../../assets/spacer.png" align="right" width="91" height="1">Status</th></tr></thead>
<tbody>
<tr><td>01</td><td><a href="01.%20Abstract.md">Abstract</a></td><td>Abstract</td><td>Done</td></tr>
<tr><td>02</td><td><a href="02.%20Introduction.md">Introduction</a></td><td>1 Introduction</td><td>Done</td></tr>
<tr><td>03</td><td><a href="03.%20Related%20Work.md">Related Work</a></td><td>2.1 Retrieval Augmentation, 2.2 Cooperation with Black-box LLMs</td><td>Done</td></tr>
<tr><td>04</td><td><a href="04.%20Methodology.md">Methodology</a></td><td>3.1 Rewrite-Retrieve-Read, 3.2 Trainable Scheme (rewriter warm-up, reinforcement learning)</td><td>Done</td></tr>
<tr><td>05</td><td><a href="05.%20Implementation.md">Implementation</a></td><td>4 Implementation (rewriter, retriever, reader)</td><td>Done</td></tr>
<tr><td>06</td><td><a href="06.%20Experiments.md">Experiments</a></td><td>5.1 Task Settings (open-domain QA, multiple-choice QA), 5.2 Baselines, 5.3 Results</td><td>Done</td></tr>
<tr><td>07</td><td><a href="07.%20Analysis.md">Analysis</a></td><td>6.1 Training Process, 6.2 Retrieval Result, 6.3 Case Study</td><td>Done</td></tr>
<tr><td>08</td><td>Conclusion and Limitations</td><td>7 Conclusion, Limitations</td><td>Planned</td></tr>
</tbody>
</table>

## Navigation

[Research Paper Explained](../README.md) | Next paper: [Passage Re-ranking with BERT](../02.%20Passage%20Re-ranking%20with%20BERT/)
