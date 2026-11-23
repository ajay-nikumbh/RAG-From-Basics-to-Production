/**
 * Answer latency chart.
 *
 * One bar per recent question (up to 20, oldest on the left) showing how long
 * the full pipeline took: embed the question, search FAISS, call the chat
 * model. A dashed line marks the average. Hovering a bar shows the question,
 * its latency, question and answer tokens and cost in rupees.
 */

// Imports
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatInr, formatMs, formatTokens } from '@/lib/format'
import { recentQueries } from './analytics'
import ChartTooltip from './ChartTooltip'

// Tooltip with the hovered question
function QueryTooltip({ active, payload, rate }) {
  if (!active || !payload?.length) {
    return null
  }
  const query = payload[0].payload
  return (
    <ChartTooltip
      title={query.question}
      rows={[
        { label: 'Latency', value: formatMs(query.latency_ms) },
        { label: 'Question tokens', value: formatTokens(query.prompt_tokens) },
        { label: 'Answer tokens', value: formatTokens(query.completion_tokens) },
        { label: 'Cost', value: formatInr(query.cost_usd * rate) },
      ]}
    />
  )
}

// Card with one bar per recent question
export default function LatencyChart({ recent, average, rate }) {

  // Latest questions, oldest first
  const queries = recentQueries(recent)

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Answer latency</CardTitle>
          <CardDescription>Last {queries.length} questions - average {formatMs(average)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        {queries.length === 0 ? (
          <p className="grid h-full place-items-center text-[13px] text-muted-foreground">No questions asked yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={queries} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="index" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--subtle-foreground)' }} />
              <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: 'var(--subtle-foreground)' }} tickFormatter={(ms) => `${(ms / 1000).toFixed(1)}s`} />
              <Tooltip content={<QueryTooltip rate={rate} />} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
              <ReferenceLine y={average} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
              <Bar dataKey="latency_ms" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
