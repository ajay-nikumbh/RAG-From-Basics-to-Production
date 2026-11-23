/**
 * PDF highlight matching.
 *
 * The PDF viewer renders a text layer: the page text split into small
 * pieces (text items). To highlight a cited chunk on the page, each piece is
 * checked against the chunk text. Both texts are normalised first (lower
 * case, hyphenated line breaks joined, runs of spaces collapsed), because
 * the backend (pypdf) and the browser (pdf.js) extract the same page with
 * slightly different spacing.
 */

// Shortest text item worth highlighting; tiny items like "a" or "1" match everywhere
const MIN_LENGTH = 4

// Lower case, join "infor- mation", collapse whitespace
export function normalise(text) {
  return text
    .toLowerCase()
    .replace(/(\w)-\s+(\w)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
}

// True when a text item from the page appears inside the cited chunk
export function isInChunk(itemText, normalisedChunk) {
  const item = normalise(itemText)
  return item.length >= MIN_LENGTH && normalisedChunk.includes(item)
}

// Escape text for safe use inside HTML returned by the text renderer
export function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
