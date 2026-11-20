/**
 * Score parts.
 *
 * Small components that show evaluation scores the same way on the chat
 * Evaluate card and the Evals page:
 *
 *   ScoreBadge   score with its word (Good, Fair, Poor) on a tinted pill
 *   ScoreRing    large overall score in a circular gauge
 *   MetricRow    metric name, bar, score and the judge's reason
 *
 * Every score carries a word or a number next to its color, so it never
 * depends on color alone.
 */

// Imports
import { formatScore, scoreTone } from './scores'
import { Tooltip } from '@/components/ui/overlay'
import { cn } from '@/lib/utils'

// Text and background classes per tone
const TONES = {
  good: { text: 'text-success', soft: 'bg-success-soft', bar: 'bg-success', stroke: 'var(--success)' },
  fair: { text: 'text-warning', soft: 'bg-highlight', bar: 'bg-warning', stroke: 'var(--warning)' },
  poor: { text: 'text-danger', soft: 'bg-danger-soft', bar: 'bg-danger', stroke: 'var(--danger)' },
  none: { text: 'text-muted-foreground', soft: 'bg-muted', bar: 'bg-muted-foreground', stroke: 'var(--muted-foreground)' },
}

// Score and word on a tinted pill
export function ScoreBadge({ score, className }) {
  const { tone, word } = scoreTone(score)
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium', TONES[tone].soft, TONES[tone].text, className)}>
      <span className="font-mono tabular-nums">{formatScore(score)}</span>{word}
    </span>
  )
}

// Circular gauge with the overall score in the middle
export function ScoreRing({ score, size = 72 }) {

  // Circle geometry: the arc length follows the score
  const { tone, word } = scoreTone(score)
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const filled = circumference * (score ?? 0)

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={TONES[tone].stroke} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} />
      </svg>
      <div className="absolute text-center leading-tight">
        <p className="font-mono text-[17px] font-semibold tabular-nums">{formatScore(score)}</p>
        <p className={cn('text-[10.5px] font-medium', TONES[tone].text)}>{word}</p>
      </div>
    </div>
  )
}

// One metric: name, bar, score and the judge's reason
export function MetricRow({ label, hint, metric }) {

  // Missing metric (for example correctness without a reference)
  const score = metric?.score ?? null
  const { tone } = scoreTone(score)

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Tooltip content={hint}>
          <span className="cursor-help text-[12.5px] font-medium">{label}</span>
        </Tooltip>
        <span className={cn('font-mono text-[12px] tabular-nums', TONES[tone].text)}>{formatScore(score)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', TONES[tone].bar)} style={{ width: `${(score ?? 0) * 100}%` }} />
      </div>
      {metric?.reason && <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{metric.reason}</p>}
    </div>
  )
}
