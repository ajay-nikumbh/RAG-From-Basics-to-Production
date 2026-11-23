/**
 * PDF viewer.
 *
 * This file renders one page of a PDF with pdf.js (react-pdf), sized to the
 * width of its container, with a toolbar for previous and next page, the page
 * number and zoom. The text layer is turned on, so text can be selected and
 * the cited chunk can be highlighted: every piece of page text that appears in
 * the `highlight` text is wrapped in an amber mark. When `page` changes from
 * outside (a citation was clicked), the viewer jumps to that page.
 */

// Imports
import { ChevronLeft, ChevronRight, Minus, Plus, ExternalLink } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { escapeHtml, isInChunk, normalise } from './highlight'
import { Document, Page, pdfjs } from 'react-pdf'
import { Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import 'react-pdf/dist/Page/TextLayer.css'

// pdf.js parses PDFs in a web worker shipped with pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

// Zoom limits and step
const ZOOM = { min: 0.6, max: 2, step: 0.2 }

// One-page PDF viewer with highlight support
export default function PdfViewer({ url, page = 1, highlight = '' }) {

  // Number of pages, current page and zoom
  const [pages, setPages] = useState(0)
  const [current, setCurrent] = useState(page)
  const [zoom, setZoom] = useState(1)

  // Width of the container, so the page fits it
  const boxRef = useRef(null)
  const [width, setWidth] = useState(600)

  // Jump to a new page when a citation asks for one (React's "adjust state when a prop changes" pattern)
  const [requested, setRequested] = useState({ page, url })
  if (requested.page !== page || requested.url !== url) {
    setRequested({ page, url })
    setCurrent(page)
  }

  // Track the container width
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    if (boxRef.current) {
      observer.observe(boxRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Normalised chunk text, computed once per highlight
  const target = useMemo(() => normalise(highlight), [highlight])

  // Wrap page text that belongs to the cited chunk in a highlight mark
  const renderText = useCallback(
    ({ str }) => (target && isInChunk(str, target) ? `<mark class="pdf-highlight">${escapeHtml(str)}</mark>` : escapeHtml(str)),
    [target],
  )

  // Move between pages within the document
  const go = (delta) => setCurrent((value) => Math.min(Math.max(1, value + delta), pages || 1))

  return (
    <div className="flex h-full min-h-0 flex-col">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => go(-1)} disabled={current <= 1} aria-label="Previous page"><ChevronLeft /></Button>
          <span className="min-w-20 text-center font-mono text-[12px] text-muted-foreground tabular-nums">{current} / {pages || '-'}</span>
          <Button variant="ghost" size="icon" onClick={() => go(1)} disabled={!pages || current >= pages} aria-label="Next page"><ChevronRight /></Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(ZOOM.min, z - ZOOM.step))} aria-label="Zoom out"><Minus /></Button>
          <span className="w-12 text-center font-mono text-[12px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(ZOOM.max, z + ZOOM.step))} aria-label="Zoom in"><Plus /></Button>
          <a href={url} target="_blank" rel="noreferrer" className="ml-1 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open PDF in a new tab">
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      {/* Page, centred on a muted background like a document viewer */}
      <div ref={boxRef} className="min-h-0 flex-1 overflow-auto bg-muted/60 p-4">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setPages(numPages)}
          loading={<Skeleton className="mx-auto aspect-[1/1.3] w-full max-w-2xl" />}
          error={<p className="p-6 text-center text-sm text-danger">This PDF could not be loaded.</p>}
          className="flex justify-center"
        >
          <Page
            key={`${current}-${target.length}`}
            pageNumber={Math.min(current, pages || current)}
            width={Math.max(280, (width - 32) * zoom)}
            renderAnnotationLayer={false}
            customTextRenderer={renderText}
            loading={<Skeleton className="aspect-[1/1.3] w-full max-w-2xl" />}
            className="overflow-hidden rounded-md shadow-pop"
          />
        </Document>
      </div>
    </div>
  )
}
