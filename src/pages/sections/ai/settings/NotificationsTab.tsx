import { useId } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Notification01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatTimeOfDay } from '@/lib/format'
import { useStoredState } from './prefs'

// Which events reach you, and where: a grid of events × channels (in app,
// email, push), and quiet hours that hold push notifications overnight.

type Channel = 'app' | 'email' | 'push'
type EventId = 'reply' | 'task' | 'approval' | 'shared' | 'usage' | 'product'

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'app', label: 'In app' },
  { id: 'email', label: 'Email' },
  { id: 'push', label: 'Push' },
]

const EVENTS: { id: EventId; label: string; hint: string; required?: Channel }[] = [
  { id: 'reply', label: 'Reply finished while you’re away', hint: 'A long answer or research is ready.' },
  { id: 'task', label: 'Scheduled task ran', hint: 'With its result, or why it failed.' },
  { id: 'approval', label: 'Agent needs your approval', hint: 'An agent is waiting before it acts.', required: 'app' },
  { id: 'shared', label: 'Someone shared a chat or project with you', hint: 'From people in your workspace.' },
  { id: 'usage', label: 'Usage limit almost reached', hint: 'At 80% and 100% of your plan.' },
  { id: 'product', label: 'Product updates', hint: 'New features and tips, about once a month.' },
]

type Matrix = Record<EventId, Record<Channel, boolean>>
type NotificationPrefs = {
  matrix: Matrix
  quietHours: boolean
  // Minutes after midnight.
  quietFrom: number
  quietTo: number
}

const KEY = 'linear-kit:ai-notifications:v1'
const INITIAL: NotificationPrefs = {
  matrix: {
    reply: { app: true, email: false, push: true },
    task: { app: true, email: true, push: false },
    approval: { app: true, email: true, push: true },
    shared: { app: true, email: true, push: false },
    usage: { app: true, email: true, push: false },
    product: { app: false, email: true, push: false },
  },
  quietHours: false,
  quietFrom: 22 * 60,
  quietTo: 7 * 60,
}

// Every half hour of the day, for the quiet hours selects.
const TIMES = Array.from({ length: 48 }, (_, i) => i * 30)

export function NotificationsTab() {
  const id = useId()
  const [prefs, setPrefs] = useStoredState<NotificationPrefs>(KEY, INITIAL)
  const matrix = { ...INITIAL.matrix, ...prefs.matrix }

  function toggle(event: EventId, channel: Channel, on: boolean) {
    setPrefs((p) => ({ ...p, matrix: { ...matrix, [event]: { ...matrix[event], [channel]: on } } }))
  }

  function sendTest() {
    toast('Reply finished', {
      description: 'Demo only. This is how a notification looks when a reply is ready.',
      icon: <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} className="size-4" />,
    })
  }

  return (
    <>
      <SettingsHeader
        title="Notifications"
        description="Choose what reaches you, and where."
        action={(
          <Button variant="outline" size="sm" onClick={sendTest}>
            <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} data-icon="inline-start" /> Send a test notification
          </Button>
        )}
      />

      <SettingsGroup title="Notify me about" description="Push goes to the mobile app and to browsers you allow." className="@container/matrix">
        <table role="table" className="w-full text-xs">
          <thead role="rowgroup" className="hidden @md/matrix:table-header-group">
            <tr role="row" className="border-b">
              <th role="columnheader" scope="col" className="text-muted-foreground px-3 py-2 text-left text-[11px] font-normal">Event</th>
              {CHANNELS.map((c) => (
                <th key={c.id} role="columnheader" scope="col" className="text-muted-foreground w-16 px-2 py-2 text-center text-[11px] font-normal">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className="divide-y">
            {EVENTS.map((e) => (
              <tr key={e.id} role="row" className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 @md/matrix:table-row @md/matrix:p-0">
                <th role="rowheader" scope="row" className="block w-full text-left font-normal @md/matrix:table-cell @md/matrix:w-auto @md/matrix:px-3 @md/matrix:py-2.5">
                  <span className="block">{e.label}</span>
                  <span className="text-muted-foreground block text-[11px] leading-4">{e.hint}</span>
                </th>
                {CHANNELS.map((c) => {
                  const cell = `${id}-${e.id}-${c.id}`
                  const required = e.required === c.id
                  return (
                    <td key={c.id} role="cell" className="@md/matrix:table-cell @md/matrix:px-2 @md/matrix:py-2.5 @md/matrix:text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <Checkbox
                          id={cell}
                          checked={required || matrix[e.id][c.id]}
                          disabled={required}
                          onCheckedChange={(on) => toggle(e.id, c.id, on === true)}
                          aria-label={`${e.label}: ${c.label}${required ? ' (always on)' : ''}`}
                        />
                        <label htmlFor={cell} aria-hidden className={cn('text-muted-foreground text-[11px] @md/matrix:sr-only', required && 'opacity-60')}>
                          {c.label}
                        </label>
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-muted-foreground px-3 py-2 text-[11px]">Approvals always show in the app, so an agent is never left waiting unseen.</p>
      </SettingsGroup>

      <SettingsGroup title="Quiet hours" description="Push notifications wait until quiet hours end. In-app and email are not held.">
        <SettingsRow label="Pause push notifications" hint="Every day, in your time zone." htmlFor={`${id}-quiet`}>
          <Switch id={`${id}-quiet`} checked={prefs.quietHours} onCheckedChange={(on) => setPrefs((p) => ({ ...p, quietHours: on }))} />
        </SettingsRow>
        <SettingsRow label="From" htmlFor={`${id}-from`} className={cn(!prefs.quietHours && 'opacity-60')}>
          <TimeSelect id={`${id}-from`} value={prefs.quietFrom} disabled={!prefs.quietHours} onChange={(quietFrom) => setPrefs((p) => ({ ...p, quietFrom }))} />
        </SettingsRow>
        <SettingsRow label="To" htmlFor={`${id}-to`} hint={prefs.quietTo <= prefs.quietFrom ? 'The next morning.' : undefined} className={cn(!prefs.quietHours && 'opacity-60')}>
          <TimeSelect id={`${id}-to`} value={prefs.quietTo} disabled={!prefs.quietHours} onChange={(quietTo) => setPrefs((p) => ({ ...p, quietTo }))} />
        </SettingsRow>
      </SettingsGroup>
    </>
  )
}

function TimeSelect({ id, value, disabled, onChange }: {
  id: string
  value: number
  disabled?: boolean
  onChange: (minutes: number) => void
}) {
  return (
    <Select value={String(value)} disabled={disabled} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger id={id} size="sm" className="w-24 tabular-nums"><SelectValue /></SelectTrigger>
      <SelectContent position="popper" align="end" className="max-h-64">
        {TIMES.map((t) => <SelectItem key={t} value={String(t)} className="tabular-nums">{formatTimeOfDay(t)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
