/**
 * Formatting helpers.
 *
 * Small text helpers shared by several components, so counts read correctly
 * everywhere: "1 chunk", "2 chunks", "19 pages".
 */

// Number plus a word, with an "s" when the count is not 1
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
