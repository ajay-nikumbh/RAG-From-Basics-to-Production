/**
 * Citation helpers.
 *
 * The backend answer is plain text with citation markers such as [1] or
 * [2][3]. This file splits that text into pieces of plain text and citation
 * numbers, so the UI can turn each marker into a clickable chip, and lists
 * which source numbers an answer actually cites.
 */

// Matches one citation marker like [1] or [12]
const CITATION = /\[(\d+)\]/g

// Split answer text into text pieces and citation pieces, in order
export function splitCitations(text) {

  // Pieces collected while walking through the text
  const pieces = []
  let last = 0

  // Every marker ends the text before it and adds a citation piece
  for (const match of text.matchAll(CITATION)) {
    if (match.index > last) {
      pieces.push({ type: 'text', value: text.slice(last, match.index) })
    }
    pieces.push({ type: 'cite', number: Number(match[1]) })
    last = match.index + match[0].length
  }

  // Text after the last marker
  if (last < text.length) {
    pieces.push({ type: 'text', value: text.slice(last) })
  }

  return pieces
}

// Set of source numbers cited anywhere in the answer
export function citedNumbers(text) {
  return new Set(Array.from(text.matchAll(CITATION), (match) => Number(match[1])))
}
