import { LABELS, PEOPLE, PRIORITY, type Job, type Priority } from '../../data'

// Scripted triage: keyword and "similar job" rules over the shared store.

type Confidence = 'High' | 'Medium'
type TriageField = 'label' | 'assignee' | 'priority'

export type Suggestion = {
  key: string
  field: TriageField
  value: string
  reason: string
  confidence: Confidence
}

const OPEN = new Set(['backlog', 'todo', 'progress'])
const RANK: Record<Priority, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 }

const LABEL_HINTS: { label: string; pattern: RegExp }[] = [
  { label: 'cold', pattern: /\b(chilled|frozen|cold|temperature)/i },
  { label: 'export', pattern: /\b(export|container|fumigation|customs)/i },
  { label: 'fragile', pattern: /\b(fragile|glass|damaged|broken)/i },
  { label: 'oversize', pattern: /\b(40ft|20ft|flatbed|oversize)/i },
]

const labelName = (id: string) => LABELS.find((l) => l.id === id)?.name ?? id

export function describe(s: Suggestion) {
  if (s.field === 'label') return `label ${labelName(s.value)}`
  if (s.field === 'assignee') return `assignee ${s.value}`
  return `priority ${PRIORITY[s.value as Priority].label}`
}

export function suggestFor(job: Job, jobs: Job[]): Suggestion[] {
  if (!OPEN.has(job.status)) return []
  const out: Suggestion[] = []
  const add = (field: TriageField, value: string, reason: string, confidence: Confidence) =>
    out.push({ key: `${job.id}:${field}:${value}`, field, value, reason, confidence })

  // Label: the first keyword hint for a label the job does not have yet.
  let label: string | undefined
  for (const hint of LABEL_HINTS) {
    if (job.labels.includes(hint.label)) continue
    const inTitle = hint.pattern.exec(job.title)
    const match = inTitle ?? hint.pattern.exec(job.description)
    if (!match) continue
    const similar = jobs.find((j) => j.id !== job.id && j.labels.includes(hint.label))
    const word = match[1].toLowerCase()
    label = hint.label
    add('label', hint.label, similar ? `Similar to ${similar.id}: mentions “${word}”` : `Mentions “${word}”`, inTitle ? 'High' : 'Medium')
    break
  }
  if (!label && !job.labels.length && job.customer) {
    const sameCustomer = jobs.find((j) => j.id !== job.id && j.customer === job.customer && j.labels.length)
    if (sameCustomer) {
      label = sameCustomer.labels[0]
      add('label', label, `Similar to ${sameCustomer.id}, same customer`, 'Medium')
    }
  }

  // Assignee: only when nobody has the job.
  if (!job.driver) {
    const sameCustomer = jobs.find((j) => j.id !== job.id && j.customer && j.customer === job.customer && j.driver)
    if (sameCustomer) {
      add('assignee', sameCustomer.driver, `Handled ${sameCustomer.id} for ${job.customer}`, 'High')
    } else {
      const load = (person: string) => jobs.filter((j) => j.driver === person && OPEN.has(j.status)).length
      const person = [...PEOPLE].sort((a, b) => load(a) - load(b))[0]
      const n = load(person)
      add('assignee', person, `Lightest load: ${n} open ${n === 1 ? 'job' : 'jobs'}`, 'Medium')
    }
  }

  // Priority: raise it when the due date or the goods call for it.
  const rank = RANK[job.priority]
  const soon = job.due === 'Today' || job.due === 'Tomorrow'
  const cold = job.labels.includes('cold') || label === 'cold'
  const fragile = job.labels.includes('fragile') || label === 'fragile'
  const text = `${job.title} ${job.description}`
  if (soon && rank < RANK.high) {
    add('priority', 'high', `Due ${job.due.toLowerCase()}${cold ? ' and temperature-sensitive' : ''}`, rank === 0 ? 'High' : 'Medium')
  } else if ((fragile || /\b(damaged|broken)/i.test(text)) && rank < RANK.medium) {
    add('priority', 'medium', /\breported\b/i.test(text) ? 'Customer reported damage' : 'Fragile goods', 'Medium')
  } else if (rank === 0) {
    add('priority', 'low', job.due ? `Due ${job.due}, no risk flags` : 'No due date or risk flags', 'Medium')
  }

  return out
}

// The job patch for a set of suggestions, and the patch that undoes it.
export function patchFor(job: Job, items: Suggestion[]) {
  const patch: Partial<Job> = {}
  const undo: Partial<Job> = {}
  const labels = items.filter((i) => i.field === 'label').map((i) => i.value)
  if (labels.length) {
    undo.labels = job.labels
    patch.labels = LABELS.map((l) => l.id).filter((id) => job.labels.includes(id) || labels.includes(id))
  }
  const priority = items.find((i) => i.field === 'priority')
  if (priority) {
    undo.priority = job.priority
    patch.priority = priority.value as Priority
  }
  const assignee = items.find((i) => i.field === 'assignee')
  if (assignee) {
    undo.driver = job.driver
    patch.driver = assignee.value
  }
  return { patch, undo }
}
