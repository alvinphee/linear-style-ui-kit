import { createContext, useContext, useState, type ReactNode } from 'react'
import { JOBS, LABELS, PRIORITY, STATUS, type Job, type Priority, type Status } from './data'

// One shared copy of the sample jobs, so the list, the board and the issue
// page all show the same data and every edit shows up everywhere.

export type Activity = {
  id: string
  jobId: string
  kind: 'created' | 'status' | 'priority' | 'assignee' | 'labels' | 'due' | 'comment'
  actor: string
  text: string
  at: string
}

type JobPatch = Partial<Omit<Job, 'id'>>

type JobsState = {
  jobs: Job[]
  activity: Activity[]
  selectedId: string
  selected: Job
  select: (id: string) => void
  updateJob: (id: string, patch: JobPatch) => void
  updateJobs: (ids: string[], patch: JobPatch) => void
  removeJobs: (ids: string[]) => void
  addJob: (status: Status, title?: string) => Job
  addComment: (id: string, text: string) => void
  addSubtask: (id: string, title: string) => void
  toggleSubtask: (id: string, subtaskId: string) => void
}

const ME = 'You'
const JobsContext = createContext<JobsState | null>(null)

let counter = 0
const nextId = () => `a${++counter}`

function seedActivity(): Activity[] {
  const seeded: Activity[] = []
  for (const job of JOBS) {
    seeded.push({ id: nextId(), jobId: job.id, kind: 'created', actor: job.createdBy, text: 'created the job', at: job.created })
    if (job.status !== 'backlog' && job.status !== 'todo') {
      seeded.push({
        id: nextId(), jobId: job.id, kind: 'status', actor: job.driver || job.createdBy,
        text: `moved from Todo to ${STATUS[job.status].label}`, at: '1 day ago',
      })
    }
  }
  seeded.push(
    { id: nextId(), jobId: 'DO-24817', kind: 'comment', actor: 'Mei Ling', text: 'Site contact says bay 4 is closed after 5 pm. Please arrive before then.', at: '5 hours ago' },
    { id: nextId(), jobId: 'DO-24817', kind: 'comment', actor: 'Ravi', text: 'On the way now. Loaded photo is attached.', at: '40 min ago' },
  )
  return seeded
}

function describeChange(before: Job, patch: JobPatch): Omit<Activity, 'id' | 'jobId' | 'actor' | 'at'>[] {
  const changes: Omit<Activity, 'id' | 'jobId' | 'actor' | 'at'>[] = []
  if (patch.status && patch.status !== before.status) {
    changes.push({ kind: 'status', text: `moved from ${STATUS[before.status].label} to ${STATUS[patch.status].label}` })
  }
  if (patch.priority && patch.priority !== before.priority) {
    changes.push({ kind: 'priority', text: `set priority to ${PRIORITY[patch.priority as Priority].label}` })
  }
  if (patch.driver !== undefined && patch.driver !== before.driver) {
    changes.push({ kind: 'assignee', text: patch.driver ? `assigned the job to ${patch.driver}` : 'removed the assignee' })
  }
  if (patch.labels) {
    const added = patch.labels.filter((l) => !before.labels.includes(l))
    const removed = before.labels.filter((l) => !patch.labels!.includes(l))
    const name = (id: string) => LABELS.find((l) => l.id === id)?.name ?? id
    if (added.length) changes.push({ kind: 'labels', text: `added ${added.map(name).join(', ')}` })
    if (removed.length) changes.push({ kind: 'labels', text: `removed ${removed.map(name).join(', ')}` })
  }
  if (patch.due !== undefined && patch.due !== before.due) {
    changes.push({ kind: 'due', text: patch.due ? `set the due date to ${patch.due}` : 'removed the due date' })
  }
  return changes
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(JOBS)
  const [activity, setActivity] = useState<Activity[]>(seedActivity)
  const [selectedId, setSelectedId] = useState(JOBS[0].id)
  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0]

  function log(jobId: string, entries: Omit<Activity, 'id' | 'jobId' | 'actor' | 'at'>[]) {
    if (!entries.length) return
    setActivity((a) => [...a, ...entries.map((e) => ({ ...e, id: nextId(), jobId, actor: ME, at: 'just now' }))])
  }

  function updateJobs(ids: string[], patch: JobPatch) {
    for (const job of jobs) if (ids.includes(job.id)) log(job.id, describeChange(job, patch))
    setJobs((all) => all.map((j) => (ids.includes(j.id) ? { ...j, ...patch } : j)))
  }

  function removeJobs(ids: string[]) {
    const left = jobs.filter((j) => !ids.includes(j.id))
    if (!left.length) return
    if (ids.includes(selectedId)) setSelectedId(left[0].id)
    setJobs(left)
  }

  function addJob(status: Status, title = 'Untitled job') {
    const highest = Math.max(...jobs.map((j) => Number(j.id.replace(/\D/g, ''))), 24800)
    const job: Job = {
      id: `DO-${highest + 1}`, title, customer: '', driver: '', status, priority: 'none', due: '',
      photos: 0, labels: [], description: '', subtasks: [], createdBy: ME, created: 'just now',
    }
    setJobs((all) => [job, ...all])
    log(job.id, [{ kind: 'created', text: 'created the job' }])
    return job
  }

  function addComment(id: string, text: string) {
    setActivity((a) => [...a, { id: nextId(), jobId: id, kind: 'comment', actor: ME, text, at: 'just now' }])
  }

  function patchSubtasks(id: string, change: (subtasks: Job['subtasks']) => Job['subtasks']) {
    setJobs((all) => all.map((j) => (j.id === id ? { ...j, subtasks: change(j.subtasks) } : j)))
  }

  const value: JobsState = {
    jobs,
    activity,
    selectedId: selected.id,
    selected,
    select: setSelectedId,
    updateJob: (id, patch) => updateJobs([id], patch),
    updateJobs,
    removeJobs,
    addJob,
    addComment,
    addSubtask: (id, title) =>
      patchSubtasks(id, (s) => [...s, { id: `s${Date.now()}`, title, done: false }]),
    toggleSubtask: (id, subtaskId) =>
      patchSubtasks(id, (s) => s.map((t) => (t.id === subtaskId ? { ...t, done: !t.done } : t))),
  }

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}

export function useJobs() {
  const state = useContext(JobsContext)
  if (!state) throw new Error('useJobs must be used inside JobsProvider')
  return state
}
