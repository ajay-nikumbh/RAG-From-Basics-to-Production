/**
 * Empty state.
 *
 * This file shows a short title and one line of help text when a region has
 * nothing to display yet, for example no documents uploaded or no answer
 * selected. It tells the user what will appear here and what to do next.
 */

// Imports
import styles from './EmptyState.module.css'

// Title plus one line of guidance
export default function EmptyState({ title, children }) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      <p className={styles.hint}>{children}</p>
    </div>
  )
}
