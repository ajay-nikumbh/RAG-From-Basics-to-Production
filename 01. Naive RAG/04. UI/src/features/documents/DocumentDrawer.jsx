/**
 * Document drawer.
 *
 * This file is the panel that slides in from the right when a document is
 * opened. The header shows the file name with its type, parts, chunks and
 * size. The body lists the chunks the file was split into.
 */

// Imports
import { formatBytes, plural } from '@/lib/format'
import { Sheet } from '@/components/ui/overlay'
import { fileType } from './fileTypes'
import ChunkList from './ChunkList'

// Slide-in panel for one document
export default function DocumentDrawer({ document, onClose }) {

  // Header details
  const { label, part } = fileType(document?.file_type)
  const description = document
    ? [label, part && plural(document.parts, part), plural(document.chunks, 'chunk'), formatBytes(document.size_bytes)].filter(Boolean).join('  /  ')
    : ''

  return (
    <Sheet open={Boolean(document)} onOpenChange={(open) => !open && onClose()} title={document?.source} description={description} className="max-w-xl">
      <div className="h-full overflow-y-auto">
        {document && <ChunkList source={document.source} />}
      </div>
    </Sheet>
  )
}
