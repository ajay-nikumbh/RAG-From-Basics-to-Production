/**
 * Evals page.
 *
 * This file is the evaluation workspace. The header has the top k choice and
 * the "Run evaluation" button, which starts a run of the built-in test set
 * (POST /evals/runs). The left column shows the selected run: its summary
 * (overall score, metric averages, retrieval hit rate, cost) and the table
 * of test cases with expandable details. The right column holds the run
 * history with a trend of overall scores, and the test set. While a run is
 * in progress the report is polled every 2 seconds, so scores appear case by
 * case. With no runs yet, the page explains what a run does.
 */

// Imports
import { useEvalRun, useEvalRuns, useEvalTestset, useStartEvalRun } from '@/api/queries'
import { FlaskConical, Play, SlidersHorizontal } from 'lucide-react'
import { Skeleton, Spinner } from '@/components/ui/misc'
import PageHeader from '@/components/layout/PageHeader'
import { DropdownMenu } from '@/components/ui/overlay'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ResultsTable from './ResultsTable'
import TestsetCard from './TestsetCard'
import RunSummary from './RunSummary'
import RunHistory from './RunHistory'
import { useState } from 'react'
import { toast } from 'sonner'

// Top k choices for a run; null means the server default
const TOP_K = [null, 2, 4, 6, 8]

// First screen before any run
function NoRuns({ cases, onRun, starting }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><FlaskConical className="size-5" /></div>
      <h2 className="mt-5 text-lg font-semibold">Measure the pipeline</h2>
      <p className="mt-2 max-w-md text-[13.5px] text-muted-foreground">
        A run asks all {cases} test questions through the RAG pipeline, checks whether the right file was retrieved, and grades every answer with an LLM judge against a reference answer.
      </p>
      <Button variant="primary" onClick={onRun} disabled={starting} className="mt-6 gap-2"><Play className="size-4" />Run evaluation</Button>
    </Card>
  )
}

// Evaluation workspace
export default function EvalsPage() {

  // Saved runs, the test set and the run being viewed
  const { data: runsData, isPending } = useEvalRuns()
  const { data: testset } = useEvalTestset()
  const startRun = useStartEvalRun()
  const [chosenId, setChosenId] = useState(null)
  const [topK, setTopK] = useState(null)
  const runs = runsData?.runs ?? []
  const cases = testset?.cases ?? []

  // The chosen run, or the newest one
  const selectedId = chosenId ?? runs[0]?.id ?? null
  const { data: run } = useEvalRun(selectedId)
  const running = runs.some((item) => item.status === 'running')

  // Start a run and show it
  async function onRun() {
    try {
      const created = await startRun.mutateAsync({ topK })
      setChosenId(created.id)
      toast.success('Evaluation started', { description: `${created.total} test cases, top ${created.top_k}` })
    } catch (err) {
      toast.error('Could not start the run', { description: err.message })
    }
  }

  // Top k menu items
  const items = TOP_K.map((value) => ({
    label: `${value === null ? 'Server default' : `Top ${value} chunks`}${value === topK ? '  (selected)' : ''}`,
    onSelect: () => setTopK(value),
  }))

  return (
    <div>
      <PageHeader
        title="Evals"
        description="Grade the RAG pipeline on a fixed test set: faithfulness, relevance, context precision, correctness and retrieval."
        actions={
          <>
            <DropdownMenu
              items={items}
              trigger={<Button variant="outline" size="sm" className="gap-1.5"><SlidersHorizontal className="size-3.5" />{topK === null ? 'Default top k' : `Top ${topK}`}</Button>}
            />
            <Button variant="primary" size="sm" onClick={onRun} disabled={running || startRun.isPending} className="gap-1.5">
              {running ? <Spinner /> : <Play className="size-3.5" />}
              {running ? 'Running...' : 'Run evaluation'}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1fr)_320px]">

        {/* Selected run */}
        <div className="min-w-0 space-y-6">
          {isPending && <Skeleton className="h-80" />}
          {!isPending && runs.length === 0 && <NoRuns cases={cases.length} onRun={onRun} starting={startRun.isPending} />}
          {run && (
            <>
              <RunSummary run={run} />
              <ResultsTable run={run} />
            </>
          )}
        </div>

        {/* History and test set */}
        <div className="space-y-6">
          {runs.length > 0 && <RunHistory runs={runs} selectedId={selectedId} onSelect={setChosenId} />}
          {cases.length > 0 && <TestsetCard cases={cases} />}
        </div>
      </div>
    </div>
  )
}
