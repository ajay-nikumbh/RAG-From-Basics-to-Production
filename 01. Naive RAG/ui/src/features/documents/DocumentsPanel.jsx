/**
 * Documents panel.
 *
 * This file is the content of the documents rail: the panel header with the
 * file count and the list of indexed files. It owns the documents state
 * through the useDocuments hook, so the upload step can refresh the list
 * from here.
 */

// Imports
import PanelHeader from '../../components/PanelHeader.jsx'
import { useDocuments } from './useDocuments.js'
import DocumentList from './DocumentList.jsx'

// Header plus list of indexed files
export default function DocumentsPanel() {

  // Indexed files from GET /documents
  const { documents, totalChunks, status, error, refresh } = useDocuments()

  // "1 file, 91 chunks" once the list has loaded
  const meta = status === 'ready' && documents.length > 0
    ? `${documents.length} file${documents.length === 1 ? '' : 's'}, ${totalChunks} chunks`
    : null

  return (
    <section>
      <PanelHeader title="Documents" meta={meta} />
      <DocumentList documents={documents} status={status} error={error} onRetry={refresh} />
    </section>
  )
}
