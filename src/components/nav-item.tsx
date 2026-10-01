import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from 'cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// One row of sidebar navigation: an icon (or a mark), a label and an
// optional count. `active` marks the page you're on. `iconOnly` folds it to
// the icon, with the label in a tooltip, for a collapsed sidebar. Give it
// `href` to make it a link (another app, a new tab) instead of a button.

export function NavItem({ icon, mark, label, count, active, iconOnly, onClick, href, end, title, className }: {
  icon?: IconSvgElement
  // Drawn instead of the icon: a LetterMark or IconMark.
  mark?: ReactNode
  label: string
  count?: number
  active?: boolean
  iconOnly?: boolean
  onClick?: () => void
  href?: string
  // Shown at the end instead of the count, such as an external-link icon.
  end?: ReactNode
  // A longer description, shown as the native tooltip.
  title?: string
  className?: string
}) {
  const Element = href ? 'a' : 'button'
  const button = (
    <Element
      {...(href ? { href } : { type: 'button' as const })}
      onClick={onClick}
      data-active={!!active}
      aria-current={active ? 'page' : undefined}
      aria-label={iconOnly ? label : undefined}
      title={title}
      className={cn(
        'hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground focus-visible:ring-ring/40 relative flex h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2',
        iconOnly && 'justify-center px-0',
        className,
      )}
    >
      {mark ?? (icon && <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 shrink-0 opacity-80" />)}
      {!iconOnly && <span className="truncate">{label}</span>}
      {!iconOnly && !!count && <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">{count}</span>}
      {!iconOnly && end && <span className="ml-auto flex shrink-0 items-center">{end}</span>}
      {iconOnly && !!count && <span className="bg-primary absolute top-1 right-1.5 size-1.5 rounded-full" />}
    </Element>
  )
  if (!iconOnly) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}{count ? ` · ${count}` : ''}</TooltipContent>
    </Tooltip>
  )
}

// A small heading over a group of nav items, such as "Receivables".
export function NavHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-muted-foreground mt-4 mb-0.5 truncate px-2 text-[11px] font-medium', className)}>{children}</h3>
}
