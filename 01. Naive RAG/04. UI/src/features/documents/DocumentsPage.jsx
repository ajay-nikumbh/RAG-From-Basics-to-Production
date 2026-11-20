/**
 * Documents page.
 *
 * This file is the ingestion workspace: four summary numbers about the index
 * (files, chunks, pages, storage), then the upload panel and the table of
 * indexed documents on the left, and on the right the index overview (the
 * ingestion pipeline and its settings, chunks per file, recent ingestions). Opening a row shows the
 * document drawer with the PDF preview and the chunks.
 */

// Imports
import { Boxes, FileStack, FileText, HardDrive } from 'lucide-react'
import { formatBytes, formatTokens } from '@/lib/format'
import PageHeader from '@/components/layout/PageHeader'
import DocumentDrawer from './DocumentDrawer'
import DocumentsTable from './DocumentsTable'
import { useDocuments } from '@/api/queries'
import IndexOverview from './IndexOverview'
import { useLocation } from 'react-router'
import UploadPanel from './UploadPanel'
import { useState } from 'react'

// One summary number
function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-card">
      <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

// Ingestion workspace
export default function DocumentsPage() {

  // Indexed documents and the one open in the drawer
  const { data, isPending } = useDocuments()
  const [open, setOpen] = useState(null)
  const documents = data?.documents ?? []

  // Open the document picked in the sidebar library (passed as router state), once per navigation
  const location = useLocation()
  const [handledKey, setHandledKey] = useState(null)
  if (location.state?.open && handledKey !== location.key && documents.length > 0) {
    setHandledKey(location.key)
    setOpen(documents.find((doc) => doc.source === location.state.open) ?? null)
  }

  // Summary numbers
  const pages = documents.filter((d) => d.file_type === 'pdf').reduce((sum, d) => sum + d.parts, 0)
  const bytes = documents.reduce((sum, d) => sum + (d.size_bytes ?? 0), 0)

  return (
    <div>
      <PageHeader title="Documents" description="Upload files, follow the ingestion pipeline and inspect how each file was chunked." />

      <div className="space-y-6 p-6 md:p-8">

        {/* Index summary */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={FileStack} label="Files" value={documents.length} />
          <Stat icon={Boxes} label="Chunks" value={formatTokens(data?.total_chunks ?? 0)} />
          <Stat icon={FileText} label="PDF pages" value={pages} />
          <Stat icon={HardDrive} label="Storage" value={formatBytes(bytes)} />
        </div>

        {/* Upload and table on the left, how the index was built on the right */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <UploadPanel />
            <DocumentsTable documents={documents} isPending={isPending} onOpen={setOpen} />
          </div>
          <IndexOverview documents={documents} totalChunks={data?.total_chunks ?? 0} />
        </div>
      </div>

      <DocumentDrawer document={open} onClose={() => setOpen(null)} />
    </div>
  )
}
