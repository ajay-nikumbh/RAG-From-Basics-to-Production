/**
 * Panel header.
 *
 * This file shows the small uppercase label at the top of a side panel
 * ("Documents", "Evidence") with optional metadata on the right, such as a
 * count. It keeps every panel heading the same size, weight and spacing.
 */

// Imports
import styles from './PanelHeader.module.css'

// Label on the left, optional metadata on the right
export default function PanelHeader({ title, meta }) {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {meta && <span className={styles.meta}>{meta}</span>}
    </header>
  )
}
