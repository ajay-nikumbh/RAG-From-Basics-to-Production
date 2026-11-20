/**
 * Application entry point.
 *
 * This file loads the global styles and design tokens, then mounts the root
 * App component into the #root element of index.html. StrictMode runs extra
 * checks during development to catch common React mistakes early.
 */

// Imports
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import '@/styles/globals.css'
import App from '@/App.jsx'

// Mount the app into the page
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
