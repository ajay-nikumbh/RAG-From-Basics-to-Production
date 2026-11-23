/**
 * Application entry point.
 *
 * This file loads the global styles and design tokens and mounts the app
 * with its providers: the TanStack Query client (server data cache), the
 * router (page URLs) and the toast container (notifications). StrictMode
 * runs extra checks during development.
 */

// Imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { StrictMode } from 'react'
import { Toaster } from 'sonner'
import '@/styles/globals.css'
import App from '@/App.jsx'

// Server data cache: keep data fresh for 10 seconds, retry failed queries once
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false } },
})

// Mount the app into the page
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="bottom-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
