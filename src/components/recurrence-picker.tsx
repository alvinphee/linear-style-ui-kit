import { useId } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import { cn } from 'cn'
import { Field, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Picks when something repeats: once, every day, every weekday, on chosen
// days of the week or on a day of the month, at a time of day, in a time
// zone. A scheduled task, a report or a reminder keeps the result. The
// controls change with the frequency: day toggles for weekly, a day select
// for monthly, a date for once. Times step by 15 minutes.
// describeRecurrence says it in words and nextRuns works out when it falls.
// The dates are worked out in the browser's own time and labelled with the
// zone, which is right while the two match and no DST change falls between.

export type RecurrenceKind = 'once' | 'daily' | 'weekdays' | 'weekly' | 'monthly'

export type Recurrence = {
  kind: RecurrenceKind
  // The time of day on a 24-hour clock: "09:00".
  time: string
  // For weekly: the days it runs, 0 for Sunday to 6 for Saturday.
  days?: number[]
  // For monthly: 1 to 31, or LAST_DAY. Past a short month's end it runs on its last day.
  dayOfMonth?: number
  // For once: the date, as "2026-10-05".
  date?: string
  // An IANA time zone: "Asia/Singapore".
  timeZone: string
}

export type TimeZoneOption = { value: string; label: string }

// dayOfMonth for "the last day of the month".
export const LAST_DAY = -1

export const RECURRENCE_KINDS: { value: RecurrenceKind; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Every weekday' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

// The zones offered when the caller passes none. The viewer's own zone is
// added when it is not one of them.
export const TIME_ZONES: TimeZoneOption[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'America/New_York', label: 'New York' },
  { value: 'America/Chicago', label: 'Chicago' },
  { value: 'America/Los_Angeles', label: 'Los Angeles' },
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// The week as the toggles show it, Monday first.
const WEEK = [1, 2, 3, 4, 5, 6, 0]
const WEEKDAYS = [1, 2, 3, 4, 5]

// Every quarter of an hour: "00:00" to "23:45".
export const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) =>
  `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`)

// The browser's own time zone, or UTC when it can't say.
export function localTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

