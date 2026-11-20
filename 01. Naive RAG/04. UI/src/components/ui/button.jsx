/**
 * Button.
 *
 * This file is the one button used across the UI. It is a native <button>
 * (keyboard and focus for free) styled with class-variance-authority, which
 * maps a variant and a size to Tailwind classes:
 *
 *   variant: primary, secondary, outline, ghost, danger
 *   size:    sm, md, lg, icon
 */

// Imports
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variant and size classes
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-card hover:bg-primary-hover',
        secondary: 'bg-muted text-foreground hover:bg-accent',
        outline: 'border bg-card text-foreground shadow-card hover:bg-accent',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        danger: 'bg-danger text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-4',
        lg: 'h-10 px-5',
        icon: 'size-8',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
)

// Native button with variant classes
export function Button({ className, variant, size, type = 'button', ...props }) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
