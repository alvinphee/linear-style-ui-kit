import type { ReactNode } from 'react'
import { cn } from 'cn'

// The title row at the top of a page or a section: the title, a line of
// context, actions on the right, and anything under it (tabs, a toolbar).
// It sets no outer padding; the page around it does.
//   lg: a kit page           md: an app page           sm: a section inside a page

const TITLE = {
  lg: 'text-xl font-semibold tracking-tight',
  md: 'text-lg font-semibold tracking-tight',
  sm: 'text-sm font-semibold tracking-tight',
} as const

// Gaps match where each size came from: the kit page, the ERP page header,
// and the kit's settings sections.
const ROW_GAP = { lg: 'gap-x-4 gap-y-2', md: 'gap-x-4 gap-y-2', sm: 'gap-3' } as const
const TEXT_GAP = { lg: 'gap-1', md: 'gap-0.5', sm: 'gap-0' } as const

const DESCRIPTION = {
  lg: 'text-muted-foreground text-sm',
  md: 'text-muted-foreground text-xs',
  sm: 'text-muted-foreground text-xs',
} as const

export function PageHeader({ title, description, actions, children, size = 'md', as: Heading = 'h1', id, className }: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  size?: keyof typeof TITLE
  as?: 'h1' | 'h2' | 'h3'
  id?: string
  className?: string
}) {
  return (
    <header className={cn('grid gap-3', className)}>
      <div className={cn('flex flex-wrap items-start justify-between', ROW_GAP[size])}>
        <div className={cn('grid min-w-0', TEXT_GAP[size])}>
          <Heading id={id} className={TITLE[size]}>{title}</Heading>
          {description && <p className={DESCRIPTION[size]}>{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
