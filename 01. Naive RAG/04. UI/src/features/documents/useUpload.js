/**
 * useUpload hook.
 *
 * This file uploads one file to POST /documents and tracks what is happening:
 * idle, uploading, success or error, with a message to show the user. After a
 * successful upload it calls onUploaded so the documents list can refresh.
 */

// Imports
import { uploadDocument } from '../../api/client.js'
import { plural } from '../../utils/format.js'
import { useState } from 'react'

// Upload a file and report progress
export function useUpload(onUploaded) {

  // idle, uploading, success or error
  const [status, setStatus] = useState('idle')

  // Text shown under the drop zone
  const [message, setMessage] = useState('')

  // Send one file to the backend
  async function upload(file) {

    // Show that indexing has started (embedding can take a few seconds)
    setStatus('uploading')
    setMessage(`Indexing ${file.name}...`)

    // Upload, then report the result
    try {
      const result = await uploadDocument(file)
      setStatus('success')
      setMessage(`Indexed ${result.source}: ${plural(result.chunks, 'chunk')}.`)
      onUploaded?.()
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return { status, message, upload }
}
