/**
 * useHealth hook.
 *
 * This file checks GET /health when the app opens and again every 30 seconds,
 * and reports one of three states: checking, online (with whether the Azure
 * chat and embedding settings are present) or offline (with the error
 * message). The UI uses it to tell the user when the API server is not
 * running, before they try to upload or ask.
 */

// Imports
import { useCallback, useEffect, useState } from 'react'
import { getHealth } from '../../api/client.js'

// Seconds between checks
const CHECK_EVERY_MS = 30000

// API status from GET /health
export function useHealth() {

  // checking, online or offline
  const [status, setStatus] = useState('checking')

  // Config flags from the backend, for example { azure_chat: true, azure_embeddings: true }
  const [config, setConfig] = useState(null)

  // Error message when offline
  const [error, setError] = useState('')

  // Ask the backend; state changes only when the request finishes
  const check = useCallback(() => {
    return getHealth()
      .then((data) => {
        setConfig(data.config)
        setStatus('online')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('offline')
      })
  }, [])

  // Check now, then on a timer; stop the timer when the component goes away
  useEffect(() => {
    check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    return () => clearInterval(timer)
  }, [check])

  return { status, config, error }
}
