/**
 * Tests for the preset comparison helpers.
 *
 * Checks that the newest finished run of each preset is picked in ablation
 * order, that changes against the baseline are computed, and that "lower is
 * better" measures such as time are judged the right way round.
 */

// Imports
import { deltaFrom, isBetter, latestByPreset, presetLabel } from './compare.js'
import { describe, expect, it } from 'vitest'

// A run with a preset, a status and an overall score
const run = (id, preset, status, overall) => ({ id, preset, status, summary: { overall } })

describe('latestByPreset', () => {

  it('picks the newest finished run of each preset, in ablation order', () => {

    // Newest first: a running D, a newer D, an older D, an A, a run without preset
    const runs = [run('d3', 'D', 'running', null), run('d2', 'D', 'done', 0.87), run('d1', 'D', 'done', 0.8), run('a1', 'A', 'done', 0.79), run('x', null, 'done', 0.9)]

    // A first, then the newest finished D
    expect(latestByPreset(runs).map((item) => item.id)).toEqual(['a1', 'd2'])
  })

  it('handles no runs', () => {

    // Empty and missing lists
    expect(latestByPreset([])).toEqual([])
    expect(latestByPreset()).toEqual([])
  })
})

describe('deltaFrom and isBetter', () => {

  it('computes the change against the baseline', () => {

    // 0.866 against 0.790
    const delta = deltaFrom(run('a', 'A', 'done', 0.79), run('d', 'D', 'done', 0.866), 'overall')
    expect(delta).toBeCloseTo(0.076)

    // Missing values give null
    expect(deltaFrom(run('a', 'A', 'done', null), run('d', 'D', 'done', 0.9), 'overall')).toBeNull()
  })

  it('labels presets by what they add', () => {

    // Known presets and a run without preset
    expect(presetLabel('D')).toBe('+ threshold')
    expect(presetLabel(null)).toBe('Current settings')
  })

  it('judges higher or lower as better', () => {

    // A higher score is better, a longer time is worse, no change is neutral
    expect(isBetter(0.07)).toBe(true)
    expect(isBetter(980, true)).toBe(false)
    expect(isBetter(-200, true)).toBe(true)
    expect(isBetter(0)).toBeNull()
  })
})
