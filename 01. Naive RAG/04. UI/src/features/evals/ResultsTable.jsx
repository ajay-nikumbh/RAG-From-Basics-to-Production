/**
 * Results table.
 *
 * One row per test case of a run: the question, whether the expected file
 * was retrieved, the four metric scores and the overall score. Clicking a row
 * expands it to show the answer next to the reference answer, the judge's
 * reason for every metric and the retrieved chunks (relevant ones marked).
 * Cases that failed show their error.
 */

// Imports
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ChevronRight, Minus, X } from 'lucide-react'
import { formatScore, METRICS, scoreTone } from './scores'
import { MetricRow, ScoreBadge } from './ScoreParts'
import { Tooltip } from '@/components/ui/overlay'
import { Fragment, useState } from 'react'
import { cn } from '@/lib/utils'

// Text color per tone for score cells
const CELL = { good: 'text-success', fair: 'text-warning', poor: 'text-danger', none: 'text-subtle-foreground' }

// Retrieval hit icon: yes, no, or not checked
function Hit({ value }) {
  if (value === null || value === undefined) {
    return <Tooltip content="No expected file for this case"><Minus className="size-4 text-subtle-foreground" /></Tooltip>
  }
  return value
    ? <Tooltip content="Expected file was retrieved"><Check className="size-4 text-success" /></Tooltip>
    : <Tooltip content="Expected file was not retrieved"><X className="size-4 text-danger" /></Tooltip>
}

// Expanded details of one case
function CaseDetails({ result }) {
  const relevant = new Set(result.relevant_chunks)
  return (
    <div className="grid gap-6 bg-muted/30 px-5 py-5 lg:grid-cols-2">

      {/* Answer and reference */}
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Answer</p>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{result.answer}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Reference</p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{result.reference}</p>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Retrieved chunks</p>
          <ul className="space-y-1">
            {result.sources.map((source) => (
              <li key={source.number} className="flex items-center gap-2 text-[12.5px]">
                <span className="grid size-5 shrink-0 place-items-center rounded bg-card font-mono text-[10.5px] ring-1 ring-border">{source.number}</span>
                <span className={cn('min-w-0 flex-1 truncate', source.source === result.expected_source && 'font-medium')}>{source.label}</span>
                <span className="font-mono text-[11px] text-subtle-foreground">{source.score.toFixed(3)}</span>
                {relevant.has(source.number) && <span className="rounded bg-success-soft px-1.5 py-px text-[11px] font-medium text-success">Relevant</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Judge reasons */}
      <div className="space-y-4">
        {METRICS.map(({ key, label, hint }) => (
          <MetricRow key={key} label={label} hint={hint} metric={result.metrics[key]} />
        ))}
      </div>
    </div>
  )
}

// Table of case results with expandable rows
export default function ResultsTable({ run }) {

  // Id of the expanded case
  const [open, setOpen] = useState(null)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div>
          <CardTitle>Test cases</CardTitle>
          <CardDescription>Click a case to compare the answer with the reference and read the judge's reasons</CardDescription>
        </div>
      </CardHeader>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-y bg-muted/50 text-left text-[11.5px] text-muted-foreground">
            <th className="px-5 py-2 font-medium">Question</th>
            <th className="px-2 py-2 text-center font-medium">Hit</th>
            {METRICS.map(({ key, label, hint }) => (
              <th key={key} className="hidden px-2 py-2 text-right font-medium md:table-cell">
                <Tooltip content={hint}><span className="cursor-help">{label.split(' ')[0]}</span></Tooltip>
              </th>
            ))}
            <th className="px-5 py-2 text-right font-medium">Overall</th>
          </tr>
        </thead>
        <tbody>
          {run.results.map((result) => (
            <Fragment key={result.id}>
              <tr onClick={() => setOpen(open === result.id ? null : result.id)} className="cursor-pointer border-b hover:bg-muted/40">
                <td className="w-full max-w-0 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className={cn('size-4 shrink-0 text-subtle-foreground transition-transform', open === result.id && 'rotate-90')} />
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={result.question}>{result.question}</p>
                      <p className="font-mono text-[11px] text-subtle-foreground">{result.id}</p>
                    </div>
                  </div>
                </td>
                {result.error ? (
                  <td colSpan={METRICS.length + 2} className="px-5 py-3 text-right text-[12.5px] text-danger">{result.error}</td>
                ) : (
                  <>
                    <td className="px-2 py-3"><div className="flex justify-center"><Hit value={result.retrieval_hit} /></div></td>
                    {METRICS.map(({ key }) => {
                      const score = result.metrics[key]?.score ?? null
                      return <td key={key} className={cn('hidden px-2 py-3 text-right font-mono tabular-nums md:table-cell', CELL[scoreTone(score).tone])}>{formatScore(score)}</td>
                    })}
                    <td className="px-5 py-3 text-right whitespace-nowrap"><ScoreBadge score={result.overall} /></td>
                  </>
                )}
              </tr>
              {open === result.id && !result.error && (
                <tr className="border-b"><td colSpan={METRICS.length + 3} className="p-0"><CaseDetails result={result} /></td></tr>
              )}
            </Fragment>
          ))}
          {run.results.length === 0 && (
            <tr><td colSpan={METRICS.length + 3} className="px-5 py-10 text-center text-muted-foreground">The first case is being evaluated...</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  )
}
