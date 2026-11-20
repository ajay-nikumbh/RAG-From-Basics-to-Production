/**
 * Root component.
 *
 * This file puts the three regions of the reading desk into the app layout:
 * the documents rail, the conversation sheet and the evidence panel. Each
 * region shows its feature, or an empty state until that feature is built.
 */

// Imports
import DocumentsPanel from './features/documents/DocumentsPanel.jsx'
import PanelHeader from './components/PanelHeader.jsx'
import EmptyState from './components/EmptyState.jsx'
import AppLayout from './components/AppLayout.jsx'
import styles from './App.module.css'

// Main component
export default function App() {

  // Left region: app name and the documents list
  const rail = (
    <>
      <div className={styles.brand}>
        <p className={styles.wordmark}>Naive RAG</p>
        <p className={styles.tagline}>Ask your documents, check the evidence.</p>
      </div>
      <DocumentsPanel />
    </>
  )

  // Middle region: the conversation
  const conversation = (
    <>
      <h1 className={styles.title}>Ask your documents</h1>
      <p className={styles.subtitle}>Answers come only from the files you upload, with numbered sources.</p>
      <EmptyState title="No questions yet">
        Your questions and the answers will appear here.
      </EmptyState>
    </>
  )

  // Right region: evidence for the selected answer
  const evidence = (
    <>
      <PanelHeader title="Evidence" />
      <EmptyState title="Nothing to verify yet">
        The chunks an answer was built from will be shown here, highlighted.
      </EmptyState>
    </>
  )

  return <AppLayout rail={rail} conversation={conversation} evidence={evidence} />
}
