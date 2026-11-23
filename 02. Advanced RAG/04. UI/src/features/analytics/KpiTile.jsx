/**
 * KPI tile.
 *
 * One headline number with its label, an icon and a short line of context
 * underneath (for example "6 questions, 4 ingestions"). Used in the row of
 * key numbers at the top of the Analytics page.
 */

// Imports
import { cn } from '@/lib/utils'

// Headline number tile
export default function KpiTile({ icon: Icon, label, value, detail, className }) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 shadow-card', className)}>
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-muted-foreground">{label}</p>
        <Icon className="size-4 text-subtle-foreground" />
      </div>
      <p className="mt-2 font-mono text-[22px] font-semibold tracking-tight tabular-nums">{value}</p>
      {detail && <p className="mt-1 truncate text-[12px] text-subtle-foreground">{detail}</p>}
    </div>
  )
}
