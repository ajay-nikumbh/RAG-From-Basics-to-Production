/**
 * Sidebar.
 *
 * This file is the left navigation of the app: the product mark, links to
 * the three pages (Chat, Documents, Analytics) with the active page
 * highlighted, the number of indexed documents, and at the bottom the API
 * status and the theme toggle. On small screens it becomes a top bar.
 */

// Imports
import { BarChart3, FileText, MessageSquareText, Moon, Sun } from 'lucide-react'
import { useDocuments, useHealth } from '@/api/queries'
import { Tooltip } from '@/components/ui/overlay'
import { useTheme } from '@/lib/theme'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

// Pages in the navigation
const NAV = [
  { to: '/', label: 'Chat', icon: MessageSquareText },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

// API status dot and label
function ApiStatus() {

  // Health query, refreshed every 30 seconds
  const { data, isError, isPending } = useHealth()

  // Pick label and color
  const ready = data?.config?.azure_chat && data?.config?.azure_embeddings
  const label = isPending ? 'Checking API' : isError ? 'API offline' : ready ? 'API online' : 'Azure not configured'
  const color = isPending ? 'bg-subtle-foreground' : isError || !ready ? 'bg-danger' : 'bg-success'

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex size-2">
        {!isError && !isPending && ready && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-40" />}
        <span className={cn('relative inline-flex size-2 rounded-full', color)} />
      </span>
      <span className="truncate">{label}</span>
    </div>
  )
}

// Left navigation
export default function Sidebar() {

  // Theme toggle and document count
  const { theme, toggle } = useTheme()
  const { data } = useDocuments()
  const count = data?.documents?.length

  return (
    <aside className="flex shrink-0 items-center gap-2 border-b bg-sidebar px-3 py-2 md:h-full md:w-60 md:flex-col md:items-stretch md:gap-0 md:border-r md:border-b-0 md:px-3 md:py-4">

      {/* Product mark */}
      <div className="flex items-center gap-2.5 px-2 md:mb-6">
        <div className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground shadow-card">R</div>
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-semibold tracking-tight">Naive RAG</p>
          <p className="text-[11px] text-muted-foreground">Retrieval workspace</p>
        </div>
      </div>

      {/* Page links */}
      <nav className="flex flex-1 items-center gap-1 md:flex-none md:flex-col md:items-stretch">
        <p className="mb-1 hidden px-2 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase md:block">Workspace</p>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
              isActive ? 'bg-card text-foreground shadow-card ring-1 ring-border' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
            {label === 'Documents' && count > 0 && (
              <span className="ml-auto hidden rounded bg-muted px-1.5 font-mono text-[10px] text-muted-foreground md:inline">{count}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status and theme at the bottom */}
      <div className="flex items-center gap-3 md:mt-auto md:justify-between md:border-t md:px-2 md:pt-4">
        <div className="hidden md:block"><ApiStatus /></div>
        <Tooltip content={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
          <button
            type="button"
            onClick={toggle}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}
