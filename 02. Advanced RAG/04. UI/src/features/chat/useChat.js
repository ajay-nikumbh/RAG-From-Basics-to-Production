/**
 * Chat context and hook.
 *
 * ChatContext carries the conversation state that ChatProvider (in
 * ChatContext.jsx) provides; useChat() reads it from any chat component.
 */

// Imports
import { createContext, useContext } from 'react'

// The context object
export const ChatContext = createContext(null)

// Read the chat state
export function useChat() {
  return useContext(ChatContext)
}
