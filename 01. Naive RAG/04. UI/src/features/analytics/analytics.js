/**
 * Analytics helpers.
 *
 * Pure functions that shape the GET /analytics response for the charts:
 * lastDays() fills a fixed window of days (days without runs get zeros, so
 * the time axis never skips a day), tokenSplit() turns token totals into
 * parts with shares, and recentQueries() picks the latest questions for the
 * latency chart, oldest first. averageCost() gives the mean cost of one run of
 * a kind (question or ingestion).
 */

// Empty day used when no run happened that day
const EMPTY_DAY = { cost_usd: 0, tokens: 0, queries: 0, ingestions: 0 }

// Local date as YYYY-MM-DD
function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// The last `count` days up to `today`, each with its totals or zeros
export function lastDays(daily, count = 14, today = new Date()) {

  // Totals by date for quick lookup
  const byDate = Object.fromEntries(daily.map((day) => [day.date, day]))

  // Walk back from today and build the window oldest first
  const days = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    const key = isoDate(date)
    days.push({ ...EMPTY_DAY, ...byDate[key], date: key, label: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }) })
  }
  return days
}

// Token totals as parts with a share of the whole (0 to 1)
export function tokenSplit(totals) {

  // The three kinds of tokens the pipeline pays for
  const parts = [
    { key: 'embedding', label: 'Embedding', value: totals.embedding_tokens, color: 'var(--chart-1)' },
    { key: 'prompt', label: 'Question (prompt)', value: totals.prompt_tokens, color: 'var(--chart-2)' },
    { key: 'completion', label: 'Answer (completion)', value: totals.completion_tokens, color: 'var(--chart-3)' },
  ]

  // Share of each part; all zero when nothing was used yet
  const total = parts.reduce((sum, part) => sum + part.value, 0)
  return parts.map((part) => ({ ...part, share: total ? part.value / total : 0 }))
}

// Latest `count` questions, oldest first, numbered for the chart axis
export function recentQueries(recent, count = 20) {
  return recent
    .filter((event) => event.kind === 'query')
    .slice(0, count)
    .reverse()
    .map((event, index) => ({ ...event, index: index + 1 }))
}

// Mean cost of one run of a kind ('query' or 'ingest') among the recent runs
export function averageCost(recent, kind) {
  const runs = recent.filter((event) => event.kind === kind)
  return runs.length ? runs.reduce((sum, event) => sum + event.cost_usd, 0) / runs.length : 0
}
