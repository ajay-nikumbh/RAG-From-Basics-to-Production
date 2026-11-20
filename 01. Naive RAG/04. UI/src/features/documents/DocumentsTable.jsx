/**
 * Documents table.
 *
 * This file lists every indexed file with its type, pages or sheets, chunks,
 * size and upload time. A search box filters by name. Clicking a row opens
 * the document drawer; the row menu offers Open and Delete, and Delete asks
 * for confirmation first. Loading shows skeleton rows, an empty index shows
 * a short call to action.
 */

// Imports
import { ConfirmDialog, DropdownMenu } from '@/components/ui/overlay'
import { Ellipsis, Eye, Search, Trash2 } from 'lucide-react'
import { formatBytes, plural, timeAgo } from '@/lib/format'
import { useDeleteDocument } from '@/api/queries'
import { Skeleton } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { fileType } from './fileTypes'
import { useState } from 'react'
import { toast } from 'sonner'

// Column headings
const COLUMNS = ['Name', 'Type', 'Parts', 'Chunks', 'Size', 'Uploaded', '']

// Indexed documents with search and row actions
export default function DocumentsTable({ documents, isPending, onOpen }) {

  // Search text and the file waiting for delete confirmation
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const remove = useDeleteDocument()

  // Rows matching the search
  const rows = (documents ?? []).filter((doc) => doc.source.toLowerCase().includes(search.toLowerCase()))

  // Delete after confirmation and report the result
  function confirmDelete() {
    const source = toDelete
    remove.mutate(source, {
      onSuccess: (data) => toast.success(`${source} deleted`, { description: `${plural(data.removed_chunks, 'chunk')} removed from the index` }),
      onError: (err) => toast.error('Delete failed', { description: err.message }),
    })
  }

  return (
    <div className="rounded-xl border bg-card shadow-card">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-sm font-semibold">Indexed documents</p>
        <label className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files"
            className="h-8 w-44 rounded-md border bg-background pr-3 pl-8 text-[13px] outline-none placeholder:text-subtle-foreground focus:border-ring sm:w-56"
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b text-[11px] tracking-wide text-muted-foreground uppercase">
              {COLUMNS.map((column) => <th key={column} className="px-4 py-2.5 font-medium">{column}</th>)}
            </tr>
          </thead>
          <tbody>

            {/* Loading */}
            {isPending && [0, 1, 2].map((row) => (
              <tr key={row} className="border-b last:border-0">
                <td colSpan={COLUMNS.length} className="px-4 py-3"><Skeleton className="h-5" /></td>
              </tr>
            ))}

            {/* Empty */}
            {!isPending && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? 'No files match your search.' : 'No documents yet. Upload a file to build the index.'}
                </td>
              </tr>
            )}

            {/* Rows */}
            {rows.map((doc) => {
              const { icon: Icon, color, label, part } = fileType(doc.file_type)
              return (
                <tr key={doc.source} onClick={() => onOpen(doc)} className="group cursor-pointer border-b whitespace-nowrap transition-colors last:border-0 hover:bg-accent/60">
                  <td className="max-w-80 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`size-4 shrink-0 ${color}`} />
                      <span className="truncate font-medium">{doc.source}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge>{label}</Badge></td>
                  <td className="px-4 py-3 font-mono text-muted-foreground tabular-nums">{part ? plural(doc.parts, part) : '-'}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{doc.chunks}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground tabular-nums">{formatBytes(doc.size_bytes)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{timeAgo(doc.uploaded_at)}</td>
                  <td className="px-2 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu
                      trigger={
                        <button type="button" className="rounded-md p-1.5 text-muted-foreground opacity-60 hover:bg-accent hover:text-foreground group-hover:opacity-100" aria-label={`Actions for ${doc.source}`}>
                          <Ellipsis className="size-4" />
                        </button>
                      }
                      items={[
                        { label: 'Open', icon: Eye, onSelect: () => onOpen(doc) },
                        { label: 'Delete', icon: Trash2, danger: true, onSelect: () => setToDelete(doc.source) },
                      ]}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete ${toDelete}?`}
        description="Its chunks are removed from the FAISS index and the uploaded file is deleted. Answers will no longer use it."
        onConfirm={confirmDelete}
      />
    </div>
  )
}
