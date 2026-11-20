/**
 * API status.
 *
 * This file shows one small status line under the app name: a colored dot and
 * a short text. Online and fully configured is quiet; a missing Azure setting
 * or an unreachable server is shown in danger ink with what to do.
 */

// Imports
import styles from './ApiStatus.module.css'
import { useHealth } from './useHealth.js'

// Text and tone for the current status
function describe(status, config, error) {

  // First check still running
  if (status === 'checking') {
    return { tone: 'neutral', text: 'Checking API...' }
  }

  // Server not reachable
  if (status === 'offline') {
    return { tone: 'danger', text: error }
  }

  // Server up but a setting is missing in .env
  if (!config?.azure_chat || !config?.azure_embeddings) {
    return { tone: 'danger', text: 'API online, but Azure OpenAI settings are missing in .env' }
  }

  // Everything ready
  return { tone: 'success', text: 'API online, Azure OpenAI configured' }
}

// Dot plus status text
export default function ApiStatus() {

  // Status from GET /health
  const { status, config, error } = useHealth()
  const { tone, text } = describe(status, config, error)

  return (
    <p className={`${styles.status} ${styles[tone]}`} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {text}
    </p>
  )
}
