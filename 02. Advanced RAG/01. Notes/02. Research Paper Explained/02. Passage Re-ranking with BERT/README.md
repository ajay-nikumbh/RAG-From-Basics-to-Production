# Passage Re-ranking with BERT

These notes go through the paper one section at a time, with one note per section of the paper.

## Paper Card

<table width="100%">
<thead><tr><th><img src="../../../../assets/spacer.png" align="right" width="233" height="1">Field</th><th><img src="../../../../assets/spacer.png" align="right" width="1166" height="1">Value</th></tr></thead>
<tbody>
<tr><td>Title</td><td>Passage Re-ranking with BERT</td></tr>
<tr><td>Authors</td><td>Rodrigo Nogueira, Kyunghyun Cho</td></tr>
<tr><td>Organizations</td><td>New York University, Facebook AI Research, CIFAR</td></tr>
<tr><td>Year and venue</td><td>2019, arXiv</td></tr>
<tr><td>arXiv</td><td><a href="https://arxiv.org/abs/1901.04085">1901.04085</a></td></tr>
<tr><td>Local PDF</td><td><a href="../../../02.%20Papers/1901.04085_BERT-Reranker.pdf">1901.04085_BERT-Reranker.pdf</a></td></tr>
<tr><td>Code</td><td><a href="https://github.com/nyu-dl/dl4marco-bert">github.com/nyu-dl/dl4marco-bert</a></td></tr>
<tr><td>Core idea</td><td>Feed the query and a candidate passage together into BERT and use it as a binary relevance classifier to re-rank the passages a first-stage retriever returned</td></tr>
</tbody>
</table>

## Notes (one per paper section)

<table width="100%">
<thead><tr><th><img src="../../../../assets/spacer.png" align="right" width="68" height="1">#</th><th><img src="../../../../assets/spacer.png" align="right" width="478" height="1">Note</th><th><img src="../../../../assets/spacer.png" align="right" width="734" height="1">Paper section</th><th><img src="../../../../assets/spacer.png" align="right" width="119" height="1">Status</th></tr></thead>
<tbody>
<tr><td>01</td><td><a href="01.%20Abstract.md">Abstract</a></td><td>Abstract</td><td>Done</td></tr>
<tr><td>02</td><td><a href="02.%20Introduction.md">Introduction</a></td><td>1 Introduction</td><td>Done</td></tr>
<tr><td>03</td><td><a href="03.%20Passage%20Re-ranking%20with%20BERT.md">Passage Re-ranking with BERT</a></td><td>2 Passage Re-ranking with BERT (the method)</td><td>Done</td></tr>
<tr><td>04</td><td><a href="04.%20Experiments.md">Experiments</a></td><td>3.1 MS MARCO, 3.2 TREC-CAR</td><td>Done</td></tr>
<tr><td>05</td><td>Results</td><td>3.3 Results</td><td>Planned</td></tr>
<tr><td>06</td><td>Conclusion</td><td>4 Conclusion</td><td>Planned</td></tr>
</tbody>
</table>

## Navigation

Previous paper: [Query Rewriting for Retrieval-Augmented LLMs](../01.%20Query%20Rewriting%20for%20Retrieval-Augmented%20LLMs/) | [Research Paper Explained](../README.md) | Next paper: [RECOMP Compression and Selective Augmentation](../03.%20RECOMP%20Compression%20and%20Selective%20Augmentation/)
