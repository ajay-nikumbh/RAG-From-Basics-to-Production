/**
 * Pipeline panel.
 *
 * This file shows what the Advanced RAG pipeline did for one answer, from
 * the trace that POST /query returns. A one-line summary row opens the
 * panel, which has three parts: the question at each step (as asked,
 * understood, searched with), a timeline with the time, tokens and cost of
 * every stage, and a table of all candidates with their rank before and
 * after reranking, similarity, reranker score and whether they were sent and
 * cited. Scores are coloured against the threshold from GET /health.
 */

// Imports
import { ArrowDown, ArrowUp, ChevronDown, Minus, Workflow } from 'lucide-react'
import { rankMove, scoreTone, stageRows, traceSummary } from './pipeline'
import { formatInr, formatMs, formatTokens } from '@/lib/format'
import { Tooltip } from '@/components/ui/overlay'
import { useHealth } from '@/api/queries'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// Text colour of each score tone
const TONE_CLASS = {
  success: 'bg-success-soft text-success',
  warning: 'bg-highlight text-warning',
  muted: 'bg-muted text-muted-foreground',
  neutral: 'bg-muted text-subtle-foreground',
}

// Small uppercase section title
function SectionTitle({ children }) {
  return <p className="mb-2 text-[11px] font-medium tracking-wider text-subtle-foreground uppercase">{children}</p>
}

// The question as asked, understood and searched with
function Questions({ trace }) {

  // Three rows; the reason explains a skipped rewrite
  const rows = [
    { label: 'Asked', text: trace.original_question },
    { label: 'Understood as', text: trace.standalone_question },
    { label: 'Searched with', text: trace.search_query },
  ]

  return (
    <div>
      <SectionTitle>Question at each step</SectionTitle>
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 break-words">{row.text}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 font-mono text-[11px] text-subtle-foreground">rewrite: {trace.rewrite_reason}  -  rerank: {trace.rerank_reason}  -  select: {trace.selection_reason}</p>
    </div>
  )
}

// Timeline bar and per-stage numbers
function Stages({ stageUsage }) {

  // Rows in pipeline order with time shares
  const rows = stageRows(stageUsage)

  return (
    <div>
      <SectionTitle>Time and cost per stage</SectionTitle>

      {/* Timeline: one segment per stage, width by time */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {rows.filter((row) => row.share > 0).map((row) => (
          <Tooltip key={row.name} content={`${row.label}: ${formatMs(row.ms)}`}>
            <div className="h-full" style={{ width: `${row.share * 100}%`, background: row.color }} />
          </Tooltip>
        ))}
      </div>

      {/* Numbers per stage */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        {rows.map((row) => (
          <div key={row.name} className={cn('rounded-md border px-2.5 py-2', row.ms === 0 && row.inr === 0 && 'opacity-50')}>
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium">
              <span className="size-2 rounded-full" style={{ background: row.color }} />{row.label}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{formatMs(row.ms)}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{formatTokens(row.tokensIn)} in / {formatTokens(row.tokensOut)} out</p>
            <p className="font-mono text-[11px] text-muted-foreground">{formatInr(row.inr)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Up, down or same arrow with the number of places moved
function Move({ candidate }) {

  // Places moved by reranking
  const move = rankMove(candidate)
  if (move === 0) {
    return <span className="flex items-center gap-0.5 text-subtle-foreground"><Minus className="size-3" /></span>
  }

  // Green when the chunk moved up, muted when it moved down
  const Icon = move > 0 ? ArrowUp : ArrowDown
  return (
    <span className={cn('flex items-center gap-0.5', move > 0 ? 'text-success' : 'text-muted-foreground')}>
      <Icon className="size-3" />{Math.abs(move)}
    </span>
  )
}

// Every candidate with ranks, scores and status
function Candidates({ candidates, threshold, cited }) {
  return (
    <div>
      <SectionTitle>Candidates after reranking (threshold {threshold})</SectionTitle>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full table-fixed text-[12px]">

          {/* Fixed widths so the chunk label gets the remaining space */}
          <colgroup>
            <col className="w-12" />
            <col className="w-16" />
            <col />
            <col className="w-20" />
            <col className="w-16" />
            <col className="w-24" />
          </colgroup>
          <thead className="bg-muted/60 text-[11px] text-muted-foreground">
            <tr>
              <th className="px-2.5 py-1.5 text-left font-medium">Rank</th>
              <th className="px-2.5 py-1.5 text-left font-medium">Was</th>
              <th className="px-2.5 py-1.5 text-left font-medium">Chunk</th>
              <th className="px-2.5 py-1.5 text-right font-medium">Similarity</th>
              <th className="px-2.5 py-1.5 text-right font-medium">Score</th>
              <th className="px-2.5 py-1.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => {
              const tone = scoreTone(candidate.rerank_score, threshold)
              const isCited = candidate.citation !== null && cited.has(candidate.citation)
              return (
                <tr key={`${candidate.retrieval_rank}-${candidate.label}`} className={cn('border-t', !candidate.kept && 'text-muted-foreground')}>
                  <td className="px-2.5 py-1.5 font-mono">{candidate.final_rank}</td>
                  <td className="px-2.5 py-1.5 font-mono">
                    <span className="flex items-center gap-2">{candidate.retrieval_rank}<Move candidate={candidate} /></span>
                  </td>
                  <td className="truncate px-2.5 py-1.5" title={candidate.label}>{candidate.label}</td>
                  <td className="px-2.5 py-1.5 text-right font-mono tabular-nums">{candidate.similarity.toFixed(3)}</td>
                  <td className="px-2.5 py-1.5 text-right">
                    <span className={cn('inline-block min-w-7 rounded px-1.5 py-px text-center font-mono font-medium', TONE_CLASS[tone])}>
                      {candidate.rerank_score ?? '-'}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right text-[11.5px]">
                    {candidate.kept ? <span className="font-medium text-primary">{isCited ? `Cited [${candidate.citation}]` : `Sent [${candidate.citation}]`}</span> : 'Dropped'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Collapsible pipeline view for one answer
export default function PipelinePanel({ trace, cited }) {

  // Closed by default so the answer stays the focus
  const [open, setOpen] = useState(false)
  const { data: health } = useHealth()
  const threshold = health?.pipeline?.rerank_threshold ?? 6

  // Older answers without a trace show nothing
  if (!trace) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card">

      {/* Summary row that opens the panel */}
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px]" aria-expanded={open}>
        <Workflow className="size-3.5 text-primary" />
        <span className="font-medium">Pipeline</span>
        <span className="text-muted-foreground">{traceSummary(trace)}</span>
        <ChevronDown className={cn('ml-auto size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {/* Details */}
      {open && (
        <div className="space-y-5 border-t px-3 py-3">
          <Questions trace={trace} />
          <Stages stageUsage={trace.stage_usage} />
          <Candidates candidates={trace.candidates} threshold={threshold} cited={cited} />
          {trace.compressed && (
            <p className="text-[12px] text-muted-foreground">Compression kept {trace.context_chars_after} of {trace.context_chars_before} characters.</p>
          )}
        </div>
      )}
    </div>
  )
}
