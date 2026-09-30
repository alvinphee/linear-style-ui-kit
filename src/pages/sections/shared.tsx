import type { ReactNode } from 'react'
import { cn } from 'cn'

export function Section({ id, title, description, children }: {
  id: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-16">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
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
