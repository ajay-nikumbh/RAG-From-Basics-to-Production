/**
 * Citation helpers.
 *
 * The backend answer is Markdown text with citation markers such as [1] or
 * [2][3]. linkCitations() turns every marker into a Markdown link to
 * "#cite-N", so the Markdown renderer can draw it as a citation chip.
 * citedNumbers() lists which source numbers the answer actually cites.
 * sourceType() tells PDF sources (shown as pages) from other files.
 */

// Matches one citation marker like [1] or [12] that is not already a link
const CITATION = /\[(\d+)\](?!\()/g

// "BART [2][3]." -> "BART [2](#cite-2)[3](#cite-3)."
export function linkCitations(text) {
  return text.replace(CITATION, (_, number) => `[${number}](#cite-${number})`)
}

// Set of source numbers cited anywhere in the answer
export function citedNumbers(text) {
  return new Set(Array.from(text.matchAll(CITATION), (match) => Number(match[1])))
}

// Number from a "#cite-N" link, or null for normal links
export function citationNumber(href) {
  const match = /^#cite-(\d+)$/.exec(href ?? '')
  return match ? Number(match[1]) : null
}

// 'pdf' for PDF sources, 'text' for every other file
export function sourceType(source) {
  return source.source.toLowerCase().endsWith('.pdf') ? 'pdf' : 'text'
}
