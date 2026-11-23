/**
 * Recent runs.
 *
 * Lists the latest questions and ingestions recorded by the backend usage
 * meter, newest first. Each row shows the run (question or file, with its
 * time, latency and number of sources or chunks), a token breakdown bar,
 * the question tokens (prompt: question plus retrieved context), the answer
 * tokens (completion), the embedding tokens and the cost in rupees with the
 * dollar amount underneath. Tabs filter by type: questions, ingestions and
 * evaluations (evaluation questions and judge calls).
 */

// Imports
import { formatCost, formatInr, formatMs, formatTokens, plural, timeAgo } from '@/lib/format'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, Tooltip } from '@/components/ui/overlay'
import { FileUp, Gauge, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// Token parts drawn in the breakdown bar, in the same colors as the token split card
const PARTS = [
  { key: 'prompt_tokens', label: 'Question', color: 'var(--chart-2)' },
  { key: 'completion_tokens', label: 'Answer', color: 'var(--chart-3)' },
  { key: 'embedding_tokens', label: 'Embedding', color: 'var(--chart-1)' },
]

// Thin bar with one segment per token part
function TokenBar({ event }) {
  return (
    <div className="flex h-1.5 w-28 gap-px overflow-hidden rounded-full bg-muted">
      {PARTS.filter((part) => event[part.key] > 0).map((part) => (
        <div key={part.key} style={{ width: `${(event[part.key] / event.total_tokens) * 100}%`, background: part.color }} />
      ))}
    </div>
  )
}

// Right-aligned token count, or a dash when the run has none of that kind
function TokenCell({ value }) {
  return (
    <td className="px-3 py-3 text-right font-mono text-[12.5px] tabular-nums">
      {value ? formatTokens(value) : <span className="text-subtle-foreground">-</span>}
    </td>
  )
}

// Column header with an explanation on hover
function Head({ label, hint, className }) {
  return (
    <th className={cn('px-3 py-2 font-medium', className)}>
      {hint ? <Tooltip content={hint}><span className="cursor-help border-b border-dotted border-subtle-foreground">{label}</span></Tooltip> : label}
    </th>
  )
}

// Card with filter tabs and the runs table
export default function RecentRuns({ recent, rate }) {

  // Selected filter and the matching rows
  const [filter, setFilter] = useState('all')
  const rows = filter === 'all' ? recent : recent.filter((event) => (filter === 'eval' ? event.kind.startsWith('eval') : event.kind === filter))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-wrap pb-4">
        <div>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription>Tokens for every question and answer, and what each run cost</CardDescription>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="query">Questions</TabsTrigger>
            <TabsTrigger value="ingest">Ingestions</TabsTrigger>
            <TabsTrigger value="eval">Evaluations</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-y bg-muted/50 text-left text-[11.5px] text-muted-foreground">
              <th className="px-5 py-2 font-medium">Run</th>
              <Head label="Breakdown" />
              <Head label="Question" hint="Prompt tokens: the question plus the retrieved chunks sent to the chat model" className="text-right" />
              <Head label="Answer" hint="Completion tokens written by the chat model" className="text-right" />
              <Head label="Embedding" hint="Tokens turned into vectors: the question, or every chunk of an uploaded file" className="text-right" />
              <th className="px-5 py-2 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => {
              const isIngest = event.kind === 'ingest'
              const isEval = event.kind.startsWith('eval')
              const Icon = isIngest ? FileUp : isEval ? Gauge : MessageSquare
              const subject = isIngest ? event.file : event.question
              const extra = isIngest ? plural(event.chunks ?? 0, 'chunk') : event.kind === 'eval_judge' ? 'judge' : plural(event.sources ?? 0, 'source')
              const kindLabel = isIngest ? 'Ingestion' : isEval ? 'Evaluation' : 'Question'
              return (
                <tr key={`${event.time}-${subject}`} className="border-b last:border-0 hover:bg-muted/40">

                  {/* Run: icon, question or file, and its context */}
                  <td className="max-w-[30rem] px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', isIngest ? 'bg-muted text-muted-foreground' : isEval ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary')}>
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={subject}>{subject}</p>
                        <p className="text-[11.5px] text-subtle-foreground">
                          {kindLabel} - {timeAgo(event.time)} - {formatMs(event.latency_ms)} - {extra}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Token breakdown and counts */}
                  <td className="px-3 py-3">
                    <Tooltip content={`${event.total_tokens.toLocaleString()} tokens in total`}>
                      <div><TokenBar event={event} /></div>
                    </Tooltip>
                  </td>
                  <TokenCell value={event.prompt_tokens} />
                  <TokenCell value={event.completion_tokens} />
                  <TokenCell value={event.embedding_tokens} />

                  {/* Cost in rupees, dollars underneath */}
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <p className="font-mono text-[13px] font-semibold tabular-nums">{formatInr(event.cost_usd * rate)}</p>
                    <p className="font-mono text-[11px] text-subtle-foreground tabular-nums">{formatCost(event.cost_usd)}</p>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nothing recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend for the breakdown bar */}
      <div className="flex flex-wrap items-center gap-4 border-t px-5 py-3 text-[11.5px] text-muted-foreground">
        {PARTS.map((part) => (
          <span key={part.key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm" style={{ background: part.color }} />{part.label} tokens
          </span>
        ))}
        <span className="ml-auto">Costs at ₹{rate} per USD</span>
      </div>
    </Card>
  )
}
