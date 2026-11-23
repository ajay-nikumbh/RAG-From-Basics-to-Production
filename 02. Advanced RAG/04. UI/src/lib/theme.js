/**
 * Theme hook.
 *
 * This file switches between the light and the dark theme by toggling the
 * "dark" class on <html>, which swaps every design token (styles/globals.css).
 * The choice is remembered in localStorage; the first visit follows the
 * operating system setting. Storage can be blocked (private windows), so
 * every access is wrapped in try/catch and the app still works without it.
 */

// Imports
import { useEffect, useState } from 'react'

// localStorage key for the saved theme
const STORAGE_KEY = 'advanced-rag-theme'

// Saved theme, or the operating system preference
function initialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // Storage blocked: fall back to the system setting
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Current theme and a toggle function
export function useTheme() {

  // light or dark
  const [theme, setTheme] = useState(initialTheme)

  // Apply the class to <html> and remember the choice
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Storage blocked: the theme still applies for this visit
    }
  }, [theme])

  // Flip between light and dark
  const toggle = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
