/**
 * Documents page.
 *
 * Placeholder for the Documents page while the app shell is set up. The full
 * page is built in its own step.
 */

// Imports
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/misc'

// Documents page
export default function DocumentsPage() {
  return (
    <div>
      <PageHeader title="Documents" description="Upload files, follow the ingestion pipeline and inspect chunks." />
      <div className="space-y-3 p-6 md:p-8">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
