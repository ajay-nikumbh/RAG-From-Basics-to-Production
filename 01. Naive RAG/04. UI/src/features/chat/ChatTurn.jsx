/**
 * Chat turn.
 *
 * This file draws one question and its answer. The question is a right-hand
 * bubble. The answer shows a thinking state while the request runs, then the
 * Markdown answer with citation chips, a usage line (latency, question and
 * answer tokens, cost in rupees) with Evaluate and Copy buttons, the
 * evaluation card once the answer is graded, and the source cards (chunks
 * the judge found relevant are marked). A failed request shows the error with
 * a retry button.
 */

// Imports
import { formatCost, formatInr, formatMs, formatTokens, plural } from '@/lib/format'
import { AlertCircle, Check, Copy, Gauge, RotateCcw, Sparkles } from 'lucide-react'
import AnswerEvaluation from './AnswerEvaluation'
import { Tooltip } from '@/components/ui/overlay'
import { Button } from '@/components/ui/button'
import AnswerMarkdown from './AnswerMarkdown'
import { citedNumbers } from './citations'
import SourceCards from './SourceCards'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// Steps shown while the answer is being prepared
const THINKING = ['Embedding the question', 'Searching the index', 'Writing the answer']

// Animated placeholder while the request runs
function Thinking() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {THINKING.map((step, index) => (
          <motion.span
            key={step}
            className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.6 }}
          >
            <span className="size-1.5 rounded-full bg-primary" />
            {step}
          </motion.span>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

// Latency, tokens and cost of one answer, plus a copy button
function UsageLine({ usage, answer, canEvaluate, onEvaluate }) {

  // Brief "copied" state after a click
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard.writeText(answer).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  })

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11.5px] text-subtle-foreground">
      <span>{formatMs(usage.latency_ms)}</span>
      <Tooltip content={`Question with retrieved context: ${usage.prompt_tokens} tokens, plus ${usage.embedding_tokens} embedding tokens`}>
        <span className="cursor-default">{formatTokens(usage.prompt_tokens)} question tokens</span>
      </Tooltip>
      <span>{formatTokens(usage.completion_tokens)} answer tokens</span>
      <Tooltip content={formatCost(usage.cost_usd)}>
        <span className="cursor-default">{formatInr(usage.cost_inr)}</span>
      </Tooltip>
      {canEvaluate && (
        <Tooltip content="Grade this answer with the LLM judge">
          <Button variant="ghost" size="sm" onClick={onEvaluate} className="ml-auto h-7 gap-1.5 px-2 font-sans text-[12px]">
            <Gauge className="size-3.5" />Evaluate
          </Button>
        </Tooltip>
      )}
      <Button variant="ghost" size="sm" onClick={copy} className={cn('h-7 gap-1.5 px-2 font-sans text-[12px]', !canEvaluate && 'ml-auto')}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

// One question and its answer
export default function ChatTurn({ turn, activeNumber, onOpen, onRetry, onEvaluate }) {

  // Which sources the answer cites, and which ones the judge found relevant
  const cited = citedNumbers(turn.answer)
  const relevant = new Set(turn.evaluation?.result?.relevant_chunks ?? [])

  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-5">

      {/* Question */}
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap text-primary-foreground shadow-card">
          {turn.question}
        </p>
      </div>

      {/* Answer */}
      <div className="flex gap-3">
        <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Sparkles className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1 space-y-4 pt-0.5">

          {turn.status === 'pending' && <Thinking />}

          {turn.status === 'error' && (
            <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-soft p-3 text-[13px]">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
              <p className="flex-1 text-foreground/90">{turn.error}</p>
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5"><RotateCcw className="size-3.5" />Retry</Button>
            </div>
          )}

          {turn.status === 'done' && (
            <>
              <AnswerMarkdown text={turn.answer} sources={turn.sources} activeNumber={activeNumber} onOpen={onOpen} />
              <UsageLine usage={turn.usage} answer={turn.answer} canEvaluate={!turn.evaluation && turn.sources.length > 0} onEvaluate={onEvaluate} />
              {turn.evaluation && <AnswerEvaluation evaluation={turn.evaluation} onRetry={onEvaluate} />}
              {turn.sources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium tracking-wider text-subtle-foreground uppercase">
                    {plural(turn.sources.length, 'source')} - {cited.size} cited
                  </p>
                  <SourceCards sources={turn.sources} cited={cited} relevant={relevant} activeNumber={activeNumber} onOpen={onOpen} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.article>
  )
}
