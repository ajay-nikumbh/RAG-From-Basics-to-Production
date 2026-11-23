/**
 * Citation chip.
 *
 * This file draws one inline citation in an answer, such as [2], as a small
 * numbered chip. Hovering it shows a preview card with the file, page, score
 * and the start of the cited chunk; clicking it opens that source in the
 * source panel (the PDF at the cited page with the passage highlighted).
 */

// Imports
import { HoverCard } from '@/components/ui/overlay'
import { fileType } from '../documents/fileTypes'
import { sourceType } from './citations'
import { cn } from '@/lib/utils'

// Small cosine score bar
export function ScoreBar({ score, className }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(1, score)) * 100}%` }} />
      </div>
      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{score.toFixed(3)}</span>
    </div>
  )
}

// Inline numbered chip with a hover preview
export default function CitationChip({ number, source, active, onOpen }) {

  // A marker without a matching source is shown as plain text
  if (!source) {
    return <span className="text-muted-foreground">[{number}]</span>
  }

  // Icon for the file type
  const { icon: Icon, color } = fileType(sourceType(source))

  return (
    <HoverCard
      trigger={
        <button
          type="button"
          onClick={() => onOpen(number)}
          className={cn(
            'mx-0.5 inline-flex h-[18px] min-w-[18px] translate-y-[-1px] items-center justify-center rounded px-1 align-middle font-mono text-[10.5px] font-semibold transition-colors',
            active ? 'bg-primary text-primary-foreground' : 'bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground',
          )}
          aria-label={`Open source ${number}: ${source.label}`}
        >
          {number}
        </button>
      }
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn('mt-0.5 size-4 shrink-0', color)} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{source.label}</p>
          <ScoreBar score={source.score} className="mt-1" />
        </div>
      </div>
      <p className="mt-3 line-clamp-5 border-l-2 border-highlight-strong pl-3 text-[12.5px] leading-relaxed text-muted-foreground">{source.text}</p>
      <p className="mt-3 text-[11px] text-subtle-foreground">Click to open the source</p>
    </HoverCard>
  )
}
