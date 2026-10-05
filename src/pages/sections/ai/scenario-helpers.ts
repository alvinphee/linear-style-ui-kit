import { formatShortDate } from '@/lib/format'
import { LABELS, PRIORITY, PRIORITY_RANK, STATUS, dueRank, type Job, type Status } from '../../data'
import { now } from './data'

// Job helpers. Everything reads the snapshot of the real job store.

export const OPEN: Status[] = ['backlog', 'todo', 'progress']

export const isOpen = (job: Job) => OPEN.includes(job.status)
export const isHot = (job: Job) => PRIORITY_RANK[job.priority] <= 1

export const byUrgency = (a: Job, b: Job) =>
  PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || dueRank(a.due) - dueRank(b.due)

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

export const DATE_LABEL = () => formatShortDate(now(), { year: true })

export function findJobIds(prompt: string) {
  return [...prompt.matchAll(/\bDO-\d{3,}\b/gi)].map((m) => m[0].toUpperCase())
}

export function short(text: string, max = 60) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}
