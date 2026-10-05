import { CUSTOMERS, LABELS, PRIORITY, STATUS, UNASSIGNED, type Job, type Priority, type Status } from '../../data'

// A small keyword parser that turns "urgent jobs for Ravi" into filters.
// No model: each matcher eats the words it understands, and what is left
// over (minus filler words) becomes a "contains" filter.

export type NlField = 'status' | 'priority' | 'assignee' | 'label' | 'customer' | 'due' | 'photos' | 'text'
export type NlFilter = { id: string; field: NlField; values: string[] }

type DueWindow = 'today' | 'tomorrow' | 'yesterday' | 'this-week' | 'next-week' | 'last-week' | 'overdue'

const DUE_LABELS: Record<DueWindow, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  yesterday: 'Yesterday',
  'this-week': 'This week',
  'next-week': 'Next week',
  'last-week': 'Last 7 days',
  overdue: 'Overdue',
}

const OPEN: Status[] = ['backlog', 'todo', 'progress']

const ALIASES: Record<string, string[]> = {
  Ravi: ['ravi'],
  'Mei Ling': ['mei ling', 'meiling', 'mei'],
  Daniel: ['daniel', 'dan'],
  Siti: ['siti'],
  Ali: ['ali'],
}

type Matcher = { field: NlField; value: string; pattern: string }

const person = (names: string[]) => `(?:(?:for|to|by|assigned to|owned by)\\s+)?(?:${names.join('|')})(?:'s)?`

// Order matters: longer phrases first, so "no priority" is not read as "priority".
const MATCHERS: Matcher[] = [
  { field: 'photos', value: 'none', pattern: '(?:without|no|missing)\\s+(?:proof\\s+)?photos?' },
  { field: 'photos', value: 'some', pattern: '(?:with|has|have)\\s+(?:proof\\s+)?photos?' },
  { field: 'priority', value: 'none', pattern: 'no priority|unprioriti[sz]ed' },
  { field: 'assignee', value: UNASSIGNED, pattern: 'unassigned|no assignee|nobody|no one|no driver' },
  { field: 'status', value: 'todo', pattern: 'to ?do|not started|pending' },
  { field: 'status', value: 'progress', pattern: 'in progress|ongoing|underway|started|active' },
  { field: 'status', value: 'backlog', pattern: 'backlog' },
  { field: 'status', value: 'done', pattern: 'done|completed?|finished|delivered|closed' },
  { field: 'status', value: 'cancelled', pattern: 'cancell?ed' },
  { field: 'status', value: 'open', pattern: 'open|unfinished|outstanding' },
  { field: 'priority', value: 'urgent', pattern: 'urgent|critical' },
  { field: 'priority', value: 'high', pattern: 'high(?:[- ]priority)?|important' },
  { field: 'priority', value: 'medium', pattern: 'medium(?:[- ]priority)?' },
  { field: 'priority', value: 'low', pattern: 'low(?:[- ]priority)?' },
  ...Object.entries(ALIASES).map(([name, names]) => ({ field: 'assignee' as const, value: name, pattern: person(names) })),
  { field: 'label', value: 'cold', pattern: 'cold[- ]chain|cold|chilled|frozen' },
  { field: 'label', value: 'export', pattern: 'exports?' },
  { field: 'label', value: 'fragile', pattern: 'fragile' },
  { field: 'label', value: 'oversize', pattern: 'oversized?|bulky' },
  { field: 'label', value: 'key', pattern: 'key[- ]accounts?|vip' },
  ...CUSTOMERS.map((c) => {
    const [first, ...rest] = c.toLowerCase().split(' ')
    return { field: 'customer' as const, value: c, pattern: `(?:(?:from|for)\\s+)?${first}(?:\\s+${rest.join('\\s+')})?` }
  }),
  { field: 'due', value: 'overdue', pattern: 'overdue|past due|late' },
  { field: 'due', value: 'last-week', pattern: '(?:last|past|previous) (?:week|7 days)' },
  { field: 'due', value: 'next-week', pattern: 'next week' },
  { field: 'due', value: 'this-week', pattern: 'this week|within a week|next 7 days' },
  { field: 'due', value: 'yesterday', pattern: 'yesterday' },
  { field: 'due', value: 'today', pattern: 'today' },
  { field: 'due', value: 'tomorrow', pattern: 'tomorrow' },
]

