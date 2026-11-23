"""
RAG service (online query pipeline).

This file runs the full Advanced RAG query pipeline for one question:

    rewrite -> retrieve candidates -> rerank -> select chunks -> generate

The rewriter turns the question (and the recent chat turns) into a
standalone question and a search query. The search query finds the
candidate chunks, the reranker scores them against the standalone question,
and the selector keeps the best few. The generator answers the standalone
question from the kept chunks only.

It returns the answer, the sources used (citations), the usage of the run
(tokens, cost, time) and a trace of every stage: the questions at each step,
every candidate with its similarity, reranker score and whether it was kept,
and the time of each stage. If no chunk is kept (empty index or nothing
relevant), it returns the fixed not-found answer without calling the chat
model. Like the ingestion service, it knows nothing about HTTP.
"""

# Imports
from app.generation.prompts import NOT_FOUND_ANSWER, build_messages, source_label
from app.core.logging import get_logger, is_debug, log_detail, log_step, preview
from app.retrieval.retriever import retrieve_candidates
from app.reranking.reranker import RankedChunk, rerank
from app.generation.generator import generate_answer
from app.reranking.selector import select_chunks
from app.rewriting.rewriter import rewrite_query
from app.services.usage import track_usage
from app.core.config import get_settings
from dataclasses import dataclass, field
import time
import re


# Logger for pipeline steps
log = get_logger(__name__)


@dataclass
class Source:
    """One kept chunk shown to the user as a citation."""

    # Citation number used in the answer, for example 1 for [1]
    number: int

    # Short label, for example "report.pdf, page 3"
    label: str

    # Cosine similarity between the search query and the chunk
    score: float

    # The chunk text sent to the model
    text: str

    # File name and page (PDF only), so the UI can open the exact page
    source: str = ""
    page: int | None = None

    # Reranker score (0 to 10) and position before reranking
    rerank_score: float | None = None
    retrieval_rank: int | None = None


@dataclass
class Usage:
    """Tokens, cost and time of one query."""

    # Tokens used by the query embedding and the chat model (rewrite, rerank, answer)
    embedding_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0

    # Cost in US dollars and Indian rupees, and total time in milliseconds
    cost_usd: float = 0.0
    cost_inr: float = 0.0
    latency_ms: int = 0


@dataclass
class TraceCandidate:
    """One retrieved candidate and what happened to it."""

    # Position before and after reranking (1 = best)
    retrieval_rank: int
    final_rank: int

    # Where the chunk comes from
    label: str
    source: str
    page: int | None

    # Cosine similarity and reranker score (None when not reranked)
    similarity: float
    rerank_score: float | None

    # Sent to the generator, and its citation number when sent
    kept: bool
    citation: int | None = None


@dataclass
class Trace:
    """What every stage of the pipeline did for one question."""

    # The question at each step
    original_question: str = ""
    standalone_question: str = ""
    search_query: str = ""

    # Whether each model stage ran, and why or why not
    rewritten: bool = False
    rewrite_reason: str = ""
    reranked: bool = False
    rerank_reason: str = ""
    selection_reason: str = ""

    # Every candidate, in final order
    candidates: list[TraceCandidate] = field(default_factory=list)

    # Milliseconds spent in each stage
    timings_ms: dict = field(default_factory=dict)


@dataclass
class RagAnswer:
    """The answer, the sources it was generated from, the usage and the trace of the run."""

    # Answer text from the chat model (or the fixed not-found answer)
    answer: str

    # Kept chunks in citation order
    sources: list[Source]

    # Tokens, cost and time
    usage: Usage = field(default_factory=Usage)

    # What each stage did
    trace: Trace = field(default_factory=Trace)


def elapsed_ms(start: float) -> int:
    """Milliseconds since start."""

    # perf_counter is in seconds
    return round((time.perf_counter() - start) * 1000)


def build_trace_candidates(chunks: list[RankedChunk], kept_count: int) -> list[TraceCandidate]:
    """Describe every candidate in final order; the first kept_count were sent."""

    # One entry per candidate, citation numbers for the kept ones
    candidates = []
    for final_rank, chunk in enumerate(chunks, start=1):
        meta = chunk.result.document.metadata
        kept = final_rank <= kept_count
        candidates.append(TraceCandidate(
            retrieval_rank=chunk.retrieval_rank,
            final_rank=final_rank,
            label=source_label(meta),
            source=meta.get("source", ""),
            page=meta.get("page"),
            similarity=round(chunk.result.score, 4),
            rerank_score=chunk.rerank_score,
            kept=kept,
            citation=final_rank if kept else None,
        ))
    return candidates


def log_candidates(candidates: list[TraceCandidate]) -> None:
    """One log line per candidate: new rank, old rank, similarity, score, kept mark, file and page."""

    # Kept chunks are marked with "keep", the others are dimmed
    for candidate in candidates:
        score = "-" if candidate.rerank_score is None else f"{candidate.rerank_score:.0f}"
        mark = "[green]keep[/]" if candidate.kept else "[dim]drop[/]"
        page = f"p.{candidate.page}" if candidate.page else "-"
        log_detail(log, f"#{candidate.final_rank}", f"{mark}  was #{candidate.retrieval_rank}  sim=[cyan]{candidate.similarity:.3f}[/]  score=[cyan]{score}[/]  {candidate.source}  [dim]{page}[/]")


