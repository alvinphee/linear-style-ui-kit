import { useId, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, ArrowRight01Icon, Cancel01Icon, Delete02Icon, Login03Icon, PencilEdit02Icon, UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import { endOfDay, format, startOfDay, subDays } from 'date-fns'
import { cn } from 'cn'
import { FacetFilter } from '@/blocks/data-table'
import { DateRangePicker, type DateRange, type DateRangePreset } from '@/blocks/period-picker'
import { UserAvatar } from '@/components/person'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatDateRange, formatShortDate, formatTime, relativeDay } from '@/lib/format'
import { seededRandom } from '@/lib/random'
import { plural } from '@/lib/text'
import { PEOPLE } from '../data'
import { Section } from './shared'

type Action = 'created' | 'updated' | 'deleted' | 'invited' | 'signed_in'

const ACTIONS: Record<Action, { label: string; verb: string; icon: IconSvgElement; className: string }> = {
  created: { label: 'Created', verb: 'created', icon: Add01Icon, className: 'text-status-done' },
  updated: { label: 'Updated', verb: 'updated', icon: PencilEdit02Icon, className: 'text-status-progress' },
  deleted: { label: 'Deleted', verb: 'deleted', icon: Delete02Icon, className: 'text-status-blocked' },
  invited: { label: 'Invited', verb: 'invited', icon: UserAdd01Icon, className: 'text-chart-2' },
  signed_in: { label: 'Signed in', verb: 'signed in to', icon: Login03Icon, className: 'text-muted-foreground' },
}
const ACTION_KEYS = Object.keys(ACTIONS) as Action[]

type Change = { field: string; before?: string; after?: string }

type AuditEvent = {
  id: string
  actor: string
  action: Action
  // What kind of thing the target is ("project", "API key"); empty when the verb says it.
  kind: string
  target: string
  ip: string
  at: Date
  changes: Change[]
}

type Picker = <T>(list: readonly T[]) => T
type Template = (pick: Picker, actor: string) => Pick<AuditEvent, 'action' | 'kind' | 'target' | 'changes'>

const PROJECTS = ['Atlas', 'Nimbus', 'Q4 launch', 'Mobile app', 'Onboarding revamp']
const INVITEES = ['priya@example.com', 'jonah@example.com', 'amara@example.com', 'felix@example.com', 'ines@example.com']
const API_KEYS = ['CI deploy', 'Analytics export', 'Staging sync']

// Made-up workspace activity. Weights make sign-ins and project edits the most common.
const TEMPLATES: { weight: number; make: Template }[] = [
  {
    weight: 6,
    make: (pick) => ({
      action: 'signed_in', kind: '', target: pick(['Web app', 'Desktop app', 'Mobile app']),
      changes: [
        { field: 'Method', after: pick(['SSO', 'Password', 'Passkey']) },
        { field: 'Browser', after: pick(['Chrome on macOS', 'Firefox on Windows', 'Safari on iOS', 'Edge on Windows']) },
        { field: 'Two-factor', after: pick(['Passed', 'Passed', 'Not required']) },
      ],
    }),
  },
  {
    weight: 3,
    make: (pick, actor) => {
      const name = pick(PROJECTS)
      return {
        action: 'created', kind: 'project', target: name,
        changes: [
          { field: 'Name', after: name },
          { field: 'Visibility', after: pick(['Private', 'Workspace']) },
          { field: 'Lead', after: actor },
        ],
      }
    },
  },
  {
    weight: 5,
    make: (pick) => {
      const [before, after] = pick([['Planned', 'In progress'], ['In progress', 'Paused'], ['Paused', 'In progress'], ['In progress', 'Completed']])
      const [was, now] = pick([['4 Oct', '11 Oct'], ['30 Sep', '7 Oct'], ['15 Oct', '1 Nov']])
      return {
        action: 'updated', kind: 'project', target: pick(PROJECTS),
        changes: [{ field: 'Status', before, after }, { field: 'Target date', before: was, after: now }],
      }
    },
  },
  {
    weight: 2,
    make: (pick) => {
      const [before, after] = pick([['Member', 'Admin'], ['Guest', 'Member'], ['Admin', 'Member']])
      return { action: 'updated', kind: 'member', target: pick(INVITEES), changes: [{ field: 'Role', before, after }] }
    },
  },
  {
    weight: 3,
    make: (pick) => {
      const email = pick(INVITEES)
      return {
        action: 'invited', kind: '', target: email,
        changes: [
          { field: 'Email', after: email },
          { field: 'Role', after: pick(['Member', 'Member', 'Guest']) },
          { field: 'Invite expires', after: 'in 7 days' },
        ],
      }
    },
  },
  {
    weight: 2,
    make: (pick) => {
      const name = pick(API_KEYS)
      return {
        action: 'created', kind: 'API key', target: name,
        changes: [
          { field: 'Name', after: name },
          { field: 'Scopes', after: pick(['read', 'read, write']) },
          { field: 'Expires', after: 'in 90 days' },
        ],
      }
    },
  },
  {
    weight: 2,
    make: (pick) => {
      const name = pick(API_KEYS)
      return {
        action: 'deleted', kind: 'API key', target: name,
        changes: [
          { field: 'Name', before: name },
          { field: 'Scopes', before: pick(['read', 'read, write']) },
          { field: 'Last used', before: pick(['2 hours ago', '3 days ago', 'never']) },
        ],
      }
    },
  },
  {
    weight: 1,
    make: () => ({
      action: 'updated', kind: 'billing', target: 'Subscription',
      changes: [{ field: 'Plan', before: 'Pro', after: 'Business' }, { field: 'Seats', before: '12', after: '20' }],
    }),
  },
  {
    weight: 1,
    make: () => ({
      action: 'updated', kind: 'settings', target: 'Workspace',
      changes: [
        { field: 'Session length', before: '30 days', after: '7 days' },
        { field: 'Default role', before: 'Member', after: 'Guest' },
      ],
    }),
  },
  {
    weight: 2,
    make: (pick) => {
      const created = pick([true, false])
      const url = 'https://hooks.example.com/deploy'
      return {
        action: created ? 'created' : 'deleted', kind: 'webhook', target: 'Deploy notify',
        changes: created
          ? [{ field: 'URL', after: url }, { field: 'Events', after: 'deploy.finished' }]
          : [{ field: 'URL', before: url }, { field: 'Events', before: 'deploy.finished, deploy.failed' }],
      }
    },
  },
  {
    weight: 1,
    make: () => ({
      action: 'deleted', kind: 'project', target: 'Old website',
      changes: [{ field: 'Name', before: 'Old website' }, { field: 'Open issues', before: '12' }],
    }),
  },
  {
    weight: 1,
    make: (pick) => {
      const [before, after] = pick([['Red', 'Orange'], ['Blue', 'Violet']])
      return { action: 'updated', kind: 'label', target: pick(['Bug', 'Feature', 'Design']), changes: [{ field: 'Colour', before, after }] }
    },
  },
]

