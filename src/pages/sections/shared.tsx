import { createContext, useContext, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { goTo } from '../nav'

// The playgrounds and variant grids for the page being shown, if it has any.
export const PageDemos = createContext<ReactNode>(null)

// True on the "All components" page, where every section is shown at once.
export const InOverview = createContext(false)

// One Section is one page: its title, the page's demos, then the examples.
export function Section({ id, title, description, children }: {
  id: string
  title: string
  description: string
  children: ReactNode
}) {
  const demos = useContext(PageDemos)
  if (useContext(InOverview)) {
    return (
      <section id={id} aria-labelledby={`${id}-title`}>
        <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id={`${id}-title`} className="text-sm font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-xs">{description}</p>
          <button
            type="button"
            onClick={() => goTo(id)}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 ml-auto flex items-center gap-1 rounded text-xs outline-none focus-visible:ring-2"
          >
            Playground and variants <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3" />
          </button>
        </header>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div>
      </section>
    )
  }
  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <header className="mb-6 grid gap-1">
        <h1 id={`${id}-title`} className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>
      {demos && (
        <>
          <div className="mb-10">{demos}</div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Examples</h2>
        </>
      )}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div>
    </section>
  )
}

export function Panel({ title, note, children, className, wide }: {
  title: string
  note?: string
  children: ReactNode
  className?: string
  wide?: boolean
}) {
  return (
    <article className={cn('bg-card rounded-lg border', wide && 'lg:col-span-2', className)}>
      <header className="flex items-baseline justify-between gap-3 border-b px-3.5 py-2.5">
        <h3 className="text-xs font-medium">{title}</h3>
        {note && <span className="text-muted-foreground truncate text-[11px]">{note}</span>}
      </header>
      <div className="p-3.5">{children}</div>
    </article>
  )
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
}
