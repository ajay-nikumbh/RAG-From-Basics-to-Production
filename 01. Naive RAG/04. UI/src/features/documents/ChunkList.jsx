/**
 * Chunk list.
 *
 * This file shows every chunk of one document as numbered cards with the
 * page or sheet it came from and its character count, so it is easy to see
 * how the chunker cut the file. Clicking a PDF chunk can jump the viewer to
 * its page. Chunks with the same page are grouped under a page heading.
 */

// Imports
import { useDocumentChunks } from '@/api/queries'
import { Skeleton } from '@/components/ui/misc'
import { cn } from '@/lib/utils'

// Chunks of one document
export default function ChunkList({ source, activePage, onSelectPage }) {

  // Chunks from GET /documents/{source}/chunks
  const { data, isPending, isError, error } = useDocumentChunks(source)

  // Loading
  if (isPending) {
    return <div className="space-y-3 p-5">{[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-20" />)}</div>
  }

  // Failed
  if (isError) {
    return <p className="p-5 text-sm text-danger">{error.message}</p>
  }

  return (
    <ol className="space-y-2 p-5">
      {data.chunks.map((chunk, index) => {
        const where = chunk.page ? `Page ${chunk.page}` : chunk.sheet ? `Sheet ${chunk.sheet}` : 'Document'
        const active = chunk.page && chunk.page === activePage
        return (
          <li key={index}>
            <button
              type="button"
              onClick={() => chunk.page && onSelectPage?.(chunk.page)}
              className={cn(
                'w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40',
                active && 'border-primary/50 bg-primary-soft/50',
              )}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">#{index + 1}  {where}  chunk {chunk.chunk_index}</span>
                <span className="font-mono">{chunk.text.length} chars</span>
              </div>
              <p className="mt-1.5 line-clamp-4 text-[13px] leading-relaxed whitespace-pre-line">{chunk.text}</p>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
