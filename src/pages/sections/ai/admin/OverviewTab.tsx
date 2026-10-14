import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon, Analytics01Icon, Archive02Icon, ArrowRight01Icon, BubbleChatIcon, CheckmarkCircle02Icon, Coins01Icon,
  Database01Icon, Key01Icon, LogsIcon, Mail01Icon, Plug01Icon, RoboticIcon, SecurityLockIcon, Shield01Icon, UserAdd01Icon,
  UserGroupIcon, UserMultiple02Icon, UserShield01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import type { ConnectorRequest } from '@/blocks/ai/admin/connector-policy'
import { KpiCard, KpiGrid, type KpiDelta } from '@/blocks/kpi-card'
import { SettingsGroup, SettingsHeader } from '@/blocks/settings-page'
import { LetterMark } from '@/components/mark'
import { UserAvatar } from '@/components/person'
import { UsageMeter } from '@/components/usage-meter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatAgo, formatNumber } from '@/lib/format'
import { plural } from '@/lib/text'
import { at, now } from '../data'
import { CONNECTORS } from '../settings/connectors-data'
import { useStoredState } from '../settings/prefs'
import { CONNECTOR_REQUESTS_KEY, sampleConnectorRequests } from './ConnectorsPolicyTab'
import { MY_ROLE, ORG, useOrgPolicy } from './org'
import { monthToDate, USAGE_PEOPLE } from './usage-data'

// The admin console's first page: the organisation and its plan, how many
// seats are taken, this month's usage, what needs an admin's attention (read
// from the live policy, so an item goes once it is dealt with), the latest
// admin activity, and a link to each section. Every figure is made up.

// Invites sent and not yet accepted. Each holds a seat.
const PENDING_INVITES = 3

const ACTIVITY: { id: string; who: string; what: string; time: number }[] = [
  { id: 'a1', who: 'Alex Morgan', what: 'blocked the CRM connector for everyone', time: at(0, 15, 12) },
  { id: 'a2', who: 'Priya Shah', what: 'invited 3 people to Acme', time: at(0, 11, 4) },
  { id: 'a3', who: 'Priya Nair', what: 'asked to allow the CRM connector', time: at(1, 16, 48) },
  { id: 'a4', who: 'Alex Morgan', what: 'made Depth Max available to everyone', time: at(2, 10, 30) },
  { id: 'a5', who: 'Alex Morgan', what: 'changed Grace Kim’s role to Admin', time: at(4, 9, 5) },
]

// The admin console's sections, as the quick links name them.
const ADMIN_LINKS: { id: string; label: string; hint: string; icon: IconSvgElement }[] = [
  { id: 'members', label: 'Members', hint: 'Invite people, change roles, remove access', icon: UserGroupIcon },
  { id: 'roles', label: 'Roles and permissions', hint: 'What owners, admins and members may do', icon: UserShield01Icon },
  { id: 'usage', label: 'Usage', hint: 'Active users, messages and credits by team', icon: Analytics01Icon },
  { id: 'sso', label: 'SSO and provisioning', hint: 'Identity provider and verified domains', icon: Key01Icon },
  { id: 'security', label: 'Security policies', hint: 'Two-step sign-in and session length', icon: SecurityLockIcon },
  { id: 'models', label: 'Models and features', hint: 'Which models and tools people may use', icon: AiBrain01Icon },
  { id: 'connectors', label: 'Connectors', hint: 'Which apps people may connect', icon: Plug01Icon },
  { id: 'knowledge', label: 'Knowledge', hint: 'Knowledge bases shared with everyone', icon: Database01Icon },
  { id: 'data', label: 'Data and retention', hint: 'How long chats are kept, training, shared links', icon: Archive02Icon },
  { id: 'audit', label: 'Audit log', hint: 'Who changed what, and when', icon: LogsIcon },
]

const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', member: 'Member' } as const

function change(current: number, before: number, tone?: KpiDelta['tone']): KpiDelta | undefined {
  if (!before) return undefined
  const value = ((current - before) / before) * 100
  return { direction: value >= 0 ? 'up' : 'down', text: `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}%`, tone }
}

type AttentionItem = { id: string; icon: IconSvgElement; title: string; hint: ReactNode; action: string; section: string }

