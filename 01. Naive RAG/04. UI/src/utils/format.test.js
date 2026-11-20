/**
 * Tests for the formatting helpers.
 *
 * Checks that plural adds an "s" for every count except 1.
 */

// Imports
import { describe, expect, it } from 'vitest'
import { plural } from './format.js'

describe('plural', () => {

  it('uses the singular word for 1 and the plural otherwise', () => {

    // One, many and zero
    expect(plural(1, 'chunk')).toBe('1 chunk')
    expect(plural(91, 'chunk')).toBe('91 chunks')
    expect(plural(0, 'file')).toBe('0 files')
  })
})
