/**
 * Documents panel.
 *
 * This file is the content of the documents rail: the upload zone, the panel
 * header with the file count and the list of indexed files. It owns the
 * documents state through the useDocuments hook and refreshes the list after
 * every successful upload.
 */

// Imports
import PanelHeader from '../../components/PanelHeader.jsx'
import { useDocuments } from './useDocuments.js'
import { plural } from '../../utils/format.js'
import DocumentList from './DocumentList.jsx'
import UploadZone from './UploadZone.jsx'

// Upload zone, header and list of indexed files
export default function DocumentsPanel() {

  // Indexed files from GET /documents
  const { documents, totalChunks, status, error, refresh } = useDocuments()

  // "1 file, 91 chunks" once the list has loaded
  const meta = status === 'ready' && documents.length > 0
    ? `${plural(documents.length, 'file')}, ${plural(totalChunks, 'chunk')}`
    : null

  return (
    <section>
      <UploadZone onUploaded={refresh} />
      <PanelHeader title="Documents" meta={meta} />
      <DocumentList documents={documents} status={status} error={error} onRetry={refresh} />
    </section>
  )
}
