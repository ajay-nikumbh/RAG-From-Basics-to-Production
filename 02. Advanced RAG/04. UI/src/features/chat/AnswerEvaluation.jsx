/**
 * Answer evaluation card.
 *
 * Shown under a chat answer after the user clicks "Evaluate". While the LLM
 * judge runs it shows a short loading state; then it shows the overall score
 * as a gauge, the three metrics that apply to a chat answer (faithfulness,
 * answer relevance, context precision) with the judge's reasons, and what
 * grading cost. Correctness is not shown here because chat questions have no
 * reference answer; it appears on the Evals page.
 */

// Imports
import { AlertCircle, Gauge, RotateCcw } from 'lucide-react'
import { MetricRow, ScoreRing } from '../evals/ScoreParts'
import { formatInr, formatMs, plural } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/misc'
import { METRICS } from '../evals/scores'
import { motion } from 'motion/react'

// Metrics that apply without a reference answer
const CHAT_METRICS = METRICS.filter((metric) => metric.key !== 'correctness')

// Evaluation state of one turn
export default function AnswerEvaluation({ evaluation, onRetry }) {

  // Judge still running
  if (evaluation.status === 'pending') {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-[13px] text-muted-foreground shadow-card">
        <Spinner className="text-primary" />
        Grading the answer with the LLM judge: faithfulness, relevance and context precision...
      </div>
    )
  }

  // Judge failed
  if (evaluation.status === 'error') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-3 text-[13px]">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
        <p className="flex-1">Evaluation failed: {evaluation.error}</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5"><RotateCcw className="size-3.5" />Retry</Button>
      </div>
    )
  }

  // Scores
  const { result } = evaluation
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-4 shadow-card">

      {/* Title */}
      <div className="mb-4 flex items-center gap-2 text-[12px] font-medium tracking-wide text-subtle-foreground uppercase">
        <Gauge className="size-3.5" />Answer evaluation
      </div>

      {/* Overall gauge and metric rows */}
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex items-center gap-3 sm:w-36 sm:flex-col sm:items-start">
          <ScoreRing score={result.overall} />
          <p className="text-[12px] leading-snug text-muted-foreground">Overall, mean of the metrics</p>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          {CHAT_METRICS.map(({ key, label, hint }) => (
            <MetricRow key={key} label={label} hint={hint} metric={result[key]} />
          ))}
        </div>
      </div>

      {/* Cost of grading */}
      <p className="mt-4 border-t pt-3 font-mono text-[11.5px] text-subtle-foreground">
        Judge: {plural(result.relevant_chunks.length, 'relevant chunk')} - {result.usage.prompt_tokens + result.usage.completion_tokens} tokens - {formatInr(result.usage.cost_inr)} - {formatMs(result.usage.latency_ms)}
      </p>
    </motion.div>
  )
}