// A zone's short name: its label in `zones`, or the city in its IANA name.
export function timeZoneLabel(timeZone: string, zones: TimeZoneOption[] = TIME_ZONES) {
  return zones.find((z) => z.value === timeZone)?.label ?? (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ')
}

// 1 → "1st", 22 → "22nd", 13 → "13th".
export function ordinal(n: number) {
  const ends = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${ends[(v - 20) % 10] ?? ends[v] ?? ends[0]}`
}

// "Monday", "Monday and Thursday", "Monday, Wednesday and Friday".
function listJoin(words: string[]) {
  return words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

// The days a weekly recurrence runs, Monday first and without repeats.
const weekOrder = (days: number[] = []) => WEEK.filter((d) => days.includes(d))

function parseTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 }
}

function parseDate(date?: string) {
  const [y, m, d] = (date ?? '').split('-').map(Number)
  return y && m && d ? new Date(y, m - 1, d) : null
}

// A recurrence in words: "Every Monday and Thursday at 09:00 (Singapore)".
export function describeRecurrence(r: Recurrence, zones: TimeZoneOption[] = TIME_ZONES) {
  const at = `at ${r.time} (${timeZoneLabel(r.timeZone, zones)})`
  switch (r.kind) {
    case 'once': {
      const d = parseDate(r.date)
      return d ? `Once on ${format(d, 'EEE d MMM yyyy')} ${at}` : `Once ${at}, date not picked`
    }
    case 'daily':
      return `Every day ${at}`
    case 'weekdays':
      return `Every weekday ${at}`
    case 'weekly': {
      const days = weekOrder(r.days)
      if (days.length === 0) return 'Weekly, no days picked'
      if (days.length === 7) return `Every day ${at}`
      if (days.length === 5 && WEEKDAYS.every((d) => days.includes(d))) return `Every weekday ${at}`
      return `Every ${listJoin(days.map((d) => DAY_NAMES[d]))} ${at}`
    }
    case 'monthly': {
      const dom = r.dayOfMonth ?? 1
      if (dom === LAST_DAY) return `Every month on the last day ${at}`
      return `Every month on the ${ordinal(dom)}${dom > 28 ? ' (the last day in shorter months)' : ''} ${at}`
    }
  }
}

// The next `count` times it runs after `from` (ms), soonest first. Once runs
// at most once, and not at all when its time has passed; weekly with no
// days never runs.
export function nextRuns(r: Recurrence, from: number, count: number): number[] {
  const out: number[] = []
  if (count <= 0) return out
  const { h, m } = parseTime(r.time)
  const at = (y: number, month: number, day: number) => new Date(y, month, day, h, m, 0, 0).getTime()
  const start = new Date(from)
  const y = start.getFullYear()
  const month = start.getMonth()

  if (r.kind === 'once') {
    const d = parseDate(r.date)
    const t = d && at(d.getFullYear(), d.getMonth(), d.getDate())
    if (t && t > from) out.push(t)
    return out
  }

  if (r.kind === 'monthly') {
    const dom = r.dayOfMonth ?? 1
    for (let i = 0; out.length < count && i <= count; i++) {
      // Day 0 of the next month is this month's last day.
      const last = new Date(y, month + i + 1, 0).getDate()
      const t = at(y, month + i, dom === LAST_DAY ? last : Math.min(Math.max(1, dom), last))
      if (t > from) out.push(t)
    }
    return out
  }

  const days = r.kind === 'daily' ? WEEK : r.kind === 'weekdays' ? WEEKDAYS : weekOrder(r.days)
  if (days.length === 0) return out
  for (let i = 0; out.length < count && i <= count * 7 + 7; i++) {
    const t = at(y, month, start.getDate() + i)
    if (t > from && days.includes(new Date(t).getDay())) out.push(t)
  }
  return out
}

// How long until a coming run: "in 25 min", "in 3 h", "tomorrow", "in 5 days".
export function formatUntil(time: number, now: number) {
  const ms = time - now
  if (ms < 60_000) return ms < 0 ? 'now' : 'in under a minute'
  const days = differenceInCalendarDays(time, now)
  if (days <= 0) {
    const min = Math.round(ms / 60_000)
    return min < 60 ? `in ${min} min` : `in ${Math.round(min / 60)} h`
  }
  return days === 1 ? 'tomorrow' : `in ${days} days`
}

// When a coming run falls: "Mon 09:00" within the week ahead, then
// "Mon 12 Oct, 09:00", with the year when it is not this year's.
export function formatRunDate(time: number, now: number) {
  const days = differenceInCalendarDays(time, now)
  if (days >= 0 && days < 7) return format(time, 'EEE HH:mm')
  return format(time, new Date(time).getFullYear() === new Date(now).getFullYear() ? 'EEE d MMM, HH:mm' : 'EEE d MMM yyyy, HH:mm')
}

// What a recurrence becomes when its frequency changes: the fields the new
// one needs, filled in from what was there or from `now`.
function withKind(r: Recurrence, kind: RecurrenceKind, now: number): Recurrence {
  const next: Recurrence = { ...r, kind }
  if (kind === 'weekly' && !r.days?.length) next.days = [new Date(now).getDay()]
  if (kind === 'monthly' && r.dayOfMonth === undefined) next.dayOfMonth = new Date(now).getDate()
  if (kind === 'once' && !r.date) next.date = format(now, 'yyyy-MM-dd')
  return next
}

export function RecurrencePicker({ value, onChange, timeZones = TIME_ZONES, now, disabled = false, invalid = false, className }: {
  value: Recurrence
  onChange: (value: Recurrence) => void
  timeZones?: TimeZoneOption[]
  // Today, for the date a new "once" starts on and the earliest date it
  // offers. Defaults to the browser's clock.
  now?: number
  disabled?: boolean
  // Marks the day toggles or the date as wrong (the caller says why).
  invalid?: boolean
  className?: string
}) {
  const id = useId()
  const today = now ?? Date.now()
  const set = (patch: Partial<Recurrence>) => onChange({ ...value, ...patch })

  // A saved value off the lists (an imported "09:05", a zone not offered)
  // still shows as itself.
  const zones = timeZones.some((z) => z.value === value.timeZone)
    ? timeZones
    : [{ value: value.timeZone, label: timeZoneLabel(value.timeZone, timeZones) }, ...timeZones]
  const times = TIME_OPTIONS.includes(value.time) ? TIME_OPTIONS : [...TIME_OPTIONS, value.time].sort()

  return (
    <div className={cn('@container min-w-0', className)}>
      <div className="grid grid-cols-1 gap-3 @xs:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${id}-kind`}>Repeats</FieldLabel>
          <Select value={value.kind} onValueChange={(v) => onChange(withKind(value, v as RecurrenceKind, today))} disabled={disabled}>
            <SelectTrigger id={`${id}-kind`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RECURRENCE_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        {value.kind === 'once' && (
          <Field data-invalid={invalid || undefined}>
            <FieldLabel htmlFor={`${id}-date`}>Date</FieldLabel>
            <Input
              id={`${id}-date`}
              type="date"
              value={value.date ?? ''}
              min={format(today, 'yyyy-MM-dd')}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              onChange={(e) => set({ date: e.target.value || undefined })}
            />
          </Field>
        )}

        {value.kind === 'monthly' && (
          <Field>
            <FieldLabel htmlFor={`${id}-dom`}>Day of the month</FieldLabel>
            <Select value={String(value.dayOfMonth ?? 1)} onValueChange={(v) => set({ dayOfMonth: Number(v) })} disabled={disabled}>
              <SelectTrigger id={`${id}-dom`} className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>{ordinal(d)}</SelectItem>
                ))}
                <SelectItem value={String(LAST_DAY)}>Last day</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}

        {value.kind === 'weekly' && (
          <Field data-invalid={invalid || undefined} className="@xs:col-span-2">
            <FieldTitle id={`${id}-days`}>On</FieldTitle>
            <ToggleGroup
              type="multiple"
              variant="outline"
              spacing={1}
              value={(value.days ?? []).map(String)}
              onValueChange={(v) => set({ days: v.map(Number) })}
              disabled={disabled}
              aria-labelledby={`${id}-days`}
              aria-invalid={invalid || undefined}
              className="w-full flex-wrap"
            >
              {WEEK.map((d) => (
                <ToggleGroupItem
                  key={d}
                  value={String(d)}
                  aria-label={DAY_NAMES[d]}
                  className="data-[state=on]:border-brand/50 data-[state=on]:bg-brand/10 data-[state=on]:text-brand min-w-10 flex-1 font-normal"
                >
                  {DAY_NAMES[d].slice(0, 3)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor={`${id}-time`}>Time</FieldLabel>
          <Select value={value.time} onValueChange={(time) => set({ time })} disabled={disabled}>
            <SelectTrigger id={`${id}-time`} className="w-full tabular-nums"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-64">
              {times.map((t) => <SelectItem key={t} value={t} className="tabular-nums">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${id}-zone`}>Time zone</FieldLabel>
          <Select value={value.timeZone} onValueChange={(timeZone) => set({ timeZone })} disabled={disabled}>
            <SelectTrigger id={`${id}-zone`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {zones.map((z) => <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  )
}
