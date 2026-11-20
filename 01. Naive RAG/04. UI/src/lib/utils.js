/**
 * Class name helper.
 *
 * cn() joins class names and lets later Tailwind classes win over earlier
 * ones ("px-2 px-4" becomes "px-4"), so components can accept a className
 * prop that overrides their defaults cleanly.
 */

// Imports
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

// Join and de-duplicate Tailwind classes
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
