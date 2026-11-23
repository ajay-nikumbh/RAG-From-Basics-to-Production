/**
 * Chat state.
 *
 * This file keeps the conversation in a React context, so it survives
 * moving between pages (Chat, Documents, Analytics). A turn is one question
 * and its answer. ask() adds a pending turn, sends the question to
 * POST /query and fills the turn with the answer, sources and usage, or the
 * error. evaluate() grades an answer with the LLM judge (POST /evals/answer)
 * and stores the scores on the turn. openSource() remembers which source of
 * which turn the source panel shows.
 */

// Imports
import { useAsk, useEvaluateAnswer } from '@/api/queries'
import { ChatContext } from './useChat'
import { useState } from 'react'

// Provider placed around the pages in App
export function ChatProvider({ children }) {

  // Turns in order, and the source shown in the panel: { turnId, number } or null
  const [turns, setTurns] = useState([])
  const [opened, setOpened] = useState(null)
  const askMutation = useAsk()
  const evaluateMutation = useEvaluateAnswer()

  // Change one turn by id
  function updateTurn(id, changes) {
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, ...changes } : turn)))
  }

  // Ask a question and fill in the answer when it arrives
  async function ask(question, topK = null) {

    // Show the question immediately
    const id = crypto.randomUUID()
    setTurns((current) => [...current, { id, question, topK, status: 'pending', answer: '', sources: [], usage: null, error: '', evaluation: null }])

    // Ask the backend, then store the result or the error
    try {
      const result = await askMutation.mutateAsync({ question, topK })
      updateTurn(id, { status: 'done', answer: result.answer, sources: result.sources, usage: result.usage })
    } catch (err) {
      updateTurn(id, { status: 'error', error: err.message })
    }
  }

  // Grade one answer with the LLM judge and keep the scores on the turn
  async function evaluate(turn) {
    updateTurn(turn.id, { evaluation: { status: 'pending' } })
    try {
      const result = await evaluateMutation.mutateAsync({ question: turn.question, answer: turn.answer, contexts: turn.sources.map((source) => source.text) })
      updateTurn(turn.id, { evaluation: { status: 'done', result } })
    } catch (err) {
      updateTurn(turn.id, { evaluation: { status: 'error', error: err.message } })
    }
  }

  // Start over
  function reset() {
    setTurns([])
    setOpened(null)
  }

  // Values shared with the chat components
  const value = {
    turns,
    busy: turns.some((turn) => turn.status === 'pending'),
    ask,
    evaluate,
    reset,
    opened,
    openSource: (turnId, number) => setOpened({ turnId, number }),
    closeSource: () => setOpened(null),
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
