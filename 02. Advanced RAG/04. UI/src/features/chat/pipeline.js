/**
 * Pipeline trace helpers.
 *
 * This file turns the trace that POST /query returns into the rows the
 * pipeline panel draws: one row per stage with its time, tokens, cost and
 * share of the total time, the rank change of every candidate after
 * reranking, the colour of a reranker score against the threshold, and a
 * one-line summary of what the pipeline did.
 */

// Stages in pipeline order, with the label and chart colour each one uses
export const STAGES = [
  { name: 'rewrite', label: 'Rewrite', color: 'var(--chart-4)' },
  { name: 'retrieve', label: 'Retrieve', color: 'var(--chart-2)' },
  { name: 'rerank', label: 'Rerank', color: 'var(--chart-1)' },
  { name: 'compress', label: 'Compress', color: 'var(--chart-3)' },
  { name: 'generate', label: 'Generate', color: 'var(--success)' },
]

// One row per stage: time, tokens, rupees and share of the total time
export function stageRows(stageUsage = {}) {

  // Total time of all stages, to size each segment of the timeline
  const total = STAGES.reduce((sum, stage) => sum + (stageUsage[stage.name]?.latency_ms ?? 0), 0)

  // Stages in order, zero for a stage that did not run
  return STAGES.map((stage) => {
    const usage = stageUsage[stage.name] ?? {}
    const ms = usage.latency_ms ?? 0
    return {
      ...stage,
      ms,
      tokensIn: (usage.prompt_tokens ?? 0) + (usage.embedding_tokens ?? 0),
      tokensOut: usage.completion_tokens ?? 0,
      inr: usage.cost_inr ?? 0,
      share: total > 0 ? ms / total : 0,
    }
  })
}

// How many places a candidate moved: positive means up, negative down
export function rankMove(candidate) {
  return candidate.retrieval_rank - candidate.final_rank
}

// Colour of a reranker score: at or above the threshold, close below it, or low
export function scoreTone(score, threshold = 6) {
  if (score === null || score === undefined) {
    return 'neutral'
  }
  if (score >= threshold) {
    return 'success'
  }
  if (score >= threshold - 2) {
    return 'warning'
  }
  return 'muted'
}

// One-line summary, for example "Rewritten - 10 candidates - 4 sent"
export function traceSummary(trace) {

  // Nothing to summarise without a trace
  if (!trace) {
    return ''
  }

  // Rewrite, candidates and sent chunks
  const parts = [trace.rewritten ? 'Rewritten' : 'Not rewritten']
  parts.push(`${trace.candidates.length} candidates`)
  parts.push(`${trace.candidates.filter((candidate) => candidate.kept).length} sent`)

  // Compression only when it ran
  if (trace.compressed) {
    parts.push('compressed')
  }
  return parts.join(' - ')
}
