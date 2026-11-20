/**
 * Tests for the API client.
 *
 * These tests replace the browser fetch function with a fake, so no server is
 * needed. They check the URL, method and body of each request, and that
 * backend errors and network failures become ApiError with a readable message.
 */

// Imports
import { ApiError, askQuestion, getHealth, listDocuments, readDetail, uploadDocument } from './client.js'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Build a fake fetch that answers with the given status and JSON body
function fakeFetch(status, body) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

// Restore the real fetch after every test
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requests', () => {

  it('getHealth calls GET /api/health', async () => {

    // Fake a healthy server
    const fetch = fakeFetch(200, { status: 'ok' })
    vi.stubGlobal('fetch', fetch)

    // Call and check
    expect(await getHealth()).toEqual({ status: 'ok' })
    expect(fetch).toHaveBeenCalledWith('/api/health', {})
  })

  it('listDocuments calls GET /api/documents', async () => {

    // Fake one indexed file
    const body = { documents: [{ source: 'a.pdf', file_type: 'pdf', parts: 2, chunks: 5 }], total_chunks: 5 }
    const fetch = fakeFetch(200, body)
    vi.stubGlobal('fetch', fetch)

    // Call and check
    expect(await listDocuments()).toEqual(body)
    expect(fetch).toHaveBeenCalledWith('/api/documents', {})
  })

  it('uploadDocument sends the file as form data', async () => {

    // Fake a successful upload
    const fetch = fakeFetch(200, { source: 'a.txt', chunks: 1 })
    vi.stubGlobal('fetch', fetch)

    // Upload a small file
    const file = new File(['hello'], 'a.txt')
    await uploadDocument(file)

    // POST to /api/documents with the file in the "file" field
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('/api/documents')
    expect(options.method).toBe('POST')
    expect(options.body.get('file').name).toBe('a.txt')
  })

  it('askQuestion sends question and top_k as JSON', async () => {

    // Fake an answer
    const fetch = fakeFetch(200, { answer: 'Yes [1]', sources: [] })
    vi.stubGlobal('fetch', fetch)

    // Ask with top_k 3
    await askQuestion('What is RAG?', 3)

    // JSON body with snake_case top_k for FastAPI
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('/api/query')
    expect(JSON.parse(options.body)).toEqual({ question: 'What is RAG?', top_k: 3 })
  })
})

describe('errors', () => {

  it('backend errors become ApiError with the detail message', async () => {

    // Fake a 409 from the upload endpoint
    vi.stubGlobal('fetch', fakeFetch(409, { detail: "'a.txt' is already indexed" }))

    // The message and status come from the backend
    await expect(uploadDocument(new File(['x'], 'a.txt'))).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: "'a.txt' is already indexed",
    })
  })

  it('a network failure becomes ApiError with status 0', async () => {

    // Fake a server that is not running
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    // Clear message, status 0
    const error = await getHealth().catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
  })

  it('a proxy 502 without a detail means the server is down', async () => {

    // Vite answers 502 with an empty body when FastAPI is not running
    vi.stubGlobal('fetch', fakeFetch(502, null))

    // Same clear message as a network failure
    const error = await getHealth().catch((e) => e)
    expect(error.status).toBe(0)
    expect(error.message).toContain('Cannot reach the API server')
  })

  it('readDetail joins validation messages', () => {

    // FastAPI 422 body with two problems
    const body = { detail: [{ msg: 'Field required' }, { msg: 'Input too long' }] }
    expect(readDetail(body)).toBe('Field required. Input too long')
  })
})
