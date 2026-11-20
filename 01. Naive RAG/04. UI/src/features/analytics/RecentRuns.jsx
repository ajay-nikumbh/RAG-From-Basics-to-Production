/**
 * Recent runs table.
 *
 * Lists the latest questions and ingestions recorded by the backend usage
 * meter, newest first: type, question or file, tokens, cost, latency and
 * time. Tabs filter by type. Every row is one line; long questions are cut
 * with an ellipsis and shown in full on hover.
 */

// Imports
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCost, formatMs, formatTokens, timeAgo } from '@/lib/format'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/overlay'
import { FileUp, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

// Type label and icon per event kind
const KINDS = {
  query: { label: 'Question', icon: MessageSquare },
  ingest: { label: 'Ingestion', icon: FileUp },
}

// Card with filter tabs and the table
export default function RecentRuns({ recent }) {

  // Selected filter and the matching rows
  const [filter, setFilter] = useState('all')
  const rows = filter === 'all' ? recent : recent.filter((event) => event.kind === filter)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-wrap pb-4">
        <div>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription>Every question and ingestion with its tokens and cost</CardDescription>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="query">Questions</TabsTrigger>
            <TabsTrigger value="ingest">Ingestions</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-y bg-muted/50 text-left text-[11.5px] text-muted-foreground">
              <th className="px-5 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Question or file</th>
              <th className="px-3 py-2 text-right font-medium">Tokens</th>
              <th className="px-3 py-2 text-right font-medium">Cost</th>
              <th className="px-3 py-2 text-right font-medium">Latency</th>
              <th className="px-5 py-2 text-right font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => {
              const { label, icon: Icon } = KINDS[event.kind] ?? KINDS.query
              const subject = event.kind === 'ingest' ? event.file : event.question
              return (
                <tr key={`${event.time}-${subject}`} className="border-b whitespace-nowrap last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-2.5">
                    <Badge variant={event.kind === 'ingest' ? 'neutral' : 'primary'} className="gap-1"><Icon className="size-3" />{label}</Badge>
                  </td>
                  <td className="max-w-[28rem] truncate px-3 py-2.5" title={subject}>{subject}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{formatTokens(event.total_tokens)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{formatCost(event.cost_usd)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground tabular-nums">{event.latency_ms ? formatMs(event.latency_ms) : '-'}</td>
                  <td className="px-5 py-2.5 text-right text-muted-foreground">{timeAgo(event.time)}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nothing recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
