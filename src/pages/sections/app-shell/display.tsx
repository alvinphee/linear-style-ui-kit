import type { ReactNode } from 'react'
import { PEOPLE, PRIORITY, STATUS, type Job, type Priority, type Status } from '../../data'
import { NoAssignee, UNASSIGNED, sortJobs, type Ordering } from '../FilterBar'
import { UserAvatar } from '@/components/person'
import { PriorityIcon, StatusIcon } from '../StatusSection'

// What the Display menu controls, and how the jobs are grouped for the list
// and the board.

export type Layout = 'list' | 'board'
export type Grouping = 'status' | 'priority' | 'assignee' | 'none'
export type Property = 'id' | 'status' | 'priority' | 'labels' | 'customer' | 'due' | 'assignee' | 'photos'

export type ListDisplay = {
  grouping: Grouping
  ordering: Ordering
  showEmpty: boolean
  showCompleted: boolean
  properties: Record<Property, boolean>
}

export const DEFAULT_LIST_DISPLAY: ListDisplay = {
  grouping: 'status',
  ordering: 'priority',
  showEmpty: false,
  showCompleted: true,
  properties: { id: true, status: true, priority: true, labels: true, customer: false, due: true, assignee: true, photos: false },
}

export const PROPERTIES: { id: Property; label: string }[] = [
  { id: 'id', label: 'ID' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'labels', label: 'Labels' },
  { id: 'customer', label: 'Customer' },
  { id: 'due', label: 'Due date' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'photos', label: 'Photos' },
]

export const GROUPINGS: { id: Grouping; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'none', label: 'No grouping' },
]

export const ORDERINGS: { id: Ordering; label: string }[] = [
  { id: 'priority', label: 'Priority' },
  { id: 'due', label: 'Due date' },
  { id: 'title', label: 'Title' },
]

export type JobPatch = Partial<Omit<Job, 'id'>>

export type Group = {
  key: string
  label: string
  visual: ReactNode
  jobs: Job[]
  // What a job dropped into (or created in) this group takes on.
  patch: JobPatch
}

const COMPLETED: Status[] = ['done', 'cancelled']
// A list reads top-down from what is moving; a board reads left to right along the workflow.
const STATUS_LIST: Status[] = ['progress', 'todo', 'backlog', 'done', 'cancelled']
const STATUS_BOARD: Status[] = ['backlog', 'todo', 'progress', 'done', 'cancelled']
const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

type GroupDef = Omit<Group, 'jobs'> & { match: (job: Job) => boolean }

function groupDefs(grouping: Exclude<Grouping, 'none'>, layout: Layout, showCompleted: boolean): GroupDef[] {
  if (grouping === 'status') {
    return (layout === 'board' ? STATUS_BOARD : STATUS_LIST)
      .filter((s) => showCompleted || !COMPLETED.includes(s))
      .map((s) => ({
        key: s, label: STATUS[s].label, visual: <StatusIcon status={s} />, patch: { status: s },
        match: (j) => j.status === s,
      }))
  }
  if (grouping === 'priority') {
    return PRIORITIES.map((p) => ({
      key: p, label: PRIORITY[p].label, visual: <PriorityIcon priority={p} />, patch: { priority: p },
      match: (j) => j.priority === p,
    }))
  }
  return [
    ...PEOPLE.map((name) => ({
      key: name, label: name, visual: <UserAvatar name={name} className="size-4" />, patch: { driver: name },
      match: (j: Job) => j.driver === name,
    })),
    {
      key: UNASSIGNED, label: 'No assignee', visual: <NoAssignee />, patch: { driver: '' },
      match: (j: Job) => !j.driver,
    },
  ]
}

export function arrangeJobs(jobs: Job[], display: ListDisplay, layout: Layout): Group[] {
  const visible = display.showCompleted ? jobs : jobs.filter((j) => !COMPLETED.includes(j.status))
  const sorted = sortJobs(visible, display.ordering)
  // A board always needs columns, so "No grouping" falls back to status there.
  const grouping = display.grouping === 'none' && layout === 'board' ? 'status' : display.grouping
  if (grouping === 'none') return [{ key: 'all', label: 'All issues', visual: null, jobs: sorted, patch: {} }]
  const groups = groupDefs(grouping, layout, display.showCompleted).map(({ match, ...def }) => ({
    ...def,
    jobs: sorted.filter(match),
  }))
  return display.showEmpty ? groups : groups.filter((g) => g.jobs.length > 0)
}

export function sameDisplay(a: ListDisplay, b: ListDisplay) {
  return a.grouping === b.grouping && a.ordering === b.ordering && a.showEmpty === b.showEmpty
    && a.showCompleted === b.showCompleted && PROPERTIES.every((p) => a.properties[p.id] === b.properties[p.id])
}
