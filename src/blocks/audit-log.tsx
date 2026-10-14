import { useId, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowRight01Icon, Cancel01Icon, Download01Icon } from '@hugeicons/core-free-icons'
import { endOfDay, format, startOfDay, subDays } from 'date-fns'
import { toast } from 'sonner'
import { cn } from 'cn'
import { FacetFilter, downloadCsv } from '@/blocks/data-table'
import { DateRangePicker, type DateRange, type DateRangePreset } from '@/blocks/period-picker'
import { UserAvatar } from '@/components/person'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatDateRange, formatShortDate, formatTime, relativeDay } from '@/lib/format'
import { plural } from '@/lib/text'

// An audit log: who did what, and when, as security and compliance teams
// read one. Events are grouped by day under sticky headings; each row opens
// to show the event's id, IP address and exact time, then what changed as a
// before / after diff (or, for a sign-in, the session's details). Search,
// the Actor facet, a date range and the action chips filter it, and Export
// CSV saves the events that pass the filters.
//
// The app brings its own events, its own kinds of action (each with a label,
// a verb, an icon and a colour) and its own list of actors.

export type AuditChange = { field: string; before?: string; after?: string }

// One kind of action: its filter chip and how a row reads.
export type AuditActionDef = {
  label: string
  // The default verb in a row: "Priya Shah <verb> project Atlas".
  verb: string
  icon: IconSvgElement
  // A text colour token for the icon, such as text-status-done.
  className?: string
  // Show the changes as a plain list under this title instead of a diff,
  // for events that change nothing (a sign-in's "Session").
  detailsTitle?: string
}

export type AuditEvent<A extends string = string> = {
  id: string
  actor: string
  action: A
  // Overrides the action's verb for this event ("changed the role of").
  verb?: string
  // What kind of thing the target is ("project", "API key"); empty when the verb says it.
  kind: string
  target: string
  ip: string
  at: Date
  changes: AuditChange[]
}

export type AuditLogProps<A extends string> = {
  // Newest first.
  events: AuditEvent<A>[]
  // Every kind of action, in the order the chips show them.
  actions: Record<A, AuditActionDef>
  // The people in the Actor filter. Defaults to everyone in the events.
  actors?: string[]
  // "Now" for Today / Yesterday and the date presets; later days can't be picked.
  now?: Date
  // The date range's shortcuts. Defaults to Today, Last 3 days, Last 7 days.
  presets?: DateRangePreset[]
  // The file name before the date: "audit-log" saves audit-log-2026-10-01.csv.
  csvFilename?: string
  searchPlaceholder?: string
  className?: string
  // The scrolling list's height, such as max-h-[30rem] (the default).
  listClassName?: string
}

function countBy<T, K>(list: T[], key: (item: T) => K) {
  const counts = new Map<K, number>()
  for (const item of list) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1)
  return counts
}

function inRange(event: AuditEvent, range: DateRange | undefined) {
  if (!range?.from) return true
  return event.at >= startOfDay(range.from) && event.at <= endOfDay(range.to ?? range.from)
}

// One change as a CSV cell: "Role: Member → Admin", "Scopes: read (removed)".
function describeChange({ field, before, after }: AuditChange) {
  if (before !== undefined && after !== undefined) return `${field}: ${before} → ${after}`
  if (after !== undefined) return `${field}: ${after}`
  return `${field}: ${before ?? ''} (removed)`
}

