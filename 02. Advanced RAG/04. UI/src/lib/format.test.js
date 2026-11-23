/**
 * Tests for the formatting helpers.
 *
 * Checks plurals, file sizes, costs, token counts, durations and relative
 * times with fixed inputs.
 */

// Imports
import { formatBytes, formatCost, formatInr, formatMs, formatTokens, plural, timeAgo } from './format.js'
import { describe, expect, it } from 'vitest'

describe('format helpers', () => {

  it('formats counts, sizes and money', () => {

    // Plural
    expect(plural(1, 'chunk')).toBe('1 chunk')
    expect(plural(91, 'chunk')).toBe('91 chunks')

    // Sizes
    expect(formatBytes(243)).toBe('243 B')
    expect(formatBytes(885323)).toBe('865 KB')
    expect(formatBytes(null)).toBe('-')

    // Money
    expect(formatCost(0.000198)).toBe('$0.000198')
    expect(formatCost(0.0421)).toBe('$0.0421')
    expect(formatCost(3.5)).toBe('$3.50')
    expect(formatInr(0.0459)).toBe('₹0.0459')
    expect(formatInr(0.42)).toBe('₹0.420')
    expect(formatInr(12.5)).toBe('₹12.50')
  })

  it('formats tokens, durations and relative times', () => {

    // Tokens
    expect(formatTokens(950)).toBe('950')
    expect(formatTokens(21198)).toBe('21.2K')

    // Durations
    expect(formatMs(412)).toBe('412 ms')
    expect(formatMs(1503)).toBe('1.5 s')

    // Relative time against a fixed "now"
    const now = new Date('2026-11-20T12:00:00Z').getTime()
    expect(timeAgo('2026-11-20T11:55:00Z', now)).toBe('5 min ago')
    expect(timeAgo('2026-11-18T12:00:00Z', now)).toBe('2 d ago')
  })
})
