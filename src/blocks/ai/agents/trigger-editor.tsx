import { useEffect, useId, useState, type FormEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, Alert02Icon, ArrowDown01Icon, Calendar03Icon, Delete02Icon, FlashIcon, PencilEdit02Icon, PlayIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from 'cn'
import {
  describeRecurrence, formatRunDate, formatUntil, localTimeZone, nextRuns, RecurrencePicker, TIME_ZONES,
  type Recurrence, type TimeZoneOption,
} from '@/components/recurrence-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ConnectorMark, ConnectorStatusLabel, type Connector } from '@/blocks/ai/connectors/connector-card'
import type { AgentTrigger } from './agent-types'

// What starts an agent's runs. Manual is always there: anyone with access
// runs it from a chat or with Run now. Schedule triggers run it at set times
// (the recurrence picker), and event triggers when something happens in a
// connected app ("New email in Mail"), narrowed by a filter in the app's own
// terms. Each schedule or event trigger is a row with an on/off switch, what
// it does in words, the next run for a schedule, Edit and Remove; Add
// trigger opens a dialog for either kind. Only connected apps can send
// events; the rest show greyed with the way to Settings.
// The list changes nothing itself: every edit comes back through onChange.

// An event a connector can start a run on: Mail's "New email", with a hint
// at the filter it understands ("from:, subject:, has:attachment").
export type AgentEventOption = { connectorId: string; id: string; label: string; filterHint?: string }

type ScheduleTrigger = Extract<AgentTrigger, { kind: 'schedule' }>
type EventTrigger = Extract<AgentTrigger, { kind: 'event' }>

let counter = 0
export const newTriggerId = () => `tr-${Date.now().toString(36)}${(++counter).toString(36)}`

// Connectors that can send events: connected, or connected with an expired
// sign-in (it still counts, and says it needs reconnecting).
const canSendEvents = (c: Pick<Connector, 'status'>) => c.status === 'connected' || c.status === 'error'

// A trigger in words: "When someone runs it", "Every weekday at 09:00
// (Singapore)", "New email in Mail · from:@supplier.com".
export function describeAgentTrigger(trigger: AgentTrigger, connectors?: Pick<Connector, 'id' | 'name'>[]) {
  switch (trigger.kind) {
    case 'manual':
      return 'When someone runs it'
    case 'schedule':
      return describeRecurrence(trigger.recurrence)
    case 'event': {
      if (!trigger.connectorId || !trigger.event) return 'Event not picked'
      const app = connectors?.find((c) => c.id === trigger.connectorId)?.name ?? trigger.connectorId
      const what = `${trigger.eventLabel || trigger.event} in ${app}`
      return trigger.filter?.trim() ? `${what} · ${trigger.filter.trim()}` : what
    }
  }
}

// Why a schedule can't be saved, if it can't.
export function recurrenceError(r: Recurrence, now = Date.now()) {
  if (r.kind === 'weekly' && !r.days?.length) return 'Pick at least one day.'
  if (r.kind === 'once' && !r.date) return 'Pick a date.'
  if (r.kind === 'once' && nextRuns(r, now, 1).length === 0) return 'Pick a time that hasn’t passed yet.'
  return undefined
}

// Why a trigger can't be saved, if it can't.
export function agentTriggerError(trigger: AgentTrigger, now = Date.now()) {
  if (trigger.kind === 'schedule') return recurrenceError(trigger.recurrence, now)
  if (trigger.kind === 'event') {
    if (!trigger.connectorId) return 'Pick the app the event comes from.'
    if (!trigger.event) return 'Pick an event.'
  }
  return undefined
}

const KIND: Record<AgentTrigger['kind'], { label: string; icon: IconSvgElement }> = {
  manual: { label: 'Manual', icon: PlayIcon },
  schedule: { label: 'Schedule', icon: Calendar03Icon },
  event: { label: 'Event', icon: FlashIcon },
}

type Editing =
  | { kind: 'schedule'; trigger?: ScheduleTrigger }
  | { kind: 'event'; trigger?: EventTrigger }
  | null

export function TriggerEditor({
  triggers, onChange, connectors, events, now, timeZones = TIME_ZONES, errors, onOpenSettings, disabled, className,
}: {
  triggers: AgentTrigger[]
  onChange: (triggers: AgentTrigger[]) => void
  // Every connector, in any status: only connected ones can send events.
  connectors: Connector[]
  events: AgentEventOption[]
  // For the next run and a new schedule's date. Defaults to the browser's clock.
  now?: number
  timeZones?: TimeZoneOption[]
  // Why a trigger can't be saved, by trigger id (validateAgentDraft).
  errors?: Record<string, string>
  // The way to Settings › Connectors, for apps not connected yet.
  onOpenSettings?: (connectorId?: string) => void
  disabled?: boolean
  className?: string
}) {
  // What the open dialog edits. It stays set while the dialog closes, so
  // the title doesn't change during the fade.
  const [editing, setEditing] = useState<Editing>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const edit = (next: Editing) => {
    setEditing(next)
    setDialogOpen(true)
  }
  const clock = now ?? Date.now()
  const manual = triggers.find((t) => t.kind === 'manual')
  const others = triggers.filter((t) => t.kind !== 'manual')
  // Only connectors with events can be picked, so only offer Event when one exists.
  const eventApps = connectors.filter((c) => events.some((e) => e.connectorId === c.id))

  const update = (id: string, next: AgentTrigger) => onChange(triggers.map((t) => (t.id === id ? next : t)))
  const remove = (id: string) => onChange(triggers.filter((t) => t.id !== id))
  // A new trigger goes after the rest; manual stays first.
  const add = (t: AgentTrigger) => onChange(manual ? [...triggers, t] : [{ id: newTriggerId(), kind: 'manual', enabled: true }, ...triggers, t])

  return (
    <div className={cn('@container grid min-w-0', className)}>
      <ul aria-label="Triggers" className="divide-y">
        <li className="flex min-w-0 items-start gap-3 px-3 py-2.5">
          <TriggerMark icon={KIND.manual.icon} />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="text-xs font-medium">Manual</span>
            <span className="text-muted-foreground text-[11px] leading-4">Anyone with access can run it from a chat or Run now.</span>
          </div>
          <span className="text-muted-foreground mt-0.5 shrink-0 text-[11px]">Always on</span>
        </li>

        {others.map((t) => (
          <TriggerRow
            key={t.id}
            trigger={t}
            connectors={connectors}
            now={clock}
            error={errors?.[t.id]}
            disabled={disabled}
            onToggle={(on) => update(t.id, { ...t, enabled: on })}
            onEdit={() => edit(t.kind === 'schedule' ? { kind: 'schedule', trigger: t } : { kind: 'event', trigger: t as EventTrigger })}
            onRemove={() => remove(t.id)}
          />
        ))}
      </ul>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
        <p className="text-muted-foreground min-w-0 text-[11px] leading-4">
          {others.length ? 'Runs it starts on its own show in the agent’s activity.' : 'Add a trigger to have it run on its own.'}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Add trigger
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onSelect={() => edit({ kind: 'schedule' })} className="items-start py-2">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="mt-0.5" />
              <span className="grid gap-0.5">
                <span className="font-medium">Schedule</span>
                <span className="text-muted-foreground text-[11px] leading-4">Runs at set times: every morning, each Monday.</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => edit({ kind: 'event' })} disabled={eventApps.length === 0} className="items-start py-2">
              <HugeiconsIcon icon={FlashIcon} strokeWidth={2} className="mt-0.5" />
              <span className="grid gap-0.5">
                <span className="font-medium">Event</span>
                <span className="text-muted-foreground text-[11px] leading-4">Runs when something happens in a connected app.</span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScheduleTriggerDialog
        open={dialogOpen && editing?.kind === 'schedule'}
        onOpenChange={(open) => !open && setDialogOpen(false)}
        initial={editing?.kind === 'schedule' ? editing.trigger?.recurrence : undefined}
        editing={!!(editing?.kind === 'schedule' && editing.trigger)}
        now={clock}
        timeZones={timeZones}
        onSave={(recurrence) => {
          const t = editing?.kind === 'schedule' ? editing.trigger : undefined
          if (t) update(t.id, { ...t, recurrence })
          else add({ id: newTriggerId(), kind: 'schedule', enabled: true, recurrence })
          setDialogOpen(false)
        }}
      />

      <EventTriggerDialog
        open={dialogOpen && editing?.kind === 'event'}
        onOpenChange={(open) => !open && setDialogOpen(false)}
        initial={editing?.kind === 'event' ? editing.trigger : undefined}
        connectors={eventApps}
        events={events}
        onOpenSettings={onOpenSettings}
        onSave={(picked) => {
          const t = editing?.kind === 'event' ? editing.trigger : undefined
          if (t) update(t.id, { ...t, ...picked })
          else add({ id: newTriggerId(), kind: 'event', enabled: true, ...picked })
          setDialogOpen(false)
        }}
      />
    </div>
  )
}

