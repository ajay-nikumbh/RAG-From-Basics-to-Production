/**
 * Chat page.
 *
 * This file is the chat-with-your-documents screen. The left side holds the
 * conversation and the composer; when a citation or source card is clicked,
 * the right side opens the source panel (the PDF at the cited page with the
 * passage highlighted), like a split chat-with-PDF view. On small screens the
 * source opens in a side sheet instead. With no messages yet, the page shows
 * the indexed documents and a few starter questions.
 */

// Imports
import { ArrowRight, FileText, MessageSquarePlus, Upload } from 'lucide-react'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/overlay'
import { useDocuments } from '@/api/queries'
import { useEffect, useRef } from 'react'
import SourcePanel from './SourcePanel'
import { plural } from '@/lib/format'
import { useChat } from './useChat'
import { Link } from 'react-router'
import Composer from './Composer'
import ChatTurn from './ChatTurn'

// Starter questions for the indexed papers
const SUGGESTIONS = [
  'What is retrieval-augmented generation and why does it help?',
  'How does Self-RAG decide when to retrieve?',
  'What problem does Corrective RAG solve?',
  'How does Adaptive-RAG pick a strategy per question?',
]

// First screen: indexed documents and starter questions
function EmptyState({ onAsk }) {

  // Indexed documents for the header line
  const { data, isPending } = useDocuments()
  const documents = data?.documents ?? []

  // Wait for the list before choosing what to show
  if (isPending) {
    return null
  }

  // No documents yet: point to the Documents page
  if (documents.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Upload className="size-5" /></div>
        <h2 className="mt-5 text-lg font-semibold">No documents indexed yet</h2>
        <p className="mt-2 text-[13.5px] text-muted-foreground">Upload a PDF, Word, Excel, Markdown or text file to start asking questions.</p>
        <Link to="/documents" className="mt-6 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover">Upload documents</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-16">
      <h2 className="text-2xl font-semibold tracking-tight">Ask your documents</h2>
      <p className="mt-2 text-[14px] text-muted-foreground">
        Answers are grounded in {plural(documents.length, 'indexed document')} and every claim links back to its source.
      </p>

      {/* Indexed documents */}
      <div className="mt-6 flex flex-wrap gap-2">
        {documents.map((doc) => (
          <span key={doc.source} className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[12px] text-muted-foreground">
            <FileText className="size-3 shrink-0" />
            <span className="truncate">{doc.source}</span>
          </span>
        ))}
      </div>

      {/* Starter questions */}
      <div className="mt-10 grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onAsk(question)}
            className="group flex items-start justify-between gap-3 rounded-xl border bg-card p-4 text-left text-[13.5px] leading-snug transition-all hover:border-primary/40 hover:shadow-card"
          >
            {question}
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  )
}

// Chat page with split source view
export default function ChatPage() {

  // Conversation state and screen size
  const { turns, busy, ask, evaluate, reset, opened, openSource, closeSource } = useChat()
  const isLarge = useMediaQuery('(min-width: 1024px)')

  // The turn whose source is open
  const openedTurn = opened ? turns.find((turn) => turn.id === opened.turnId) : null

  // Keep the newest message in view when a question is added and when its answer arrives
  const endRef = useRef(null)
  const lastStatus = turns.at(-1)?.status
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, lastStatus])

  // Source panel for the opened citation
  const panel = openedTurn && (
    <SourcePanel
      sources={openedTurn.sources}
      number={opened.number}
      onOpen={(number) => openSource(openedTurn.id, number)}
      onClose={closeSource}
    />
  )

  return (
    <div className="flex h-full min-h-0">

      {/* Conversation */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[15px] font-semibold">Chat</h1>
            {turns.length > 0 && <span className="text-[12px] text-muted-foreground">{plural(turns.length, 'question')}</span>}
          </div>
          <Button variant="outline" size="sm" onClick={reset} disabled={turns.length === 0 || busy} className="gap-1.5">
            <MessageSquarePlus className="size-3.5" />New chat
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {turns.length === 0 ? (
            <EmptyState onAsk={(question) => ask(question)} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-10 py-8">
              {turns.map((turn) => (
                <ChatTurn
                  key={turn.id}
                  turn={turn}
                  activeNumber={opened?.turnId === turn.id ? opened.number : null}
                  onOpen={(number) => openSource(turn.id, number)}
                  onRetry={() => ask(turn.question, turn.topK)}
                  onEvaluate={() => evaluate(turn)}
                />
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 pt-2 pb-5">
          <div className="mx-auto max-w-3xl">
            <Composer busy={busy} onSend={ask} />
            <p className="mt-2 text-center text-[11.5px] text-subtle-foreground">Answers come only from your indexed documents. Click a citation to see the passage.</p>
          </div>
        </div>
      </section>

      {/* Source panel: right column on large screens, sheet on small ones */}
      {isLarge && panel && (
        <aside className="w-[46%] max-w-[760px] min-w-[420px] shrink-0 border-l">{panel}</aside>
      )}
      {!isLarge && (
        <Sheet open={Boolean(panel)} onOpenChange={(open) => !open && closeSource()} title="Source" className="p-0">
          <div className="h-full">{panel}</div>
        </Sheet>
      )}
    </div>
  )
}
