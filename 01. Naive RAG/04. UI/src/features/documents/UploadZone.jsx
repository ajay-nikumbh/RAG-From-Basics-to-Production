/**
 * Upload zone.
 *
 * This file is the drop zone at the top of the documents rail. A file can be
 * dropped on it or picked with the file browser (click or keyboard). While a
 * file is being indexed the zone is disabled and says so; afterwards a short
 * success or error message appears below it.
 */

// Imports
import styles from './UploadZone.module.css'
import { useUpload } from './useUpload.js'
import { useState } from 'react'

// File types the backend accepts (implementation doc 08)
const ACCEPT = '.pdf,.xlsx,.docx,.txt,.md'

// Drop zone plus result message
export default function UploadZone({ onUploaded }) {

  // Upload state and the upload function
  const { status, message, upload } = useUpload(onUploaded)

  // True while a file is dragged over the zone
  const [dragging, setDragging] = useState(false)

  // Uploading blocks a second upload
  const busy = status === 'uploading'

  // Upload the first file of a file list
  function handleFiles(files) {
    const file = files?.[0]
    if (file && !busy) {
      upload(file)
    }
  }

  // Dropped file: stop the browser from opening it, then upload
  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  // Classes for the current state
  const zoneClass = [styles.zone, dragging && styles.dragging, busy && styles.busy].filter(Boolean).join(' ')

  return (
    <div className={styles.wrapper}>
      <label
        className={zoneClass}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >

        {/* Hidden but focusable file input; the whole zone is its label */}
        <input
          type="file"
          accept={ACCEPT}
          className={styles.input}
          disabled={busy}
          onChange={(event) => { handleFiles(event.target.files); event.target.value = '' }}
        />
        <span className={styles.title}>{busy ? 'Indexing...' : 'Drop a file or browse'}</span>
        <span className={styles.hint}>PDF, Excel, Word, text or Markdown</span>
      </label>

      {/* Result of the last upload */}
      {message && (
        <p className={styles[status]} role="status">
          {message}
        </p>
      )}
    </div>
  )
}
