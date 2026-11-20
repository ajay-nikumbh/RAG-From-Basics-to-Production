/**
 * Analytics page.
 *
 * Placeholder for the Analytics page while the app shell is set up. The full
 * page is built in its own step.
 */

// Imports
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/misc'

// Analytics page
export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" description="Token usage, cost and latency of every query and ingestion." />
      <div className="space-y-3 p-6 md:p-8">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
