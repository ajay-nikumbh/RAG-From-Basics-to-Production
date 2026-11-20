/**
 * Vite configuration.
 *
 * This file sets up the React plugin and a development proxy. Every request
 * the UI sends to /api/... is forwarded to the FastAPI server on port 8000
 * with the /api prefix removed, so /api/query reaches POST /query. Because
 * the browser only talks to the Vite server, no CORS setup is needed.
 */

// Imports
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// URL of the FastAPI server started with uvicorn
const API_URL = 'http://127.0.0.1:8000'

export default defineConfig({

  // Enable JSX and fast refresh for React
  plugins: [react()],

  // Forward /api requests to FastAPI during development
  server: {
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
