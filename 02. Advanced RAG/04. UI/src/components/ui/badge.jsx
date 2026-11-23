/**
 * Badge.
 *
 * Small rounded label for statuses and file types, for example "PDF",
 * "Indexed" or "query". Variants: neutral, primary, success, warning, danger.
 */

// Imports
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variant classes
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-muted text-muted-foreground',
        primary: 'border-transparent bg-primary-soft text-primary',
        success: 'border-transparent bg-success-soft text-success',
        warning: 'border-transparent bg-highlight text-warning',
        danger: 'border-transparent bg-danger-soft text-danger',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

// Inline label
export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
