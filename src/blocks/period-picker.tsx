import { useCallback, useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { differenceInCalendarDays, format, isSameDay, startOfMonth } from 'date-fns'
import { getDefaultClassNames, type DateRange } from 'react-day-picker'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Picks the period a dashboard reports on.
//
// PeriodPicker: preset periods as a segmented switch, an optional "Custom"
// button that opens the range calendar, and an optional "Compare to previous
// period" switch. Drop it into a page header's actions.
//
// PeriodBar: the same controls in a bar that names the period and its dates
// on the left, with room for actions (Export…) on the right. Put it above a
// row of KPI cards.
//
// DateRangePicker: a button that opens a two-month range calendar (one month
// on a phone), with optional preset buttons under it.

export type { DateRange }

export type Period<T extends string = string> = {
  value: T
  // The full name, such as "Last 7 days". Shown on the switch unless `short` is given.
  label: string
  // A short form for the switch, such as "7d". `label` becomes its accessible name.
  short?: string
}

export type DateRangePreset = {
  label: string
  // Leave it out for a button that clears the range.
  range?: DateRange
}

function useMediaQuery(query: string) {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

function rangeLabel(range: DateRange | undefined, placeholder = 'Pick a date range') {
  if (!range?.from) return placeholder
  if (!range.to) return format(range.from, 'd MMM yyyy')
  return `${format(range.from, 'd MMM')} – ${format(range.to, 'd MMM yyyy')}`
}

// Both ends count, so a range from the 1st to the 7th is 7 days.
const rangeDays = (range: DateRange | undefined) =>
  range?.from && range.to ? differenceInCalendarDays(range.to, range.from) + 1 : 0

export function DateRangePicker({ value, onChange, presets, defaultMonth, id, label, placeholder, size, align = 'start', className }: {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  presets?: DateRangePreset[]
  // The first month shown. Defaults to the month the range starts in.
  defaultMonth?: Date
  id?: string
  // Replaces the dates on the button.
  label?: ReactNode
  placeholder?: string
  size?: 'default' | 'sm'
  align?: 'start' | 'center' | 'end'
  // For the button, such as its width.
  className?: string
}) {
  const [month, setMonth] = useState(() => startOfMonth(defaultMonth ?? value?.from ?? new Date()))
  const twoMonths = useMediaQuery('(min-width: 640px)')
  const days = rangeDays(value)

  function applyPreset(next?: DateRange) {
    onChange(next)
    if (next?.from) setMonth(startOfMonth(next.from))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          size={size}
          className={cn('justify-start font-normal', !value?.from && 'text-muted-foreground', className)}
        >
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} data-icon="inline-start" className="text-muted-foreground" />
          <span className="truncate">{label ?? rangeLabel(value, placeholder)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto gap-0 p-0" align={align}>
        <Calendar
          mode="range"
          numberOfMonths={twoMonths ? 2 : 1}
          month={month}
          onMonthChange={setMonth}
          selected={value}
          onSelect={onChange}
          classNames={{ months: cn('relative flex flex-col gap-4 sm:flex-row', getDefaultClassNames().months) }}
        />
        {!!presets?.length && (
          <div className="flex flex-wrap items-center gap-1 border-t p-2">
            {presets.map((p) => {
              const active = p.range?.from && p.range.to && value?.from && value.to
                && isSameDay(p.range.from, value.from) && isSameDay(p.range.to, value.to)
              return (
                <Button key={p.label} variant={active ? 'secondary' : 'ghost'} size="sm" onClick={() => applyPreset(p.range)}>
                  {p.label}
                </Button>
              )
            })}
            {days > 0 && <span className="text-muted-foreground ml-auto px-1 text-[11px] tabular-nums">{days} days</span>}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export type PeriodPickerProps<T extends string> = {
  periods: Period<T>[]
  // Null while a custom range is in use.
  value: T | null
  onChange: (value: T) => void
  // Shows the "Compare to previous period" switch.
  compare?: boolean
  onCompareChange?: (compare: boolean) => void
  compareLabel?: string
  // Adds a "Custom" button with the range calendar. Set `value` to null once
  // the range has both ends, and the button shows its dates.
  custom?: {
    range: DateRange | undefined
    onChange: (range: DateRange | undefined) => void
    presets?: DateRangePreset[]
  }
  // sm is 24px tall, to sit beside size="sm" buttons.
  size?: 'default' | 'sm'
  'aria-label'?: string
}

// A fragment, so PeriodBar can wrap each control on its own like its other children.
function PeriodControls<T extends string>({
  periods, value, onChange, compare = false, onCompareChange, compareLabel = 'Compare to previous period', custom, size,
  'aria-label': ariaLabel = 'Date range',
}: PeriodPickerProps<T>) {
  const compareId = useId()
  const preset = periods.some((p) => p.value === value)

  return (
    <>
      <ToggleGroup
        type="single"
        variant="outline"
        size={size}
        spacing={0}
        value={preset && value ? value : ''}
        onValueChange={(v) => v && onChange(v as T)}
        aria-label={ariaLabel}
      >
        {periods.map((p) => (
          <ToggleGroupItem
            key={p.value}
            value={p.value}
            aria-label={p.short ? p.label : undefined}
            className={cn('tabular-nums', size === 'sm' && 'text-xs')}
          >
            {p.short ?? p.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {custom && (
        <DateRangePicker
          value={custom.range}
          onChange={custom.onChange}
          presets={custom.presets}
          size={size}
          align="end"
          placeholder="Custom"
          label={preset ? 'Custom' : undefined}
          className={cn('max-w-56', preset && 'text-muted-foreground')}
        />
      )}
      {onCompareChange && (
        <div className="flex items-center gap-2">
          <Switch id={compareId} checked={compare} onCheckedChange={onCompareChange} />
          <Label htmlFor={compareId} className="font-normal">{compareLabel}</Label>
        </div>
      )}
    </>
  )
}

export function PeriodPicker<T extends string>({ className, ...props }: PeriodPickerProps<T> & { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <PeriodControls {...props} />
    </div>
  )
}

export function PeriodBar<T extends string>({ title, description, actions, className, ...props }: PeriodPickerProps<T> & {
  // Defaults to the chosen period's label.
  title?: ReactNode
  // Such as the dates the period covers.
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  const chosen = props.periods.find((p) => p.value === props.value)
  return (
    <div className={cn('bg-card flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2', className)}>
      <div className="mr-auto grid min-w-0 gap-0.5">
        <span className="text-xs font-medium">{title ?? chosen?.label ?? 'Custom range'}</span>
        {description && <span className="text-muted-foreground text-[11px] tabular-nums">{description}</span>}
      </div>
      <PeriodControls {...props} />
      {actions}
    </div>
  )
}
