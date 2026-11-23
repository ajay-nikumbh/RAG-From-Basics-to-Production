/**
 * Tests for the citation helpers.
 *
 * Checks that markers become citation links (including adjacent markers and
 * existing links left alone), that cited numbers are collected once, and
 * that citation links are recognised.
 */

// Imports
import { citationNumber, citedNumbers, linkCitations } from './citations.js'
import { describe, expect, it } from 'vitest'

describe('citations', () => {

  it('links markers, including adjacent ones', () => {

    // Each marker becomes a link
    expect(linkCitations('BART [2][3].')).toBe('BART [2](#cite-2)[3](#cite-3).')

    // Text without markers is unchanged; existing links are left alone
    expect(linkCitations('No citations.')).toBe('No citations.')
    expect(linkCitations('[1](#cite-1)')).toBe('[1](#cite-1)')
  })

  it('collects cited numbers once and reads citation links', () => {

    // [1] twice, [3] once
    expect(citedNumbers('A [1], B [3], C [1]')).toEqual(new Set([1, 3]))

    // Citation link vs normal link
    expect(citationNumber('#cite-4')).toBe(4)
    expect(citationNumber('https://example.com')).toBeNull()
  })
})
