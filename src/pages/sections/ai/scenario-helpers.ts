import { LABELS, PRIORITY, STATUS, type Job, type Priority, type Status } from '../../data'
import { now } from './data'

// Job helpers. Everything reads the snapshot of the real job store.

export const OPEN: Status[] = ['backlog', 'todo', 'progress']
export const RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const isOpen = (job: Job) => OPEN.includes(job.status)
export const isHot = (job: Job) => RANK[job.priority] <= 1

export function dueRank(due: string) {
  if (due === 'Today') return 0
  if (due === 'Tomorrow') return 1
  const m = due.match(/^(\d{1,2}) (\w{3})/)
  if (m) return 2 + Math.max(0, MONTHS.indexOf(m[2]) - 8) * 31 + Number(m[1])
  return 999
}

export const byUrgency = (a: Job, b: Job) => RANK[a.priority] - RANK[b.priority] || dueRank(a.due) - dueRank(b.due)

export function jobRow(job: Job) {
  return {
    id: job.id,
    title: job.title,
    status: STATUS[job.status].label,
    priority: PRIORITY[job.priority].label,
    assignee: job.driver || null,
    due: job.due || null,
  }
}

export function jobDetail(job: Job) {
  return {
    ...jobRow(job),
    customer: job.customer || null,
    labels: job.labels.map((id) => LABELS.find((l) => l.id === id)?.name ?? id),
    photos: job.photos,
    steps: job.subtasks.map((s) => ({ title: s.title, done: s.done })),
    description: job.description || null,
  }
}

export function stepsSummary(job: Job) {
  if (!job.subtasks.length) return 'no steps'
  return `${job.subtasks.filter((s) => s.done).length}/${job.subtasks.length} steps done`
}

export const cell = (text: string) => text.replace(/\|/g, '/')

export function mdTable(headers: string[], rows: (string | number)[][]) {
  return [
    `| ${headers.join(' | ')} |`,
    `|${headers.map((_, i) => (i === 0 ? '---' : ':---')).join('|')}|`,
    ...rows.map((r) => `| ${r.map((c) => cell(String(c))).join(' | ')} |`),
  ].join('\n')
}

export const quote = (text: string) => text.split('\n').map((line) => (line ? `> ${line}` : '>')).join('\n')

export function csv(rows: Record<string, string | number>[]) {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const esc = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n')
}

export const DATE_LABEL = () => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(now())

export function findJobIds(prompt: string) {
  return [...prompt.matchAll(/\bDO-\d{3,}\b/gi)].map((m) => m[0].toUpperCase())
}

export function short(text: string, max = 60) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}