function TriggerMark({ icon, className }: { icon: IconSvgElement; className?: string }) {
  return (
    <span aria-hidden className={cn('bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-md', className)}>
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
    </span>
  )
}

function TriggerRow({ trigger: t, connectors, now, error, disabled, onToggle, onEdit, onRemove }: {
  trigger: ScheduleTrigger | EventTrigger
  connectors: Connector[]
  now: number
  error?: string
  disabled?: boolean
  onToggle: (on: boolean) => void
  onEdit: () => void
  onRemove: () => void
}) {
  const text = describeAgentTrigger(t, connectors)
  const app = t.kind === 'event' ? connectors.find((c) => c.id === t.connectorId) : undefined
  const next = t.kind === 'schedule' && t.enabled ? nextRuns(t.recurrence, now, 1)[0] : undefined
  const label = KIND[t.kind].label

  return (
    <li data-enabled={t.enabled || undefined} className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5">
      {app ? <ConnectorMark connector={app} size="sm" className={cn('mt-0.5', !t.enabled && 'opacity-50')} /> : (
        <TriggerMark icon={KIND[t.kind].icon} className={cn(!t.enabled && 'opacity-50')} />
      )}
      <div className={cn('grid min-w-0 flex-1 basis-44 gap-0.5', !t.enabled && 'text-muted-foreground')}>
        <span className="text-muted-foreground text-[11px]">{label}</span>
        <span className="text-xs leading-4 break-words">{text}</span>
        {t.kind === 'schedule' && (
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {!t.enabled ? 'Off: no runs until it is turned back on' : next
              ? <>Next run {formatRunDate(next, now)} · {formatUntil(next, now)}</>
              : 'No runs coming up'}
          </span>
        )}
        {t.kind === 'event' && app && app.status !== 'connected' && <ConnectorStatusLabel connector={app} />}
        {t.kind === 'event' && t.connectorId && !app && (
          <span className="text-destructive text-[11px]">This app is no longer connected.</span>
        )}
        {error && (
          <span role="alert" className="text-destructive flex items-center gap-1 text-[11px]">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3 shrink-0" />
            {error}
          </span>
        )}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" aria-label={`Edit trigger: ${text}`} onClick={onEdit} disabled={disabled} className="text-muted-foreground">
          <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Remove trigger: ${text}`} onClick={onRemove} disabled={disabled} className="text-muted-foreground hover:text-destructive">
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        </Button>
        <Switch
          checked={t.enabled}
          onCheckedChange={onToggle}
          disabled={disabled}
          aria-label={`${t.enabled ? 'Turn off' : 'Turn on'} trigger: ${text}`}
          className="mx-1.5"
        />
      </div>
    </li>
  )
}

// A new schedule's starting point: weekdays at 09:00 in the viewer's zone.
export const defaultTriggerRecurrence = (timeZone = localTimeZone()): Recurrence =>
  ({ kind: 'weekdays', time: '09:00', timeZone })

// Add or change a schedule trigger: the recurrence and its next three runs.
export function ScheduleTriggerDialog({ open, onOpenChange, initial, editing = !!initial, now, timeZones = TIME_ZONES, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Recurrence
  editing?: boolean
  now?: number
  timeZones?: TimeZoneOption[]
  onSave: (recurrence: Recurrence) => void
}) {
  const id = useId()
  const clock = now ?? Date.now()
  const [value, setValue] = useState<Recurrence>(() => initial ?? defaultTriggerRecurrence())
  const [tried, setTried] = useState(false)
  useEffect(() => {
    if (!open) return
    setValue(initial ?? defaultTriggerRecurrence())
    setTried(false)
  }, [open])

  const error = recurrenceError(value, clock)
  const coming = nextRuns(value, clock, 3)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!error) onSave(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(40rem,90vh)] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b p-4 pr-10">
          <DialogTitle>{editing ? 'Edit schedule' : 'Add a schedule'}</DialogTitle>
          <DialogDescription>The agent runs on its own at these times, with its instructions and tools.</DialogDescription>
        </DialogHeader>
        <form id={`${id}-form`} onSubmit={submit} noValidate className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4">
          <RecurrencePicker value={value} onChange={setValue} timeZones={timeZones} now={clock} invalid={tried && !!error} />
          {tried && error && <FieldError>{error}</FieldError>}
          <section aria-labelledby={`${id}-next`} className="grid gap-1.5">
            <h3 id={`${id}-next`} className="text-muted-foreground text-[11px] font-medium">Next runs</h3>
            {coming.length ? (
              <ol className="bg-card divide-y rounded-lg border">
                {coming.map((t) => (
                  <li key={t} className="flex min-w-0 items-center gap-2 px-3 py-1.5 text-xs">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                    <span className="min-w-0 truncate tabular-nums">{formatRunDate(t, clock)}</span>
                    <span className="text-muted-foreground ml-auto shrink-0 text-[11px]">{formatUntil(t, clock)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground text-xs">No runs coming up with this schedule.</p>
            )}
          </section>
        </form>
        <DialogFooter className="border-t p-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form={`${id}-form`}>{editing ? 'Save schedule' : 'Add schedule'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type EventTriggerPick = Pick<EventTrigger, 'connectorId' | 'event' | 'eventLabel' | 'filter'>

// Add or change an event trigger: the app (connected ones only), one of its
// events, and an optional filter in the app's own terms.
export function EventTriggerDialog({ open, onOpenChange, initial, connectors, events, onOpenSettings, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Partial<EventTriggerPick>
  // The connectors to offer, in any status; ones that can't send events are greyed.
  connectors: Connector[]
  events: AgentEventOption[]
  onOpenSettings?: (connectorId?: string) => void
  onSave: (pick: EventTriggerPick) => void
}) {
  const id = useId()
  const [connectorId, setConnectorId] = useState('')
  const [event, setEvent] = useState('')
  const [filter, setFilter] = useState('')
  const [tried, setTried] = useState(false)

  useEffect(() => {
    if (!open) return
    const first = connectors.find(canSendEvents)?.id ?? ''
    const app = initial?.connectorId || first
    setConnectorId(app)
    setEvent(initial?.event || events.find((e) => e.connectorId === app)?.id || '')
    setFilter(initial?.filter ?? '')
    setTried(false)
  }, [open])

  const app = connectors.find((c) => c.id === connectorId)
  const appEvents = events.filter((e) => e.connectorId === connectorId)
  const picked = appEvents.find((e) => e.id === event)
  const usable = connectors.filter(canSendEvents)
  const appError = !connectorId ? 'Pick the app the event comes from.' : undefined
  const eventError = !picked ? 'Pick an event.' : undefined

  const chooseApp = (next: string) => {
    setConnectorId(next)
    // Keep the event when it belongs to the new app too; otherwise its first.
    if (!events.some((e) => e.connectorId === next && e.id === event)) {
      setEvent(events.find((e) => e.connectorId === next)?.id ?? '')
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (appError || eventError || !picked) return
    onSave({ connectorId, event: picked.id, eventLabel: picked.label, filter: filter.trim() || undefined })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(44rem,90vh)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-4 pr-10">
          <DialogTitle>{initial?.event ? 'Edit event trigger' : 'Add an event trigger'}</DialogTitle>
          <DialogDescription>The agent runs each time this happens in a connected app.</DialogDescription>
        </DialogHeader>
        <form id={`${id}-form`} onSubmit={submit} noValidate className="@container grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
          <section aria-labelledby={`${id}-app`} className="grid min-w-0 gap-1.5">
            <h3 id={`${id}-app`} className="text-xs font-medium">App</h3>
            <RadioGroupPrimitive.Root
              aria-labelledby={`${id}-app`}
              aria-invalid={(tried && !!appError) || undefined}
              value={connectorId}
              onValueChange={chooseApp}
              className="grid grid-cols-1 gap-1.5 @sm:grid-cols-2"
            >
              {connectors.map((c) => {
                const off = !canSendEvents(c)
                return (
                  <RadioGroupPrimitive.Item
                    key={c.id}
                    value={c.id}
                    disabled={off}
                    className={cn(
                      'flex min-w-0 items-center gap-2.5 rounded-lg border p-2 text-left outline-none transition-colors',
                      'hover:bg-accent/50 focus-visible:ring-ring/50 focus-visible:ring-2',
                      'data-[state=checked]:border-brand/60 data-[state=checked]:bg-accent/40',
                      'data-[disabled]:pointer-events-none data-[disabled]:opacity-60',
                    )}
                  >
                    <ConnectorMark connector={c} size="sm" />
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate text-xs font-medium">{c.name}</span>
                      {off
                        ? <span className="text-muted-foreground truncate text-[11px]">{c.status === 'disabled' ? 'Disabled by admin' : 'Connect it in Settings'}</span>
                        : <ConnectorStatusLabel connector={c} />}
                    </span>
                  </RadioGroupPrimitive.Item>
                )
              })}
            </RadioGroupPrimitive.Root>
            {usable.length === 0 && (
              <p className="text-muted-foreground text-[11px]">None of these apps is connected yet. Connect one in Settings first.</p>
            )}
            {tried && appError && <FieldError>{appError}</FieldError>}
            {onOpenSettings && usable.length < connectors.length && (
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground w-fit" onClick={() => onOpenSettings()}>
                <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} data-icon="inline-start" />
                Connect more apps in Settings
              </Button>
            )}
          </section>

          {app && (
            <section aria-labelledby={`${id}-event`} className="grid min-w-0 gap-1.5">
              <h3 id={`${id}-event`} className="text-xs font-medium">Event in {app.name}</h3>
              <RadioGroupPrimitive.Root
                aria-labelledby={`${id}-event`}
                value={event}
                onValueChange={setEvent}
                className="bg-card grid min-w-0 divide-y rounded-lg border"
              >
                {appEvents.map((e) => (
                  <RadioGroupPrimitive.Item
                    key={e.id}
                    value={e.id}
                    className="hover:bg-accent/40 focus-visible:bg-accent/60 flex min-w-0 items-center gap-2.5 px-3 py-2 text-left text-xs outline-none first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span aria-hidden className="border-input grid size-3.5 shrink-0 place-items-center rounded-full border">
                      <RadioGroupPrimitive.Indicator className="bg-brand size-2 rounded-full" />
                    </span>
                    <span className="min-w-0 truncate">{e.label}</span>
                  </RadioGroupPrimitive.Item>
                ))}
              </RadioGroupPrimitive.Root>
              {tried && eventError && <FieldError>{eventError}</FieldError>}
            </section>
          )}

          {picked && (
            <Field>
              <FieldLabel htmlFor={`${id}-filter`}>Filter <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
              <Input
                id={`${id}-filter`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={picked.filterHint ?? 'Leave empty for every one'}
                aria-describedby={`${id}-filter-hint`}
                className="font-mono text-[11px]"
                autoComplete="off"
                spellCheck={false}
              />
              <FieldDescription id={`${id}-filter-hint`} className="text-[11px] leading-4">
                {picked.filterHint ? <>In {app?.name}’s terms: <code className="font-mono">{picked.filterHint}</code>. </> : null}
                Leave it empty to run on every one.
              </FieldDescription>
            </Field>
          )}
        </form>
        <DialogFooter className="border-t p-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form={`${id}-form`} disabled={usable.length === 0}>
            {initial?.event ? 'Save trigger' : 'Add trigger'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
