# RECOMP: Improving Retrieval-Augmented LMs with Compression and Selective Augmentation

These notes go through the paper one section at a time, with one note per section of the paper.

## Paper Card

<table width="100%">
<thead><tr><th><img src="../../../../assets/spacer.png" align="right" width="233" height="1">Field</th><th><img src="../../../../assets/spacer.png" align="right" width="1166" height="1">Value</th></tr></thead>
<tbody>
<tr><td>Title</td><td>RECOMP: Improving Retrieval-Augmented LMs with Compression and Selective Augmentation</td></tr>
<tr><td>Authors</td><td>Fangyuan Xu, Weijia Shi, Eunsol Choi</td></tr>
<tr><td>Organizations</td><td>The University of Texas at Austin, University of Washington</td></tr>
<tr><td>Year and venue</td><td>2023 (arXiv), ICLR 2024</td></tr>
<tr><td>arXiv</td><td><a href="https://arxiv.org/abs/2310.04408">2310.04408</a></td></tr>
<tr><td>Local PDF</td><td><a href="../../../02.%20Papers/2310.04408_RECOMP-Compression.pdf">2310.04408_RECOMP-Compression.pdf</a></td></tr>
<tr><td>Code</td><td><a href="https://github.com/carriex/recomp">github.com/carriex/recomp</a></td></tr>
<tr><td>Core idea</td><td>Compress retrieved documents into a short summary before putting them in the prompt: an extractive compressor selects useful sentences, an abstractive compressor writes a summary; both can output nothing when the documents do not help (selective augmentation)</td></tr>
</tbody>
</table>

## Notes (one per paper section)

<table width="100%">
<thead><tr><th><img src="../../../../assets/spacer.png" align="right" width="53" height="1">#</th><th><img src="../../../../assets/spacer.png" align="right" width="320" height="1">Note</th><th><img src="../../../../assets/spacer.png" align="right" width="933" height="1">Paper section</th><th><img src="../../../../assets/spacer.png" align="right" width="93" height="1">Status</th></tr></thead>
<tbody>
<tr><td>01</td><td><a href="01.%20Abstract.md">Abstract</a></td><td>Abstract</td><td>Done</td></tr>
<tr><td>02</td><td>Introduction</td><td>1 Introduction</td><td>Planned</td></tr>
<tr><td>03</td><td>Problem Formulation</td><td>2 Problem Formulation: RECOMP</td><td>Planned</td></tr>
<tr><td>04</td><td>Learning the Compressors</td><td>3.1 Extractive Compression, 3.2 Abstractive Compression (training data by distillation)</td><td>Planned</td></tr>
<tr><td>05</td><td>Experimental Settings</td><td>4.1 Language Modeling, 4.2 Open-domain QA, 4.3 Baselines and Oracles</td><td>Planned</td></tr>
<tr><td>06</td><td>Results</td><td>5 Results</td><td>Planned</td></tr>
<tr><td>07</td><td>Analysis and Discussions</td><td>6 Analysis and Discussions</td><td>Planned</td></tr>
<tr><td>08</td><td>Related Work</td><td>7 Related Work</td><td>Planned</td></tr>
<tr><td>09</td><td>Conclusion and Appendix</td><td>8 Conclusion, A Appendix</td><td>Planned</td></tr>
</tbody>
</table>

## Navigation

Previous paper: [Passage Re-ranking with BERT](../02.%20Passage%20Re-ranking%20with%20BERT/) | [Research Paper Explained](../README.md)
