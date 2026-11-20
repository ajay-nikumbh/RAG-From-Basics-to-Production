/**
 * Chat panel.
 *
 * This file is the content of the conversation sheet: the title, the thread
 * of turns (or an empty state before the first question) and the ask form at
 * the bottom. The newest turn is scrolled into view when it is added.
 */

// Imports
import EmptyState from '../../components/EmptyState.jsx'
import styles from './ChatPanel.module.css'
import { useEffect, useRef } from 'react'
import AskForm from './AskForm.jsx'
import Turn from './Turn.jsx'

// Title, thread and question box
export default function ChatPanel({ turns, busy, onAsk, selectedId, onSelect }) {

  // Marker after the last turn, used for scrolling
  const endRef = useRef(null)

  // Scroll to the newest turn when one is added
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length])

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>Ask your documents</h1>
      <p className={styles.subtitle}>Answers come only from the files you upload, with numbered sources.</p>

      {/* Thread of turns, or guidance before the first question */}
      <div className={styles.thread}>
        {turns.length === 0 ? (
          <EmptyState title="No questions yet">
            Ask about the uploaded documents, for example: What are the two RAG models?
          </EmptyState>
        ) : (
          turns.map((turn) => (
            <Turn key={turn.id} turn={turn} selected={turn.id === selectedId} onSelect={onSelect} />
          ))
        )}
        <div ref={endRef} />
      </div>

      <AskForm onAsk={onAsk} busy={busy} />
    </div>
  )
}
