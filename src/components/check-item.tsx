import { useId, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Cancel01Icon, MinusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import type { Tone } from '@/components/status-badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// One line of a checklist: a statement, answered with one of a few outcomes.
// Pass / Fail / N/A by default; Yes / No, or any options of your own. The
// outcome buttons are a toggle group, each tinted by its tone once chosen,
// and grow to 40px on a touch screen. Anything passed as children (a note
// box, a photo) shows under the statement, for the form to reveal on a fail.
// Knows nothing about what is being checked: the statement comes in as text.

export type CheckResult = 'pass' | 'fail' | 'na'
export type CheckTone = Extract<Tone, 'success' | 'danger' | 'neutral' | 'warning'>
export type CheckOption<T extends string = string> = { value: T; label: string; tone: CheckTone; icon?: IconSvgElement }

export const CHECK_OPTIONS: CheckOption<CheckResult>[] = [
  { value: 'pass', label: 'Pass', tone: 'success', icon: Tick02Icon },
  { value: 'fail', label: 'Fail', tone: 'danger', icon: Cancel01Icon },
  { value: 'na', label: 'N/A', tone: 'neutral', icon: MinusSignIcon },
]

export const YES_NO_OPTIONS: CheckOption<'yes' | 'no'>[] = [
  { value: 'yes', label: 'Yes', tone: 'success', icon: Tick02Icon },
  { value: 'no', label: 'No', tone: 'danger', icon: Cancel01Icon },
]

// The chosen button's colours, by tone.
const ON: Record<CheckTone, string> = {
  success: 'data-[state=on]:border-status-done/40 data-[state=on]:bg-[color-mix(in_oklch,var(--status-done),transparent_85%)] data-[state=on]:text-status-done',
  danger: 'data-[state=on]:border-destructive/40 data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive',
  warning: 'data-[state=on]:border-status-progress/40 data-[state=on]:bg-[color-mix(in_oklch,var(--status-progress),transparent_85%)] data-[state=on]:text-status-progress',
  neutral: 'data-[state=on]:bg-muted data-[state=on]:text-foreground',
}

export function CheckItem<T extends string = CheckResult>({
  id, label, description, options = CHECK_OPTIONS as unknown as CheckOption<T>[], value, onChange, required, disabled, readOnly,
  error, focusRef, children, className,
}: {
  id?: string
  // The statement being checked: "Horn works".
  label: ReactNode
  description?: ReactNode
  // The outcomes to choose from. CHECK_OPTIONS (Pass / Fail / N/A) by default; YES_NO_OPTIONS for a question.
  options?: CheckOption<T>[]
  // The chosen outcome, or '' for none yet.
  value: T | ''
  // Choosing the chosen outcome again clears it.
  onChange?: (value: T | '') => void
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  error?: ReactNode
  // Gets the first outcome button, for a form to focus the first bad field.
  focusRef?: (el: HTMLButtonElement | null) => void
  // Shown under the statement: a note box and a photo on a fail.
  children?: ReactNode
  className?: string
}) {
  const uid = useId()
  const labelId = `${id ?? uid}-label`
  const errorId = `${id ?? uid}-error`
  return (
    <div className={cn('grid min-w-0 gap-2', className)} data-result={value || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
          <span id={labelId} className="text-xs font-medium">
            {label}
            {required && <span aria-hidden="true" className="text-muted-foreground"> *</span>}
          </span>
          {description && <span className="text-muted-foreground text-[11px]">{description}</span>}
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="lg"
          spacing={1}
          value={value}
          onValueChange={(v) => {
            if (!readOnly) onChange?.(v as T | '')
          }}
          aria-labelledby={labelId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          aria-readonly={readOnly || undefined}
          disabled={disabled}
          className="shrink-0"
        >
          {options.map((o, i) => (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              ref={i === 0 ? focusRef : undefined}
              className={cn('min-w-16 pointer-coarse:h-10 pointer-coarse:min-w-20', ON[o.tone], readOnly && 'pointer-events-none')}
            >
              {o.icon && <HugeiconsIcon icon={o.icon} strokeWidth={2} data-icon="inline-start" />}
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {error && <p id={errorId} role="alert" className="text-destructive text-[11px]">{error}</p>}
      {children && <div className="grid min-w-0 gap-2">{children}</div>}
    </div>
  )
}

// The option behind a stored outcome, for showing a past answer.
export const checkOption = <T extends string>(options: CheckOption<T>[], value: string) => options.find((o) => o.value === value)
