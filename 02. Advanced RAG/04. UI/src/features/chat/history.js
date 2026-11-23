/**
 * Chat history helper.
 *
 * This file turns the finished chat turns into the "history" list that
 * POST /query expects, so follow-up questions ("and how is it trained?") can
 * be rewritten into standalone questions by the API. Only answered turns are
 * sent, oldest first, at most HISTORY_TURNS of them, with long answers cut,
 * because the rewriter only needs to know what earlier turns were about.
 */

// Most recent answered turns sent with a question (the API rewriter uses the last 3)
export const HISTORY_TURNS = 6

// Longest part of an earlier answer that is sent, in characters
export const HISTORY_ANSWER_CHARS = 1500

// Earlier answered turns as [{ question, answer }], oldest first
export function buildHistory(turns, limit = HISTORY_TURNS) {

  // Only turns with an answer help the rewriter
  const answered = turns.filter((turn) => turn.status === 'done' && turn.answer)

  // The most recent ones, with long answers shortened
  return answered.slice(-limit).map((turn) => ({
    question: turn.question,
    answer: turn.answer.slice(0, HISTORY_ANSWER_CHARS),
  }))
}
