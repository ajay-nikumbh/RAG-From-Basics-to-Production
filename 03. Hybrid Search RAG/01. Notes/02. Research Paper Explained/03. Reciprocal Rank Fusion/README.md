# Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods

These notes go through the paper one part at a time. The paper is a two-page SIGIR short paper with two sections, so the long first section is split into one note per experiment.

## Paper Card

<table width="100%">
<thead><tr><th><img src="../../../../assets/spacer.png" align="right" width="233" height="1">Field</th><th><img src="../../../../assets/spacer.png" align="right" width="1166" height="1">Value</th></tr></thead>
<tbody>
<tr><td>Title</td><td>Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods</td></tr>
<tr><td>Authors</td><td>Gordon V. Cormack, Charles L. A. Clarke, Stefan Buettcher</td></tr>
<tr><td>Organizations</td><td>University of Waterloo, Google</td></tr>
<tr><td>Year and venue</td><td>2009, SIGIR (short paper), Boston</td></tr>
<tr><td>DOI</td><td><a href="https://doi.org/10.1145/1571941.1572114">10.1145/1571941.1572114</a></td></tr>
<tr><td>Local PDF</td><td><a href="../../../02.%20Papers/Cormack-2009_Reciprocal-Rank-Fusion.pdf">Cormack-2009_Reciprocal-Rank-Fusion.pdf</a></td></tr>
<tr><td>Core idea</td><td>Merge rankings from several systems by giving each document the sum of 1 / (k + rank) over the rankings, with k = 60. The rule needs no scores and no training, and on TREC and LETOR data it beats the best single system, Condorcet Fuse and, in most cases, CombMNZ</td></tr>
</tbody>
</table>

## Notes (one per part of the paper)

<table width="100%">
<thead><tr><th><img src="../../../../assets/spacer.png" align="right" width="62" height="1">#</th><th><img src="../../../../assets/spacer.png" align="right" width="582" height="1">Note</th><th><img src="../../../../assets/spacer.png" align="right" width="660" height="1">Paper part</th><th><img src="../../../../assets/spacer.png" align="right" width="94" height="1">Status</th></tr></thead>
<tbody>
<tr><td>01</td><td><a href="01.%20Abstract.md">Abstract</a></td><td>Abstract</td><td>Done</td></tr>
<tr><td>02</td><td><a href="02.%20The%20RRF%20Formula.md">The RRF Formula</a></td><td>1, first part (the formula and why k = 60)</td><td>Done</td></tr>
<tr><td>03</td><td><a href="03.%20Condorcet%20Fuse%20and%20CombMNZ.md">Condorcet Fuse and CombMNZ</a></td><td>1, the two baselines</td><td>Done</td></tr>
<tr><td>04</td><td><a href="04.%20Pilot%20Experiments%20and%20the%20Choice%20of%20k.md">Pilot Experiments and the Choice of k</a></td><td>1, pilot runs (Table 1)</td><td>Done</td></tr>
<tr><td>05</td><td><a href="05.%20TREC%20Experiments%20and%20Significance.md">TREC Experiments and Significance</a></td><td>1, TREC runs and sign test (Table 2)</td><td>Done</td></tr>
<tr><td>06</td><td><a href="06.%20LETOR%203%20Meta-Learner.md">LETOR 3 Meta-Learner</a></td><td>1, LETOR 3 experiment (Table 3)</td><td>Done</td></tr>
<tr><td>07</td><td><a href="07.%20Discussion%20and%20Conclusion.md">Discussion and Conclusion</a></td><td>2 Discussion</td><td>Done</td></tr>
</tbody>
</table>

## How to Read These Notes

The paper is short and dense: one formula, two baselines, three tables and a few claims. The notes explain each part in plain words, check each claim against the tables, and test the same ideas on our own data (the Advanced RAG index and its 10 test questions). Our basic concepts note 09 already introduced the formula; these notes show where it comes from and how strong the evidence is.

```mermaid
flowchart LR
    A[01 abstract] --> B[02, 03<br/>formula,<br/>baselines]
    B --> C[04 to 06<br/>three<br/>experiments]
    C --> D[07 discussion]
```

## Navigation

Previous paper: [Fusion Functions for Hybrid Retrieval](../02.%20Fusion%20Functions%20for%20Hybrid%20Retrieval/) | [Research Paper Explained](../README.md)