def answer_question(question: str, history: list[dict] | None = None, usage_kind: str = "query") -> RagAnswer:
    """Rewrite, retrieve, rerank, select and generate, and return the answer with sources and trace.

    history holds earlier turns as {"question": ..., "answer": ...}, oldest
    first. usage_kind names the recorded run: "query" for user questions,
    "eval_query" when an evaluation run asks the question.
    """

    # Read the shared settings, start the clock and an empty trace
    settings = get_settings()
    start = time.perf_counter()
    trace = Trace(original_question=question)
    limit = 300 if is_debug(log) else 64

    # The question being answered
    log.info(f"  [bold]{'question':<12}[/]  \"{preview(question, 120)}\"  [dim]kind={usage_kind}  history={len(history or [])}[/]")

    # Measure tokens, cost and time of this query
    with track_usage(usage_kind, question=question[:300]) as meter:

        # Stage 1: condense and rewrite the question
        stage = time.perf_counter()
        with log_step(log, "rewrite") as step:
            rewrite = rewrite_query(question, history)
            step["reason"] = rewrite.reason
        trace.standalone_question = rewrite.standalone_question
        trace.search_query = rewrite.search_query
        trace.rewritten = rewrite.rewritten
        trace.rewrite_reason = rewrite.reason
        trace.timings_ms["rewrite"] = elapsed_ms(stage)
        if rewrite.rewritten:
            log_detail(log, "standalone", f"\"{preview(rewrite.standalone_question, limit + 60)}\"")
            log_detail(log, "search", f"\"{preview(rewrite.search_query, limit + 60)}\"")

        # Stage 2: retrieve candidates with the search query
        stage = time.perf_counter()
        with log_step(log, "retrieve") as step:
            candidates = retrieve_candidates(rewrite.search_query)
            step["candidates"] = len(candidates)
            step["top_similarity"] = round(candidates[0].score, 3) if candidates else None
        trace.timings_ms["retrieve"] = elapsed_ms(stage)

        # Stage 3: score the candidates against the standalone question
        stage = time.perf_counter()
        with log_step(log, "rerank") as step:
            outcome = rerank(rewrite.standalone_question, candidates)
            step["reason"] = outcome.reason
        trace.reranked = outcome.reranked
        trace.rerank_reason = outcome.reason
        trace.timings_ms["rerank"] = elapsed_ms(stage)

        # Stage 4: keep the chunks that pass the threshold and limits
        selection = select_chunks(outcome)
        trace.selection_reason = selection.reason
        trace.candidates = build_trace_candidates(outcome.chunks, len(selection.kept))
        log_detail(log, "select", f"kept=[cyan]{len(selection.kept)}[/] of {len(outcome.chunks)}  [dim]{selection.reason}[/]")
        log_candidates(trace.candidates)

        # Nothing to answer from: fixed answer without calling the chat model
        if not selection.kept:
            log.info(f"  [yellow]no chunks kept ({selection.reason}), returning the not-found answer[/]")
            answer = NOT_FOUND_ANSWER
            trace.timings_ms["generate"] = 0

        # Stage 5: answer the standalone question from the kept chunks
        else:
            stage = time.perf_counter()
            messages = build_messages(rewrite.standalone_question, [chunk.result for chunk in selection.kept])
            log.debug(f"      [dim]prompt[/]\n{preview(messages[1]['content'], 20000)}")
            with log_step(log, "generate", model=settings.azure_openai_deployment_name) as step:
                answer = generate_answer(messages)
                step["context_chars"] = len(messages[1]["content"])
            trace.timings_ms["generate"] = elapsed_ms(stage)

            # The answer and the sources it cites
            cited = sorted({int(number) for number in re.findall(r"\[(\d+)\]", answer)})
            log_detail(log, "answer", f"\"{preview(answer, limit + 60)}\"")
            log_detail(log, "cited", f"{cited or 'none'}  [dim]of {len(selection.kept)} kept[/]")

        # Keep the number of sources with the saved event
        meter.details["sources"] = len(selection.kept)
        meter.details["candidates"] = len(candidates)

    # Number the sources the same way as the context blocks in the prompt
    sources = [
        Source(
            number=number,
            label=source_label(chunk.result.document.metadata),
            score=round(chunk.result.score, 4),
            text=chunk.result.document.text,
            source=chunk.result.document.metadata.get("source", ""),
            page=chunk.result.document.metadata.get("page"),
            rerank_score=chunk.rerank_score,
            retrieval_rank=chunk.retrieval_rank,
        )
        for number, chunk in enumerate(selection.kept, start=1)
    ]

    # Usage of the whole run
    cost = meter.cost(settings)
    total_tokens = meter.embedding_tokens + meter.prompt_tokens + meter.completion_tokens
    log.info(f"  [bold]{'usage':<12}[/]  tokens=[cyan]{total_tokens}[/]  cost=[cyan]${cost:.6f}[/]  inr=[cyan]Rs {cost * settings.usd_to_inr:.4f}[/]  stages={trace.timings_ms}")
    usage = Usage(
        embedding_tokens=meter.embedding_tokens,
        prompt_tokens=meter.prompt_tokens,
        completion_tokens=meter.completion_tokens,
        cost_usd=round(cost, 6),
        cost_inr=round(cost * settings.usd_to_inr, 4),
        latency_ms=elapsed_ms(start),
    )

    return RagAnswer(answer=answer, sources=sources, usage=usage, trace=trace)
