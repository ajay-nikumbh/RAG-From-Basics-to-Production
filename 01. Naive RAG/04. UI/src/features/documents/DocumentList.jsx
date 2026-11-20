/**
 * Document list.
 *
 * This file shows the indexed files in the documents rail, one row per file
 * with its name, a small file-type tag and its page (or sheet) and chunk
 * counts. It also draws the three other states of the list: loading, error
 * (with a Retry button) and empty.
 */

// Imports
import EmptyState from '../../components/EmptyState.jsx'
import Button from '../../components/Button.jsx'
import styles from './DocumentList.module.css'
import { plural } from '../../utils/format.js'

// Word used for the parts of each file type
const PART_NAMES = { pdf: 'page', excel: 'sheet' }

// "19 pages", "1 sheet", or nothing for whole-file types
function partsLabel(fileType, parts) {
  const name = PART_NAMES[fileType]
  if (!name) {
    return ''
  }
  return plural(parts, name)
}

// List of indexed files with its loading, error and empty states
export default function DocumentList({ documents, status, error, onRetry }) {

  // First load in progress
  if (status === 'loading' && documents.length === 0) {
    return <p className={styles.note}>Loading documents...</p>
  }

  // Could not load the list
  if (status === 'error') {
    return (
      <div className={styles.error} role="alert">
        <p>{error}</p>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    )
  }

  // Nothing indexed yet
  if (documents.length === 0) {
    return (
      <EmptyState title="No documents yet">
        Upload a PDF, Excel, Word, text or Markdown file to start.
      </EmptyState>
    )
  }

  // One row per file
  return (
    <ul className={styles.list}>
      {documents.map((doc) => (
        <li key={doc.source} className={styles.item}>
          <span className={styles.name} title={doc.source}>{doc.source}</span>
          <span className={styles.meta}>
            <span className={styles.tag}>{doc.file_type}</span>
            {partsLabel(doc.file_type, doc.parts) && <span>{partsLabel(doc.file_type, doc.parts)}</span>}
            <span>{plural(doc.chunks, 'chunk')}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
