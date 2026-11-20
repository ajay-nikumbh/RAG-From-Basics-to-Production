/**
 * Chat turn.
 *
 * This file draws one question and its answer. The question is a right-hand
 * bubble. The answer shows a thinking state while the request runs, then the
 * Markdown answer with citation chips, a usage line (latency, tokens, cost)
 * with a copy button, and the source cards. A failed request shows the error
 * with a retry button.
 */

// Imports
import { AlertCircle, Check, Copy, RotateCcw, Sparkles } from 'lucide-react'
import { formatCost, formatMs, formatTokens, plural } from '@/lib/format'
import { Tooltip } from '@/components/ui/overlay'
import { Button } from '@/components/ui/button'
import AnswerMarkdown from './AnswerMarkdown'
import { citedNumbers } from './citations'
import SourceCards from './SourceCards'
import { motion } from 'motion/react'
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
function UsageLine({ usage, answer }) {

  // Brief "copied" state after a click
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard.writeText(answer).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  })

  // Total tokens of the run
  const tokens = usage.embedding_tokens + usage.prompt_tokens + usage.completion_tokens

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11.5px] text-subtle-foreground">
      <span>{formatMs(usage.latency_ms)}</span>
      <Tooltip content={`${usage.embedding_tokens} embedding, ${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion`}>
        <span className="cursor-default">{formatTokens(tokens)} tokens</span>
      </Tooltip>
      <span>{formatCost(usage.cost_usd)}</span>
      <Button variant="ghost" size="sm" onClick={copy} className="ml-auto h-7 gap-1.5 px-2 font-sans text-[12px]">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

// One question and its answer
export default function ChatTurn({ turn, activeNumber, onOpen, onRetry }) {

  // Which sources the answer cites
  const cited = citedNumbers(turn.answer)

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
              <UsageLine usage={turn.usage} answer={turn.answer} />
              {turn.sources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium tracking-wider text-subtle-foreground uppercase">
                    {plural(turn.sources.length, 'source')} - {cited.size} cited
                  </p>
                  <SourceCards sources={turn.sources} cited={cited} activeNumber={activeNumber} onOpen={onOpen} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.article>
  )
}
