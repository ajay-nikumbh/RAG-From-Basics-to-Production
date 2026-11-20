# Research Paper Explained: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks

These notes walk through the original RAG paper section by section. Every figure, equation and table is explained in simple terms, and the key figures are redrawn.

In this note:

- Paper card with links
- The paper in one paragraph
- Reading order of the notes
- Which note covers which section of the paper

## Paper Card

<table width="100%">
<thead><tr><th>Field</th><th>Value</th></tr></thead>
<tbody>
<tr><td>Title</td><td>Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks</td></tr>
<tr><td>Authors</td><td>Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Kuttler, Mike Lewis, Wen-tau Yih, Tim Rocktaschel, Sebastian Riedel, Douwe Kiela</td></tr>
<tr><td>Organizations</td><td>Facebook AI Research, University College London, New York University</td></tr>
<tr><td>Year and venue</td><td>2020, NeurIPS 2020</td></tr>
<tr><td>arXiv</td><td><a href="https://arxiv.org/abs/2005.11401">2005.11401</a></td></tr>
<tr><td>Local PDF</td><td><a href="../../papers/2005.11401_RAG-Lewis.pdf">2005.11401_RAG-Lewis.pdf</a></td></tr>
<tr><td>Code</td><td><a href="https://huggingface.co/docs/transformers/model_doc/rag">HuggingFace Transformers RAG docs</a></td></tr>
</tbody>
</table>

## The Paper in One Paragraph

Large language models store facts inside their weights, but they cannot easily update those facts, cannot show where an answer came from, and sometimes invent facts (hallucinate). This paper connects a text generator (BART) to a searchable library of 21 million Wikipedia passages. For each input, a neural retriever (DPR) finds the most relevant passages, and the generator writes the output while reading them. The paper gives two ways to combine several passages (RAG-Sequence and RAG-Token), trains the retriever and generator together without telling the model which passage is correct, and shows state-of-the-art results on open-domain question answering, more factual text generation than BART alone, and the ability to update knowledge by simply swapping the passage index. The name "RAG" and the retrieve-then-generate pattern used in almost every modern LLM application come from this paper.

## Reading Order

<table width="100%">
<thead><tr><th>#</th><th>Note</th><th>What you learn</th></tr></thead>
<tbody>
<tr><td>1</td><td><a href="01.%20Abstract%20and%20Introduction.md">Abstract and Introduction</a></td><td>The problem, parametric vs non-parametric memory, Figure 1 redrawn and explained</td></tr>
<tr><td>2</td><td><a href="02.%20Models%20RAG-Sequence%20and%20RAG-Token.md">Models: RAG-Sequence and RAG-Token</a></td><td>Both core equations, symbol by symbol, with a worked numeric example</td></tr>
<tr><td>3</td><td><a href="03.%20Retriever%20DPR%20and%20Generator%20BART.md">Retriever DPR and Generator BART</a></td><td>How documents are scored, MIPS search, how BART reads the passages</td></tr>
<tr><td>4</td><td><a href="04.%20Training%20and%20Decoding.md">Training and Decoding</a></td><td>The loss function, what is trained and frozen, beam search, Thorough vs Fast decoding</td></tr>
<tr><td>5</td><td><a href="05.%20Experiments%20Setup.md">Experiments Setup</a></td><td>Wikipedia index, the four task families, datasets and metrics</td></tr>
<tr><td>6</td><td><a href="06.%20Results.md">Results</a></td><td>Tables 1 to 6, Figure 2 and Figure 3, ablations, index hot-swapping</td></tr>
<tr><td>7</td><td><a href="07.%20Related%20Work%20Discussion%20and%20Broader%20Impact.md">Related Work, Discussion and Broader Impact</a></td><td>Where RAG sits among earlier ideas, future work, risks</td></tr>
<tr><td>8</td><td><a href="08.%20Appendix%20Details.md">Appendix Details</a></td><td>Hardware, parameter counts, null document, retrieval collapse</td></tr>
<tr><td>9</td><td><a href="09.%20Key%20Takeaways%20and%20Link%20to%20Modern%20RAG.md">Key Takeaways and Link to Modern RAG</a></td><td>What today's Naive RAG kept from the paper and what changed</td></tr>
</tbody>
</table>

## Paper Section to Note Mapping

<table width="100%">
<thead><tr><th>Paper section</th><th>Content</th><th>Note</th></tr></thead>
<tbody>
<tr><td>Abstract, 1 Introduction, Figure 1</td><td>Motivation and overview</td><td>01</td></tr>
<tr><td>2 Methods, 2.1 Models</td><td>RAG-Sequence and RAG-Token equations</td><td>02</td></tr>
<tr><td>2.2 Retriever, 2.3 Generator</td><td>DPR and BART</td><td>03</td></tr>
<tr><td>2.4 Training, 2.5 Decoding</td><td>Loss and inference</td><td>04</td></tr>
<tr><td>3 Experiments</td><td>Tasks, datasets, index</td><td>05</td></tr>
<tr><td>4 Results, Tables 1 to 6, Figures 2 and 3</td><td>Numbers and analysis</td><td>06</td></tr>
<tr><td>5 Related Work, 6 Discussion, Broader Impact</td><td>Context and risks</td><td>07</td></tr>
<tr><td>Appendices A to I, Table 7</td><td>Implementation details</td><td>08</td></tr>
<tr><td>Not in paper</td><td>Mapping to modern RAG</td><td>09</td></tr>
</tbody>
</table>

## Navigation

[Notes Home](../../README.md#notes) | Next: [01. Abstract and Introduction](01.%20Abstract%20and%20Introduction.md)
