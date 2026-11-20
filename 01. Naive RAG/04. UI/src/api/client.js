/**
 * API client.
 *
 * This file is the only place in the UI that talks to the FastAPI backend.
 * It has one function per endpoint (health, documents, upload, chunks, delete,
 * query, analytics). Every request
 * goes to /api/..., which the Vite proxy forwards to FastAPI. When the
 * backend returns an error, the function throws an ApiError that carries the
 * readable message from FastAPI's {"detail": ...} body and the HTTP status.
 * When the backend is down (network failure, or a 502/503/504 from the Vite
 * proxy) the error says so, with status 0.
 */

// Base path for all backend calls; the Vite proxy removes it
const API_BASE = '/api'

// Message when the API server cannot be reached
const UNREACHABLE = 'Cannot reach the API server. Is it running on port 8000?'

// Statuses the Vite proxy returns when FastAPI is not running
const PROXY_DOWN = [502, 503, 504]

// Error thrown for any failed request
export class ApiError extends Error {

  // Keep the HTTP status next to the message (0 means the server was unreachable)
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Turn FastAPI's error body into one readable sentence
export function readDetail(body) {

  // No body or no detail field
  if (!body || body.detail === undefined) {
    return ''
  }

  // Our own errors: {"detail": "message"}
  if (typeof body.detail === 'string') {
    return body.detail
  }

  // Validation errors (422): {"detail": [{"msg": "..."}, ...]}
  if (Array.isArray(body.detail)) {
    return body.detail.map((item) => item.msg).join('. ')
  }

  return ''
}

// Send a request, return the JSON body, or throw ApiError
async function request(path, options = {}) {

  // Call the backend; a network failure means the server is not running
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, options)
  } catch {
    throw new ApiError(UNREACHABLE, 0)
  }

  // FastAPI always answers with JSON; tolerate an empty body
  const body = await response.json().catch(() => null)

  // Proxy error without a FastAPI body: the backend is down
  if (PROXY_DOWN.includes(response.status) && !readDetail(body)) {
    throw new ApiError(UNREACHABLE, 0)
  }

  // Error status: use the message from the backend when there is one
  if (!response.ok) {
    const message = readDetail(body) || `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return body
}

// GET /health: API status and configuration check
export function getHealth() {
  return request('/health')
}

// GET /documents: every indexed file with its type, parts and chunk count
export function listDocuments() {
  return request('/documents')
}

// POST /documents: upload and index one file, reporting upload progress (0 to 1)
export function uploadDocument(file, onProgress = () => {}) {

  // Files are sent as multipart form data in a field named "file"
  const form = new FormData()
  form.append('file', file)

  // XMLHttpRequest is used here because fetch cannot report upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/documents`)

    // Share of bytes sent so far
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total)
      }
    }

    // Server answered: parse JSON and turn errors into ApiError, like request()
    xhr.onload = () => {
      let body = null
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        body = null
      }
      if (PROXY_DOWN.includes(xhr.status) && !readDetail(body)) {
        reject(new ApiError(UNREACHABLE, 0))
      } else if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(readDetail(body) || `Request failed with status ${xhr.status}`, xhr.status))
      } else {
        resolve(body)
      }
    }

    // Network failure
    xhr.onerror = () => reject(new ApiError(UNREACHABLE, 0))

    xhr.send(form)
  })
}

// URL of the original uploaded file, used by the PDF viewer
export function documentFileUrl(source) {
  return `${API_BASE}/documents/${encodeURIComponent(source)}/file`
}

// GET /documents/{source}/chunks: every chunk of one file
export function getDocumentChunks(source) {
  return request(`/documents/${encodeURIComponent(source)}/chunks`)
}

// DELETE /documents/{source}: remove a file from the index
export function deleteDocument(source) {
  return request(`/documents/${encodeURIComponent(source)}`, { method: 'DELETE' })
}

// GET /analytics: usage totals, daily series and recent runs
export function getAnalytics() {
  return request('/analytics')
}

// POST /query: ask a question, get the answer and its sources
export function askQuestion(question, topK = null) {
  return request('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK }),
  })
}

// POST /evals/answer: grade one answer with the LLM judge
export function evaluateAnswer({ question, answer, contexts, reference = null }) {
  return request('/evals/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer, contexts, reference }),
  })
}

// GET /evals/testset: the built-in test cases
export function getEvalTestset() {
  return request('/evals/testset')
}

// GET /evals/runs: saved evaluation runs, newest first
export function listEvalRuns() {
  return request('/evals/runs')
}

// GET /evals/runs/{id}: one run with its per-case results
export function getEvalRun(id) {
  return request(`/evals/runs/${encodeURIComponent(id)}`)
}

// POST /evals/runs: start evaluating the pipeline on the test set
export function startEvalRun({ topK = null, caseIds = null } = {}) {
  return request('/evals/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ top_k: topK, case_ids: caseIds }),
  })
}