const STOPWORDS = new Set([
  'a', 'all', 'an', 'and', 'any', 'are', 'assigned', 'at', 'be', 'by', 'can', 'customer', 'deliveries', 'delivery',
  'due', 'every', 'find', 'for', 'from', 'get', 'give', 'has', 'have', 'in', 'is', 'it', 'items', 'job', 'jobs',
  'label', 'labelled', 'labeled', 'list', 'me', 'my', 'of', 'on', 'or', 'please', 'priority', 'show', 'status',
  'task', 'tasks', 'that', 'the', 'there', 'to', 'what', 'which', 'with', 'week', 'were', 'was',
])

const FIELD_ORDER: NlField[] = ['status', 'priority', 'assignee', 'label', 'customer', 'due', 'photos', 'text']

export function parseQuery(query: string): NlFilter[] {
  let text = ` ${query.toLowerCase().replace(/[“”"?,.!;:()]/g, ' ')} `
  const found = new Map<NlField, string[]>()
  const add = (field: NlField, value: string) => {
    const list = found.get(field) ?? []
    if (!list.includes(value)) found.set(field, [...list, value])
  }

  for (const m of MATCHERS) {
    const re = new RegExp(`(?<![\\w'])(?:${m.pattern})(?![\\w'])`, 'g')
    if (!re.test(text)) continue
    text = text.replace(re, ' ')
    if (m.field === 'status' && m.value === 'open') OPEN.forEach((s) => add('status', s))
    else add(m.field, m.value)
  }

  const words = text.split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
  if (words.length) found.set('text', words)

  return FIELD_ORDER.filter((f) => found.has(f)).map((field) => ({ id: field, field, values: found.get(field)! }))
}

// Days from 30 Sep 2026, the "today" of the sample data.
const TODAY = new Date(2026, 8, 30)
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function dueOffset(due: string): number | null {
  if (!due) return null
  if (due === 'Today') return 0
  if (due === 'Tomorrow') return 1
  if (due === 'Next week') return 7
  const [day, month] = due.toLowerCase().split(' ')
  const m = MONTHS.indexOf(month)
  if (m < 0 || !Number(day)) return null
  return Math.round((new Date(2026, m, Number(day)).getTime() - TODAY.getTime()) / 86_400_000)
}

function inWindow(job: Job, window: string) {
  const d = dueOffset(job.due)
  if (d === null) return false
  switch (window as DueWindow) {
    case 'today': return d === 0
    case 'tomorrow': return d === 1
    case 'yesterday': return d === -1
    case 'this-week': return d >= 0 && d <= 6
    case 'next-week': return d >= 7 && d <= 13
    case 'last-week': return d >= -7 && d <= -1
    case 'overdue': return d < 0 && OPEN.includes(job.status)
  }
}

const stem = (word: string) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word)

export function matchesFilter(job: Job, filter: NlFilter) {
  const { field, values } = filter
  switch (field) {
    case 'status': return values.includes(job.status)
    case 'priority': return values.includes(job.priority)
    case 'assignee': return values.includes(job.driver || UNASSIGNED)
    case 'label': return job.labels.some((l) => values.includes(l))
    case 'customer': return values.includes(job.customer)
    case 'due': return values.some((v) => inWindow(job, v))
    case 'photos': return values.includes(job.photos > 0 ? 'some' : 'none')
    case 'text': {
      const haystack = `${job.id} ${job.title} ${job.description} ${job.customer}`.toLowerCase()
      return values.every((w) => haystack.includes(stem(w)))
    }
  }
}

export function valueLabel(field: NlField, value: string) {
  switch (field) {
    case 'status': return STATUS[value as Status]?.label ?? value
    case 'priority': return PRIORITY[value as Priority]?.label ?? value
    case 'assignee': return value === UNASSIGNED ? 'No assignee' : value
    case 'label': return LABELS.find((l) => l.id === value)?.name ?? value
    case 'due': return DUE_LABELS[value as DueWindow] ?? value
    case 'photos': return value === 'some' ? 'attached' : 'missing'
    default: return value
  }
}
