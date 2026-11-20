/**
 * useDocuments hook.
 *
 * This file loads the list of indexed files from GET /documents when the
 * component mounts, and gives back the list, the total chunk count, a status
 * (loading, ready or error), the error message and a refresh function that
 * the upload step calls after a new file is indexed.
 */

// Imports
import { useCallback, useEffect, useState } from 'react'
import { listDocuments } from '../../api/client.js'

// Load and refresh the indexed documents
export function useDocuments() {

  // List of files and total chunks from the backend
  const [documents, setDocuments] = useState([])
  const [totalChunks, setTotalChunks] = useState(0)

  // Request status and error message
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  // Fetch the list; state changes only when the request finishes
  const load = useCallback(() => {
    return listDocuments()
      .then((data) => {
        setDocuments(data.documents)
        setTotalChunks(data.total_chunks)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [])

  // Load once when the component appears (status starts as loading)
  useEffect(() => {
    load()
  }, [load])

  // Reload on demand, for example after an upload or on Retry
  const refresh = useCallback(() => {
    setStatus('loading')
    return load()
  }, [load])

  return { documents, totalChunks, status, error, refresh }
}