export function AuditLog<A extends string>({
  events, actions, actors, now = new Date(), presets, csvFilename = 'audit-log',
  searchPlaceholder = 'Search people, targets or IPs', className, listClassName,
}: AuditLogProps<A>) {
  const [search, setSearch] = useState('')
  const [chosenActors, setChosenActors] = useState<string[]>([])
  const [chosenActions, setChosenActions] = useState<A[]>([])
  const [range, setRange] = useState<DateRange | undefined>()
  const [openId, setOpenId] = useState<string | null>(null)
  const id = useId()

  const actionKeys = Object.keys(actions) as A[]
  const people = actors ?? [...new Set(events.map((e) => e.actor))].sort()
  const verbOf = (e: AuditEvent<A>) => e.verb ?? actions[e.action].verb

  const datePresets = presets ?? [
    { label: 'Today', range: { from: now, to: now } },
    { label: 'Last 3 days', range: { from: subDays(now, 2), to: now } },
    { label: 'Last 7 days', range: { from: subDays(now, 6), to: now } },
  ]

  const query = search.trim().toLowerCase()
  const matches = (e: AuditEvent<A>) =>
    !query || [e.actor, verbOf(e), e.kind, e.target, e.ip, e.id].some((s) => s.toLowerCase().includes(query))
  const base = events.filter((e) => matches(e) && inRange(e, range))
  // Each filter's counts leave out that filter itself, so they show what picking an option would give.
  const forActorCounts = base.filter((e) => !chosenActions.length || chosenActions.includes(e.action))
  const forActionCounts = base.filter((e) => !chosenActors.length || chosenActors.includes(e.actor))
  const visible = forActionCounts.filter((e) => !chosenActions.length || chosenActions.includes(e.action))
  const actorCounts = countBy(forActorCounts, (e) => e.actor)
  const actionCounts = countBy(forActionCounts, (e) => e.action)
  const active = query !== '' || chosenActors.length > 0 || chosenActions.length > 0 || !!range?.from

  const groups: { key: string; date: Date; events: AuditEvent<A>[] }[] = []
  for (const event of visible) {
    const key = format(event.at, 'yyyy-MM-dd')
    const last = groups.at(-1)
    if (last?.key === key) last.events.push(event)
    else groups.push({ key, date: event.at, events: [event] })
  }

  function reset() {
    setSearch('')
    setChosenActors([])
    setChosenActions([])
    setRange(undefined)
  }

  function exportCsv() {
    if (!visible.length) {
      toast.error('Nothing to export', { description: 'No events match the current filters.' })
      return
    }
    downloadCsv(`${csvFilename}-${format(now, 'yyyy-MM-dd')}.csv`, [
      ['Time', 'Event', 'Actor', 'Action', 'Description', 'Target', 'IP address', 'Changes'],
      ...visible.map((e) => [
        format(e.at, "yyyy-MM-dd'T'HH:mm:ss"),
        e.id,
        e.actor,
        actions[e.action].label,
        [verbOf(e), e.kind].filter(Boolean).join(' '),
        e.target,
        e.ip,
        e.changes.map(describeChange).join('; '),
      ]),
    ])
    toast.success(`Exported ${plural(visible.length, 'event')}`, {
      description: active ? 'Only events that match the filters, newest first.' : 'Every event, newest first.',
    })
  }

  return (
    <article aria-label="Audit log" className={cn('bg-card min-w-0 overflow-hidden rounded-lg border', className)}>
      <header className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={searchPlaceholder}
          label="Search the audit log"
          className="w-full sm:w-60"
        />
        <FacetFilter
          title="Actor"
          options={people.map((name) => ({
            value: name, label: name, count: actorCounts.get(name) ?? 0, visual: <UserAvatar name={name} className="size-4" />,
          }))}
          selected={chosenActors}
          onChange={setChosenActors}
        />
        <DateRangePicker
          value={range}
          onChange={setRange}
          // A preset without a range clears it.
          presets={range?.from ? [...datePresets, { label: 'Clear' }] : datePresets}
          defaultMonth={now}
          // No events after now, so later days can't be picked.
          disabled={{ after: now }}
          size="sm"
          placeholder="Date"
          label={range?.from ? formatDateRange(range.from, range.to) : undefined}
          // Weighted and dashed like the Actor filter beside it.
          className={cn('font-medium', !range?.from && 'text-foreground border-dashed')}
        />
        {active && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-end" />
          </Button>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums" aria-live="polite">
            {visible.length === events.length ? plural(events.length, 'event') : `${visible.length} of ${plural(events.length, 'event')}`}
          </span>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
            Export CSV
          </Button>
        </span>
      </header>

      <div className="border-b px-3 py-2">
        <ToggleGroup
          type="multiple"
          spacing={1}
          value={chosenActions}
          onValueChange={(v) => setChosenActions(v as A[])}
          aria-label="Filter by action"
          className="flex-wrap"
        >
          {actionKeys.map((a) => (
            <ToggleGroupItem
              key={a}
              value={a}
              size="sm"
              className="text-muted-foreground hover:text-foreground aria-pressed:bg-accent data-[state=on]:border-border data-[state=on]:bg-accent data-[state=on]:text-foreground h-6 rounded-full border border-transparent px-2.5 text-xs"
            >
              <HugeiconsIcon icon={actions[a].icon} strokeWidth={2} className={cn('size-3.5', actions[a].className)} />
              {actions[a].label}
              <span className="text-muted-foreground tabular-nums">{actionCounts.get(a) ?? 0}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className={cn('max-h-[30rem] overflow-y-auto', listClassName)}>
        {groups.length > 0 ? (
          groups.map((group) => {
            const headingId = `${id}-${group.key}`
            return (
              <section key={group.key} aria-labelledby={headingId}>
                <h4 id={headingId} className="bg-subtle sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-1.5 text-xs">
                  {/* "Today", "Yesterday", then the weekday, with the date beside it. */}
                  <span className="font-medium">{relativeDay(group.date, now) ?? format(group.date, 'EEEE')}</span>
                  <span className="text-muted-foreground">{formatShortDate(group.date)}</span>
                  <span className="text-muted-foreground ml-auto tabular-nums">{plural(group.events.length, 'event')}</span>
                </h4>
                <ul>
                  {group.events.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      action={actions[event.action]}
                      verb={verbOf(event)}
                      open={openId === event.id}
                      onToggle={() => setOpenId(openId === event.id ? null : event.id)}
                    />
                  ))}
                </ul>
              </section>
            )
          })
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground text-xs">{events.length ? 'No events match these filters.' : 'No events yet.'}</p>
            {active && <Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>}
          </div>
        )}
      </div>
    </article>
  )
}

function EventRow({ event, action, verb, open, onToggle }: {
  event: AuditEvent
  action: AuditActionDef
  verb: string
  open: boolean
  onToggle: () => void
}) {
  const panelId = `${event.id}-details`

  return (
    <li className="border-b last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
        className="hover:bg-accent/50 focus-visible:bg-accent/50 flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs outline-none"
      >
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className={cn('text-muted-foreground size-3 shrink-0 transition-transform', open && 'rotate-90')}
        />
        <UserAvatar name={event.actor} className="size-5" />
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium">{event.actor}</span>{' '}
          <span className="text-muted-foreground">
            {verb}
            {event.kind && ` ${event.kind}`}
          </span>{' '}
          <span className="font-medium">{event.target}</span>
        </span>
        <span className="text-muted-foreground hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] md:inline-flex">
          <HugeiconsIcon icon={action.icon} strokeWidth={2} className={cn('size-3', action.className)} />
          {action.label}
        </span>
        <span className="text-muted-foreground hidden w-24 shrink-0 font-mono text-[11px] sm:inline">{event.ip}</span>
        <time dateTime={event.at.toISOString()} className="text-muted-foreground w-10 shrink-0 text-right tabular-nums">
          {formatTime(event.at)}
        </time>
      </button>

      {open && (
        <div id={panelId} className="bg-subtle grid gap-3 border-t px-3 py-3 text-xs sm:pl-16">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
            <dt className="text-muted-foreground">Event</dt>
            <dd className="truncate font-mono">{event.id}</dd>
            <dt className="text-muted-foreground">IP address</dt>
            <dd className="font-mono">{event.ip}</dd>
            <dt className="text-muted-foreground">Time</dt>
            <dd>{format(event.at, 'EEE d MMM yyyy, HH:mm:ss')}</dd>
            <dt className="text-muted-foreground">Actor</dt>
            <dd>{event.actor}</dd>
          </dl>
          {event.changes.length > 0 && (action.detailsTitle
            ? <DetailList title={action.detailsTitle} changes={event.changes} />
            : <ChangeDiff changes={event.changes} />)}
        </div>
      )}
    </li>
  )
}

function DetailList({ title, changes }: { title: string; changes: AuditChange[] }) {
  return (
    <div className="bg-card rounded-md border">
      <p className="text-muted-foreground border-b px-2.5 py-1.5 font-medium">{title}</p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 px-2.5 py-2">
        {changes.map((c) => (
          <div key={c.field} className="contents">
            <dt className="text-muted-foreground">{c.field}</dt>
            <dd>{c.after ?? c.before}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ChangeDiff({ changes }: { changes: AuditChange[] }) {
  return (
    <div className="bg-card overflow-hidden rounded-md border">
      <table className="w-full table-fixed text-xs">
        <caption className="sr-only">Changes: each field before and after</caption>
        <thead className="text-muted-foreground bg-muted/50">
          <tr>
            <th scope="col" className="w-[28%] px-2.5 py-1.5 text-left font-medium">Field</th>
            <th scope="col" className="px-2.5 py-1.5 text-left font-medium">Before</th>
            <th scope="col" className="px-2.5 py-1.5 text-left font-medium">After</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c) => (
            <tr key={c.field} className="border-t">
              <th scope="row" className="text-muted-foreground px-2.5 py-1.5 text-left align-top font-normal">{c.field}</th>
              <td className="px-2.5 py-1.5 align-top"><DiffValue value={c.before} removed /></td>
              <td className="px-2.5 py-1.5 align-top"><DiffValue value={c.after} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DiffValue({ value, removed }: { value?: string; removed?: boolean }) {
  if (value === undefined) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        'inline-flex max-w-full gap-1 rounded px-1 [overflow-wrap:anywhere]',
        removed ? 'bg-destructive/10 text-destructive' : 'bg-status-done/10 text-status-done',
      )}
    >
      <span aria-hidden className="select-none">{removed ? '−' : '+'}</span>
      <span className="min-w-0">{value}</span>
    </span>
  )
}
