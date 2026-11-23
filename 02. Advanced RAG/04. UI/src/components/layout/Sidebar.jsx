/**
 * Sidebar.
 *
 * This file is the left navigation of the app, from top to bottom:
 *
 *   - the product mark and a "New chat" button
 *   - links to the pages (Chat, Documents, Analytics, Evals), with the
 *     active page highlighted
 *   - Library: the indexed documents; clicking one opens it on the
 *     Documents page with its PDF and chunks
 *   - Recent questions: the latest recorded questions; clicking one asks it
 *     again on the Chat page
 *   - Today: spend in rupees, questions and tokens for the current day with
 *     a 7-day cost sparkline, linking to Analytics
 *   - the models and Advanced RAG stage settings in use (rewrite, rerank
 *     candidates, kept chunks and threshold), the API status and the theme
 *     toggle
 *
 * On small screens it becomes a compact top bar with icon links only.
 */

// Imports
import { BarChart3, FileText, FlaskConical, History, MessageSquareText, Moon, Plus, Sun, ArrowUpRight } from 'lucide-react'
import { useAnalytics, useDocuments, useHealth, useInrRate } from '@/api/queries'
import { formatInr, formatTokens, plural } from '@/lib/format'
import { fileType } from '@/features/documents/fileTypes'
import { Link, NavLink, useNavigate } from 'react-router'
import { lastDays } from '@/features/analytics/analytics'
import { useChat } from '@/features/chat/useChat'
import { Tooltip } from '@/components/ui/overlay'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

// Pages in the navigation
const NAV = [
  { to: '/', label: 'Chat', icon: MessageSquareText },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/evals', label: 'Evals', icon: FlaskConical },
]

// Documents listed in the library before "View all", and recent questions shown
const LIBRARY_LIMIT = 6
const RECENT_LIMIT = 5

// Small uppercase section title
function SectionTitle({ children, action }) {
  return (
    <div className="mb-1.5 flex items-center justify-between px-2">
      <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">{children}</p>
      {action}
    </div>
  )
}

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

