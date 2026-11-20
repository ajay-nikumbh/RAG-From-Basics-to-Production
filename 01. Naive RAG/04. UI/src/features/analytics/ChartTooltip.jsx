/**
 * Chart tooltip.
 *
 * Shared tooltip card for the Recharts charts: a title line and rows of
 * label and value, in the same popover style as the rest of the app. Text
 * uses text colors; a small swatch carries the series color.
 */

// Tooltip card with a title and label/value rows
export default function ChartTooltip({ title, rows }) {
  return (
    <div className="max-w-72 rounded-lg border bg-card px-3 py-2 text-[12px] shadow-pop">
      <p className="mb-1 font-medium text-foreground">{title}</p>
      {rows.map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {color && <span className="size-2 rounded-sm" style={{ background: color }} />}
            {label}
          </span>
          <span className="font-mono text-foreground tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  )
}
