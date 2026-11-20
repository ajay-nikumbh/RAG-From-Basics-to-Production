/**
 * Answer Markdown.
 *
 * This file renders an answer as Markdown (paragraphs, lists, bold, code,
 * tables) with citation markers turned into CitationChip components. Each
 * marker is first rewritten as a "#cite-N" link; the link renderer then draws
 * a chip for it instead of an anchor.
 */

// Imports
import { citationNumber, linkCitations } from './citations'
import ReactMarkdown from 'react-markdown'
import CitationChip from './CitationChip'
import remarkGfm from 'remark-gfm'

// Markdown answer with citation chips
export default function AnswerMarkdown({ text, sources, activeNumber, onOpen }) {

  // Look up a source by its citation number
  const byNumber = Object.fromEntries(sources.map((source) => [source.number, source]))

  // Element renderers: tidy typography and chips for citation links
  const components = {
    p: (props) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
    ul: (props) => <ul className="my-2 list-disc space-y-1 pl-5" {...props} />,
    ol: (props) => <ol className="my-2 list-decimal space-y-1 pl-5" {...props} />,
    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
    code: (props) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12.5px]" {...props} />,
    table: (props) => <div className="my-3 overflow-x-auto"><table className="w-full text-[13px]" {...props} /></div>,
    th: (props) => <th className="border-b px-2 py-1 text-left font-medium" {...props} />,
    td: (props) => <td className="border-b px-2 py-1" {...props} />,
    a: ({ href, children }) => {
      const number = citationNumber(href)
      if (number === null) {
        return <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{children}</a>
      }
      return <CitationChip number={number} source={byNumber[number]} active={activeNumber === number} onOpen={onOpen} />
    },
  }

  return (
    <div className="text-[14.5px] leading-7 text-foreground/90">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linkCitations(text)}
      </ReactMarkdown>
    </div>
  )
}
