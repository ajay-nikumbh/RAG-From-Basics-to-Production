/**
 * useConversation hook.
 *
 * This file keeps the list of turns in the conversation. A turn is one
 * question and its answer. ask() adds a pending turn right away, sends the
 * question to POST /query and then fills the turn with the answer and its
 * sources, or with the error message. It also remembers which turn is
 * selected and which of its sources was clicked, so the evidence panel knows
 * what to show and what to point at.
 */

// Imports
import { askQuestion } from '../../api/client.js'
import { useState } from 'react'

// Conversation state and actions
export function useConversation() {

  // Turns in the order they were asked
  const [turns, setTurns] = useState([])

  // Id of the turn whose sources the evidence panel shows
  const [selectedId, setSelectedId] = useState(null)

  // Source number clicked in that turn's answer, or null
  const [focusedNumber, setFocusedNumber] = useState(null)

  // Change one turn by id without touching the others
  function updateTurn(id, changes) {
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, ...changes } : turn)))
  }

  // Show a turn's sources, optionally pointing at one source number
  function select(id, number = null) {
    setSelectedId(id)
    setFocusedNumber(number)
  }

  // Ask a question and fill in the answer when it arrives
  async function ask(question) {

    // Add the turn immediately so the question shows while waiting
    const id = crypto.randomUUID()
    setTurns((current) => [...current, { id, question, status: 'pending', answer: '', sources: [], error: '' }])
    select(id)

    // Ask the backend, then store the answer or the error
    try {
      const result = await askQuestion(question)
      updateTurn(id, { status: 'done', answer: result.answer, sources: result.sources })
    } catch (err) {
      updateTurn(id, { status: 'error', error: err.message })
    }
  }

  // True while the latest question is still waiting for its answer
  const busy = turns.some((turn) => turn.status === 'pending')

  // The selected turn, or null
  const selectedTurn = turns.find((turn) => turn.id === selectedId) ?? null

  return { turns, busy, ask, selectedTurn, focusedNumber, select }
}
