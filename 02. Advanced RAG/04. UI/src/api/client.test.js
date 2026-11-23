/**
 * Tests for the API client.
 *
 * These tests replace the browser fetch function with a fake, so no server is
 * needed. They check the URL, method and body of each request, and that
 * backend errors and network failures become ApiError with a readable message.
 */

// Imports
import { ApiError, askQuestion, deleteDocument, documentFileUrl, getHealth, listDocuments, readDetail, uploadDocument } from './client.js'
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

  it('uploadDocument sends form data and reports progress', async () => {

    // Fake XMLHttpRequest that "uploads" instantly and answers 200
    const sent = {}
    class FakeXhr {
      constructor() { this.upload = {} }
      open(method, url) { Object.assign(sent, { method, url }) }
      send(form) {
        sent.fileName = form.get('file').name
        this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 })
        this.status = 200
        this.responseText = JSON.stringify({ source: 'a.txt', chunks: 1 })
        this.onload()
      }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXhr)

    // Upload and collect progress values
    const progress = []
    const result = await uploadDocument(new File(['hello'], 'a.txt'), (value) => progress.push(value))

    // POST to /api/documents with the file, progress reported, JSON returned
    expect(sent).toEqual({ method: 'POST', url: '/api/documents', fileName: 'a.txt' })
    expect(progress).toEqual([0.5])
    expect(result).toEqual({ source: 'a.txt', chunks: 1 })
  })

  it('deleteDocument and documentFileUrl encode the file name', async () => {

    // Fake a successful delete
    const fetch = fakeFetch(200, { source: 'my file.pdf', removed_chunks: 3 })
    vi.stubGlobal('fetch', fetch)

    // Spaces are URL-encoded
    await deleteDocument('my file.pdf')
    expect(fetch).toHaveBeenCalledWith('/api/documents/my%20file.pdf', { method: 'DELETE' })
    expect(documentFileUrl('my file.pdf')).toBe('/api/documents/my%20file.pdf/file')
  })

  it('askQuestion sends the question and the chat history as JSON', async () => {

    // Fake an answer
    const fetch = fakeFetch(200, { answer: 'Yes [1]', sources: [] })
    vi.stubGlobal('fetch', fetch)

    // Ask a follow-up with one earlier turn
    const history = [{ question: 'What is RAG?', answer: 'Retrieval plus generation [1].' }]
    await askQuestion('and how is it trained?', history)

    // JSON body with the question and the history
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('/api/query')
    expect(JSON.parse(options.body)).toEqual({ question: 'and how is it trained?', history })

    // Without history an empty list is sent
    await askQuestion('What is RAG?')
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ question: 'What is RAG?', history: [] })
  })
})

describe('errors', () => {

  it('backend errors become ApiError with the detail message', async () => {

    // Fake a 404 from the chunks endpoint
    vi.stubGlobal('fetch', fakeFetch(404, { detail: "'a.pdf' is not indexed" }))

    // The message and status come from the backend
    await expect(deleteDocument('a.pdf')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: "'a.pdf' is not indexed",
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
