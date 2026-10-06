import { useId, useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'

// A star rating: pick 1 to `max` stars (5 by default). A radio group for
// assistive tech, with the arrow keys moving between stars. Pass `labels`
// for a word per star ("Poor" … "Excellent"), shown as you hover or pick.
// Read-only, it shows a stored rating.

const SIZE = { sm: 'size-4', md: 'size-5', lg: 'size-6' } as const
const HIT = { sm: 'size-6', md: 'size-7 pointer-coarse:size-9', lg: 'size-8 pointer-coarse:size-10' } as const

export function Rating({ value = 0, onChange, max = 5, labels, label = 'Rating', id, size = 'md', readOnly, disabled, focusRef, className }: {
  // Stars chosen, 0 for none.
  value?: number
  onChange?: (value: number) => void
  max?: number
  // One word per star, first star first.
  labels?: string[]
  // The accessible name of the group.
  label?: string
  id?: string
  size?: keyof typeof SIZE
  readOnly?: boolean
  disabled?: boolean
  // Gets the first star, for a form to focus the first bad field.
  focusRef?: (el: HTMLButtonElement | null) => void
  className?: string
}) {
  const uid = useId()
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const still = readOnly || disabled
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (still) return
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    let next = value
    if (step) next = Math.min(max, Math.max(1, value + step))
    else if (e.key === 'Home') next = 1
    else if (e.key === 'End') next = max
    else return
    e.preventDefault()
    onChange?.(next)
    ;(e.currentTarget.querySelector(`[data-star="${next}"]`) as HTMLButtonElement | null)?.focus()
  }

  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <div
        id={id}
        role="radiogroup"
        aria-label={label}
        aria-readonly={readOnly || undefined}
        aria-disabled={disabled || undefined}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(0)}
        className="flex items-center"
      >
        {stars.map((n) => {
          const lit = n <= shown
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={labels?.[n - 1] ? `${n}: ${labels[n - 1]}` : `${n} of ${max}`}
              data-star={n}
              ref={n === 1 ? focusRef : undefined}
              tabIndex={(value ? n === value : n === 1) ? 0 : -1}
              disabled={disabled}
              onClick={() => !still && onChange?.(n === value ? 0 : n)}
              onMouseEnter={() => !still && setHover(n)}
              onFocus={() => !still && setHover(0)}
              className={cn(
                'focus-visible:ring-ring/40 inline-flex items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 disabled:opacity-50',
                HIT[size],
                still ? 'cursor-default' : 'hover:bg-accent',
                lit ? 'text-status-progress' : 'text-muted-foreground/50',
              )}
            >
              <HugeiconsIcon icon={StarIcon} strokeWidth={2} className={cn(SIZE[size], lit && '[&_path]:fill-current')} aria-hidden="true" />
            </button>
          )
        })}
      </div>
      {labels && (
        <span id={`${uid}-word`} className="text-muted-foreground min-w-14 text-xs" aria-live="polite">
          {shown ? labels[shown - 1] : ''}
        </span>
      )}
    </div>
  )
}
