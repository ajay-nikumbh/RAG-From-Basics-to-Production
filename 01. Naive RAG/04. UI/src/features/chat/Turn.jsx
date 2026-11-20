/**
 * Turn.
 *
 * This file shows one question and its answer. The question is a short line
 * in interface type; the answer is reading text in the serif font, where each
 * citation marker such as [1] becomes a small clickable chip that opens that
 * source in the evidence panel. While the answer is being generated the turn
 * says so, and if the request failed it shows the error. A turn that is not
 * selected has a "Show evidence" button; the selected one gets a margin bar.
 */

// Imports
import { splitCitations } from './citations.js'
import { plural } from '../../utils/format.js'
import styles from './Turn.module.css'

// One question and its answer
export default function Turn({ turn, selected, onSelect }) {

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

      {/* The answer, with citation chips */}
      {turn.status === 'done' && (
        <p className={styles.answer}>
          {splitCitations(turn.answer).map((piece, index) =>
            piece.type === 'text' ? (
              <span key={index}>{piece.value}</span>
            ) : (
              <button
                key={index}
                type="button"
                className={styles.cite}
                onClick={() => onSelect(turn.id, piece.number)}
                aria-label={`Show source ${piece.number}`}
              >
                {piece.number}
              </button>
            ),
          )}
        </p>
      )}

      {/* Link to the evidence for turns that are not selected */}
      {turn.status === 'done' && !selected && turn.sources.length > 0 && (
        <button type="button" className={styles.showEvidence} onClick={() => onSelect(turn.id)}>
          Show evidence ({plural(turn.sources.length, 'source')})
        </button>
      )}
    </article>
  )
}
