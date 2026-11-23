/**
 * Media query hook.
 *
 * Returns true while a CSS media query matches, for example
 * useMediaQuery('(min-width: 1024px)') on large screens. It subscribes to the
 * browser's matchMedia, so components re-render when the window crosses the
 * breakpoint.
 */

// Imports
import { useSyncExternalStore } from 'react'

// True while the query matches
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
