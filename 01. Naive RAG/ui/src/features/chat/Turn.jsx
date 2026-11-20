/**
 * Turn.
 *
 * This file shows one question and its answer. The question is a short line
 * in interface type; the answer is reading text in the serif font. While the
 * answer is being generated the turn says so, and if the request failed it
 * shows the error. The selected turn (the one whose sources are shown in the
 * evidence panel) gets a margin bar.
 */

// Imports
import styles from './Turn.module.css'

// One question and its answer
export default function Turn({ turn, selected }) {

  // Classes for the selected turn
  const className = [styles.turn, selected && styles.selected].filter(Boolean).join(' ')

  return (
    <article className={className} aria-current={selected || undefined}>

      {/* The question */}
      <p className={styles.question}>{turn.question}</p>

      {/* Waiting for the answer */}
      {turn.status === 'pending' && (
        <p className={styles.pending} role="status">Searching the documents and writing an answer...</p>
      )}

      {/* The request failed */}
      {turn.status === 'error' && (
        <p className={styles.error} role="alert">{turn.error}</p>
      )}

      {/* The answer */}
      {turn.status === 'done' && (
        <p className={styles.answer}>{turn.answer}</p>
      )}
    </article>
  )
}