// Fixed "now", so the log reads the same for everyone.
const NOW = new Date(2026, 8, 30, 16, 42)
const MINUTE = 60_000

function makeEvents(count: number): AuditEvent[] {
  // Seeded, so the events read the same on every load.
  const rand = seededRandom(4021)
  const pick: Picker = (list) => list[Math.floor(rand() * list.length)]
  const total = TEMPLATES.reduce((sum, t) => sum + t.weight, 0)
  // Each person mostly works from one address.
  const home = new Map(PEOPLE.map((p) => [p, `203.0.113.${10 + Math.floor(rand() * 240)}`]))
  const events: AuditEvent[] = []
  let at = NOW.getTime() - 6 * MINUTE

  for (let i = 0; i < count; i++) {
    let roll = rand() * total
    const template = TEMPLATES.find((t) => (roll -= t.weight) < 0) ?? TEMPLATES[0]
    const actor = pick(PEOPLE)
    events.push({
      id: `evt_${(1000 + count - i).toString(36)}${Math.floor(rand() * 36 ** 4).toString(36).padStart(4, '0')}`,
      actor,
      ip: rand() < 0.8 ? home.get(actor)! : `203.0.113.${10 + Math.floor(rand() * 240)}`,
      at: new Date(at),
      ...template.make(pick, actor),
    })
    at -= (15 + Math.floor(rand() * 420)) * MINUTE
    // Skip the small hours: jump back to the previous evening.
    if (new Date(at).getHours() < 8) at -= 10 * 60 * MINUTE
  }
  return events
}

const EVENTS = makeEvents(40)

function countBy<T, K>(list: T[], key: (item: T) => K) {
  const counts = new Map<K, number>()
  for (const item of list) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1)
  return counts
}

function matchesSearch(event: AuditEvent, query: string) {
  if (!query) return true
  return [event.actor, ACTIONS[event.action].verb, event.kind, event.target, event.ip, event.id].some((s) =>
    s.toLowerCase().includes(query),
  )
}

function inRange(event: AuditEvent, range: DateRange | undefined) {
  if (!range?.from) return true
  return event.at >= startOfDay(range.from) && event.at <= endOfDay(range.to ?? range.from)
}

// "Today", "Yesterday", then the weekday, with the date beside it.
const dayLabel = (date: Date) => ({ label: relativeDay(date, NOW) ?? format(date, 'EEEE'), sub: formatShortDate(date) })

const DATE_PRESETS: DateRangePreset[] = [
  { label: 'Today', range: { from: NOW, to: NOW } },
  { label: 'Last 3 days', range: { from: subDays(NOW, 2), to: NOW } },
  { label: 'Last 7 days', range: { from: subDays(NOW, 6), to: NOW } },
]
// A preset without a range clears it.
const DATE_PRESETS_WITH_CLEAR: DateRangePreset[] = [...DATE_PRESETS, { label: 'Clear' }]

