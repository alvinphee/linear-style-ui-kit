import { useId, type ReactNode } from 'react'
import { cn } from 'cn'

// A boxed area with a title bar: the kit's card for grouping one thing on a
// page (a chart, a list, a form section). The bar holds the title, an
// optional description under it, and a short note or an action on the
// right. Leave out the title for a plain box. As a section, it's named by
// its title for screen readers.

export function Panel({ title, description, note, action, children, className, bodyClassName, as: Element = 'article', headingAs: Heading = 'h3' }: {
  title?: ReactNode
  description?: ReactNode
  // A short grey note at the right of the title bar.
  note?: ReactNode
  // A button or link at the right of the title bar (shown instead of the note).
  action?: ReactNode
  children: ReactNode
  className?: string
  // "p-0" for edge-to-edge content such as a table.
  bodyClassName?: string
  as?: 'article' | 'section' | 'div'
  headingAs?: 'h2' | 'h3' | 'h4'
}) {
  const id = useId()
  const end = action ?? (note && <span className="text-muted-foreground truncate text-[11px]">{note}</span>)
  return (
    <Element aria-labelledby={title && Element !== 'div' ? id : undefined} className={cn('bg-card min-w-0 rounded-lg border', className)}>
      {title && (
        <header
          className={cn(
            'flex justify-between gap-3 border-b px-3.5 py-2.5',
            description ? 'flex-wrap items-start gap-y-2' : 'items-baseline',
          )}
        >
          {description ? (
            <div className="grid min-w-0 gap-0.5">
              <Heading id={id} className="text-xs font-medium">{title}</Heading>
              <p className="text-muted-foreground text-[11px]">{description}</p>
            </div>
          ) : (
            <Heading id={id} className="text-xs font-medium">{title}</Heading>
          )}
          {end && (description ? <div className="flex shrink-0 flex-wrap items-center gap-1.5">{end}</div> : end)}
        </header>
      )}
      <div className={cn('p-3.5', bodyClassName)}>{children}</div>
    </Element>
  )
}