export function OverviewTab({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { policy } = useOrgPolicy()
  const month = monthToDate()
  const members = USAGE_PEOPLE.length
  const seatsUsed = members + PENDING_INVITES
  const versus = `vs ${month.lastMonth}`
  const spark = (key: 'activePeople' | 'messages' | 'agentRuns' | 'credits') => ({
    data: month.series.map((d) => d[key]),
    previous: month.previous.map((d) => d[key]),
  })

  const blocked = policy.connectors.blocked
    .map((id) => CONNECTORS.find((c) => c.id === id)?.name ?? id)
  const connectorName = (id: string) => CONNECTORS.find((c) => c.id === id)?.name ?? id
  const [requests] = useStoredState<ConnectorRequest[]>(CONNECTOR_REQUESTS_KEY, sampleConnectorRequests())

  const attention: AttentionItem[] = [
    {
      id: 'invites', icon: Mail01Icon, section: 'members', action: 'Review',
      title: `${plural(PENDING_INVITES, 'invite')} not accepted yet`,
      hint: 'Each one holds a seat until it is accepted or revoked.',
    },
    ...(!policy.security.ssoRequired ? [{
      id: 'sso', icon: Shield01Icon, section: 'sso', action: 'Set up',
      title: 'Single sign-on is not set up',
      hint: `People sign in with an email and password. Connect your identity provider for ${ORG.domain}.`,
    }] : []),
    // The same requests as Admin › Connectors, so approving one there clears it here.
    ...(requests.length ? [{
      id: 'connectors', icon: Plug01Icon, section: 'connectors', action: 'Review',
      title: `${plural(requests.length, 'request')} to allow a connector`,
      hint: (
        <>
          {requests.map((r) => `${r.requester} asked for ${connectorName(r.connectorId)}`).join('; ')}.
          {blocked.length > 0 && ` ${plural(blocked.length, 'connector')} blocked: ${blocked.join(', ')}.`}
        </>
      ),
    }] : []),
    ...(policy.retentionDays === null ? [{
      id: 'retention', icon: Archive02Icon, section: 'data', action: 'Set',
      title: 'No retention period set',
      hint: 'Chats are kept until people delete them.',
    }] : []),
  ]

  return (
    <>
      <SettingsHeader
        title="Overview"
        description={`How ${ORG.name} uses the assistant, and what needs an admin.`}
      />

      <SettingsGroup>
        <div className="flex flex-wrap items-start gap-3 p-3">
          <LetterMark text={ORG.name.slice(0, 1)} colour="var(--brand)" size="lg" />
          <div className="grid min-w-0 flex-1 gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{ORG.name}</span>
              <Badge variant="secondary">{ORG.plan} plan</Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {ORG.domain} · You are the {ROLE_LABEL[MY_ROLE].toLowerCase()}
            </p>
          </div>
        </div>
        <UsageMeter
          size="md"
          className="p-3"
          value={(seatsUsed / ORG.seats) * 100}
          label="Seats"
          count={`${seatsUsed} / ${ORG.seats} used`}
          note={`${plural(members, 'member')} · ${plural(PENDING_INVITES, 'invite')} pending`}
          noteEnd={`${plural(ORG.seats - seatsUsed, 'seat')} left`}
          warnAt={80}
          dangerAt={100}
        >
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast('Add seats', { description: 'Demo only. Nothing is charged or changed.' })}
            >
              <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" /> Add seats
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('members')}>Manage members</Button>
          </div>
        </UsageMeter>
      </SettingsGroup>

      <section className="@container grid min-w-0 gap-2" aria-labelledby="admin-overview-month">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="grid min-w-0 gap-0.5">
            <h3 id="admin-overview-month" className="text-xs font-medium">{month.month} so far</h3>
            <p className="text-muted-foreground text-[11px] leading-4">Against all of {month.lastMonth}.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('usage')}>
            Usage <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
          </Button>
        </div>
        <KpiGrid breakpoints="container">
          <KpiCard
            label="Active users"
            icon={UserMultiple02Icon}
            value={formatNumber(month.totals.activePeople)}
            hint={`of ${members}`}
            delta={change(month.totals.activePeople, month.previousTotals.activePeople)}
            footnote={versus}
            sparkline={spark('activePeople')}
            onClick={() => onNavigate('usage')}
          />
          <KpiCard
            label="Messages"
            icon={BubbleChatIcon}
            value={formatNumber(month.totals.messages)}
            delta={change(month.totals.messages, month.previousTotals.messages)}
            footnote={versus}
            sparkline={spark('messages')}
            onClick={() => onNavigate('usage')}
          />
          <KpiCard
            label="Agent runs"
            icon={RoboticIcon}
            value={formatNumber(month.totals.agentRuns)}
            delta={change(month.totals.agentRuns, month.previousTotals.agentRuns)}
            footnote={versus}
            sparkline={spark('agentRuns')}
            onClick={() => onNavigate('usage')}
          />
          <KpiCard
            label="Credits used"
            icon={Coins01Icon}
            value={formatNumber(Math.round(month.totals.credits))}
            delta={change(month.totals.credits, month.previousTotals.credits, 'neutral')}
            footnote={versus}
            sparkline={spark('credits')}
            onClick={() => onNavigate('usage')}
          />
        </KpiGrid>
      </section>

      <SettingsGroup
        title="Needs attention"
        description={attention.length ? plural(attention.length, 'thing') + ' to look at' : undefined}
      >
        {attention.length ? (
          <ul className="divide-y">
            {attention.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                <span className="bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-md">
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" />
                </span>
                <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
                  <span className="text-xs font-medium">{item.title}</span>
                  <span className="text-muted-foreground text-[11px] leading-4">{item.hint}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`${item.action}: ${item.title}`}
                  onClick={() => onNavigate(item.section)}
                >
                  {item.action}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-xs">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="text-status-done size-4" />
            Nothing needs your attention.
          </p>
        )}
      </SettingsGroup>

      <SettingsGroup
        title="Recent admin activity"
        action={
          <Button variant="ghost" size="sm" onClick={() => onNavigate('audit')}>
            Audit log <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
          </Button>
        }
      >
        <ul className="divide-y">
          {ACTIVITY.map((line) => (
            <li key={line.id} className="flex items-start gap-2.5 px-3 py-2.5">
              <UserAvatar name={line.who} className="size-5" />
              <p className="min-w-0 flex-1 text-xs leading-5">
                <span className="font-medium">{line.who}</span> {line.what}
              </p>
              <time dateTime={new Date(line.time).toISOString()} className="text-muted-foreground shrink-0 text-[11px] leading-5">
                {formatAgo(line.time, now())}
              </time>
            </li>
          ))}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="Admin console" className="@container">
        <ul className="grid grid-cols-1 gap-px p-1 @md:grid-cols-2">
          {ADMIN_LINKS.map((link) => (
            <li key={link.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onNavigate(link.id)}
                className="hover:bg-accent/60 focus-visible:ring-ring/40 flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset"
              >
                <HugeiconsIcon icon={link.icon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate text-xs font-medium">{link.label}</span>
                  <span className="text-muted-foreground truncate text-[11px]">{link.hint}</span>
                </span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </SettingsGroup>
    </>
  )
}
