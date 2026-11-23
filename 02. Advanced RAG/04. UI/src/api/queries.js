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
import { askQuestion, deleteDocument, evaluateAnswer, getAnalytics, getDocumentChunks, getEvalRun, getEvalTestset, getHealth, listDocuments, listEvalRuns, startEvalRun, uploadDocument } from './client.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Cache keys, in one place so invalidation never misses a typo
export const keys = {
  health: ['health'],
  documents: ['documents'],
  chunks: (source) => ['documents', source, 'chunks'],
  analytics: ['analytics'],
  testset: ['evals', 'testset'],
  evalRuns: ['evals', 'runs'],
  evalRun: (id) => ['evals', 'runs', id],
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

// Ask a question with the earlier turns; analytics refresh afterwards
export function useAsk() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ question, history }) => askQuestion(question, history),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.analytics }),
  })
}

// Grade one chat answer with the LLM judge; analytics refresh afterwards (grading has a cost)
export function useEvaluateAnswer() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: evaluateAnswer,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.analytics }),
  })
}

// Built-in evaluation test cases
export function useEvalTestset() {
  return useQuery({ queryKey: keys.testset, queryFn: getEvalTestset })
}

// Saved evaluation runs; polled every 3 seconds while one is running
export function useEvalRuns() {
  return useQuery({
    queryKey: keys.evalRuns,
    queryFn: listEvalRuns,
    refetchInterval: (query) => (query.state.data?.runs?.some((run) => run.status === 'running') ? 3000 : false),
  })
}

// One evaluation run with results; polled every 2 seconds until it finishes
export function useEvalRun(id) {
  return useQuery({
    queryKey: keys.evalRun(id),
    queryFn: () => getEvalRun(id),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'running' ? 2000 : false),
  })
}

// Start an evaluation run; the run list and analytics refresh afterwards
export function useStartEvalRun() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: startEvalRun,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.evalRuns })
      client.invalidateQueries({ queryKey: keys.analytics })
    },
  })
}
