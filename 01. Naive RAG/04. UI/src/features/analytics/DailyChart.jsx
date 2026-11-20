/**
 * Daily activity chart.
 *
 * Bar chart of the last 14 days for one metric at a time: cost, tokens,
 * questions or ingestions, chosen with the tabs above the chart. One metric
 * per chart keeps a single y axis. Days without runs show as empty slots, so
 * the time axis is even. Hovering a bar shows that day's full totals.
 */

// Imports
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/overlay'
import { formatCost, formatTokens } from '@/lib/format'
import ChartTooltip from './ChartTooltip'
import { lastDays } from './analytics'
import { useState } from 'react'

// Metrics the tabs switch between
const METRICS = {
  cost_usd: { label: 'Cost', format: formatCost, axis: (v) => `$${v.toFixed(v < 0.01 ? 4 : 2)}` },
  tokens: { label: 'Tokens', format: formatTokens, axis: formatTokens },
  queries: { label: 'Questions', format: String, axis: String },
  ingestions: { label: 'Ingestions', format: String, axis: String },
}

// Tooltip with all totals of the hovered day
function DayTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }
  const day = payload[0].payload
  return (
    <ChartTooltip
      title={day.label}
      rows={[
        { label: 'Cost', value: formatCost(day.cost_usd) },
        { label: 'Tokens', value: formatTokens(day.tokens) },
        { label: 'Questions', value: day.queries },
        { label: 'Ingestions', value: day.ingestions },
      ]}
    />
  )
}

// Card with metric tabs and the bar chart
export default function DailyChart({ daily }) {

  // Selected metric and the filled 14-day window
  const [metric, setMetric] = useState('cost_usd')
  const days = lastDays(daily)
  const { format, axis } = METRICS[metric]

  // Total of the metric over the window, shown under the title
  const total = days.reduce((sum, day) => sum + day[metric], 0)

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <div>
          <CardTitle>Daily activity</CardTitle>
          <CardDescription>Last 14 days - {format(total)} {metric === 'cost_usd' ? 'spent' : 'in total'}</CardDescription>
        </div>
        <Tabs value={metric} onValueChange={setMetric}>
          <TabsList>
            {Object.entries(METRICS).map(([key, { label }]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="h-72 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--subtle-foreground)' }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: 'var(--subtle-foreground)' }} tickFormatter={axis} allowDecimals={metric === 'cost_usd'} />
            <Tooltip content={<DayTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
            <Bar dataKey={metric} fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
