import { useState, type HTMLAttributes, type MouseEventHandler, type ReactNode, type Ref } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// One row of sidebar navigation: an icon (or a mark), a label and an
// optional count. `active` marks the page you're on. `iconOnly` folds it to
// the icon, with the label in a tooltip, for a collapsed sidebar; `rail`
// draws it as a square icon button for a navigation rail, with a bar beside
// the active one. Give it `href` to make it a link (another app, a new tab)
// instead of a button. `expanded` adds a chevron after the label, for a row
// that folds the pages under it (a team). Other props and the ref go onto
// the button, so it can be a menu's trigger.
// Outside a sidebar (a sheet, a settings page), recolour it with className,
// e.g. "hover:bg-accent data-[active=true]:bg-accent".

export function NavItem({
  icon, mark, label, count, active, iconOnly, rail, expanded, onClick, href, end, title, className, ref, ...props
}: Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick' | 'title' | 'className'> & {
  ref?: Ref<HTMLElement>
  icon?: IconSvgElement
  // Drawn instead of the icon: a LetterMark or IconMark.
  mark?: ReactNode
  label: string
  count?: number
  active?: boolean
  iconOnly?: boolean
  rail?: boolean
  // Open (true) or folded (false); leave it out for a plain row.
  expanded?: boolean
  onClick?: MouseEventHandler<HTMLElement>
  href?: string
  // Shown at the end instead of the count, such as an external-link icon.
  end?: ReactNode
  // A longer description, shown as the native tooltip.
  title?: string
  className?: string
}) {
  const compact = iconOnly || rail
  const Element = href ? 'a' : 'button'
  const button = (
    <Element
      {...(href ? { href } : { type: 'button' as const })}
      data-active={!!active}
      aria-current={active ? 'page' : undefined}
      aria-expanded={expanded}
      aria-label={compact ? label : undefined}
      title={title}
      // After the attributes above, so a menu trigger's aria-expanded wins.
      {...props}
      // The element is a button or a link, so the ref fits either.
      ref={ref as Ref<HTMLAnchorElement & HTMLButtonElement>}
      onClick={onClick}
      className={cn(
        'hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground focus-visible:ring-ring/40 relative rounded-md outline-none focus-visible:ring-2',
        rail
          ? 'text-muted-foreground hover:text-foreground grid size-8 shrink-0 place-items-center'
          : 'flex h-7 w-full min-w-0 items-center gap-2 px-2 text-left text-xs',
        iconOnly && !rail && 'justify-center px-0',
        className,
      )}
    >
      {mark ?? (icon && <HugeiconsIcon icon={icon} strokeWidth={2} className={rail ? 'size-4' : 'size-3.5 shrink-0 opacity-80'} />)}
      {!compact && <span className="truncate">{label}</span>}
      {!compact && expanded !== undefined && (
        <HugeiconsIcon icon={expanded ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" />
      )}
      {!compact && !!count && <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">{count}</span>}
      {!compact && end && <span className="ml-auto flex shrink-0 items-center">{end}</span>}
      {compact && !!count && <span className={cn('bg-primary absolute top-1 size-1.5 rounded-full', rail ? 'right-1' : 'right-1.5')} />}
      {rail && active && <span className="bg-primary absolute top-1.5 -left-2 h-5 w-0.5 rounded-full" />}
    </Element>
  )
  if (!compact) return button
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

// A group of nav items under a heading that folds it: click the heading (its
// chevron shows open or folded) to hide or show the items. A grey count of
// the items, or an action such as an add button, can sit at the end.
// Uncontrolled by default (open at first); pass `open` and `onOpenChange` to
// keep the state yourself, such as to open the group holding the current
// page. `foldable={false}` keeps it open, with a plain heading that lines up.
export function NavGroup({ title, count, action, open, defaultOpen = true, onOpenChange, foldable = true, children, className }: {
  title: string
  count?: number
  // A small button at the end of the heading, outside the fold button.
  action?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  foldable?: boolean
  children: ReactNode
  className?: string
}) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen)
  const isOpen = !foldable || (open ?? ownOpen)
  const heading = 'text-muted-foreground flex h-6 min-w-0 flex-1 items-center gap-1 rounded px-2 text-[11px] font-medium'

  function toggle() {
    setOwnOpen(!isOpen)
    onOpenChange?.(!isOpen)
  }

  return (
    <div className={cn('mt-3', className)}>
      <div className="flex items-center">
        {foldable ? (
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={toggle}
            className={cn(heading, 'hover:text-foreground focus-visible:ring-ring/40 outline-none focus-visible:ring-2')}
          >
            <span className="truncate">{title}</span>
            <HugeiconsIcon icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="size-3 shrink-0" />
            {count !== undefined && <span className="ml-auto tabular-nums opacity-60">{count}</span>}
          </button>
        ) : (
          <span className={heading}>
            <span className="truncate">{title}</span>
            {count !== undefined && <span className="ml-auto tabular-nums opacity-60">{count}</span>}
          </span>
        )}
        {action}
      </div>
      {isOpen && <div className="mt-0.5 grid gap-px">{children}</div>}
    </div>
  )
}
