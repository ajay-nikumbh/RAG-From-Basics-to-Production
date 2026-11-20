/**
 * API client.
 *
 * This file is the only place in the UI that talks to the FastAPI backend.
 * It has one function per endpoint (health, upload, query). Every request
 * goes to /api/..., which the Vite proxy forwards to FastAPI. When the
 * backend returns an error, the function throws an ApiError that carries the
 * readable message from FastAPI's {"detail": ...} body and the HTTP status.
 */

// Base path for all backend calls; the Vite proxy removes it
const API_BASE = '/api'

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
    throw new ApiError('Cannot reach the API server. Is it running on port 8000?', 0)
  }

  // FastAPI always answers with JSON; tolerate an empty body
  const body = await response.json().catch(() => null)

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

// POST /documents: upload and index one file
export function uploadDocument(file) {

  // Files are sent as multipart form data in a field named "file"
  const form = new FormData()
  form.append('file', file)

  return request('/documents', { method: 'POST', body: form })
}

// POST /query: ask a question, get the answer and its sources
export function askQuestion(question, topK = null) {
  return request('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK }),
  })
}
