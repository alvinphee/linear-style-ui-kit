import type { ReactNode } from 'react'
import { cn } from 'cn'

// The global header: the top row for what belongs to the whole app, not the
// page. Put the page's breadcrumb on a row of its own under it (a breadcrumb
// bar). Three slots:
//   start   the sidebar buttons, and the workspace or module when no sidebar
//           shows it
//   center  search, kept in the middle of the row
//   end     the assistant, notifications, theme and the account
// The start and end slots share the room either side of search equally, so
// search stays centred without breakpoints and the row works the same in a
// window or a narrow frame. Below the width where search fits, hide it with
// `centerClassName` (`hidden md:flex`) and put a search icon in `end`.
// `children` lie over the whole row, such as a phone's open search box.

export function GlobalHeader({ start, center, end, centerClassName, className, children }: {
  start?: ReactNode
  center?: ReactNode
  end?: ReactNode
  // On the search slot: when to show it (`hidden md:flex`) and its width (w-96 by default).
  centerClassName?: string
  // On the row: its colour, border and height, such as `bg-background border-b`.
  className?: string
  children?: ReactNode
}) {
  return (
    <header className={cn('relative flex h-12 shrink-0 items-center gap-2 px-2', className)}>
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-1">{start}</div>
      {center && <div className={cn('flex w-96 min-w-40 shrink items-center', centerClassName)}>{center}</div>}
      <div className="flex flex-1 basis-0 items-center justify-end gap-1">{end}</div>
      {children}
    </header>
  )
}
