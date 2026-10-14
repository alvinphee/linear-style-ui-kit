import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'

// A settings page as the big chat apps and SaaS tools lay one out: sections
// down the left, the open one on the right. It measures its own box
// (@container), not the window, so it works full page and inside a card.
// Narrower than 48rem it becomes a list of sections that drills into one,
// with a back arrow, as settings do on a phone.
//
// Each section is made of a SettingsHeader, then SettingsGroups (a titled
// card) of SettingsRows (a label and hint, with the control on the right).

export type SettingsNavItem = { id: string; label: string; icon: IconSvgElement; badge?: ReactNode }
export type SettingsNavGroup = { label?: string; items: SettingsNavItem[] }

export function SettingsPage({ title = 'Settings', nav, active, onSelect, renderSection, start, backLabel, className }: {
  title?: string
  // The narrow screen's way back to the list. "All settings" when left out.
  backLabel?: string
  nav: SettingsNavGroup[]
  // The open section. null: the list of sections on a narrow screen, the
  // first section on a wide one.
  active: string | null
  // null goes back to the list (narrow screens only).
  onSelect: (id: string | null) => void
  renderSection: (id: string) => ReactNode
  // Before the title, such as a link back to the app.
  start?: ReactNode
  className?: string
}) {
  const items = nav.flatMap((g) => g.items)
  const shown = items.find((i) => i.id === active) ?? items[0]

  return (
    <div className={cn('@container flex h-full min-h-0 min-w-0 flex-col', className)}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        {start}
        <h1 className="truncate text-sm font-medium">{title}</h1>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label={`${title} sections`}
          className={cn(
            'min-h-0 w-full shrink-0 flex-col gap-3 overflow-y-auto p-2 @3xl:flex @3xl:w-52 @3xl:border-r',
            active ? 'hidden' : 'flex',
          )}
        >
          {nav.map((group, i) => (
            <div key={group.label ?? i} role={group.label ? 'group' : undefined} aria-label={group.label} className="grid gap-px">
              {group.label && (
                <p className="text-muted-foreground px-2 pb-1 text-[10px] font-medium tracking-wide uppercase">{group.label}</p>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={item.id === shown?.id && active ? 'page' : undefined}
                  data-shown={item.id === shown?.id || undefined}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    'text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-ring/40 flex h-9 items-center gap-2.5 rounded-md px-2 text-left text-[13px] outline-none focus-visible:ring-2 @3xl:h-7 @3xl:text-xs',
                    '@3xl:data-shown:bg-accent @3xl:data-shown:text-foreground',
                  )}
                >
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4 shrink-0 @3xl:size-3.5" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge}
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5 shrink-0 opacity-60 @3xl:hidden" />
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className={cn('min-h-0 min-w-0 flex-1 flex-col overflow-y-auto @3xl:flex', active ? 'flex' : 'hidden')}>
          <div className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-5 @3xl:px-8 @3xl:py-8">
            <Button variant="ghost" size="sm" className="-ml-2 w-fit @3xl:hidden" onClick={() => onSelect(null)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" /> {backLabel ?? `All ${title.toLowerCase()}`}
            </Button>
            {shown && renderSection(shown.id)}
          </div>
        </div>
      </div>
    </div>
  )
}

// The top of a section: its title, a line on what it covers, and an action.
export function SettingsHeader({ title, description, action }: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="grid min-w-0 gap-1">
        <h2 className="text-base font-medium">{title}</h2>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// A titled card of rows. Without a title it is just the card.
export function SettingsGroup({ title, description, action, children, className }: {
  title?: string
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className="grid min-w-0 gap-2">
      {(title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="grid min-w-0 gap-0.5">
            {title && <h3 className="text-xs font-medium">{title}</h3>}
            {description && <p className="text-muted-foreground text-[11px] leading-4">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('bg-card min-w-0 divide-y rounded-lg border', className)}>{children}</div>
    </section>
  )
}

// One setting: the label and hint on the left and the control on the right,
// wrapping under them when narrow. `stacked` puts the control below.
export function SettingsRow({ label, hint, htmlFor, stacked, children, className }: {
  label: ReactNode
  hint?: ReactNode
  htmlFor?: string
  stacked?: boolean
  children?: ReactNode
  className?: string
}) {
  return (
    <Field
      orientation={stacked ? 'vertical' : 'horizontal'}
      className={cn(
        'gap-x-4 gap-y-2 px-3 py-2.5',
        !stacked && 'flex-wrap justify-between has-[>[data-slot=field-content]]:items-center',
        className,
      )}
    >
      <FieldContent className="min-w-0 flex-initial">
        <FieldLabel htmlFor={htmlFor} className="font-normal">{label}</FieldLabel>
        {hint && <FieldDescription className="text-[11px] leading-4">{hint}</FieldDescription>}
      </FieldContent>
      {children}
    </Field>
  )
}
