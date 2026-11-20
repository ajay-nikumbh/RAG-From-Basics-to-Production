/**
 * Token split.
 *
 * Shows where the tokens go: embedding (ingestion and question vectors),
 * prompt (question plus retrieved chunks sent to the chat model) and
 * completion (the answer). A single stacked bar gives the proportions, with
 * a 2px gap between segments; the legend underneath names every part with
 * its exact count and share, so the colors are never the only key. Below,
 * the average cost of one question and one ingestion puts tokens into money.
 */

// Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatInr, formatTokens } from '@/lib/format'
import { averageCost, tokenSplit } from './analytics'
import { Tooltip } from '@/components/ui/overlay'

// What each kind of token pays for
const NOTES = {
  embedding: 'Document chunks at ingestion and each question',
  prompt: 'Question plus retrieved chunks sent to the chat model',
  completion: 'Answers written by the chat model',
}

// Card with the stacked bar and the legend
export default function TokenSplit({ totals, recent, rate }) {

  // Parts with shares
  const parts = tokenSplit(totals)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Where tokens go</CardTitle>
          <CardDescription>{formatTokens(totals.total_tokens)} tokens in total</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">

        {/* Stacked bar; tiny parts keep a visible sliver */}
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
          {parts.filter((part) => part.value > 0).map((part) => (
            <Tooltip key={part.key} content={`${part.label}: ${part.value.toLocaleString()} tokens`}>
              <div className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${part.share * 100}%`, minWidth: 4, background: part.color }} />
            </Tooltip>
          ))}
        </div>

        {/* Legend with exact numbers */}
        <ul className="space-y-4">
          {parts.map((part) => (
            <li key={part.key} className="flex items-start gap-3">
              <span className="mt-1 size-2.5 shrink-0 rounded-sm" style={{ background: part.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium">{part.label}</span>
                  <span className="font-mono text-[13px] tabular-nums">{part.value.toLocaleString()}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3 text-[12px] text-muted-foreground">
                  <span className="truncate">{NOTES[part.key]}</span>
                  <span className="font-mono tabular-nums">{(part.share * 100).toFixed(1)}%</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Average cost per run type */}
        <div className="mt-auto grid grid-cols-2 gap-3 border-t pt-5">
          <div>
            <p className="text-[12px] text-muted-foreground">Avg question</p>
            <p className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums">{formatInr(averageCost(recent, 'query') * rate)}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Avg ingestion</p>
            <p className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums">{formatInr(averageCost(recent, 'ingest') * rate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
