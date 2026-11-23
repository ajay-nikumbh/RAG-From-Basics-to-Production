/**
 * Tests for the analytics helpers.
 *
 * Checks that the day window is filled with zeros and keeps real totals,
 * that token shares add up, that recent questions come oldest first, that
 * run costs are averaged per type, and that stage averages come in pipeline
 * order with their shares.
 */

// Imports
import { averageCost, lastDays, recentQueries, stageAverages, tokenSplit } from './analytics.js'
import { describe, expect, it } from 'vitest'

describe('analytics helpers', () => {

  it('fills missing days with zeros and keeps real totals', () => {

    // One real day inside a 3-day window
    const days = lastDays([{ date: '2026-11-19', cost_usd: 0.5, tokens: 10, queries: 1, ingestions: 0 }], 3, new Date(2026, 10, 20))

    // Oldest first, with the real day in the middle
    expect(days.map((day) => day.date)).toEqual(['2026-11-18', '2026-11-19', '2026-11-20'])
    expect(days[0].tokens).toBe(0)
    expect(days[1].cost_usd).toBe(0.5)
  })

  it('computes token shares', () => {

    // 75 / 20 / 5 split
    const parts = tokenSplit({ embedding_tokens: 75, prompt_tokens: 20, completion_tokens: 5 })
    expect(parts.map((part) => part.share)).toEqual([0.75, 0.2, 0.05])

    // Nothing used yet
    expect(tokenSplit({ embedding_tokens: 0, prompt_tokens: 0, completion_tokens: 0 })[0].share).toBe(0)
  })

  it('lists recent questions oldest first', () => {

    // Newest first from the API, with an ingestion in between
    const recent = [{ kind: 'query', question: 'b' }, { kind: 'ingest', file: 'x.pdf' }, { kind: 'query', question: 'a' }]
    expect(recentQueries(recent).map((event) => [event.index, event.question])).toEqual([[1, 'a'], [2, 'b']])
  })

  it('averages the cost of one run type', () => {

    // Two questions and one ingestion
    const recent = [{ kind: 'query', cost_usd: 1 }, { kind: 'query', cost_usd: 3 }, { kind: 'ingest', cost_usd: 9 }]
    expect(averageCost(recent, 'query')).toBe(2)
    expect(averageCost([], 'ingest')).toBe(0)
  })
})

describe('stageAverages', () => {

  it('orders stages and computes rupees and shares', () => {

    // The API returns stages in any order; generate costs three times rerank
    const rows = stageAverages({
      generate: { runs: 2, avg_cost_usd: 0.0003, avg_tokens: 800, avg_latency_ms: 1500 },
      rerank: { runs: 2, avg_cost_usd: 0.0001, avg_tokens: 2400, avg_latency_ms: 500 },
    }, 100)

    // Pipeline order, rupees at the given rate, shares of cost and time
    expect(rows.map((row) => row.name)).toEqual(['rerank', 'generate'])
    expect(rows[0].inr).toBeCloseTo(0.01)
    expect(rows[0].costShare).toBeCloseTo(0.25)
    expect(rows[1].timeShare).toBeCloseTo(0.75)
  })

  it('handles no stage data', () => {

    // Older usage events have no stages
    expect(stageAverages(undefined)).toEqual([])
  })
})
