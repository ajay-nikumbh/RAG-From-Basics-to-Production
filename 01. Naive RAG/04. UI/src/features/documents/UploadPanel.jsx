/**
 * Upload panel.
 *
 * This file is the ingestion card on the documents page. Files can be
 * dropped on the zone or picked with the browser; several files are queued
 * and uploaded one after another. Each queued file shows its state: waiting,
 * uploading (with a real progress bar for the bytes sent), indexing (the
 * server is parsing, chunking and embedding), done (with the result) or
 * failed (with the backend message). The latest result opens the pipeline
 * breakdown below the zone.
 */

// Imports
import { CheckCircle2, CircleAlert, CloudUpload, Clock3 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { useUploadDocument } from '@/api/queries'
import IngestionResult from './IngestionResult'
import { Spinner } from '@/components/ui/misc'
import { useDropzone } from 'react-dropzone'
import { formatBytes } from '@/lib/format'
import { fileType } from './fileTypes'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// File types the backend accepts (API doc 08)
const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
}

// Type of a file from its extension, for the icon
function typeFromName(name) {
  const ext = name.split('.').pop().toLowerCase()
  return { pdf: 'pdf', xlsx: 'excel', docx: 'word', md: 'markdown', txt: 'text' }[ext]
}

// One row of the upload queue
function QueueRow({ item }) {

  // Icon and color for the file type
  const { icon: Icon, color } = fileType(typeFromName(item.file.name))

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
    >
      <Icon className={cn('size-5 shrink-0', color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[13px] font-medium">{item.file.name}</p>
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{formatBytes(item.file.size)}</span>
        </div>

        {/* Progress bar while bytes are sent, thin indeterminate bar while indexing */}
        {(item.status === 'uploading' || item.status === 'indexing') && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full bg-primary transition-[width] duration-200', item.status === 'indexing' && 'w-1/3 animate-[pulse_1.2s_ease-in-out_infinite]')}
              style={item.status === 'uploading' ? { width: `${Math.round(item.progress * 100)}%` } : undefined}
            />
          </div>
        )}

        {/* Status line */}
        <p className={cn('mt-1 text-[12px]', item.status === 'error' ? 'text-danger' : 'text-muted-foreground')}>
          {item.status === 'waiting' && 'Waiting'}
          {item.status === 'uploading' && `Uploading ${Math.round(item.progress * 100)}%`}
          {item.status === 'indexing' && 'Parsing, chunking and embedding...'}
          {item.status === 'done' && `Indexed: ${item.result.chunks} chunks, ${item.result.embedding_tokens} tokens`}
          {item.status === 'error' && item.error}
        </p>
      </div>

      {/* State icon */}
      <div className="shrink-0">
        {item.status === 'waiting' && <Clock3 className="size-4 text-subtle-foreground" />}
        {(item.status === 'uploading' || item.status === 'indexing') && <Spinner className="text-primary" />}
        {item.status === 'done' && <CheckCircle2 className="size-4 text-success" />}
        {item.status === 'error' && <CircleAlert className="size-4 text-danger" />}
      </div>
    </motion.li>
  )
}

// Drop zone, upload queue and latest result
export default function UploadPanel() {

  // Upload mutation, queue of files and the latest successful result
  const upload = useUploadDocument()
  const [queue, setQueue] = useState([])
  const [latest, setLatest] = useState(null)
  const running = useRef(false)

  // Change one queue item by id
  const update = useCallback((id, changes) => {
    setQueue((items) => items.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }, [])

  // Upload queued items one at a time, in order
  const processQueue = useCallback(async (items) => {

    // Only one loop runs at a time
    if (running.current) {
      return
    }
    running.current = true

    // Upload each item and record its outcome
    for (const item of items) {
      update(item.id, { status: 'uploading', progress: 0 })
      try {
        const onProgress = (value) => update(item.id, value >= 1 ? { status: 'indexing', progress: 1 } : { progress: value })
        const result = await upload.mutateAsync({ file: item.file, onProgress })
        update(item.id, { status: 'done', result })
        setLatest(result)
        toast.success(`${result.source} indexed`, { description: `${result.chunks} chunks in ${(result.steps.reduce((sum, s) => sum + s.ms, 0) / 1000).toFixed(1)} s` })
      } catch (err) {
        update(item.id, { status: 'error', error: err.message })
        toast.error(`${item.file.name} failed`, { description: err.message })
      }
    }

    running.current = false
  }, [update, upload])

  // New files dropped or picked: queue them and start uploading
  const onDrop = useCallback((files) => {
    const items = files.map((file) => ({ id: crypto.randomUUID(), file, status: 'waiting', progress: 0 }))
    setQueue((current) => [...items, ...current].slice(0, 8))
    processQueue(items)
  }, [processQueue])

  // Dropzone behaviour: accepted types, drag state, rejected files
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    onDropRejected: (rejections) => toast.error('Unsupported file', { description: rejections.map((r) => r.file.name).join(', ') }),
  })

  return (
    <div className="space-y-4">

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'group relative flex cursor-pointer items-center gap-4 rounded-xl border border-dashed px-5 py-5 transition-colors',
          isDragActive ? 'border-primary bg-primary-soft' : 'border-input bg-muted/40 hover:border-primary/60 hover:bg-primary-soft/50',
        )}
      >
        <input {...getInputProps()} />
        <div className="grid size-11 shrink-0 place-items-center rounded-full border bg-card shadow-card transition-transform group-hover:-translate-y-0.5">
          <CloudUpload className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{isDragActive ? 'Drop to upload' : 'Drop files here to index them'}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">PDF, Excel, Word, Markdown or text. Files are parsed, chunked, embedded and indexed.</p>
        </div>
        <span className="hidden shrink-0 rounded-lg border bg-card px-3 py-1.5 text-[12.5px] font-medium shadow-card sm:inline">Browse files</span>
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {queue.map((item) => <QueueRow key={item.id} item={item} />)}
          </AnimatePresence>
        </ul>
      )}

      {/* Pipeline breakdown of the latest upload */}
      {latest && <IngestionResult result={latest} />}
    </div>
  )
}
