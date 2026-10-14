import {
  Add01Icon, Delete02Icon, Login03Icon, PencilEdit02Icon, UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import { AuditLog, type AuditActionDef, type AuditEvent as LogEvent } from '@/blocks/audit-log'
import { seededRandom } from '@/lib/random'
import { PEOPLE } from '../data'
import { Section } from './shared'

// The audit log block fed with made-up workspace activity: project edits,
// invites, API keys, sign-ins. The AI chat app's admin console feeds it its own.

type Action = 'created' | 'updated' | 'deleted' | 'invited' | 'signed_in'

const ACTIONS: Record<Action, AuditActionDef> = {
  created: { label: 'Created', verb: 'created', icon: Add01Icon, className: 'text-status-done' },
  updated: { label: 'Updated', verb: 'updated', icon: PencilEdit02Icon, className: 'text-status-progress' },
  deleted: { label: 'Deleted', verb: 'deleted', icon: Delete02Icon, className: 'text-status-blocked' },
  invited: { label: 'Invited', verb: 'invited', icon: UserAdd01Icon, className: 'text-chart-2' },
  signed_in: { label: 'Signed in', verb: 'signed in to', icon: Login03Icon, className: 'text-muted-foreground', detailsTitle: 'Session' },
}
type AuditEvent = LogEvent<Action>

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

export default function AuditLogSection() {
  return (
    <Section id="audit-log" title="Audit log" description="Who did what, filterable by person, action and date">
      <AuditLog events={EVENTS} actions={ACTIONS} actors={PEOPLE} now={NOW} className="lg:col-span-2" />
    </Section>
  )
}
