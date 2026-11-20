/**
 * Tests for the citation helpers.
 *
 * Checks that answer text is split into text and citation pieces in the
 * right order, including markers next to each other, and that the set of
 * cited numbers has no duplicates.
 */

// Imports
import { citedNumbers, splitCitations } from './citations.js'
import { describe, expect, it } from 'vitest'

describe('splitCitations', () => {

  it('splits text and markers in order', () => {

    // Two markers, one at the end
    expect(splitCitations('You get 8 days [1]. Ask HR [2]')).toEqual([
      { type: 'text', value: 'You get 8 days ' },
      { type: 'cite', number: 1 },
      { type: 'text', value: '. Ask HR ' },
      { type: 'cite', number: 2 },
    ])
  })

  it('handles markers next to each other and text without markers', () => {

    // Adjacent markers become separate pieces
    expect(splitCitations('BART [2][3].')).toEqual([
      { type: 'text', value: 'BART ' },
      { type: 'cite', number: 2 },
      { type: 'cite', number: 3 },
      { type: 'text', value: '.' },
    ])

    // No markers: one text piece
    expect(splitCitations('Not found.')).toEqual([{ type: 'text', value: 'Not found.' }])
  })
})

describe('citedNumbers', () => {

  it('returns each cited number once', () => {

    // [1] appears twice
    expect(citedNumbers('A [1], B [3], C [1]')).toEqual(new Set([1, 3]))
  })
})
