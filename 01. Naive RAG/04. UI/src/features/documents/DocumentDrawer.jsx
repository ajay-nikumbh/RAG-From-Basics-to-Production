/**
 * Document drawer.
 *
 * This file is the panel that slides in from the right when a document is
 * opened. The header shows the file name with its type, parts, chunks and
 * size. The body is split: the PDF on the left (for PDF files) and the list
 * of chunks on the right. Clicking a chunk jumps the PDF to its page and
 * highlights the chunk's text on the page, so you can see exactly what the
 * chunker cut out of it. Non-PDF files show the chunk list on its own.
 */

// Imports
import { documentFileUrl } from '@/api/client'
import { formatBytes, plural } from '@/lib/format'
import { Sheet } from '@/components/ui/overlay'
import PdfViewer from '@/features/pdf/PdfViewer'
import { fileType } from './fileTypes'
import ChunkList from './ChunkList'
import { useState } from 'react'

// Slide-in panel for one document
export default function DocumentDrawer({ document, onClose }) {

  // Page shown in the viewer and the chunk highlighted on it
  const [focus, setFocus] = useState({ page: 1, text: '' })

  // Header details
  const isPdf = document?.file_type === 'pdf'
  const { label, part } = fileType(document?.file_type)
  const description = document
    ? [label, part && plural(document.parts, part), plural(document.chunks, 'chunk'), formatBytes(document.size_bytes)].filter(Boolean).join('  /  ')
    : ''

  // Close and reset the viewer for the next document
  function handleOpenChange(open) {
    if (!open) {
      setFocus({ page: 1, text: '' })
      onClose()
    }
  }

  return (
    <Sheet
      open={Boolean(document)}
      onOpenChange={handleOpenChange}
      title={document?.source}
      description={description}
      className={isPdf ? 'max-w-6xl' : 'max-w-xl'}
    >
      {document && (
        <div className={isPdf ? 'grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_380px]' : 'h-full'}>

          {/* PDF preview */}
          {isPdf && (
            <div className="hidden min-h-0 border-r lg:block">
              <PdfViewer url={documentFileUrl(document.source)} page={focus.page} highlight={focus.text} />
            </div>
          )}

          {/* Chunks */}
          <div className="h-full min-h-0 overflow-y-auto">
            <p className="sticky top-0 z-10 border-b bg-card/95 px-5 py-2.5 text-[12px] text-muted-foreground backdrop-blur">
              {isPdf ? 'Click a chunk to see it highlighted on its page.' : 'Chunks this file was split into.'}
            </p>
            <ChunkList
              source={document.source}
              activePage={focus.page}
              onSelect={(chunk) => chunk.page && setFocus({ page: chunk.page, text: chunk.text })}
            />
          </div>
        </div>
      )}
    </Sheet>
  )
}
