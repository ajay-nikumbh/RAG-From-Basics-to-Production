/**
 * Tests for the chat history helper.
 *
 * Checks that only answered turns are sent, oldest first, that the number of
 * turns is limited to the most recent ones, and that long answers are cut.
 */

// Imports
import { buildHistory, HISTORY_ANSWER_CHARS } from './history.js'
import { describe, expect, it } from 'vitest'

// A finished turn
const done = (question, answer) => ({ question, answer, status: 'done' })

describe('buildHistory', () => {

  it('keeps only answered turns, oldest first', () => {

    // One answered, one failed, one still running, one answered
    const turns = [done('q1', 'a1'), { question: 'q2', status: 'error' }, { question: 'q3', status: 'pending', answer: '' }, done('q4', 'a4')]

    // Failed and running turns are left out
    expect(buildHistory(turns)).toEqual([{ question: 'q1', answer: 'a1' }, { question: 'q4', answer: 'a4' }])
  })

  it('sends only the most recent turns', () => {

    // Eight answered turns, limit 3
    const turns = Array.from({ length: 8 }, (_, index) => done(`q${index}`, `a${index}`))

    // The last three
    expect(buildHistory(turns, 3).map((turn) => turn.question)).toEqual(['q5', 'q6', 'q7'])
  })

  it('cuts long answers', () => {

    // One very long answer
    const history = buildHistory([done('q', 'x'.repeat(5000))])

    // Cut to the limit
    expect(history[0].answer.length).toBe(HISTORY_ANSWER_CHARS)
  })
})
