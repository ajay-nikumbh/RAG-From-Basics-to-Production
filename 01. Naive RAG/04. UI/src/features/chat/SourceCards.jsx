/**
 * Source cards.
 *
 * This file lists the retrieved chunks under an answer as compact cards:
 * number, file name, page, similarity score and the first lines of the chunk.
 * Cited sources come first and are marked; sources the model retrieved but
 * did not cite are dimmed. Clicking a card opens it in the source panel.
 */

// Imports
import { fileType } from '../documents/fileTypes'
import { ScoreBar } from './CitationChip'
import { sourceType } from './citations'
import { cn } from '@/lib/utils'

// Grid of source cards
export default function SourceCards({ sources, cited, activeNumber, onOpen }) {

  // Cited sources first, then the rest, each group in retrieval order
  const ordered = [...sources].sort((a, b) => Number(cited.has(b.number)) - Number(cited.has(a.number)))

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ordered.map((source) => {
        const { icon: Icon, color } = fileType(sourceType(source))
        const isCited = cited.has(source.number)
        return (
          <button
            key={source.number}
            type="button"
            onClick={() => onOpen(source.number)}
            className={cn(
              'group flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-card',
              activeNumber === source.number && 'border-primary ring-2 ring-primary/15',
              !isCited && 'opacity-60 hover:opacity-100',
            )}
          >

            {/* Number, file and page */}
            <div className="flex items-center gap-2">
              <span className={cn('grid size-5 shrink-0 place-items-center rounded font-mono text-[10.5px] font-semibold', isCited ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground')}>
                {source.number}
              </span>
              <Icon className={cn('size-3.5 shrink-0', color)} />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{source.source}</span>
              {source.page && <span className="shrink-0 font-mono text-[11px] text-muted-foreground">p.{source.page}</span>}
            </div>

            {/* Start of the chunk */}
            <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{source.text}</p>

            {/* Score and cited flag */}
            <div className="flex items-center justify-between">
              <ScoreBar score={source.score} />
              <span className="text-[11px] text-subtle-foreground">{isCited ? 'Cited' : 'Retrieved'}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
