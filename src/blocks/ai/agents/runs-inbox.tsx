import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkBadge01Icon, InboxIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { formatShortDate, relativeDay } from '@/lib/format'
import type { AgentRun } from './agent-types'
import { RunCard } from './run-card'
import type { RunAgent } from './run-status'

// The runs inbox: every run of every agent, in one place to check. Filter
// chips with counts: Needs you (runs waiting for approval, and failed runs
// not opened yet), Running, Done and All. Runs are grouped by the day they
// started, newest first, under a line that says what is going on ("2
// running · 1 needs approval"). Each filter has its own empty state.

export type RunsFilter = 'needs-you' | 'running' | 'done' | 'all'

const FILTERS: { value: RunsFilter; label: string }[] = [
  { value: 'needs-you', label: 'Needs you' },
  { value: 'running', label: 'Running' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
]

export const needsYou = (run: AgentRun) =>
  run.status === 'awaiting' || (run.status === 'failed' && !run.seen)

const MATCH: Record<RunsFilter, (run: AgentRun) => boolean> = {
  'needs-you': needsYou,
  running: (run) => run.status === 'running' || run.status === 'queued',
  done: (run) => run.status === 'succeeded' || run.status === 'failed' || run.status === 'cancelled',
  all: () => true,
}

const EMPTY: Record<RunsFilter, { title: string; description: string }> = {
  'needs-you': { title: 'Nothing needs you', description: 'Runs that wait for your approval, or that failed, show up here.' },
  running: { title: 'Nothing running', description: 'Start a run, or wait for a schedule or an event to start one.' },
  done: { title: 'No finished runs yet', description: 'Runs that succeeded, failed or were cancelled are kept here.' },
  all: { title: 'No runs yet', description: 'Each time an agent works, on request, on a schedule or on an event, it shows up here.' },
}

// "2 running · 1 needs approval · 1 failed", or "All quiet".
export function runsSummary(runs: AgentRun[]) {
  const running = runs.filter(MATCH.running).length
  const awaiting = runs.filter((r) => r.status === 'awaiting').length
  const failed = runs.filter((r) => r.status === 'failed' && !r.seen).length
  const parts = [
    running ? `${running} running` : '',
    awaiting ? `${awaiting} ${awaiting === 1 ? 'needs' : 'need'} approval` : '',
    failed ? `${failed} failed` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'All quiet: nothing running or waiting'
}

function groupByDay(runs: AgentRun[], now: number) {
  const groups: { label: string; runs: AgentRun[] }[] = []
  for (const run of [...runs].sort((a, b) => b.startedAt - a.startedAt)) {
    const label = relativeDay(run.startedAt, now) ?? formatShortDate(run.startedAt)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.runs.push(run)
    else groups.push({ label, runs: [run] })
  }
  return groups
}

export function RunsInbox({
  runs, agentOf, onOpen, onApprove, onDeny, onCancel, filter: filterProp, onFilterChange,
  defaultFilter = 'needs-you', actions, now = Date.now(), className,
}: {
  runs: AgentRun[]
  agentOf: (agentId: string) => RunAgent
  onOpen: (runId: string) => void
  // Allow once and Deny on a waiting run's card.
  onApprove: (runId: string) => void
  onDeny: (runId: string) => void
  onCancel: (runId: string) => void
  // Controlled filter; leave out to let the inbox keep its own.
  filter?: RunsFilter
  onFilterChange?: (filter: RunsFilter) => void
  defaultFilter?: RunsFilter
  // Buttons at the right of the summary line (Start a run).
  actions?: ReactNode
  now?: number
  className?: string
}) {
  const [own, setOwn] = useState<RunsFilter>(defaultFilter)
  const filter = filterProp ?? own
  const setFilter = (value: RunsFilter) => {
    setOwn(value)
    onFilterChange?.(value)
  }
  const shown = runs.filter(MATCH[filter])
  const groups = groupByDay(shown, now)
  const empty = EMPTY[filter]

  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="text-muted-foreground min-w-0 flex-1 text-xs" aria-live="polite">{runsSummary(runs)}</p>
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>

      <div role="group" aria-label="Filter runs" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
        {FILTERS.map((chip) => {
          const active = filter === chip.value
          const count = runs.filter(MATCH[chip.value]).length
          return (
            <Button
              key={chip.value}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={active}
              onClick={() => setFilter(chip.value)}
              className={cn('shrink-0 rounded-full', !active && 'text-muted-foreground')}
            >
              {chip.label}
              <span className={cn('tabular-nums', chip.value === 'needs-you' && count > 0 ? 'text-brand' : 'text-muted-foreground')}>
                {count}
              </span>
            </Button>
          )
        })}
      </div>

      {groups.length === 0 ? (
        <Empty className="border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={filter === 'needs-you' ? CheckmarkBadge01Icon : InboxIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>{empty.title}</EmptyTitle>
            <EmptyDescription>{empty.description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid min-w-0 gap-4">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label} className="grid min-w-0 gap-1.5">
              <h4 className="text-muted-foreground text-[11px] font-medium">{group.label}</h4>
              <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5">
                {group.runs.map((run) => (
                  <li key={run.id} className="min-w-0">
                    <RunCard
                      run={run}
                      agent={agentOf(run.agentId)}
                      now={now}
                      onOpen={() => onOpen(run.id)}
                      onApprove={() => onApprove(run.id)}
                      onDeny={() => onDeny(run.id)}
                      onCancel={() => onCancel(run.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
