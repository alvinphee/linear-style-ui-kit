import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon, BotIcon, BubbleChatIcon, Clock01Icon, CursorPointer01Icon, Database01Icon, FlashIcon, MoreHorizontalIcon,
  PlayIcon, Plug01Icon, PuzzleIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { IconMark } from '@/components/mark'
import { describeRecurrence, LAST_DAY, ordinal, type Recurrence } from '@/components/recurrence-picker'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { formatAgo, formatShortDate } from '@/lib/format'
import type { Agent, AgentTemplate, AgentTrigger, AgentTriggerKind } from './agent-types'

// One agent on a card, for a gallery: its mark, name and what it is for,
// what starts it (Manual, "Mondays 09:00", "New email in Mail"), what it
// can use (knowledge, connectors, skills) and how its last run went. Chat
// and Run now sit at the foot. The whole card opens the agent (onOpen).
//
// The template variant is a ready-made agent in Explore: who made it, how
// many people use it, and Use template in place of Chat and Run now.
//
// Also here: AgentMark (the agent's icon in its colour), describeTrigger
// (a trigger in words) and AgentStatusLine (the status line on its own).

// How the agent is doing, from its latest run.
export type AgentStatus = 'idle' | 'running' | 'awaiting' | 'failed'

export const TRIGGER_ICONS: Record<AgentTriggerKind, IconSvgElement> = {
  manual: CursorPointer01Icon,
  schedule: Clock01Icon,
  event: FlashIcon,
}

