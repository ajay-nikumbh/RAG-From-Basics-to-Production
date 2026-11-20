/**
 * Tests for the score helpers.
 *
 * Checks the tone boundaries, the missing-score case and score formatting.
 */

// Imports
import { formatScore, scoreTone } from './scores.js'
import { describe, expect, it } from 'vitest'

describe('score helpers', () => {

  it('maps scores to tones at the boundaries', () => {
    expect(scoreTone(0.75).tone).toBe('good')
    expect(scoreTone(0.74).tone).toBe('fair')
    expect(scoreTone(0.5).tone).toBe('fair')
    expect(scoreTone(0.49).word).toBe('Poor')
    expect(scoreTone(null).word).toBe('n/a')
  })

  it('formats scores', () => {
    expect(formatScore(0.8125)).toBe('0.81')
    expect(formatScore(1)).toBe('1.00')
    expect(formatScore(null)).toBe('-')
  })
})
