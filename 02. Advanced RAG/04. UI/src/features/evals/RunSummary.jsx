/**
 * Run summary.
 *
 * The headline of one evaluation run: the overall score as a gauge, the four
 * metric averages, the hit rates (expected file sent, and among the
 * candidates), passed cases, average answer time and cost, plus the preset
 * and stage settings the run used. While the run is in progress a
 * progress bar shows how many cases are done.
 */

// Imports
import { formatInr, formatMs, timeAgo } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { MetricRow, ScoreRing } from './ScoreParts'
import { Spinner } from '@/components/ui/misc'
import { presetLabel } from './compare'
import { METRICS } from './scores'

// Small labelled number
function Fact({ label, value, detail }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
      <p className="text-[11.5px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums">{value}</p>
      {detail && <p className="text-[11px] text-subtle-foreground">{detail}</p>}
    </div>
  )
}

// Headline card of one run
export default function RunSummary({ run }) {

  // Summary numbers and progress
  const { summary } = run
  const running = run.status === 'running'
  const progress = run.total ? run.completed / run.total : 0
  const percent = (value) => (value === null || value === undefined ? '-' : `${Math.round(value * 100)}%`)
  const pipeline = run.pipeline ?? {}
  const stages = [pipeline.rewrite_enabled && 'rewrite', pipeline.rerank_enabled && `rerank ${pipeline.candidate_k}`, pipeline.compression_enabled && 'compress'].filter(Boolean).join(' + ') || 'top 4 only'

  return (
    <Card>
      <CardContent className="space-y-5">

        {/* Run title and settings */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Run <span className="font-mono text-[13px]">{run.id}</span></p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {run.preset ? `Preset ${run.preset}: ` : ''}{presetLabel(run.preset)} - {timeAgo(run.created_at)}
            </p>
            <p className="text-[11.5px] text-subtle-foreground">
              {run.chat_model} - {stages}{pipeline.rerank_enabled ? ` - threshold ${pipeline.rerank_threshold}, keep ${pipeline.min_chunks} to ${pipeline.max_chunks}` : ''} - chunks {run.chunk_size}/{run.chunk_overlap}
            </p>
          </div>
          {running && (
            <span className="flex items-center gap-2 text-[12.5px] text-primary"><Spinner />Running {run.completed} of {run.total}</span>
          )}
          {run.status === 'interrupted' && <span className="text-[12.5px] text-warning">Interrupted: the server restarted during the run</span>}
          {run.status === 'failed' && <span className="text-[12.5px] text-danger">Failed: {run.error}</span>}
        </div>

        {/* Progress while running */}
        {running && (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        {/* Overall gauge and metric averages */}
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex items-center gap-4 lg:w-44 lg:flex-col lg:items-start">
            <ScoreRing score={summary.overall} size={96} />
            <div>
              <p className="text-[13px] font-medium">{summary.passed} of {run.completed} passed</p>
              <p className="text-[12px] text-muted-foreground">Overall 0.75 or higher</p>
            </div>
          </div>
          <div className="grid min-w-0 flex-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {METRICS.map(({ key, label, hint }) => (
              <MetricRow key={key} label={label} hint={hint} metric={{ score: summary[key], reason: '' }} />
            ))}
          </div>
        </div>

        {/* Retrieval, time and cost */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Fact label="Hit rate" value={percent(summary.retrieval_hit_rate)} detail="Expected file sent" />
          <Fact label="Candidate hit rate" value={percent(summary.candidate_hit_rate)} detail="Among the candidates" />
          <Fact label="Avg answer time" value={formatMs(summary.avg_latency_ms)} detail="All stages" />
          <Fact label="Run cost" value={formatInr(summary.cost_inr)} detail="Answers plus judge" />
          <Fact label="Errors" value={summary.failed_cases} detail={summary.failed_cases ? 'See the table' : 'All cases finished'} />
        </div>
      </CardContent>
    </Card>
  )
}
