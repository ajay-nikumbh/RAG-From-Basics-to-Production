/**
 * Page header.
 *
 * Title, one-line description and optional actions (buttons) at the top of
 * a page, with the same size and spacing on every page.
 */

// Imports
import { cn } from '@/lib/utils'

// Title row of a page
export default function PageHeader({ title, description, actions, className }) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4 border-b bg-background/80 px-6 py-5 backdrop-blur md:px-8', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
