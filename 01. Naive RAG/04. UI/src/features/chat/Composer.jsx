/**
 * Composer.
 *
 * This file is the question box at the bottom of the chat. The textarea
 * grows with its text; Enter sends and Shift+Enter adds a new line. A small
 * menu picks how many chunks to retrieve (top k), and the send button is
 * disabled while a question is running or the box is empty.
 */

// Imports
import { ArrowUp, SlidersHorizontal } from 'lucide-react'
import { DropdownMenu } from '@/components/ui/overlay'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/misc'
import { useState } from 'react'

// Top k choices; null means the server default
const TOP_K = [null, 3, 5, 8, 10]

// Question box with send button and top k menu
export default function Composer({ busy, onSend }) {

  // Draft text and chosen top k
  const [text, setText] = useState('')
  const [topK, setTopK] = useState(null)

  // Send the draft and clear the box
  function send() {
    const question = text.trim()
    if (!question || busy) {
      return
    }
    onSend(question, topK)
    setText('')
  }

  // Enter sends, Shift+Enter keeps a new line
  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send()
    }
  }

  // Menu items for the top k choice
  const items = TOP_K.map((value) => ({
    label: `${value === null ? 'Server default' : `Top ${value} chunks`}${value === topK ? '  (selected)' : ''}`,
    onSelect: () => setTopK(value),
  }))

  return (
    <div className="rounded-2xl border bg-card p-2 shadow-pop transition-shadow focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder="Ask a question about your documents..."
        className="field-sizing-content max-h-48 focus-visible:outline-none min-h-11 w-full resize-none bg-transparent px-3 py-2.5 text-[14.5px] outline-none placeholder:text-subtle-foreground"
        aria-label="Question"
      />
      <div className="flex items-center justify-between gap-2 px-1">
        <DropdownMenu
          align="start"
          items={items}
          trigger={
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              {topK === null ? 'Default top k' : `Top ${topK}`}
            </Button>
          }
        />
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
