/**
 * Preset comparison.
 *
 * A card on the Evals page that puts the newest finished run of each
 * ablation preset (A Naive baseline to E with compression) side by side.
 * Every measure is shown with its change against preset A, green when it
 * improved and muted when it got worse, so the effect of each added stage
 * is visible in one table. Clicking a column header opens that run.
 */

// Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MEASURES, deltaFrom, isBetter, latestByPreset, presetLabel } from './compare'
import { formatMs } from '@/lib/format'
import { formatScore } from './scores'
import { cn } from '@/lib/utils'

// Value of one measure: scores with two decimals, hit rate in percent, time in seconds
function formatValue(key, value) {
  if (value === null || value === undefined) {
    return '-'
  }
  if (key === 'retrieval_hit_rate') {
    return `${Math.round(value * 100)}%`
  }
  if (key === 'avg_latency_ms') {
    return formatMs(value)
  }
  return formatScore(value)
}

// Change against the baseline, signed, in the unit of the measure
function formatDelta(key, delta) {
  const sign = delta > 0 ? '+' : '-'
  if (key === 'retrieval_hit_rate') {
    return `${sign}${Math.abs(Math.round(delta * 100))} pts`
  }
  if (key === 'avg_latency_ms') {
    return `${sign}${formatMs(Math.abs(delta))}`
  }
  return `${sign}${Math.abs(delta).toFixed(2)}`
}

// Side by side table of the presets
export default function PresetComparison({ runs, selectedId, onSelect }) {

  // Newest finished run of each preset; A is the baseline when it exists
  const columns = latestByPreset(runs)
  const baseline = columns.find((run) => run.preset === 'A')

  // Nothing to compare until two presets have finished
  if (columns.length < 2) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Preset comparison</CardTitle>
          <CardDescription>Newest run of each preset; changes are against A, the Naive RAG baseline</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-2">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Measure</th>
              {columns.map((run) => (
                <th key={run.id} className="px-2 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => onSelect(run.id)}
                    className={cn('rounded-md px-1.5 py-0.5 text-left hover:bg-accent', selectedId === run.id && 'bg-primary-soft text-primary')}
                  >
                    <span className="block font-semibold">{run.preset}</span>
                    <span className="block font-normal whitespace-nowrap">{presetLabel(run.preset)}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEASURES.map((measure) => (
              <tr key={measure.key} className="border-t">
                <td className="py-2 pr-3 text-muted-foreground">{measure.label}</td>
                {columns.map((run) => {
                  const delta = run === baseline ? null : deltaFrom(baseline, run, measure.key)
                  const better = isBetter(delta, measure.lowerIsBetter)
                  return (
                    <td key={run.id} className="px-2 py-2">
                      <span className="px-1.5 font-mono font-medium tabular-nums">{formatValue(measure.key, run.summary[measure.key])}</span>
                      {delta !== null && (
                        <span className={cn('block px-1.5 font-mono text-[10.5px] tabular-nums', better ? 'text-success' : 'text-subtle-foreground')}>
                          {delta === 0 ? 'same' : formatDelta(measure.key, delta)}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
