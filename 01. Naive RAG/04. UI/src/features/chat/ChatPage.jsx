/**
 * Chat page.
 *
 * Placeholder for the Chat page while the app shell is set up. The full
 * page is built in its own step.
 */

// Imports
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/misc'

// Chat page
export default function ChatPage() {
  return (
    <div>
      <PageHeader title="Chat" description="Ask questions about your documents and open every citation." />
      <div className="space-y-3 p-6 md:p-8">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
