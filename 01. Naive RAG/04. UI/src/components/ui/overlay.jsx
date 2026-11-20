/**
 * Overlays built on Radix UI primitives.
 *
 * Radix handles the hard parts (focus trap, Escape to close, keyboard
 * navigation, screen reader roles, positioning); these wrappers only add the
 * look of the design system.
 *
 *   Tooltip      short hint on hover or focus
 *   HoverCard    rich preview on hover (citation previews)
 *   Sheet        panel that slides in from the right (document drawer)
 *   DropdownMenu small action menu (row actions)
 *   Tabs         switch between views in the same place
 */

// Imports
import { DropdownMenu as Menu, HoverCard as Hover, Tooltip as Tip } from 'radix-ui'
import { Dialog, Tabs as TabsPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Shared look of floating surfaces
const POP = 'z-50 rounded-lg border bg-card text-card-foreground shadow-pop'

// Tooltip: wrap a trigger, pass the text as content
export function Tooltip({ content, side = 'top', children }) {
  return (
    <Tip.Provider delayDuration={250}>
      <Tip.Root>
        <Tip.Trigger asChild>{children}</Tip.Trigger>
        <Tip.Portal>
          <Tip.Content side={side} sideOffset={6} className="z-50 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-pop">
            {content}
          </Tip.Content>
        </Tip.Portal>
      </Tip.Root>
    </Tip.Provider>
  )
}

// HoverCard: rich preview on hover
export function HoverCard({ trigger, children, side = 'top', className }) {
  return (
    <Hover.Root openDelay={150} closeDelay={80}>
      <Hover.Trigger asChild>{trigger}</Hover.Trigger>
      <Hover.Portal>
        <Hover.Content side={side} sideOffset={8} className={cn(POP, 'w-80 p-4', className)}>
          {children}
        </Hover.Content>
      </Hover.Portal>
    </Hover.Root>
  )
}

// Sheet: right-side panel with a title, a close button and scrollable content
export function Sheet({ open, onOpenChange, title, description, children, className }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content className={cn('fixed inset-y-0 right-0 z-50 flex w-full max-w-4xl flex-col border-l bg-card shadow-pop', className)}>
          <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-base font-semibold">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-0.5 text-[13px] text-muted-foreground">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// DropdownMenu: trigger plus a list of { label, icon, onSelect, danger } items
export function DropdownMenu({ trigger, items, align = 'end' }) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align={align} sideOffset={4} className={cn(POP, 'min-w-40 p-1')}>
          {items.map(({ label, icon: Icon, onSelect, danger }) => (
            <Menu.Item
              key={label}
              onSelect={onSelect}
              className={cn('flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none data-[highlighted]:bg-accent', danger && 'text-danger')}
            >
              {Icon && <Icon className="size-3.5" />}
              {label}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

// Tabs: the root
export const Tabs = TabsPrimitive.Root

// Tabs: row of triggers
export function TabsList({ className, ...props }) {
  return <TabsPrimitive.List className={cn('inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-1', className)} {...props} />
}

// Tabs: one trigger
export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn('inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card', className)}
      {...props}
    />
  )
}

// Tabs: one panel
export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn('outline-none', className)} {...props} />
}
