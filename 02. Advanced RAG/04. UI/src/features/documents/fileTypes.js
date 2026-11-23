/**
 * File type details.
 *
 * Maps the backend file_type (pdf, excel, word, text, markdown) to a short
 * label, a lucide icon and a color, so every list and badge shows file types
 * the same way, and says which part name to use (page or sheet).
 */

// Imports
import { FileCode2, FileSpreadsheet, FileText, FileType2, File } from 'lucide-react'

// Label, icon, color and part name per type
const TYPES = {
  pdf: { label: 'PDF', icon: FileText, color: 'text-red-500', part: 'page' },
  excel: { label: 'Excel', icon: FileSpreadsheet, color: 'text-emerald-500', part: 'sheet' },
  word: { label: 'Word', icon: FileType2, color: 'text-blue-500', part: null },
  markdown: { label: 'Markdown', icon: FileCode2, color: 'text-violet-500', part: null },
  text: { label: 'Text', icon: File, color: 'text-zinc-500', part: null },
}

// Details for one type, with a neutral fallback
export function fileType(type) {
  return TYPES[type] ?? { label: type ?? 'File', icon: File, color: 'text-zinc-500', part: null }
}
