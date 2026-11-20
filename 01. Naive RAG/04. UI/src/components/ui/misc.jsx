/**
 * Small shared pieces.
 *
 * Skeleton: a pulsing placeholder shown while data loads.
 * Kbd: a keyboard key hint such as Enter.
 * Separator: a hairline divider.
 * Spinner: a small rotating loader for buttons and inline states.
 */

// Imports
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Loading placeholder block
export function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}

// Keyboard key hint
export function Kbd({ className, ...props }) {
  return (
    <kbd
      className={cn('inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}

// Hairline divider
export function Separator({ className, vertical = false }) {
  return <div role="separator" className={cn(vertical ? 'h-full w-px' : 'h-px w-full', 'bg-border', className)} />
}

// Rotating loader
export function Spinner({ className }) {
  return <LoaderCircle className={cn('size-4 animate-spin', className)} aria-hidden="true" />
}
