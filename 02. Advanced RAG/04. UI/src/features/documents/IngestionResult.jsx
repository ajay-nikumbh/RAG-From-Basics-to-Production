/**
 * Ingestion result.
 *
 * This file shows what happened to the latest uploaded file: the five
 * pipeline steps (load, chunk, embed, store, save) as a timeline with the
 * real duration of each step from the API, a bar that shows each step's
 * share of the total time, and the outcome: pages or sheets, chunks,
 * embedding tokens and cost.
 */

// Imports
import { Boxes, Database, FileInput, HardDrive, Scissors } from 'lucide-react'
import { formatInr, formatMs, formatTokens } from '@/lib/format'
import { useInrRate } from '@/api/queries'
import { motion } from 'motion/react'

// Icon and plain description per step
const STEPS = {
  load: { icon: FileInput, text: 'Read the file into pages or sheets' },
  chunk: { icon: Scissors, text: 'Split text into overlapping chunks' },
  embed: { icon: Boxes, text: 'Turn chunks into vectors (Azure)' },
  store: { icon: Database, text: 'Add vectors to the FAISS index' },
  save: { icon: HardDrive, text: 'Write the index to disk' },
}

// Timeline of the pipeline steps with outcome numbers
export default function IngestionResult({ result }) {

  // Exchange rate for the rupee cost
  const rate = useInrRate()

  // Total time, used for each step's share
  const total = Math.max(1, result.steps.reduce((sum, step) => sum + step.ms, 0))

  // Outcome numbers
  const stats = [
    { label: 'Parts', value: result.documents },
    { label: 'Chunks', value: result.chunks },
    { label: 'Tokens', value: formatTokens(result.embedding_tokens) },
    { label: 'Cost', value: formatInr(result.cost_usd * rate) },
    { label: 'Time', value: formatMs(total) },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-5 shadow-card">

      {/* Title */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Pipeline for <span className="font-mono text-[13px]">{result.source}</span></p>
        <p className="text-[12px] text-muted-foreground">Index now holds {result.total_chunks} chunks</p>
      </div>

      {/* Outcome numbers */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="font-mono text-sm font-medium tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Step timeline */}
      <ol className="mt-5 space-y-3">
        {result.steps.map((step, index) => {
          const { icon: Icon, text } = STEPS[step.name] ?? { icon: Boxes, text: step.name }
          return (
            <motion.li
              key={step.name}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className="grid grid-cols-[28px_1fr_auto] items-center gap-3"
            >
              <div className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary">
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium capitalize">{step.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{text}</p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(2, (step.ms / total) * 100)}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.06 }}
                  />
                </div>
              </div>
              <p className="w-16 text-right font-mono text-[12px] text-muted-foreground tabular-nums">{formatMs(step.ms)}</p>
            </motion.li>
          )
        })}
      </ol>
    </motion.div>
  )
}
