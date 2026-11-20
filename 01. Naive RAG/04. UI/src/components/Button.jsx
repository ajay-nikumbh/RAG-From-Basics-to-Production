/**
 * Button.
 *
 * This file is the one button used across the UI. It wraps the native
 * <button> element (so keyboard and focus work for free) and adds two looks:
 * "primary" in pen blue for the main action of a region, and "quiet" for
 * secondary actions such as Retry. All other props pass straight through.
 */

// Imports
import styles from './Button.module.css'

// Native button with a variant class
export default function Button({ variant = 'quiet', type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
