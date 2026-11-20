/**
 * Source panel.
 *
 * This file shows the source that was clicked in an answer. A PDF source
 * opens in the PdfViewer at the cited page with the cited passage
 * highlighted. Other files (Markdown, text, Word, Excel) have no page view,
 * so the panel shows the chunk text itself. The header names the file, the
 * page and the score, and has buttons to step through the other sources of
 * the same answer and to close the panel.
 */

// Imports
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { fileType } from '../documents/fileTypes'
import { Button } from '@/components/ui/button'
import { documentFileUrl } from '@/api/client'
import { ScoreBar } from './CitationChip'
import { sourceType } from './citations'
import PdfViewer from '../pdf/PdfViewer'
import { cn } from '@/lib/utils'

// Panel with the opened source
export default function SourcePanel({ sources, number, onOpen, onClose }) {

  // The opened source and its position in the list
  const index = sources.findIndex((source) => source.number === number)
  const source = sources[index]
  if (!source) {
    return null
  }

  // File type details
  const type = sourceType(source)
  const { icon: Icon, color } = fileType(type)

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">

      {/* Header: source, page, score and navigation */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">{source.number}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon className={cn('size-3.5 shrink-0', color)} />
            <p className="truncate text-[13px] font-medium">{source.source}</p>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-muted-foreground">
            {source.page && <span>Page {source.page}</span>}
            <ScoreBar score={source.score} />
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => onOpen(sources[index - 1].number)} disabled={index <= 0} aria-label="Previous source"><ChevronLeft /></Button>
          <span className="font-mono text-[11.5px] text-muted-foreground">{index + 1}/{sources.length}</span>
          <Button variant="ghost" size="icon" onClick={() => onOpen(sources[index + 1].number)} disabled={index >= sources.length - 1} aria-label="Next source"><ChevronRight /></Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close source"><X /></Button>
        </div>
      </div>

      {/* PDF at the cited page, or the chunk text for other files */}
      <div className="min-h-0 flex-1">
        {type === 'pdf' ? (
          <PdfViewer url={documentFileUrl(source.source)} page={source.page ?? 1} highlight={source.text} />
        ) : (
          <div className="h-full overflow-auto bg-muted/60 p-4">
            <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6 shadow-card">
              <p className="mb-3 text-[11px] font-medium tracking-wider text-subtle-foreground uppercase">Cited chunk</p>
              <p className="text-[14px] leading-7 whitespace-pre-wrap"><mark className="pdf-highlight">{source.text}</mark></p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
