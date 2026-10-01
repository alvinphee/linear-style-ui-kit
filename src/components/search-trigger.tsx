import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Shortcut } from './shortcut'

// A button that looks like a search field and opens the command palette.
// It holds no text itself; typing happens in the palette.
//   sm: in a sidebar      md: in a header      lg: the hero search on a home page

const SIZE = {
  sm: 'h-7 gap-2 rounded-md px-2 text-xs [&_svg]:size-3.5',
  md: 'h-8 gap-2 rounded-md px-2.5 text-xs [&_svg]:size-3.5',
  lg: 'h-10 gap-2.5 rounded-lg px-3 text-sm [&_svg]:size-4',
} as const

export function SearchTrigger({ label = 'Search…', onClick, shortcut = ['mod', 'K'], size = 'sm', className }: {
  label?: string
  onClick: () => void
  // Keys shown at the end; pass [] to hide them.
  shortcut?: string[]
  size?: keyof typeof SIZE
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-ring/40 flex w-full min-w-0 items-center border whitespace-nowrap outline-none focus-visible:ring-2',
        size === 'lg' && 'bg-card hover:bg-card hover:border-foreground/15',
        SIZE[size],
        className,
      )}
    >
      <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="shrink-0" />
      <span className="truncate">{label}</span>
      {shortcut.length > 0 && <Shortcut keys={shortcut} className="ml-auto" />}
    </button>
  )
}