// Indexed documents; a click opens the document on the Documents page
function Library() {

  // Indexed documents
  const { data } = useDocuments()
  const documents = data?.documents ?? []

  return (
    <div>
      <SectionTitle action={documents.length > LIBRARY_LIMIT && <Link to="/documents" className="text-[11px] text-muted-foreground hover:text-foreground">View all</Link>}>
        Library
      </SectionTitle>
      {documents.length === 0 && <p className="px-2 text-[12px] text-subtle-foreground">No documents yet</p>}
      <ul className="space-y-px">
        {documents.slice(0, LIBRARY_LIMIT).map((doc) => {
          const { icon: Icon, color } = fileType(doc.file_type)
          return (
            <li key={doc.source}>
              <Link
                to="/documents"
                state={{ open: doc.source }}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={doc.source}
              >
                <Icon className={cn('size-3.5 shrink-0', color)} />
                <span className="min-w-0 flex-1 truncate">{doc.source}</span>
                <span className="font-mono text-[10px] text-subtle-foreground">{doc.chunks}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Latest recorded questions; a click asks the question again
function RecentQuestions() {

  // Distinct questions from the recorded runs, newest first
  const { data } = useAnalytics()
  const { ask, busy } = useChat()
  const navigate = useNavigate()
  const questions = [...new Set((data?.recent ?? []).filter((run) => run.kind === 'query').map((run) => run.question))].slice(0, RECENT_LIMIT)

  // Nothing asked yet
  if (questions.length === 0) {
    return null
  }

  // Go to the chat and ask again
  function askAgain(question) {
    navigate('/')
    ask(question)
  }

  return (
    <div>
      <SectionTitle>Recent questions</SectionTitle>
      <ul className="space-y-px">
        {questions.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => askAgain(question)}
              disabled={busy}
              title={`Ask again: ${question}`}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              <History className="size-3.5 shrink-0 text-subtle-foreground" />
              <span className="min-w-0 flex-1 truncate">{question}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Today's spend, questions and tokens with a 7-day cost sparkline
function Today() {

  // Daily usage for the last 7 days, today last
  const { data } = useAnalytics()
  const rate = useInrRate()
  const week = lastDays(data?.daily ?? [], 7)
  const today = week[week.length - 1]
  const peak = Math.max(...week.map((day) => day.cost_usd), 0)

  return (
    <Link to="/analytics" className="group block rounded-lg border bg-card p-3 shadow-card transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Today</p>
        <ArrowUpRight className="size-3.5 text-subtle-foreground transition-colors group-hover:text-primary" />
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="font-mono text-lg leading-none font-semibold tabular-nums">{formatInr(today.cost_usd * rate)}</p>

        {/* 7-day cost sparkline, today highlighted */}
        <Tooltip content="Cost over the last 7 days">
          <div className="flex h-8 items-end gap-0.5">
            {week.map((day, index) => (
              <span
                key={day.date}
                className={cn('w-1.5 rounded-sm', index === week.length - 1 ? 'bg-primary' : 'bg-primary/30')}
                style={{ height: `${peak ? Math.max(8, (day.cost_usd / peak) * 100) : 8}%` }}
              />
            ))}
          </div>
        </Tooltip>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{plural(today.queries, 'question')} - {formatTokens(today.tokens)} tokens</p>
    </Link>
  )
}

// Left navigation
export default function Sidebar() {

  // Theme, document count, models and chat reset
  const { theme, toggle } = useTheme()
  const { data } = useDocuments()
  const { data: health } = useHealth()
  const { reset, busy } = useChat()
  const navigate = useNavigate()
  const count = data?.documents?.length
  const pipeline = health?.pipeline

  // Start a fresh conversation on the Chat page
  function newChat() {
    reset()
    navigate('/')
  }

  return (
    <aside className="flex shrink-0 items-center gap-2 border-b bg-sidebar px-3 py-2 md:h-full md:w-64 md:flex-col md:items-stretch md:gap-0 md:border-r md:border-b-0 md:px-3 md:py-4">

      {/* Product mark */}
      <div className="flex items-center gap-2.5 px-2 md:mb-4">
        <div className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground shadow-card">R</div>
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-semibold tracking-tight">Advanced RAG</p>
          <p className="text-[11px] text-muted-foreground">Retrieval workspace</p>
        </div>
      </div>

      {/* New chat */}
      <button
        type="button"
        onClick={newChat}
        disabled={busy}
        className="mb-5 hidden h-9 items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary-hover disabled:opacity-60 md:flex"
      >
        <Plus className="size-4" />New chat
      </button>

      {/* Page links */}
      <nav className="flex flex-1 items-center gap-1 md:flex-none md:flex-col md:items-stretch">
        <div className="hidden md:block"><SectionTitle>Workspace</SectionTitle></div>
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

      {/* Library and recent questions, scroll if the window is short */}
      <div className="mt-6 hidden min-h-0 flex-1 space-y-6 overflow-y-auto md:block">
        <Library />
        <RecentQuestions />
      </div>

      {/* Today's usage */}
      <div className="mt-4 hidden md:block">
        <Today />
      </div>

      {/* Models, status and theme at the bottom */}
      <div className="flex items-center gap-3 md:mt-4 md:flex-col md:items-stretch md:gap-3 md:border-t md:px-2 md:pt-4">
        {pipeline && (
          <div className="hidden space-y-1 text-[11px] text-muted-foreground md:block">
            <p className="flex justify-between gap-2"><span>Chat</span><span className="truncate font-mono text-foreground/80">{pipeline.chat_model}</span></p>
            <p className="flex justify-between gap-2"><span>Embed</span><span className="truncate font-mono text-foreground/80" title={pipeline.embedding_model}>{pipeline.embedding_model}</span></p>
            <p className="flex justify-between gap-2"><span>Rewrite</span><span className="font-mono text-foreground/80">{pipeline.rewrite_enabled ? 'on' : 'off'}</span></p>
            <p className="flex justify-between gap-2">
              <span>Rerank</span>
              <span className="font-mono text-foreground/80">{pipeline.rerank_enabled ? `${pipeline.candidate_k}, keep ${pipeline.min_chunks}-${pipeline.max_chunks} >= ${pipeline.rerank_threshold}` : 'off'}</span>
            </p>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
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
      </div>
    </aside>
  )
}
