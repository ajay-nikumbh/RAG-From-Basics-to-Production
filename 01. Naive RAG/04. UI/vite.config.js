/**
 * Vite configuration.
 *
 * This file sets up React, Tailwind CSS and two conveniences. The "@" alias
 * points to src, so imports read "@/components/ui/button" instead of long
 * relative paths. The dev proxy forwards every /api/... request to the
 * FastAPI server on port 8000 with the /api prefix removed, so the browser
 * only talks to Vite and no CORS setup is needed.
 */

// Imports
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// URL of the FastAPI server started with uvicorn
const API_URL = 'http://127.0.0.1:8000'

export default defineConfig({

  // React (JSX, fast refresh) and Tailwind CSS v4
  plugins: [react(), tailwindcss()],

  // "@/..." means "src/..."
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

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