export default function AuditLogSection() {
  const [search, setSearch] = useState('')
  const [actors, setActors] = useState<string[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [range, setRange] = useState<DateRange | undefined>()
  const [openId, setOpenId] = useState<string | null>(null)
  const id = useId()

  const query = search.trim().toLowerCase()
  const base = EVENTS.filter((e) => matchesSearch(e, query) && inRange(e, range))
  // Each filter's counts leave out that filter itself, so they show what picking an option would give.
  const forActorCounts = base.filter((e) => !actions.length || actions.includes(e.action))
  const forActionCounts = base.filter((e) => !actors.length || actors.includes(e.actor))
  const visible = forActionCounts.filter((e) => !actions.length || actions.includes(e.action))
  const actorCounts = countBy(forActorCounts, (e) => e.actor)
  const actionCounts = countBy(forActionCounts, (e) => e.action)
  const active = query !== '' || actors.length > 0 || actions.length > 0 || !!range?.from

  const groups: { key: string; date: Date; events: AuditEvent[] }[] = []
  for (const event of visible) {
    const key = format(event.at, 'yyyy-MM-dd')
    const last = groups.at(-1)
    if (last?.key === key) last.events.push(event)
    else groups.push({ key, date: event.at, events: [event] })
  }

  function reset() {
    setSearch('')
    setActors([])
    setActions([])
    setRange(undefined)
  }

  return (
    <Section id="audit-log" title="Audit log" description="Who did what, filterable by person, action and date">
      <article className="bg-card min-w-0 overflow-hidden rounded-lg border lg:col-span-2">
        <header className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search people, targets or IPs"
            label="Search the audit log"
            className="w-full sm:w-60"
          />
          <FacetFilter
            title="Actor"
            options={PEOPLE.map((name) => ({
              value: name, label: name, count: actorCounts.get(name) ?? 0, visual: <UserAvatar name={name} className="size-4" />,
            }))}
            selected={actors}
            onChange={setActors}
          />
          <DateRangePicker
            value={range}
            onChange={setRange}
            presets={range?.from ? DATE_PRESETS_WITH_CLEAR : DATE_PRESETS}
            defaultMonth={NOW}
            // No events after now, so later days can't be picked.
            disabled={{ after: NOW }}
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
          <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap tabular-nums" aria-live="polite">
            {visible.length === EVENTS.length ? plural(EVENTS.length, 'event') : `${visible.length} of ${plural(EVENTS.length, 'event')}`}
          </span>
        </header>

        <div className="border-b px-3 py-2">
          <ToggleGroup
            type="multiple"
            spacing={1}
            value={actions}
            onValueChange={(v) => setActions(v as Action[])}
            aria-label="Filter by action"
            className="flex-wrap"
          >
            {ACTION_KEYS.map((a) => (
              <ToggleGroupItem
                key={a}
                value={a}
                size="sm"
                className="text-muted-foreground hover:text-foreground aria-pressed:bg-accent data-[state=on]:border-border data-[state=on]:bg-accent data-[state=on]:text-foreground h-6 rounded-full border border-transparent px-2.5 text-xs"
              >
                <HugeiconsIcon icon={ACTIONS[a].icon} strokeWidth={2} className={cn('size-3.5', ACTIONS[a].className)} />
                {ACTIONS[a].label}
                <span className="text-muted-foreground tabular-nums">{actionCounts.get(a) ?? 0}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="max-h-[30rem] overflow-y-auto">
          {groups.length > 0 ? (
            groups.map((group) => {
              const day = dayLabel(group.date)
              const headingId = `${id}-${group.key}`
              return (
                <section key={group.key} aria-labelledby={headingId}>
                  <h4
                    id={headingId}
                    className="bg-subtle sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-1.5 text-xs"
                  >
                    <span className="font-medium">{day.label}</span>
                    <span className="text-muted-foreground">{day.sub}</span>
                    <span className="text-muted-foreground ml-auto tabular-nums">{plural(group.events.length, 'event')}</span>
                  </h4>
                  <ul>
                    {group.events.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
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
              <p className="text-muted-foreground text-xs">No events match these filters.</p>
              <Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>
            </div>
          )}
        </div>
      </article>
    </Section>
  )
}

function EventRow({ event, open, onToggle }: { event: AuditEvent; open: boolean; onToggle: () => void }) {
  const action = ACTIONS[event.action]
  const panelId = `${event.id}-details`

  return (
    <li className="border-b last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
        className="hover:bg-accent/60 focus-visible:bg-accent aria-expanded:bg-accent/40 flex h-9 w-full cursor-default items-center gap-2.5 px-3 text-left text-xs outline-none"
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
            {action.verb}
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
          {event.action === 'signed_in' ? <SessionDetails changes={event.changes} /> : <ChangeDiff changes={event.changes} />}
        </div>
      )}
    </li>
  )
}

function SessionDetails({ changes }: { changes: Change[] }) {
  return (
    <div className="bg-card rounded-md border">
      <p className="text-muted-foreground border-b px-2.5 py-1.5 font-medium">Session</p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 px-2.5 py-2">
        {changes.map((c) => (
          <div key={c.field} className="contents">
            <dt className="text-muted-foreground">{c.field}</dt>
            <dd>{c.after}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ChangeDiff({ changes }: { changes: Change[] }) {
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
