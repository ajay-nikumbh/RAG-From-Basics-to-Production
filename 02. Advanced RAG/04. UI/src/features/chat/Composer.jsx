/**
 * Composer.
 *
 * This file is the question box at the bottom of the chat. The textarea
 * grows with its text; Enter sends and Shift+Enter adds a new line. A small
 * label shows how many earlier turns are sent with the question, so the user
 * knows follow-ups ("and how is it trained?") will be understood. The send
 * button is disabled while a question is running or the box is empty. The
 * number of chunks is no longer chosen here: the API keeps 1 to 5 chunks by
 * reranker score.
 */

// Imports
import { Tooltip } from '@/components/ui/overlay'
import { Button } from '@/components/ui/button'
import { ArrowUp, History } from 'lucide-react'
import { Kbd } from '@/components/ui/misc'
import { plural } from '@/lib/format'
import { useState } from 'react'

// Question box with send button and the follow-up context label
export default function Composer({ busy, onSend, historyTurns = 0 }) {

  // Draft text
  const [text, setText] = useState('')

  // Send the draft and clear the box
  function send() {
    const question = text.trim()
    if (!question || busy) {
      return
    }
    onSend(question)
    setText('')
  }

  // Enter sends, Shift+Enter keeps a new line
  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-2 shadow-pop transition-shadow focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder="Ask a question about your documents..."
        className="field-sizing-content max-h-48 min-h-11 w-full resize-none bg-transparent px-3 py-2.5 text-[14.5px] outline-none focus-visible:outline-none placeholder:text-subtle-foreground"
        aria-label="Question"
      />
      <div className="flex items-center justify-between gap-2 px-1">
        <Tooltip content="Earlier questions and answers are sent so follow-up questions can be rewritten into standalone questions">
          <span className="flex cursor-default items-center gap-1.5 px-2 text-[12px] text-muted-foreground">
            <History className="size-3.5" />
            {historyTurns === 0 ? 'New conversation' : `Follow-ups use ${plural(historyTurns, 'earlier turn')}`}
          </span>
        </Tooltip>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1 text-[11.5px] text-subtle-foreground sm:flex">
            <Kbd>Enter</Kbd> send <Kbd>Shift</Kbd><Kbd>Enter</Kbd> new line
          </span>
          <Button size="icon" onClick={send} disabled={busy || !text.trim()} className="rounded-xl" aria-label="Send question">
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  )
}
