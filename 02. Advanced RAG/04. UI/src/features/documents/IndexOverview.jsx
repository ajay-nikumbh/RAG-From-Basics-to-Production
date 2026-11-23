/**
 * Index overview.
 *
 * The right-hand column of the Documents page, with three cards:
 *
 *   - Ingestion pipeline: the four steps every upload goes through (load,
 *     chunk, embed, store) with the settings the backend uses for each
 *   - Index composition: how the chunks are spread over the files, as one
 *     bar per file
 *   - Recent ingestions: the latest uploads with chunks, time and cost in
 *     rupees, from the usage records
 *
 * It explains what the index contains and how it was built, next to the
 * table of files.
 */

// Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Boxes, Database, FileInput, Scissors } from 'lucide-react'
import { useAnalytics, useHealth, useInrRate } from '@/api/queries'
import { formatInr, formatMs, timeAgo } from '@/lib/format'
import { Tooltip } from '@/components/ui/overlay'

// The four ingestion steps and the setting shown for each
function pipelineSteps(pipeline) {
  return [
    { icon: FileInput, name: 'Load', detail: 'PDF pages, Excel sheets, Word, Markdown, text' },
    { icon: Scissors, name: 'Chunk', detail: pipeline ? `${pipeline.chunk_size} characters, ${pipeline.chunk_overlap} overlap` : '-' },
    { icon: Boxes, name: 'Embed', detail: pipeline ? `${pipeline.embedding_model}, ${pipeline.embedding_dimensions} dims` : '-' },
    { icon: Database, name: 'Store', detail: pipeline ? `FAISS inner product; ${pipeline.rerank_enabled ? `${pipeline.candidate_k} candidates reranked per question` : `top ${pipeline.top_k} per question`}` : '-' },
  ]
}

// Vertical list of pipeline steps joined by a line
function PipelineCard() {

  // Settings from the health endpoint
  const { data } = useHealth()
  const steps = pipelineSteps(data?.pipeline)

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Ingestion pipeline</CardTitle>
          <CardDescription>What happens to every upload</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
          {steps.map(({ icon: Icon, name, detail }, index) => (
            <li key={name} className="relative flex items-start gap-3">
              <span className="z-10 grid size-8 shrink-0 place-items-center rounded-lg border bg-card text-primary shadow-card">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[13px] font-medium"><span className="mr-1.5 font-mono text-[11px] text-subtle-foreground">{index + 1}</span>{name}</p>
                <p className="text-[12px] text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

// One bar per file, longest first, scaled to the largest file
function CompositionCard({ documents, totalChunks }) {

  // Files with the most chunks first
  const ordered = [...documents].sort((a, b) => b.chunks - a.chunks)
  const peak = Math.max(1, ...ordered.map((doc) => doc.chunks))

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Index composition</CardTitle>
          <CardDescription>{totalChunks} chunks across {documents.length} files</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ordered.length === 0 && <p className="text-[12.5px] text-muted-foreground">Upload a file to build the index.</p>}
        {ordered.map((doc) => {
          const share = totalChunks ? Math.round((doc.chunks / totalChunks) * 100) : 0
          return (
            <Tooltip key={doc.source} content={`${doc.chunks} chunks, ${share}% of the index`}>
              <div>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-[12px]">
                  <span className="truncate">{doc.source}</span>
                  <span className="shrink-0 font-mono text-muted-foreground tabular-nums">{doc.chunks}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(doc.chunks / peak) * 100}%` }} />
                </div>
              </div>
            </Tooltip>
          )
        })}
      </CardContent>
    </Card>
  )
}

// Latest uploads from the usage records
function RecentIngestionsCard() {

  // Ingestion runs, newest first
  const { data } = useAnalytics()
  const rate = useInrRate()
  const runs = (data?.recent ?? []).filter((run) => run.kind === 'ingest').slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent ingestions</CardTitle>
          <CardDescription>Time and embedding cost per upload</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {runs.length === 0 && <p className="text-[12.5px] text-muted-foreground">No uploads recorded yet.</p>}
        <ul className="divide-y">
          {runs.map((run) => (
            <li key={`${run.time}-${run.file}`} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium" title={run.file}>{run.file}</p>
                <p className="text-[11.5px] text-subtle-foreground">{timeAgo(run.time)} - {run.chunks} chunks - {formatMs(run.latency_ms)}</p>
              </div>
              <span className="shrink-0 font-mono text-[12px] tabular-nums">{formatInr(run.cost_usd * rate)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// Right column of the Documents page
export default function IndexOverview({ documents, totalChunks }) {
  return (
    <div className="space-y-6">
      <PipelineCard />
      <CompositionCard documents={documents} totalChunks={totalChunks} />
      <RecentIngestionsCard />
    </div>
  )
}
