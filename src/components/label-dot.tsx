import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'

// A label's colour as a small dot, before its name in chips, menus and rows.
export function LabelDot({ colour, className }: { colour: string; className?: string }) {
  return <span aria-hidden className={cn('size-2 shrink-0 rounded-full', className)} style={{ backgroundColor: colour }} />
}

const CHIP_SIZE = {
  sm: 'h-5 gap-1 px-1.5',
  md: 'h-6 gap-1.5 px-2',
} as const

const CHIP_VARIANT = {
  outline: 'text-muted-foreground rounded-full border',
  soft: 'bg-muted rounded-sm',
} as const

// A label as a pill: its dot and name, on cards, rows and side panels. Give it
// `onRemove` for an × that takes the label off (a labels field, a filter).
//   sm: on cards and in rows      md: beside 24px property pills
//   outline: a bordered pill      soft: a filled tag, inside an input
export function LabelChip({ name, colour, size = 'sm', variant = 'outline', onRemove, className }: {
  name: string
  colour: string
  size?: keyof typeof CHIP_SIZE
  variant?: keyof typeof CHIP_VARIANT
  onRemove?: () => void
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full min-w-0 shrink-0 items-center text-[11px] whitespace-nowrap',
        CHIP_SIZE[size],
        CHIP_VARIANT[variant],
        onRemove && 'pr-0.5',
        className,
      )}
    >
      <LabelDot colour={colour} className="size-1.5" />
      <span className="truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          className={cn(
            'text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/30 grid size-4 shrink-0 place-items-center outline-none focus-visible:ring-2',
            variant === 'outline' ? 'rounded-full' : 'rounded-xs',
          )}
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-2.5" />
        </button>
      )}
    </span>
  )
}
