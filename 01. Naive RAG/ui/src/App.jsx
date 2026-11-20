/**
 * Root component.
 *
 * This file puts the three regions of the reading desk into the app layout:
 * the documents rail, the conversation sheet and the evidence panel. It owns
 * the conversation state, because both the chat and the evidence panel need
 * it: the chat adds turns, the evidence panel shows the selected turn's
 * sources.
 */

// Imports
import DocumentsPanel from './features/documents/DocumentsPanel.jsx'
import { useConversation } from './features/chat/useConversation.js'
import PanelHeader from './components/PanelHeader.jsx'
import ChatPanel from './features/chat/ChatPanel.jsx'
import EmptyState from './components/EmptyState.jsx'
import AppLayout from './components/AppLayout.jsx'
import styles from './App.module.css'

// Main component
export default function App() {

  // Questions, answers and the selected turn
  const { turns, busy, ask, selectedTurn } = useConversation()

  // Left region: app name, upload and the documents list
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
    <ChatPanel turns={turns} busy={busy} onAsk={ask} selectedId={selectedTurn?.id} />
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
