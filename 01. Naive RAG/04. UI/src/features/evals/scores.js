/**
 * Score helpers.
 *
 * Shared by the chat Evaluate card and the Evals page. METRICS lists the
 * four judge metrics with a label and a one-line explanation. scoreTone()
 * turns a 0 to 1 score into a tone (good, fair, poor) with a word, so a
 * score is never shown by color alone. formatScore() prints scores the same
 * way everywhere.
 */

// The four metrics in display order
export const METRICS = [
  { key: 'faithfulness', label: 'Faithfulness', hint: 'Share of the answer\'s claims supported by the retrieved chunks' },
  { key: 'answer_relevance', label: 'Answer relevance', hint: 'How directly the answer addresses the question' },
  { key: 'context_precision', label: 'Context precision', hint: 'Relevant chunks out of all retrieved chunks' },
  { key: 'correctness', label: 'Correctness', hint: 'Agreement with the reference answer (test set only)' },
]

// Score at or above which an answer counts as good, and as fair
export const GOOD = 0.75
export const FAIR = 0.5

// Tone and word for a score; null scores are "n/a"
export function scoreTone(score) {
  if (score === null || score === undefined) {
    return { tone: 'none', word: 'n/a' }
  }
  if (score >= GOOD) {
    return { tone: 'good', word: 'Good' }
  }
  if (score >= FAIR) {
    return { tone: 'fair', word: 'Fair' }
  }
  return { tone: 'poor', word: 'Poor' }
}

// 0.8125 -> "0.81", null -> "-"
export function formatScore(score) {
  return score === null || score === undefined ? '-' : score.toFixed(2)
}
