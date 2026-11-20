/**
 * App layout.
 *
 * This file draws the three columns of the reading desk: the documents rail
 * on the left, the conversation sheet in the middle and the evidence panel on
 * the right. It only places the regions; what goes inside each one is passed
 * in as props, so the layout knows nothing about documents or answers.
 */

// Imports
import styles from './AppLayout.module.css'

// Three-column layout
export default function AppLayout({ rail, conversation, evidence }) {
  return (
    <div className={styles.desk}>

      {/* Left: upload and list documents */}
      <aside className={styles.rail} aria-label="Documents">
        {rail}
      </aside>

      {/* Middle: questions and answers, the focal surface */}
      <main className={styles.sheet}>
        {conversation}
      </main>

      {/* Right: chunks cited by the selected answer */}
      <aside className={styles.evidence} aria-label="Evidence">
        {evidence}
      </aside>
    </div>
  )
}
