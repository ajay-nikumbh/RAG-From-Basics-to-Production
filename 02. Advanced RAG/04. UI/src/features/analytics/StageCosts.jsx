/**
 * Stage costs.
 *
 * A card on the Analytics page that splits an average question into the
 * stages of the Advanced RAG pipeline (rewrite, retrieve, rerank, compress,
 * generate), from the per-stage averages in GET /analytics. Each stage shows
 * its average cost in rupees and time, with bars for its share of the cost
 * and of the time, so the most expensive and the slowest stage stand out.
 * Questions recorded before per-stage tracking are not counted.
 */

// Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatInr, formatMs, formatTokens } from '@/lib/format'
import { stageAverages } from './analytics'

// One share bar, coloured with the stage colour
function ShareBar({ share, color }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full" style={{ width: `${share * 100}%`, background: color }} />
    </div>
  )
}

// Card with one row per stage
export default function StageCosts({ stages, rate }) {

  // Rows in pipeline order
  const rows = stageAverages(stages, rate)
  const questions = Math.max(0, ...rows.map((row) => row.runs))

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Cost and time per stage</CardTitle>
          <CardDescription>Average question, over {questions} questions with stage tracking</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {rows.length === 0 && <p className="text-[13px] text-muted-foreground">No question with stage tracking yet. Ask a question in the chat.</p>}
        {rows.length > 0 && (
          <div className="space-y-1">

            {/* Column titles */}
            <div className="grid grid-cols-[120px_1fr_1fr_90px] gap-4 pb-1 text-[11px] text-muted-foreground">
              <span>Stage</span><span>Share of cost</span><span>Share of time</span><span className="text-right">Tokens</span>
            </div>

            {/* One row per stage */}
            {rows.map((row) => (
              <div key={row.name} className="grid grid-cols-[120px_1fr_1fr_90px] items-center gap-4 border-t py-2 text-[12.5px]">
                <span className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full" style={{ background: row.color }} />{row.label}</span>
                <div className="space-y-1">
                  <ShareBar share={row.costShare} color={row.color} />
                  <p className="font-mono text-[11px] text-muted-foreground">{formatInr(row.inr)} - {Math.round(row.costShare * 100)}%</p>
                </div>
                <div className="space-y-1">
                  <ShareBar share={row.timeShare} color={row.color} />
                  <p className="font-mono text-[11px] text-muted-foreground">{formatMs(row.ms)} - {Math.round(row.timeShare * 100)}%</p>
                </div>
                <span className="text-right font-mono text-[11.5px] text-muted-foreground">{formatTokens(row.tokens)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
