/**
 * Tests for the pipeline trace helpers.
 *
 * Checks the stage rows (order, zeros for stages that did not run, shares of
 * the total time), the rank change of a candidate, the score colours against
 * the threshold, and the one-line summary.
 */

// Imports
import { rankMove, scoreTone, stageRows, traceSummary } from './pipeline.js'
import { describe, expect, it } from 'vitest'

describe('stageRows', () => {

  it('lists every stage in order with time shares, tokens and cost', () => {

    // Rerank and generate ran, the others are missing
    const rows = stageRows({
      rerank: { prompt_tokens: 2500, completion_tokens: 33, embedding_tokens: 0, cost_inr: 0.033, latency_ms: 1000 },
      generate: { prompt_tokens: 1250, completion_tokens: 140, embedding_tokens: 0, cost_inr: 0.023, latency_ms: 3000 },
    })

    // Five stages in pipeline order
    expect(rows.map((row) => row.name)).toEqual(['rewrite', 'retrieve', 'rerank', 'compress', 'generate'])

    // Missing stages count as zero, shares add up to the total time
    expect(rows[0]).toMatchObject({ ms: 0, tokensIn: 0, inr: 0, share: 0 })
    expect(rows[2]).toMatchObject({ ms: 1000, tokensIn: 2500, tokensOut: 33, inr: 0.033, share: 0.25 })
    expect(rows[4].share).toBe(0.75)
  })

  it('handles an empty trace', () => {

    // No stage data at all
    expect(stageRows(undefined).every((row) => row.share === 0)).toBe(true)
  })
})

describe('candidates', () => {

  it('rankMove is positive when a chunk moved up', () => {

    // From rank 7 to rank 1, and from 1 to 3
    expect(rankMove({ retrieval_rank: 7, final_rank: 1 })).toBe(6)
    expect(rankMove({ retrieval_rank: 1, final_rank: 3 })).toBe(-2)
  })

  it('scoreTone compares the score with the threshold', () => {

    // Threshold 6: 6 and above pass, 4 and 5 are close, below is low
    expect(scoreTone(9, 6)).toBe('success')
    expect(scoreTone(6, 6)).toBe('success')
    expect(scoreTone(4, 6)).toBe('warning')
    expect(scoreTone(1, 6)).toBe('muted')
    expect(scoreTone(null, 6)).toBe('neutral')
  })
})

describe('traceSummary', () => {

  it('summarises rewrite, candidates and sent chunks', () => {

    // A rewritten question with 3 candidates, 2 sent
    const trace = { rewritten: true, compressed: false, candidates: [{ kept: true }, { kept: true }, { kept: false }] }
    expect(traceSummary(trace)).toBe('Rewritten - 3 candidates - 2 sent')

    // Compression is mentioned when it ran; no trace gives an empty string
    expect(traceSummary({ ...trace, rewritten: false, compressed: true })).toBe('Not rewritten - 3 candidates - 2 sent - compressed')
    expect(traceSummary(null)).toBe('')
  })
})
