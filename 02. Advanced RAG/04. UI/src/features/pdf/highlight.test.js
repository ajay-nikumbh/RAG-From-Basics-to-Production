/**
 * Tests for PDF highlight matching.
 *
 * Checks normalisation (case, hyphen breaks, spaces), that short items are
 * never highlighted, and that HTML is escaped.
 */

// Imports
import { escapeHtml, isInChunk, normalise } from './highlight.js'
import { describe, expect, it } from 'vitest'

describe('highlight matching', () => {

  it('normalises case, hyphen breaks and spaces', () => {

    // pypdf and pdf.js spacing differences disappear
    expect(normalise('Dense  Passage\nRetri- eval')).toBe('dense passage retrieval')
  })

  it('matches page items that appear in the chunk', () => {

    // Chunk text as stored by the backend
    const chunk = normalise('We use a pre-trained neural retriever (DPR) and BART.')

    // Long enough and contained: highlight
    expect(isInChunk('neural retriever', chunk)).toBe(true)

    // Too short or not contained: no highlight
    expect(isInChunk('and', chunk)).toBe(false)
    expect(isInChunk('generator', chunk)).toBe(false)
  })

  it('escapes HTML', () => {

    // Text from the PDF never becomes markup
    expect(escapeHtml('<b>a & b</b>')).toBe('&lt;b&gt;a &amp; b&lt;/b&gt;')
  })
})
