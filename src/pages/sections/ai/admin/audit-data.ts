import {
  BookOpen01Icon, Download01Icon, Link01Icon, Login03Icon, PlugSocketIcon, RoboticIcon, Settings02Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import type { AuditActionDef, AuditEvent } from '@/blocks/audit-log'
import type { DateRangePreset } from '@/blocks/period-picker'
import { seededRandom } from '@/lib/random'
import { DAY, MINUTE, at } from '../data'
import { PEOPLE, YOU } from '../projects/people'

// The AI app's audit log: about 120 made-up events over the 30 days before
// the demo clock's start (30 Sep 2026, 18:40). Seeded, so it reads the same
// on every load: sign-ins, members, connectors, agents, shared links,
// knowledge bases, organisation settings and data exports.

export type AiAuditAction = 'sign_in' | 'members' | 'connectors' | 'agents' | 'sharing' | 'knowledge' | 'settings' | 'data'

export const AI_AUDIT_ACTIONS: Record<AiAuditAction, AuditActionDef> = {
  sign_in: { label: 'Sign-ins', verb: 'signed in to', icon: Login03Icon, className: 'text-muted-foreground', detailsTitle: 'Session' },
  members: { label: 'Members', verb: 'updated', icon: UserGroupIcon, className: 'text-chart-2' },
  connectors: { label: 'Connectors', verb: 'updated', icon: PlugSocketIcon, className: 'text-chart-3' },
  agents: { label: 'Agents', verb: 'updated', icon: RoboticIcon, className: 'text-brand' },
  sharing: { label: 'Sharing', verb: 'shared', icon: Link01Icon, className: 'text-status-progress' },
  knowledge: { label: 'Knowledge', verb: 'updated', icon: BookOpen01Icon, className: 'text-chart-4' },
  settings: { label: 'Settings', verb: 'changed', icon: Settings02Icon, className: 'text-status-todo' },
  data: { label: 'Data exports', verb: 'exported', icon: Download01Icon, className: 'text-chart-5' },
}

// When the log ends: the demo clock's start.
export const AUDIT_NOW = new Date(at(0, 18, 40))

export const AUDIT_PRESETS: DateRangePreset[] = [
  { label: 'Today', range: { from: AUDIT_NOW, to: AUDIT_NOW } },
  { label: 'Last 7 days', range: { from: new Date(AUDIT_NOW.getTime() - 6 * DAY), to: AUDIT_NOW } },
  { label: 'Last 30 days', range: { from: new Date(AUDIT_NOW.getTime() - 29 * DAY), to: AUDIT_NOW } },
]

const EVERYONE = [YOU, ...PEOPLE]
// Who holds the admin role, so admin changes come from them.
const ADMINS = [YOU, PEOPLE.find((p) => p.id === 'u-grace')!, PEOPLE.find((p) => p.id === 'u-jonas')!]
export const AUDIT_ACTORS = EVERYONE.map((p) => p.name)

const INVITEES = ['sam.lee@example.com', 'hana.sato@example.com', 'leo.fischer@example.com', 'zara.ahmed@example.com', 'pablo.ruiz@example.com']
const CONNECTORS = ['Cloud Drive', 'Mail', 'Calendar', 'Team Chat', 'Code Repository', 'Issue Tracker', 'Wiki', 'Support Desk']
const AGENTS = ['Invoice clerk', 'Weekly operations report', 'Support triage', 'Competitor watch']
const CHATS = ['Q4 delivery plan', 'Refund policy summary', 'Fleet costs by region', 'Onboarding checklist', 'Supplier comparison']
const BASES = ['HR policies', 'Product documentation', 'Support playbook', 'Customs and export rules', 'Contract library']

// SSO was turned on this many days before now (see FIXED).
const SSO_DAYS_AGO = 12

type Picker = <T>(list: readonly T[]) => T
type Made = Pick<AuditEvent<AiAuditAction>, 'action' | 'verb' | 'kind' | 'target' | 'changes'>
// daysAgo: when it happened, so sign-ins after SSO was turned on use it.
type Template = { weight: number; admin?: boolean; make: (pick: Picker, daysAgo: number) => Made }

const TEMPLATES: Template[] = [
  {
    weight: 9,
    make: (pick, daysAgo) => ({
      action: 'sign_in', kind: '', target: pick(['Web app', 'Web app', 'Desktop app', 'Mobile app']),
      changes: [
        { field: 'Method', after: pick(daysAgo < SSO_DAYS_AGO ? ['SSO', 'SSO', 'Passkey'] : ['Password', 'Passkey', 'Password']) },
        { field: 'Browser', after: pick(['Chrome on macOS', 'Edge on Windows', 'Safari on iOS', 'Firefox on Linux']) },
        { field: 'Two-step', after: pick(['Passed', 'Passed', 'Not set up']) },
      ],
    }),
  },
  {
    weight: 2,
    admin: true,
    make: (pick) => {
      const email = pick(INVITEES)
      return {
        action: 'members', verb: 'invited', kind: '', target: email,
        changes: [{ field: 'Email', after: email }, { field: 'Role', after: 'Member' }, { field: 'Invite expires', after: 'in 7 days' }],
      }
    },
  },
  {
    weight: 1,
    admin: true,
    make: (pick) => {
      const [before, after] = pick([['Member', 'Admin'], ['Admin', 'Member']])
      return { action: 'members', verb: 'changed the role of', kind: '', target: pick(PEOPLE).email, changes: [{ field: 'Role', before, after }] }
    },
  },
  {
    weight: 3,
    make: (pick) => ({
      action: 'connectors', verb: 'connected', kind: '', target: pick(CONNECTORS),
      changes: [{ field: 'Status', before: 'Not connected', after: 'Connected' }, { field: 'Access', after: pick(['Read only', 'Read and write']) }],
    }),
  },
  {
    weight: 1,
    make: (pick) => ({
      action: 'connectors', verb: 'disconnected', kind: '', target: pick(CONNECTORS),
      changes: [{ field: 'Status', before: 'Connected', after: 'Not connected' }],
    }),
  },
  {
    weight: 2,
    make: (pick) => {
      const name = pick(AGENTS)
      return {
        action: 'agents', verb: 'created', kind: 'agent', target: name,
        changes: [
          { field: 'Name', after: name },
          { field: 'Trigger', after: pick(['Every Monday at 08:00', 'New email in Mail', 'Manual']) },
          { field: 'Model', after: pick(['Balanced', 'Depth']) },
        ],
      }
    },
  },
  {
    weight: 4,
    make: (pick) => ({
      action: 'agents', verb: 'ran', kind: 'agent', target: pick(AGENTS),
      changes: [
        { field: 'Trigger', after: pick(['Schedule', 'Manual', 'New email']) },
        { field: 'Result', after: pick(['Succeeded', 'Succeeded', 'Waiting for approval', 'Failed']) },
        { field: 'Duration', after: pick(['38 s', '1 min 12 s', '2 min 4 s', '54 s']) },
      ],
    }),
  },
  {
    weight: 1,
    make: (pick) => {
      const name = pick(AGENTS)
      return { action: 'agents', verb: 'deleted', kind: 'agent', target: `${name} (copy)`, changes: [{ field: 'Name', before: `${name} (copy)` }] }
    },
  },
  {
    weight: 2,
    make: (pick) => ({
      action: 'sharing', verb: 'shared a public link to', kind: 'chat', target: pick(CHATS),
      changes: [{ field: 'Link access', before: 'Only people at Acme', after: 'Anyone with the link' }],
    }),
  },
  {
    weight: 1,
    make: (pick) => ({
      action: 'sharing', verb: 'revoked the public link to', kind: 'chat', target: pick(CHATS),
      changes: [{ field: 'Link access', before: 'Anyone with the link', after: 'Off' }],
    }),
  },
  {
    weight: 1,
    make: (pick) => {
      const name = pick(BASES)
      return {
        action: 'knowledge', verb: 'created', kind: 'knowledge base', target: name,
        changes: [{ field: 'Name', after: name }, { field: 'Access', after: pick(['Everyone at Acme', 'Only invited people']) }],
      }
    },
  },
  {
    weight: 2,
    make: (pick) => ({
      action: 'knowledge', verb: 'added sources to', kind: 'knowledge base', target: pick(BASES),
      changes: [{ field: 'Sources', after: pick(['3 files uploaded', 'Wiki › Support', 'docs.example.com']) }],
    }),
  },
]

// One-off admin changes, at fixed times: they tell the story of the set-up.
const FIXED: (Made & { actor: string; daysAgo: number; hour: number; minute: number })[] = [
  {
    actor: YOU.name, daysAgo: 27, hour: 10, minute: 14, action: 'settings', verb: 'changed', kind: '', target: 'chat retention',
    changes: [{ field: 'Keep chats', before: 'Until people delete them', after: '1 year' }],
  },
  {
    actor: YOU.name, daysAgo: 21, hour: 15, minute: 2, action: 'connectors', verb: 'blocked', kind: 'connector', target: 'CRM',
    changes: [{ field: 'Status', before: 'Allowed', after: 'Blocked by admin' }, { field: 'People affected', after: '4 connected' }],
  },
  {
    actor: 'Jonas Weber', daysAgo: 14, hour: 11, minute: 40, action: 'settings', verb: 'set up', kind: '', target: 'SAML single sign-on',
    changes: [{ field: 'Identity provider', after: 'https://idp.example.com' }, { field: 'Status', before: 'Not set up', after: 'Testing' }],
  },
  {
    actor: YOU.name, daysAgo: SSO_DAYS_AGO, hour: 9, minute: 26, action: 'settings', verb: 'enabled', kind: '', target: 'SSO',
    changes: [{ field: 'SSO', before: 'Off', after: 'On' }, { field: 'Domains', after: 'example.com' }],
  },
  {
    actor: 'Grace Kim', daysAgo: 9, hour: 16, minute: 51, action: 'data', verb: 'exported', kind: '', target: 'organisation data',
    changes: [{ field: 'Contents', after: 'Chats, projects and members' }, { field: 'Format', after: 'JSON (zip)' }, { field: 'Size', after: '184 MB' }],
  },
  {
    actor: YOU.name, daysAgo: 4, hour: 13, minute: 8, action: 'settings', verb: 'changed', kind: '', target: 'session length',
    changes: [{ field: 'Sign in again after', before: '30 days', after: '14 days' }],
  },
  {
    actor: 'Grace Kim', daysAgo: 1, hour: 17, minute: 33, action: 'data', verb: 'exported', kind: '', target: 'the audit log',
    changes: [{ field: 'Range', after: 'Last 30 days' }, { field: 'Format', after: 'CSV' }],
  },
]

function makeEvents(count: number): AuditEvent<AiAuditAction>[] {
  const rand = seededRandom(7310)
  const pick: Picker = (list) => list[Math.floor(rand() * list.length)]
  const total = TEMPLATES.reduce((sum, t) => sum + t.weight, 0)
  // Each person mostly works from one address (documentation ranges, not real ones).
  const home = new Map(AUDIT_ACTORS.map((name) => [name, `198.51.100.${10 + Math.floor(rand() * 240)}`]))
  const ipFor = (actor: string) => (rand() < 0.85 ? home.get(actor)! : `203.0.113.${10 + Math.floor(rand() * 240)}`)
  const idFor = () => `evt_${Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0')}`
  const nowMs = AUDIT_NOW.getTime()
  const events: AuditEvent<AiAuditAction>[] = []

  for (let i = 0; i < count; i++) {
    let roll = rand() * total
    const template = TEMPLATES.find((t) => (roll -= t.weight) < 0) ?? TEMPLATES[0]
    const actor = pick(template.admin ? ADMINS : EVERYONE).name
    // Working hours, 08:00 to 19:00, on one of the last 30 days; never after now.
    const daysAgo = Math.floor(rand() * 30)
    let time = at(daysAgo, 8 + Math.floor(rand() * 11), Math.floor(rand() * 60))
    if (time > nowMs) time -= (2 + Math.floor(rand() * 8)) * 60 * MINUTE
    events.push({ id: idFor(), actor, ip: ipFor(actor), at: new Date(time), ...template.make(pick, daysAgo) })
  }
  for (const { daysAgo, hour, minute, ...event } of FIXED) {
    events.push({ id: idFor(), ip: ipFor(event.actor), at: new Date(at(daysAgo, hour, minute)), ...event })
  }
  return events.sort((a, b) => b.at.getTime() - a.at.getTime())
}

export const AI_AUDIT_EVENTS = makeEvents(113)
