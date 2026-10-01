import { useLayoutEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CheckmarkCircle02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LABELS, PRIORITY, type Job, type Priority } from '../../data'
import { useJobs } from '../../jobs-store'
import { goTo } from '../../nav'
import { LabelDot } from '../FilterBar'
import { Panel } from '../shared'
import { UserAvatar } from '@/components/person'
import { PriorityIcon, StatusIcon } from '../StatusSection'
import { AiLabel, IconAction, useTimers } from './shared'
import { describe, patchFor, suggestFor, type Suggestion } from './triage'

type Row = { job: Job; items: Suggestion[] }

const VISIBLE_ROWS = 3
const COLLAPSE_MS = 220

// Jobs missing an assignee, a label or a priority come before the ones that
// only get an extra suggestion.
const missingSomething = (job: Job) => !job.driver || !job.labels.length || job.priority === 'none'

export function TriagePanel() {
  const { jobs, updateJob, select } = useJobs()
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [leaving, setLeaving] = useState<Record<string, Row>>({})
  const listRef = useRef<HTMLUListElement>(null)
  const { later } = useTimers()
  // Undo runs from a toast later on. The store logs each change against the
  // jobs it saw when the update function was made, so undo needs a fresh one.
  const latestUpdate = useRef(updateJob)
  useLayoutEffect(() => {
    latestUpdate.current = updateJob
  })

  // A collapsing row is ordered by its snapshot, so it does not jump while it closes.
  const ordered = [...jobs].sort(
    (a, b) => Number(missingSomething(leaving[b.id]?.job ?? b)) - Number(missingSomething(leaving[a.id]?.job ?? a)),
  )
  const liveRows = ordered
    .map((job) => ({ job, items: suggestFor(job, jobs).filter((s) => !dismissed.has(s.key)) }))
    .filter((row) => row.items.length > 0 && !leaving[row.job.id])
  const shown = liveRows.slice(0, VISIBLE_ROWS)
  const waiting = liveRows.length - shown.length
  const rows = ordered.flatMap((job) => {
    if (leaving[job.id]) return [{ ...leaving[job.id], leaving: true }]
    const row = shown.find((r) => r.job.id === job.id)
    return row ? [{ ...row, leaving: false }] : []
  })
  const suggestionCount = shown.reduce((n, r) => n + r.items.length, 0)

  function collapse(row: Row) {
    // Keep keyboard focus in the panel when the focused row goes away.
    if (listRef.current?.contains(document.activeElement)) listRef.current.focus()
    setLeaving((all) => ({ ...all, [row.job.id]: row }))
    later(() => {
      setLeaving((all) => {
        const next = { ...all }
        delete next[row.job.id]
        return next
      })
    }, COLLAPSE_MS)
  }

  function accept(row: Row, items = row.items) {
    const { patch, undo } = patchFor(row.job, items)
    if (items.length === row.items.length) collapse(row)
    updateJob(row.job.id, patch)
    toast.success(`Updated ${row.job.id}`, {
      description: items.map(describe).join(', '),
      action: { label: 'Undo', onClick: () => latestUpdate.current(row.job.id, undo) },
    })
  }

  function acceptAll() {
    const undos = shown.map((row) => {
      const { patch, undo } = patchFor(row.job, row.items)
      collapse(row)
      updateJob(row.job.id, patch)
      return { id: row.job.id, undo }
    })
    toast.success(`Updated ${undos.length} ${undos.length === 1 ? 'job' : 'jobs'}`, {
      description: `${suggestionCount} AI suggestions applied.`,
      action: { label: 'Undo', onClick: () => undos.forEach(({ id, undo }) => latestUpdate.current(id, undo)) },
    })
  }

  function dismiss(row: Row) {
    const keys = row.items.map((i) => i.key)
    collapse(row)
    setDismissed((d) => new Set([...d, ...keys]))
    toast(`Dismissed suggestions for ${row.job.id}`, {
      action: {
        label: 'Undo',
        onClick: () => setDismissed((d) => new Set([...d].filter((k) => !keys.includes(k)))),
      },
    })
  }

  function open(job: Job) {
    select(job.id)
    goTo('issue')
  }

  return (
    <Panel title="Triage suggestions" note="Accepting really edits the job">
      <div className="grid min-w-0 gap-2.5">
        {shown.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs" aria-live="polite">
              {suggestionCount} {suggestionCount === 1 ? 'suggestion' : 'suggestions'} for {shown.length} {shown.length === 1 ? 'job' : 'jobs'}
            </span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={acceptAll}>
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />
              Accept all
            </Button>
          </div>
        )}

        {rows.length > 0 && (
          <ul ref={listRef} tabIndex={-1} aria-label="Jobs with suggestions" className="overflow-hidden rounded-lg border outline-none">
            {rows.map((row) => (
              <li
                key={row.job.id}
                aria-hidden={row.leaving || undefined}
                className={cn(
                  'group/row grid transition-[grid-template-rows,opacity] duration-200 ease-out',
                  row.leaving ? 'pointer-events-none grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]',
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="grid gap-2 border-b px-3 py-2.5 group-last/row:border-b-0">
                    <div className="flex min-w-0 items-center gap-2 text-xs">
                      <StatusIcon status={row.job.status} />
                      <button
                        type="button"
                        onClick={() => open(row.job)}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/30 shrink-0 rounded-sm tabular-nums outline-none focus-visible:ring-2"
                      >
                        {row.job.id}
                      </button>
                      <span className="min-w-0 flex-1 truncate font-medium">{row.job.title || 'Untitled job'}</span>
                      <Button size="sm" variant="ghost" onClick={() => accept(row)}>Accept</Button>
                      <IconAction label={`Dismiss suggestions for ${row.job.id}`} onClick={() => dismiss(row)} className="-ml-1" icon={Cancel01Icon} />
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <AiLabel>AI suggests</AiLabel>
                      {row.items.map((item) => (
                        <SuggestionPill key={item.key} item={item} onApply={() => accept(row, [item])} />
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {waiting > 0 && (
          <p className="text-muted-foreground text-[11px]">
            {waiting} more {waiting === 1 ? 'job' : 'jobs'} waiting. They appear as you work through these.
          </p>
        )}

        {rows.length === 0 && (
          <div className="grid justify-items-center gap-1.5 rounded-lg border border-dashed px-4 py-8 text-center">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="text-status-done size-5" />
            <p className="text-xs font-medium">All caught up</p>
            <p className="text-muted-foreground max-w-64 text-[11px]">
              New jobs without an assignee, a label or a priority show up here with suggestions.
            </p>
            {dismissed.size > 0 && (
              <Button variant="ghost" size="sm" className="mt-1" onClick={() => setDismissed(new Set())}>
                Show dismissed
              </Button>
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}

function SuggestionPill({ item, onApply }: { item: Suggestion; onApply: () => void }) {
  const label = LABELS.find((l) => l.id === item.value)
  const field = item.field === 'label' ? 'Label' : item.field === 'assignee' ? 'Assignee' : 'Priority'
  const value = item.field === 'label'
    ? label?.name ?? item.value
    : item.field === 'assignee' ? item.value : PRIORITY[item.value as Priority].label

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onApply}
          aria-label={`Apply ${describe(item)}. ${item.reason}. ${item.confidence} confidence.`}
          className="bg-card hover:bg-accent focus-visible:ring-ring/30 inline-flex h-6 max-w-full min-w-0 items-center gap-1.5 rounded-full border pr-1 pl-2 text-xs transition-colors outline-none focus-visible:ring-2"
        >
          {item.field === 'label' && label && <LabelDot colour={label.colour} />}
          {item.field === 'assignee' && <UserAvatar name={item.value} className="size-4" />}
          {item.field === 'priority' && <PriorityIcon priority={item.value as Priority} />}
          <span className="text-muted-foreground hidden sm:inline">{field}</span>
          <span className="truncate font-medium">{value}</span>
          <span
            className={cn(
              'rounded-full px-1.5 text-[10px] leading-4 font-medium',
              item.confidence === 'High' ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground',
            )}
          >
            {item.confidence}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 flex-col items-start gap-0.5">
        <span>{item.reason}</span>
        <span className="opacity-70">{item.confidence} confidence. Click to apply.</span>
      </TooltipContent>
    </Tooltip>
  )
}