export function AgentMark({ agent, size = 'md', className }: {
  agent: { name: string; icon?: IconSvgElement; colour?: string }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return <IconMark icon={agent.icon ?? BotIcon} colour={agent.colour ?? 'var(--brand)'} size={size} className={className} />
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_PLURAL = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']
// Monday first, as the recurrence picker shows the week.
const WEEK = [1, 2, 3, 4, 5, 6, 0]

// A recurrence in a few words, for a chip: "Mondays 09:00", "Mon, Thu 09:00".
function shortRecurrence(r: Recurrence) {
  switch (r.kind) {
    case 'once': {
      const [y, m, d] = (r.date ?? '').split('-').map(Number)
      return y && m && d ? `Once, ${formatShortDate(new Date(y, m - 1, d))} ${r.time}` : `Once ${r.time}`
    }
    case 'daily':
      return `Daily ${r.time}`
    case 'weekdays':
      return `Weekdays ${r.time}`
    case 'weekly': {
      const days = WEEK.filter((d) => r.days?.includes(d))
      if (days.length === 0) return 'Weekly, no days'
      if (days.length === 7) return `Daily ${r.time}`
      if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return `Weekdays ${r.time}`
      if (days.length === 1) return `${DAY_PLURAL[days[0]]} ${r.time}`
      return `${days.map((d) => DAY_SHORT[d]).join(', ')} ${r.time}`
    }
    case 'monthly': {
      const dom = r.dayOfMonth ?? 1
      return dom === LAST_DAY ? `Monthly, last day ${r.time}` : `Monthly, ${ordinal(dom)} ${r.time}`
    }
  }
}

// A trigger in words. Short for a chip ("Mondays 09:00", "New email in
// Mail"); with `long`, the full schedule and the event's filter.
export function describeTrigger(trigger: AgentTrigger, connectorName?: string, { long = false }: { long?: boolean } = {}) {
  switch (trigger.kind) {
    case 'manual':
      return long ? 'When someone runs it or chats with it' : 'Manual'
    case 'schedule':
      return long ? describeRecurrence(trigger.recurrence) : shortRecurrence(trigger.recurrence)
    case 'event': {
      const where = connectorName ? `${trigger.eventLabel} in ${connectorName}` : trigger.eventLabel
      return long && trigger.filter ? `${where}, matching ${trigger.filter}` : where
    }
  }
}

const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

// The status in words, in its tone: Running with a spinner, Needs approval
// in the brand colour, Failed in red, else when it last ran.
export function AgentStatusLine({ status = 'idle', lastRunAt, now, className }: {
  status?: AgentStatus
  lastRunAt?: number
  // The clock "2 h ago" is measured from (a demo clock). Now when left out.
  now?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-[11px]',
        status === 'running' && 'text-status-progress',
        status === 'awaiting' && 'text-brand font-medium',
        status === 'failed' && 'text-destructive',
        status === 'idle' && 'text-muted-foreground',
        className,
      )}
    >
      {status === 'running' && <Spinner aria-hidden role="presentation" className="size-3 shrink-0" />}
      {status === 'awaiting' && <span aria-hidden className="bg-brand size-1.5 shrink-0 rounded-full" />}
      {status === 'failed' && <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3 shrink-0" />}
      {status === 'idle' && <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3 shrink-0" />}
      <span className="truncate">
        {status === 'running' && 'Running…'}
        {status === 'awaiting' && 'Needs approval'}
        {status === 'failed' && (lastRunAt ? `Failed ${formatAgo(lastRunAt, now)}` : 'Last run failed')}
        {status === 'idle' && (lastRunAt ? `Last run ${formatAgo(lastRunAt, now)}` : 'Never run')}
      </span>
    </span>
  )
}

// A trigger as a small pill. A paused trigger is dimmed.
export function TriggerChip({ trigger, connectorName, className }: {
  trigger: AgentTrigger
  connectorName?: string
  className?: string
}) {
  const text = describeTrigger(trigger, connectorName)
  return (
    <span
      title={trigger.enabled ? undefined : `${text} (paused)`}
      className={cn(
        'text-muted-foreground inline-flex h-5 max-w-full min-w-0 items-center gap-1 rounded-full border px-1.5 text-[11px]',
        !trigger.enabled && 'opacity-60',
        className,
      )}
    >
      <HugeiconsIcon icon={TRIGGER_ICONS[trigger.kind]} strokeWidth={2} className="size-3 shrink-0" />
      <span className="truncate">{text}</span>
      {!trigger.enabled && <span className="sr-only">(paused)</span>}
    </span>
  )
}

// What the agent can use, as counts: knowledge (files and knowledge
// bases), connectors and skills.
export function agentUses(agent: Pick<Agent, 'files' | 'knowledgeBases' | 'connectors' | 'skills'>) {
  return {
    knowledge: agent.files.length + agent.knowledgeBases.length,
    connectors: Object.keys(agent.connectors).length,
    skills: agent.skills.length,
  }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function UsesList({ agent }: { agent: Pick<Agent, 'files' | 'knowledgeBases' | 'connectors' | 'skills'> }) {
  const uses = agentUses(agent)
  const items = [
    { id: 'knowledge', icon: Database01Icon, count: uses.knowledge, label: plural(uses.knowledge, 'knowledge source') },
    { id: 'connectors', icon: Plug01Icon, count: uses.connectors, label: plural(uses.connectors, 'connector') },
    { id: 'skills', icon: PuzzleIcon, count: uses.skills, label: plural(uses.skills, 'skill') },
  ].filter((i) => i.count > 0)
  if (!items.length) return <span className="text-muted-foreground text-[11px]">Instructions only</span>
  return (
    <ul aria-label="What it can use" className="text-muted-foreground flex shrink-0 items-center gap-2.5 text-[11px]">
      {items.map((i) => (
        <li key={i.id} title={i.label} className="flex items-center gap-1 tabular-nums">
          <HugeiconsIcon icon={i.icon} strokeWidth={2} aria-hidden className="size-3" />
          <span aria-hidden>{i.count}</span>
          <span className="sr-only">{i.label}</span>
        </li>
      ))}
    </ul>
  )
}

export type AgentCardProps = {
  agent: Agent | AgentTemplate
  status?: AgentStatus
  lastRunAt?: number
  // Who made it, when it is not yours: "by Sam Lee".
  owner?: string
  onOpen: () => void
  // Left out: no Chat button.
  onChat?: () => void
  // Left out: no Run now button.
  onRun?: () => void
  // Items for the card's menu (DropdownMenuItem…). Left out: no menu.
  menu?: ReactNode
  variant?: 'card' | 'template'
  // How many people use the template, when the template does not say.
  uses?: number
  // Use template; onOpen when left out.
  onUse?: () => void
  // A connector's name from its id, for event triggers: "in Mail".
  connectorName?: (id: string) => string | undefined
  // At most this many trigger chips, then "+2".
  maxTriggers?: number
  // The clock "2 h ago" is measured from (a demo clock). Now when left out.
  now?: number
  className?: string
}

export function AgentCard({
  agent, status = 'idle', lastRunAt, owner, onOpen, onChat, onRun, menu, variant = 'card', uses, onUse,
  connectorName, maxTriggers = 2, now, className,
}: AgentCardProps) {
  const template = variant === 'template'
  const publisher = 'publisher' in agent ? agent.publisher : undefined
  const useCount = uses ?? ('uses' in agent ? agent.uses : undefined)
  const triggers: AgentTrigger[] = agent.triggers.length ? agent.triggers : [{ id: 'manual', kind: 'manual', enabled: true }]
  const shown = triggers.slice(0, maxTriggers)
  const more = triggers.length - shown.length
  const byline = template ? ('category' in agent ? agent.category : undefined) : owner && `by ${owner}`

  return (
    <div
      data-status={template ? undefined : status}
      className={cn(
        'bg-card hover:border-foreground/15 relative flex min-w-0 flex-col gap-2.5 rounded-lg border p-3 transition-colors',
        !template && status === 'awaiting' && 'border-brand/40',
        !template && status === 'failed' && 'border-destructive/30',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <AgentMark agent={agent} />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h4 className="flex min-w-0 text-xs font-medium">
            {/* The name is the card's button; its ::after covers the card. */}
            <button
              type="button"
              onClick={onOpen}
              className="focus-visible:ring-ring/40 min-w-0 truncate rounded text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:ring-2"
            >
              {agent.name}
            </button>
          </h4>
          {byline && <span className="text-muted-foreground truncate text-[11px]">{byline}</span>}
        </div>
        {menu && (
          <div className="relative z-[1] -mt-0.5 -mr-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Options for ${agent.name}`} className="text-muted-foreground">
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">{menu}</DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <p className="text-muted-foreground line-clamp-2 min-h-[2lh] text-xs leading-relaxed">{agent.description}</p>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <ul aria-label="Triggers" className="flex min-w-0 flex-wrap items-center gap-1">
          {shown.map((t) => (
            <li key={t.id} className="flex min-w-0 max-w-full">
              <TriggerChip trigger={t} connectorName={t.kind === 'event' ? connectorName?.(t.connectorId) : undefined} />
            </li>
          ))}
          {more > 0 && <li className="text-muted-foreground text-[11px] tabular-nums">+{more}</li>}
        </ul>
        <UsesList agent={agent} />
      </div>

      <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2 border-t pt-2.5">
        {template ? (
          <span className="text-muted-foreground min-w-0 truncate text-[11px]">
            {publisher}
            {publisher && useCount !== undefined && ' · '}
            {useCount !== undefined && `${COMPACT.format(useCount)} ${useCount === 1 ? 'use' : 'uses'}`}
          </span>
        ) : (
          <AgentStatusLine status={status} lastRunAt={lastRunAt} now={now} className="flex-1" />
        )}
        <div className="relative z-[1] flex shrink-0 items-center gap-1">
          {template ? (
            <Button variant="outline" size="sm" onClick={onUse ?? onOpen} aria-label={`Use template ${agent.name}`}>
              Use template
            </Button>
          ) : (
            <>
              {onRun && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRun}
                  disabled={status === 'running'}
                  aria-label={`Run ${agent.name} now`}
                  className="text-muted-foreground"
                >
                  <HugeiconsIcon icon={PlayIcon} strokeWidth={2} data-icon="inline-start" />
                  Run now
                </Button>
              )}
              {onChat && (
                <Button variant="outline" size="sm" onClick={onChat} aria-label={`Chat with ${agent.name}`}>
                  <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} data-icon="inline-start" />
                  Chat
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
