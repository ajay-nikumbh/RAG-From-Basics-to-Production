/**
 * Root component.
 *
 * This file puts the three regions of the reading desk into the app layout:
 * the documents rail, the conversation sheet and the evidence panel. It owns
 * the conversation state, because both the chat and the evidence panel need
 * it: the chat adds and selects turns, the evidence panel shows the selected
 * turn's sources.
 */

// Imports
import DocumentsPanel from './features/documents/DocumentsPanel.jsx'
import { useConversation } from './features/chat/useConversation.js'
import EvidencePanel from './features/evidence/EvidencePanel.jsx'
import ApiStatus from './features/health/ApiStatus.jsx'
import ChatPanel from './features/chat/ChatPanel.jsx'
import AppLayout from './components/AppLayout.jsx'
import styles from './App.module.css'

// Main component
export default function App() {

  // Questions, answers, the selected turn and the clicked source
  const { turns, busy, ask, selectedTurn, focusedNumber, select } = useConversation()

  // Left region: app name, API status, upload and the documents list
  const rail = (
    <>
      <div className={styles.brand}>
        <p className={styles.wordmark}>Naive RAG</p>
        <p className={styles.tagline}>Ask your documents, check the evidence.</p>
        <ApiStatus />
      </div>
      <DocumentsPanel />
    </>
  )

  // Middle region: the conversation
  const conversation = (
    <ChatPanel turns={turns} busy={busy} onAsk={ask} selectedId={selectedTurn?.id} onSelect={select} />
  )

  // Right region: evidence for the selected answer
  const evidence = <EvidencePanel turn={selectedTurn} focusedNumber={focusedNumber} />

  return <AppLayout rail={rail} conversation={conversation} evidence={evidence} />
}
