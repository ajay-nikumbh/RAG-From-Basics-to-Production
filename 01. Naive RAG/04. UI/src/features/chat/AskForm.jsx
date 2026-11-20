/**
 * Ask form.
 *
 * This file is the question box at the bottom of the conversation sheet. It
 * grows with the text, sends on Enter (Shift+Enter adds a new line) or with
 * the Ask button, and is disabled while an answer is being generated.
 */

// Imports
import Button from '../../components/Button.jsx'
import styles from './AskForm.module.css'
import { useState } from 'react'

// Same limit as the backend QueryRequest schema
const MAX_LENGTH = 2000

// Question box with an Ask button
export default function AskForm({ onAsk, busy }) {

  // Current text in the box
  const [question, setQuestion] = useState('')

  // A question needs at least one non-space character
  const canAsk = question.trim().length > 0 && !busy

  // Send the question and clear the box
  function submit(event) {
    event.preventDefault()
    if (!canAsk) {
      return
    }
    onAsk(question.trim())
    setQuestion('')
  }

  // Enter sends, Shift+Enter makes a new line
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      submit(event)
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label} htmlFor="question">Question</label>
      <textarea
        id="question"
        className={styles.box}
        rows={2}
        maxLength={MAX_LENGTH}
        placeholder="Ask something about your documents..."
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className={styles.footer}>
        <span className={styles.hint}>Enter to ask, Shift + Enter for a new line</span>
        <Button type="submit" variant="primary" disabled={!canAsk}>
          {busy ? 'Answering...' : 'Ask'}
        </Button>
      </div>
    </form>
  )
}
