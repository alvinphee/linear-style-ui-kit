import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon } from '@hugeicons/core-free-icons'
import { LabelDot } from '@/components/label-dot'
import { NoAssignee, UserAvatar } from '@/components/person'
import { PRIORITY_ORDER, PriorityIcon } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'
import {
  CUSTOMERS, LABELS, PEOPLE, PRIORITY, STATUS, STATUS_ORDER, UNASSIGNED, type Priority, type Status,
} from './data'

// The choices a job's fields offer, each with its name and the visual shown
// before it: one list behind every job menu, picker and filter (the status,
// priority and Assign menus, the labels picker, the filter bar, the bulk
// toolbar, quick create). And the words for how a job list is sorted and
// which fields its rows show. Sample-data wiring over the kit's icons, so it
// lives with the jobs, not in the kit.

// One choice: the value kept on the job (or in a filter), its name, and a
// visual sized for a menu row (a 14px icon, a 16px avatar, a dot).
export type JobOption<V extends string = string> = { value: V; label: string; visual: ReactNode }

// Workflow order: Backlog, Todo, In progress, Done, Cancelled.
export const STATUS_OPTIONS: JobOption<Status>[] = STATUS_ORDER.map((s) => ({
  value: s, label: STATUS[s].label, visual: <StatusIcon status={s} />,
}))

// Most urgent first, No priority last.
export const PRIORITY_OPTIONS: JobOption<Priority>[] = PRIORITY_ORDER.map((p) => ({
  value: p, label: PRIORITY[p].label, visual: <PriorityIcon priority={p} />,
}))

// Nobody first, then each person. Nobody's value is UNASSIGNED; turn it back
// into the job's empty driver with driverOf.
export const ASSIGNEE_OPTIONS: JobOption[] = [
  { value: UNASSIGNED, label: 'No assignee', visual: <NoAssignee /> },
  ...PEOPLE.map((name) => ({ value: name, label: name, visual: <UserAvatar name={name} className="size-4" /> })),
]

// A job's assignee as an option value ('' becomes UNASSIGNED), and back.
export const assigneeValue = (driver: string) => driver || UNASSIGNED
export const driverOf = (value: string) => (value === UNASSIGNED ? '' : value)

// Value is the label's id.
export const LABEL_OPTIONS: JobOption[] = LABELS.map((l) => ({
  value: l.id, label: l.name, visual: <LabelDot colour={l.colour} />,
}))

export const CUSTOMER_OPTIONS: JobOption[] = CUSTOMERS.map((c) => ({
  value: c,
  label: c,
  visual: <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />,
}))

/* ---------- How a job list or board is shown ---------- */

// The sort orders a job list or board offers (sortJobs in sections/FilterBar does the sorting).
export type Ordering = 'priority' | 'due' | 'title'

export const ORDERINGS: { id: Ordering; label: string }[] = [
  { id: 'priority', label: 'Priority' },
  { id: 'due', label: 'Due date' },
  { id: 'title', label: 'Title' },
]

// The fields a job row or card can show or hide: the Display menu's properties.
export type JobProperty = 'id' | 'status' | 'priority' | 'labels' | 'customer' | 'due' | 'assignee' | 'photos'

export const JOB_PROPERTIES: { id: JobProperty; label: string }[] = [
  { id: 'id', label: 'ID' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'labels', label: 'Labels' },
  { id: 'customer', label: 'Customer' },
  { id: 'due', label: 'Due date' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'photos', label: 'Photos' },
]

// Some of the properties, in the order given, for a view that offers fewer:
// jobProperties(['id', 'priority', 'due']).
export function jobProperties<P extends JobProperty>(ids: P[]) {
  return ids.map((id) => JOB_PROPERTIES.find((p) => p.id === id) as { id: P; label: string })
}
