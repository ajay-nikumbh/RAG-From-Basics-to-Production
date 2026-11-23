/**
 * Run history.
 *
 * The list of saved evaluation runs, newest first, in the right column of
 * the Evals page. A small bar chart on top shows the overall score of the
 * last runs, oldest to newest, scaled from 0.5 to 1, so a change in quality is visible at a
 * glance. Each run shows when it ran, its status, settings, overall score and
 * cost; clicking one opens its report.
 */

// Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatInr, timeAgo } from '@/lib/format'
import { Tooltip } from '@/components/ui/overlay'
import { Spinner } from '@/components/ui/misc'
import { ScoreBadge } from './ScoreParts'
import { formatScore } from './scores'
import { cn } from '@/lib/utils'

// Bars start at this score, so small changes between runs stay visible
const TREND_FLOOR = 0.5

// Overall score of the last runs as small bars, scaled from TREND_FLOOR to 1
function Trend({ runs }) {
  const recent = runs.filter((run) => run.summary.overall !== null).slice(0, 12).reverse()
  if (recent.length < 2) {
    return null
  }
  return (
    <div className="mb-4 flex h-14 items-end gap-1 border-b pb-3">
      {recent.map((run) => (
        <Tooltip key={run.id} content={`${formatScore(run.summary.overall)} overall, ${timeAgo(run.created_at)}`}>
          <span className="flex-1 rounded-t-sm bg-primary/70 hover:bg-primary" style={{ height: `${Math.max(6, ((run.summary.overall - TREND_FLOOR) / (1 - TREND_FLOOR)) * 100)}%` }} />
        </Tooltip>
      ))}
    </div>
  )
}

// List of runs with the selected one highlighted
export default function RunHistory({ runs, selectedId, onSelect }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Run history</CardTitle>
          <CardDescription>{runs.length} saved runs</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Trend runs={runs} />
        <ul className="space-y-1">
          {runs.map((run) => (
            <li key={run.id}>
              <button
                type="button"
                onClick={() => onSelect(run.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                  selectedId === run.id ? 'bg-primary-soft ring-1 ring-primary/30' : 'hover:bg-accent',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium">{timeAgo(run.created_at)}</p>
                  <p className="truncate text-[11.5px] text-subtle-foreground">
                    {run.completed}/{run.total} cases - top {run.top_k} - {formatInr(run.summary.cost_inr)}
                  </p>
                </div>
                {run.status === 'running' ? <Spinner className="text-primary" /> : <ScoreBadge score={run.summary.overall} />}
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
