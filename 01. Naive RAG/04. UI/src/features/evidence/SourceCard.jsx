/**
 * Source card.
 *
 * This file shows one retrieved chunk in the evidence panel: its citation
 * number, file and page label, a bar for its cosine similarity score and the
 * chunk text. Chunks the answer cites are marked with the highlighter; chunks
 * that were retrieved but not cited are shown quieter. Single line breaks
 * from PDF pages are joined so the text reads as a paragraph. The card the
 * user clicked in the answer is scrolled into view and outlined.
 */

// Imports
import styles from './SourceCard.module.css'
import { useEffect, useRef } from 'react'

// Split chunk text into paragraphs at blank lines, joining the single line breaks PDF pages keep
function paragraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}

// One retrieved chunk with its score
export default function SourceCard({ source, cited, focused }) {

  // The card element, used to scroll it into view
  const cardRef = useRef(null)

  // Bring the clicked source into view
  useEffect(() => {
    if (focused) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [focused])

  // Classes for cited and focused cards
  const className = [styles.card, !cited && styles.uncited, focused && styles.focused].filter(Boolean).join(' ')

  // Score as a percentage width for the bar, kept between 0 and 100
  const barWidth = `${Math.max(0, Math.min(1, source.score)) * 100}%`

  return (
    <li ref={cardRef} className={className}>

      {/* Number, label and cited marker */}
      <div className={styles.header}>
        <span className={styles.number}>{source.number}</span>
        <span className={styles.label} title={source.label}>{source.label}</span>
        <span className={styles.status}>{cited ? 'cited' : 'not cited'}</span>
      </div>

      {/* Cosine similarity score */}
      <div className={styles.score}>
        <span className={styles.track}>
          <span className={styles.bar} style={{ width: barWidth }} />
        </span>
        <span className={styles.value}>{source.score.toFixed(3)}</span>
      </div>

      {/* Chunk text, one paragraph at a time, highlighted when cited */}
      <div className={styles.text}>
        {paragraphs(source.text).map((paragraph, index) => (
          <p key={index}>
            <mark className={cited ? styles.mark : styles.plain}>{paragraph}</mark>
          </p>
        ))}
      </div>
    </li>
  )
}
