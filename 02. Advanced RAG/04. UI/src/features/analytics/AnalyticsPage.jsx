/**
 * Analytics page.
 *
 * This file shows what the RAG pipeline costs and how it is used, from
 * GET /analytics (the backend usage meter): a row of key numbers (cost,
 * tokens, questions, ingestions, average latency), the daily activity
 * chart, the token split, the cost and time of each pipeline stage, the
 * latency of recent answers and a table of recent runs. The data refreshes every minute and after every question or
 * upload.
 */

// Imports
import { Clock, Coins, FileUp, Hash, MessageSquare, RefreshCw } from 'lucide-react'
import { formatCost, formatInr, formatMs, formatTokens } from '@/lib/format'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { useAnalytics } from '@/api/queries'
import LatencyChart from './LatencyChart'
import { averageCost } from './analytics'
import RecentRuns from './RecentRuns'
import DailyChart from './DailyChart'
import TokenSplit from './TokenSplit'
import StageCosts from './StageCosts'
import KpiTile from './KpiTile'

// Loading layout with the same shape as the page
function Loading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-[104px]" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}

// Analytics dashboard
export default function AnalyticsPage() {

  // Usage data from the backend
  const { data, isPending, isError, error, refetch, isFetching } = useAnalytics()
  const rate = data?.usd_to_inr ?? 84

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="LLM cost, token usage, questions and ingestions, recorded for every run."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
            <RefreshCw className={isFetching ? 'size-3.5 animate-spin' : 'size-3.5'} />Refresh
          </Button>
        }
      />
      <div className="space-y-4 p-6 md:p-8">
        {isPending && <Loading />}
        {isError && <p className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-[13px]">Analytics could not be loaded: {error.message}</p>}
        {data && (
          <>
            {/* Key numbers; costs are shown in rupees with dollars as context */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <KpiTile icon={Coins} label="Total cost" value={formatInr(data.totals.cost_usd * rate)} detail={`${formatCost(data.totals.cost_usd)} at ₹${rate} per USD`} />
              <KpiTile icon={Hash} label="Tokens" value={formatTokens(data.totals.total_tokens)} detail={`${formatTokens(data.totals.prompt_tokens + data.totals.completion_tokens)} chat, ${formatTokens(data.totals.embedding_tokens)} embedding`} />
              <KpiTile icon={MessageSquare} label="Questions" value={data.totals.queries} detail={data.totals.queries ? `${formatInr(averageCost(data.recent, 'query') * rate)} per question` : 'None yet'} />
              <KpiTile icon={FileUp} label="Ingestions" value={data.totals.ingestions} detail="Uploads embedded and stored" />
              <KpiTile icon={Clock} label="Avg answer time" value={formatMs(data.totals.avg_query_latency_ms)} detail="All pipeline stages" />
            </div>

            {/* Activity and token split */}
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2"><DailyChart daily={data.daily} rate={rate} /></div>
              <TokenSplit totals={data.totals} recent={data.recent} rate={rate} />
            </div>

            {/* Cost and time of each pipeline stage */}
            <StageCosts stages={data.stages} rate={rate} />

            {/* Latency and recent runs */}
            <LatencyChart recent={data.recent} average={data.totals.avg_query_latency_ms} rate={rate} />
            <RecentRuns recent={data.recent} rate={rate} />
          </>
        )}
      </div>
    </div>
  )
}
