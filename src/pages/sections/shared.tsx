import { Children, createContext, useContext, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { PageHeader } from '@/components/page-header'
import { Panel as KitPanel } from '@/components/panel'
import { goTo } from '../nav'

// The playgrounds and variant grids for the page being shown, if it has any.
export const PageDemos = createContext<ReactNode>(null)

// True on the "All components" page, where every section is shown at once.
export const InOverview = createContext(false)

// One Section is one page: its title, the page's demos, then the examples.
// A page can have demos only (no children).
export function Section({ id, title, description, children }: {
  id: string
  title: string
  description: string
  children?: ReactNode
}) {
  const demos = useContext(PageDemos)
  const hasExamples = Children.toArray(children).length > 0
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
        {hasExamples ? <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div> : demos}
      </section>
    )
  }
  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <PageHeader id={`${id}-title`} title={title} description={description} size="lg" className="mb-6" />
      {demos && <div className={hasExamples ? 'mb-10' : undefined}>{demos}</div>}
      {hasExamples && (
        <>
          {demos && <h2 className="mb-3 text-sm font-semibold tracking-tight">Examples</h2>}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div>
        </>
      )}
    </section>
  )
}

// The kit's Panel component, spanning both columns of a section when wide.
export function Panel({ title, note, children, className, wide }: {
  title: string
  note?: string
  children: ReactNode
  className?: string
  wide?: boolean
}) {
  return <KitPanel title={title} note={note} className={cn(wide && 'lg:col-span-2', className)}>{children}</KitPanel>
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
}
