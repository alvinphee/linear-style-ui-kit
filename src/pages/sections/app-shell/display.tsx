import type { ReactNode } from 'react'
import { STATUS_LIST_ORDER, STATUS_ORDER, type Job, type Status } from '../../data'
import {
  ASSIGNEE_OPTIONS, JOB_PROPERTIES, PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeValue, driverOf, type JobProperty,
  type Ordering,
} from '../../job-options'
import { sortJobs } from '../FilterBar'

// What the Display menu controls, and how the jobs are grouped for the list
// and the board. The groups, orderings and properties come from the shared
// job lists in src/pages/job-options.

export type Layout = 'list' | 'board'
export type Grouping = 'status' | 'priority' | 'assignee' | 'none'

export type ListDisplay = {
  grouping: Grouping
  ordering: Ordering
  showEmpty: boolean
  showCompleted: boolean
  properties: Record<JobProperty, boolean>
}

export const DEFAULT_LIST_DISPLAY: ListDisplay = {
  grouping: 'status',
  ordering: 'priority',
  showEmpty: false,
  showCompleted: true,
  properties: { id: true, status: true, priority: true, labels: true, customer: false, due: true, assignee: true, photos: false },
}

export const GROUPINGS: { id: Grouping; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'none', label: 'No grouping' },
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

type GroupDef = Omit<Group, 'jobs'> & { match: (job: Job) => boolean }

// A group per option of the field, headed by the option's name and visual.
function groupDefs(grouping: Exclude<Grouping, 'none'>, layout: Layout, showCompleted: boolean): GroupDef[] {
  if (grouping === 'status') {
    // A list reads top-down from what is moving; a board reads left to right along the workflow.
    return (layout === 'board' ? STATUS_ORDER : STATUS_LIST_ORDER)
      .filter((s) => showCompleted || !COMPLETED.includes(s))
      .map((s) => {
        const { label, visual } = STATUS_OPTIONS.find((o) => o.value === s)!
        return { key: s, label, visual, patch: { status: s }, match: (j) => j.status === s }
      })
  }
  if (grouping === 'priority') {
    return PRIORITY_OPTIONS.map(({ value, label, visual }) => ({
      key: value, label, visual, patch: { priority: value }, match: (j) => j.priority === value,
    }))
  }
  // People first, nobody last.
  const [nobody, ...people] = ASSIGNEE_OPTIONS
  return [...people, nobody].map(({ value, label, visual }) => ({
    key: value, label, visual, patch: { driver: driverOf(value) }, match: (j) => assigneeValue(j.driver) === value,
  }))
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
    && a.showCompleted === b.showCompleted && JOB_PROPERTIES.every((p) => a.properties[p.id] === b.properties[p.id])
}
