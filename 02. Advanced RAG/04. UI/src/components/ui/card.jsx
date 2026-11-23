/**
 * Card.
 *
 * A surface for grouped content: white (or dark card) background, hairline
 * border, soft shadow and 12px radius. CardHeader, CardTitle,
 * CardDescription and CardContent keep spacing the same in every card.
 */

// Imports
import { cn } from '@/lib/utils'

// Outer surface
export function Card({ className, ...props }) {
  return <div className={cn('rounded-lg border bg-card text-card-foreground shadow-card', className)} {...props} />
}

// Title row with optional actions on the right
export function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)} {...props} />
}

// Card title
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-sm font-semibold tracking-tight', className)} {...props} />
}

// One line under the title
export function CardDescription({ className, ...props }) {
  return <p className={cn('mt-0.5 text-[13px] text-muted-foreground', className)} {...props} />
}

// Body
export function CardContent({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />
}
