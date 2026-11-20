/**
 * Server data hooks.
 *
 * This file wraps every API call in a TanStack Query hook. Queries cache
 * their data by key, show loading and error states and refetch when needed;
 * mutations change data and then mark the related queries as stale so the
 * screens update by themselves (for example, the documents table and the
 * analytics refresh after an upload or a delete).
 */

// Imports
import { askQuestion, deleteDocument, getAnalytics, getDocumentChunks, getHealth, listDocuments, uploadDocument } from './client.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Cache keys, in one place so invalidation never misses a typo
export const keys = {
  health: ['health'],
  documents: ['documents'],
  chunks: (source) => ['documents', source, 'chunks'],
  analytics: ['analytics'],
}

// API status, checked every 30 seconds
export function useHealth() {
  return useQuery({ queryKey: keys.health, queryFn: getHealth, refetchInterval: 30_000, retry: false })
}

// Indexed documents
export function useDocuments() {
  return useQuery({ queryKey: keys.documents, queryFn: listDocuments })
}

// Chunks of one document, only fetched when a source is given
export function useDocumentChunks(source) {
  return useQuery({ queryKey: keys.chunks(source), queryFn: () => getDocumentChunks(source), enabled: Boolean(source) })
}

// Usage analytics, refreshed every minute while the page is open
export function useAnalytics() {
  return useQuery({ queryKey: keys.analytics, queryFn: getAnalytics, refetchInterval: 60_000 })
}

// USD to INR rate from the analytics response, with the backend default until it loads
export function useInrRate() {
  const { data } = useAnalytics()
  return data?.usd_to_inr ?? 84
}

// Upload one file; documents and analytics refresh afterwards
export function useUploadDocument() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }) => uploadDocument(file, onProgress),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.documents })
      client.invalidateQueries({ queryKey: keys.analytics })
    },
  })
}

// Delete one file; documents refresh afterwards
export function useDeleteDocument() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.documents }),
  })
}

// Ask a question; analytics refresh afterwards
export function useAsk() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ question, topK }) => askQuestion(question, topK),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.analytics }),
  })
}
