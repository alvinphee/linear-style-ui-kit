import { plural } from '@/lib/text'
import { CUSTOMERS, LABELS, PEOPLE, PRIORITY, STATUS, type Job, type Priority, type Status } from '../../data'
import {
  DATE_LABEL, byUrgency, csv, findJobIds, isHot, isOpen, jobDetail, jobRow, mdTable, quote, stepsSummary,
} from './scenario-helpers'
import { Builder, type AgentContext, type BuilderContext } from './script'
import type { Change, EmailTone, JobPatch, Source, UpdateRequest } from './types'

// Scenarios that read and change the shared job store: summarise, email,
// update (with approval) and compare.

// ---------------------------------------------------------------------------
// Scenario: summarise urgent jobs

const BAY_SOURCES: Source[] = [
  {
    title: 'Loading bay hours and booking rules', domain: 'docs.example.com', url: 'https://docs.example.com/sites/jurong/bays',
    snippet: 'Bays 1 to 6 open 7 am to 5 pm on weekdays. Bay 4 takes chilled loads only.',
  },
  {
    title: 'How long can chilled pallets wait?', domain: 'coldchain.example.org', url: 'https://coldchain.example.org/guides/dwell-time',
    snippet: 'Keep the wait at the bay under 30 minutes for chilled goods.',
  },
  {
    title: 'Proof of delivery: the photo checklist', domain: 'help.example.net', url: 'https://help.example.net/pod-photos',
    snippet: 'One photo of the load, one of the signed note, one of any damage.',
  },
]

function watchNote(job: Job, cite: boolean) {
  const open = job.subtasks.filter((s) => !s.done)
  const parts: string[] = []
  if (!job.subtasks.length) parts.push('has no steps yet. Add a checklist so the driver knows what to photograph.')
  else if (!open.length) parts.push('has every step done, so it only needs closing.')
  else {
    const done = job.subtasks.length - open.length
    parts.push(`has ${done} of ${job.subtasks.length} steps done. Still open: ${open.map((s) => `*${s.title.toLowerCase()}*`).join(' and ')}.`)
  }
  if (!job.driver) parts.push('Nobody is assigned yet.')
  if (job.due === 'Today') {
    if (cite && /jurong/i.test(job.title)) parts.push('Bay 4 closes at 5 pm [1].')
    else parts.push('It is due today.')
  }
  if (cite && (/chilled/i.test(job.description) || job.labels.includes('cold'))) {
    parts.push('Chilled pallets should not wait at the bay for more than 30 minutes [2].')
  }
  if (cite && open.some((s) => /photo/i.test(s.title))) parts.push('It needs a delivery photo to close [3].')
  return parts.join(' ')
}

function nextStep(job: Job) {
  const open = job.subtasks.filter((s) => !s.done)
  if (!job.driver) return `Assign **${job.id}** to a driver.`
  if (!job.subtasks.length) return `Add a checklist to **${job.id}** before ${job.due || 'it starts'}.`
  if (job.due === 'Today' && open.length) {
    return `Ask ${job.driver} to finish **${job.id}** today: ${open.map((s) => s.title.toLowerCase()).join(', ')}.`
  }
  return `Check in with ${job.driver} on **${job.id}**.`
}

export function reportMarkdown(jobs: Job[], level: 1 | 2 | 3 | 4) {
  const open = jobs.filter(isOpen)
  const hot = open.filter(isHot).sort(byUrgency)
  const today = hot.filter((j) => j.due === 'Today')
  const unassigned = hot.filter((j) => !j.driver)
  const lines = [`# Urgent jobs report`, `*${DATE_LABEL()} · ${plural(hot.length, 'open job')} with urgent or high priority*`, '']
  if (!hot.length) return [...lines, 'No open urgent or high-priority jobs. Nice work.'].join('\n')

  lines.push('## Summary')
  lines.push(`- **${hot.length}** urgent or high-priority ${hot.length === 1 ? 'job is' : 'jobs are'} open, **${today.length}** due today.`)
  if (level >= 2) lines.push(`- **${unassigned.length}** ${unassigned.length === 1 ? 'has' : 'have'} no assignee.`)
  lines.push('')
  lines.push('## Jobs')
  lines.push(level >= 2
    ? mdTable(['Job', 'What', 'Customer', 'Priority', 'Assignee', 'Due', 'Steps'], hot.map((j) => [
      j.id, j.title, j.customer || '—', PRIORITY[j.priority].label, j.driver || 'Unassigned', j.due || '—', stepsSummary(j),
    ]))
    : mdTable(['Job', 'Priority', 'Due'], hot.map((j) => [j.id, PRIORITY[j.priority].label, j.due || '—'])))
  if (level >= 2) {
    lines.push('', '## Notes')
    for (const job of hot) lines.push(`- **${job.id}** ${watchNote(job, false)}`)
  }
  if (level >= 3) {
    lines.push('', '## Next steps')
    hot.forEach((job, i) => lines.push(`${i + 1}. ${nextStep(job)}`))
  }
  if (level >= 4) {
    const rest = open.filter((j) => !isHot(j)).sort(byUrgency)
    if (rest.length) {
      lines.push('', '## Other open jobs')
      lines.push(mdTable(['Job', 'What', 'Priority', 'Due'], rest.map((j) => [j.id, j.title, PRIORITY[j.priority].label, j.due || '—'])))
    }
  }
  return lines.join('\n')
}

export function summary(b: Builder, ctx: AgentContext) {
  const open = ctx.jobs.filter(isOpen)
  const hot = open.filter(isHot).sort(byUrgency)
  const today = hot.filter((j) => j.due === 'Today')
  const web = ctx.modes.web

  b.think([
    'They want a quick picture of the jobs that need attention.',
    'I will search the open jobs with urgent or high priority, then read the most urgent ones to see which steps are still open.',
    'Anything due today goes to the top.',
  ], [
    'An open step usually means a missing photo or signature, so I should name them.',
    'A table first and short notes after it is the easiest to scan on a phone.',
  ])
  const steps = ['Find open urgent and high-priority jobs', 'Read the most urgent jobs']
  if (web) steps.push('Check the loading bay hours online')
  steps.push('Write the report')
  const last = steps.length - 1
  b.plan(steps)

  b.step(0, 'running')
  b.tool('search_jobs', { status: ['Backlog', 'Todo', 'In progress'], priority: ['Urgent', 'High'], sort: 'priority' }, {
    output: hot.map(jobRow), summary: plural(hot.length, 'job'),
  }, 'Searching jobs…')
  b.step(0, 'done')

  if (!hot.length) {
    for (let i = 1; i <= last; i++) b.step(i, 'done')
    b.say('**No open urgent or high-priority jobs.** Everything left is medium priority or lower, so nothing needs chasing today.')
    b.followUps(['Compare driver workload', 'Plan tomorrow’s deliveries'])
    return
  }

  b.step(1, 'running')
  for (const job of hot.slice(0, b.detail >= 2 ? 2 : 1)) {
    b.tool('read_job', { id: job.id }, { output: jobDetail(job), summary: stepsSummary(job) }, `Reading ${job.id}…`)
  }
  b.step(1, 'done')

  if (web) {
    b.step(2, 'running')
    b.tool('web_search', { query: 'Jurong warehouse loading bay opening hours' }, {
      output: BAY_SOURCES.map(({ title, url }) => ({ title, url })), summary: plural(BAY_SOURCES.length, 'result'),
    }, 'Searching the web…')
    b.step(2, 'done')
  }

  b.step(last, 'running')
  const lines: string[] = []
  const intro = ctx.attempt ? 'Here is the picture again, most urgent first. ' : ''
  lines.push(`${intro}**${plural(hot.length, 'open job')}** need attention${today.length ? `, and **${today.length} ${today.length === 1 ? 'is' : 'are'} due today**` : ''}.`)
  lines.push('')
  lines.push(mdTable(['Job', 'What', 'Priority', 'Assignee', 'Due'], hot.map((j) => [
    j.id, j.title, PRIORITY[j.priority].label, j.driver || 'Unassigned', j.due || '—',
  ])))
  if (b.detail >= 2) {
    lines.push('', '### What to watch')
    for (const job of hot) lines.push(`- **${job.id}** ${watchNote(job, web)}`)
  }
  if (b.detail >= 3) {
    lines.push('', '### Next steps')
    hot.forEach((job, i) => lines.push(`${i + 1}. ${nextStep(job)}`))
  }
  lines.push('', 'I saved this as a report you can open, copy or download.')
  b.say(lines.join('\n'))
  b.step(last, 'done')
  if (web) b.sources(BAY_SOURCES)
  b.artifact({
    title: 'Urgent jobs report', kind: 'document', language: 'markdown',
    content: reportMarkdown(ctx.jobs, 3), source: { template: 'report' },
  })
  b.followUps(['Make it shorter', 'Mark the jobs due today as done', 'Draft an email to Bayview Foods'])
}

// ---------------------------------------------------------------------------
// Scenario: draft an email

export function emailBody(job: Job, tone: EmailTone) {
  const who = job.customer || 'there'
  const driver = job.driver
    ? `${job.driver} is on the way and will call your site contact 15 minutes before arriving.`
    : 'We are assigning a driver now and will send you their name shortly.'
  const what = `“${job.title}”`
  switch (tone) {
    case 'formal':
      return [
        `**Subject:** Delivery update for ${job.id}`, '',
        `Dear ${who} team,`, '',
        `We are writing to let you know that delivery **${job.id}** (${what}) is running approximately 45 minutes behind schedule. ${driver}`, '',
        'Should the receiving bay close before the driver arrives, we will arrange an alternative bay and confirm the details with you immediately.', '',
        'We apologise for the inconvenience and appreciate your understanding.', '',
        'Kind regards,\nThe Operations team',
      ].join('\n')
    case 'short':
      return [
        `**Subject:** ${job.id} is running late`, '',
        `Hi ${who} team,`, '',
        `${job.id} is about 45 minutes late. ${driver}`, '',
        'Sorry for the wait.', '',
        'The Operations team',
      ].join('\n')
    case 'warm':
      return [
        `**Subject:** A quick update on ${job.id}`, '',
        `Hi ${who} team,`, '',
        `A quick heads-up: your delivery **${job.id}** (${what}) is running about 45 minutes late. ${driver}`, '',
        'If the bay closes before we get there, we will book another one and tell you straight away, so you are never left guessing.', '',
        'Thanks so much for bearing with us.', '',
        'Best wishes,\nThe Operations team',
      ].join('\n')
    default:
      return [
        `**Subject:** Update on your delivery ${job.id}`, '',
        `Hi ${who} team,`, '',
        `Your delivery **${job.id}** (${what}) is running about 45 minutes late. ${driver}`, '',
        'If the bay closes before we arrive, we will book another bay and let you know straight away.', '',
        'Sorry for the wait, and thank you for your patience.', '',
        'Best regards,\nThe Operations team',
      ].join('\n')
  }
}

function emailJob(ctx: AgentContext) {
  const ids = findJobIds(ctx.prompt)
  const byId = ctx.jobs.find((j) => ids.includes(j.id))
  if (byId) return byId
  const p = ctx.prompt.toLowerCase()
  const customer = CUSTOMERS.find((c) => p.includes(c.toLowerCase()))
  const pool = ctx.jobs.filter((j) => isOpen(j) && (!customer || j.customer === customer)).sort(byUrgency)
  return pool[0] ?? ctx.jobs.find((j) => j.id === 'DO-24817') ?? ctx.jobs[0]
}

const TONES: EmailTone[] = ['standard', 'warm', 'short', 'formal']

export function email(b: Builder, ctx: AgentContext) {
  const job = emailJob(ctx)
  if (!job) {
    b.think(['They want an email, but there are no jobs to write about.'])
    b.say('There are no jobs in the workspace yet, so there is nothing to write about. Create a job first and ask again.')
    return
  }
  const p = ctx.prompt.toLowerCase()
  const tone: EmailTone = /formal/.test(p) ? 'formal' : /\b(short|brief)\b/.test(p) ? 'short'
    : /warm|friendly/.test(p) ? 'warm' : TONES[ctx.attempt % TONES.length]
  const who = job.customer || 'the customer'

  b.think([
    `They want an email to ${who} about ${job.id}.`,
    'I should read the job first so the facts are right: what it is, who is driving and when it is due.',
    'Short and polite, with a clear next step.',
  ], [
    'A delay email should give a new time, a reason to trust it, and what happens if things slip further.',
  ])
  b.tool('read_job', { id: job.id }, { output: jobDetail(job), summary: stepsSummary(job) }, `Reading ${job.id}…`)

  const body = emailBody(job, tone)
  const intro = ctx.attempt
    ? `Here is another take${tone === 'warm' ? ', a little warmer' : tone === 'short' ? ', shorter this time' : tone === 'formal' ? ', more formal' : ''}.`
    : `Here's a draft for ${who}. I read ${job.id} first, so the details match the job.`
  const notes = b.detail >= 2
    ? `\n\n- Swap in the real delay once ${job.driver || 'the driver'} confirms the time.\n- The job is due **${job.due || 'soon'}**${job.customer ? ` and belongs to ${job.customer}` : ''}.`
    : ''
  b.say(`${intro}\n\n${quote(body)}${notes}`)
  b.artifact({
    title: `Delay email to ${who}`, kind: 'document', language: 'markdown', content: body,
    source: { template: 'email', jobId: job.id, tone },
  })
  b.followUps(['Make it shorter', 'Make it more formal', 'Translate it to French'])
}

// ---------------------------------------------------------------------------
// Scenario: change jobs (needs approval)

const STATUS_WORDS: [RegExp, Status][] = [
  [/\b(done|complete|completed|finished|close|closed)\b/, 'done'],
  [/\b(in progress|started|ongoing)\b/, 'progress'],
  [/\b(to ?do|reopen|reopened)\b/, 'todo'],
  [/\bbacklog\b/, 'backlog'],
  [/\b(cancel|cancelled|canceled)\b/, 'cancelled'],
]

function parsePatch(prompt: string): JobPatch {
  const p = prompt.toLowerCase()
  const patch: JobPatch = {}
  const priority = p.match(/\b(?:as|to)\s+(urgent|high|medium|low)\b/)?.[1]
    ?? (/\bpriority\b/.test(p) ? p.match(/\b(urgent|high|medium|low)\b/)?.[1] : undefined)
  if (priority) patch.priority = priority as Priority
  const status = STATUS_WORDS.find(([re]) => re.test(p))?.[1]
  if (status) patch.status = status
  if (/\bunassign\b/.test(p)) patch.driver = ''
  else if (/\b(assign|reassign|give|hand)\b/.test(p)) {
    const person = PEOPLE.find((name) => new RegExp(`\\b${name}\\b`, 'i').test(prompt))
    if (person) patch.driver = person
  }
  return patch
}

function targetsFor(prompt: string, jobs: Job[], patch: JobPatch) {
  const ids = findJobIds(prompt)
  if (ids.length) return { jobs: jobs.filter((j) => ids.includes(j.id)), filter: { id: ids } as Record<string, unknown> }
  const p = prompt.toLowerCase()
  const filter: Record<string, unknown> = { status: ['Backlog', 'Todo', 'In progress'] }
  let list = jobs.filter(isOpen)
  let narrowed = false
  if (/\btoday\b|today[’']s/.test(p)) {
    list = list.filter((j) => j.due === 'Today')
    filter.due = 'Today'
    narrowed = true
  } else if (/\btomorrow\b/.test(p)) {
    list = list.filter((j) => j.due === 'Tomorrow')
    filter.due = 'Tomorrow'
    narrowed = true
  }
  if (/unassigned|nobody|no one/.test(p)) {
    list = list.filter((j) => !j.driver)
    filter.assignee = null
    narrowed = true
  }
  const label = LABELS.find((l) => p.includes(l.name.toLowerCase()))
  if (label) {
    list = list.filter((j) => j.labels.includes(label.id))
    filter.label = label.name
    narrowed = true
  }
  const customer = CUSTOMERS.find((c) => p.includes(c.toLowerCase()))
  if (customer) {
    list = list.filter((j) => j.customer === customer)
    filter.customer = customer
    narrowed = true
  }
  if (/\burgent\b/.test(p) && !patch.priority) {
    list = list.filter(isHot)
    filter.priority = ['Urgent', 'High']
    narrowed = true
  }
  list = list.sort(byUrgency)
  if (!narrowed) {
    list = list.slice(0, 2)
    filter.limit = 2
  }
  return { jobs: list, filter }
}

function changesFor(jobs: Job[], patch: JobPatch) {
  const changes: Change[] = []
  const ids: string[] = []
  for (const job of jobs) {
    let changed = false
    if (patch.status && patch.status !== job.status) {
      changes.push({ jobId: job.id, title: job.title, field: 'Status', from: STATUS[job.status].label, to: STATUS[patch.status].label })
      changed = true
    }
    if (patch.priority && patch.priority !== job.priority) {
      changes.push({ jobId: job.id, title: job.title, field: 'Priority', from: PRIORITY[job.priority].label, to: PRIORITY[patch.priority].label })
      changed = true
    }
    if (patch.driver !== undefined && patch.driver !== job.driver) {
      changes.push({ jobId: job.id, title: job.title, field: 'Assignee', from: job.driver || 'Unassigned', to: patch.driver || 'Unassigned' })
      changed = true
    }
    if (changed) ids.push(job.id)
  }
  return { changes, ids }
}

function describePatch(patch: JobPatch) {
  const parts: string[] = []
  if (patch.status) parts.push(`status → ${STATUS[patch.status].label}`)
  if (patch.priority) parts.push(`priority → ${PRIORITY[patch.priority].label}`)
  if (patch.driver !== undefined) parts.push(`assignee → ${patch.driver || 'nobody'}`)
  return parts.join(', ')
}

function followUpFor(change: Change) {
  if (change.field === 'Assignee') return `Assign ${change.jobId} to ${change.to}`
  if (change.field === 'Priority') return `Set ${change.jobId} to ${change.to.toLowerCase()} priority`
  return `Mark ${change.jobId} as ${change.to.toLowerCase()}`
}

export function update(b: Builder, ctx: AgentContext) {
  const patch = parsePatch(ctx.prompt)
  if (!Object.keys(patch).length) {
    b.think(['They want to change something, but I cannot tell what.', 'Better to ask than to guess, since changes show up for everyone.'])
    b.say([
      'What should I change? For example:', '',
      '- **Assign** DO-24812 to Ravi',
      '- **Mark** DO-24815 as done',
      '- **Set** DO-24809 to urgent priority', '',
      'I will show you the changes and ask before I update anything.',
    ].join('\n'))
    b.followUps(['Assign DO-24812 to Ravi', 'Mark DO-24815 as done'])
    return
  }

  const { jobs: targets, filter } = targetsFor(ctx.prompt, ctx.jobs, patch)
  const { changes, ids } = changesFor(targets, patch)
  b.think([
    'They want to change jobs, so I need to find the right ones and ask before I write anything.',
    `I read this as: ${describePatch(patch)}.`,
  ], [
    'Jobs that already match can be skipped, so the approval only lists real changes.',
  ])
  b.plan(['Find the matching jobs', 'Work out the changes', 'Ask for approval', 'Update the jobs'])
  b.step(0, 'running')
  b.tool('search_jobs', filter, { output: targets.map(jobRow), summary: plural(targets.length, 'job') }, 'Searching jobs…')
  b.step(0, 'done')
  b.step(1, 'running')
  b.pause(450)
  b.step(1, 'done')

  if (!changes.length) {
    b.step(2, 'done')
    b.step(3, 'done')
    b.say(targets.length
      ? `Nothing to change: ${targets.length === 1 ? `**${targets[0].id}** already has` : `all ${targets.length} jobs already have`} ${describePatch(patch)}.`
      : 'I could not find any open jobs that match. Try naming the job, for example **DO-24812**.')
    b.followUps(['Summarise the urgent jobs', 'Compare driver workload'])
    return
  }

  b.step(2, 'running')
  const n = ids.length
  b.say(`I found **${plural(n, 'job')}** to update. Please check the ${changes.length === 1 ? 'change' : 'changes'} below.`)
  b.approval({
    kind: 'jobs',
    title: `Allow the agent to update ${plural(n, 'job')}?`,
    summary: 'The change shows at once in the job list, the board and the issue page.',
    changes,
    groups: [{ ids, patch }],
  })
}

export function continueUpdate(
  request: UpdateRequest,
  decision: 'approved' | 'denied',
  ctx: BuilderContext,
) {
  const b = new Builder(ctx, 350)
  const n = new Set(request.changes.map((c) => c.jobId)).size
  if (decision === 'approved') {
    b.step(2, 'done')
    b.step(3, 'running')
    b.tool('update_jobs', {
      updates: request.groups.map((g) => ({ ids: g.ids, set: g.patch })),
    }, {
      output: { updated: n, jobs: request.changes.map((c) => ({ id: c.jobId, [c.field.toLowerCase()]: c.to })) },
      summary: `${n} updated`,
    }, `Updating ${plural(n, 'job')}…`)
    b.step(3, 'done')
    b.say([
      `Done. I updated **${plural(n, 'job')}**:`, '',
      ...request.changes.map((c) => `- **${c.jobId}** ${c.title}: ${c.field.toLowerCase()} ${c.from} → **${c.to}**`), '',
      'The job list, the board and the issue page show the change now. [Open the board](#board)',
    ].join('\n'))
    b.followUps(['Summarise the urgent jobs', 'Compare driver workload'])
  } else {
    b.step(2, 'failed')
    b.say([
      `Okay, I did not change anything. The ${n === 1 ? 'job stays as it was' : 'jobs stay as they were'}.`, '',
      `If only some of these should change, tell me which, for example “${followUpFor(request.changes[0])}”.`,
    ].join('\n'))
    b.followUps([followUpFor(request.changes[0]), 'Summarise the urgent jobs'])
  }
  return b.events
}

// ---------------------------------------------------------------------------
// Scenario: compare (run_query). "Workload" fails the first time, on purpose.

type Dimension = 'driver' | 'customer' | 'status'

const SQL: Record<Dimension, string> = {
  driver: "select coalesce(driver, 'Unassigned') as driver,\n  count(*) filter (where status in ('backlog', 'todo', 'progress')) as open,\n  count(*) filter (where priority in ('urgent', 'high')) as urgent_high,\n  count(*) filter (where status = 'done') as done\nfrom jobs\ngroup by 1\norder by open desc",
  customer: "select customer,\n  count(*) filter (where status in ('backlog', 'todo', 'progress')) as open,\n  count(*) filter (where status = 'done') as done\nfrom jobs\ngroup by customer\norder by open desc",
  status: 'select status, count(*) as jobs,\n  count(*) filter (where priority in (\'urgent\', \'high\')) as urgent_high\nfrom jobs\ngroup by status',
}

function aggregate(jobs: Job[], dim: Dimension): Record<string, string | number>[] {
  if (dim === 'status') {
    return (Object.keys(STATUS) as Status[]).map((s) => {
      const mine = jobs.filter((j) => j.status === s)
      return { status: STATUS[s].label, jobs: mine.length, urgent_high: mine.filter(isHot).length }
    }).filter((r) => r.jobs > 0)
  }
  const keys = dim === 'driver' ? [...PEOPLE, ''] : CUSTOMERS
  return keys.map((key) => {
    const mine = jobs.filter((j) => (dim === 'driver' ? j.driver : j.customer) === key)
    const open = mine.filter(isOpen)
    return {
      [dim]: key || 'Unassigned',
      open: open.length,
      urgent_high: open.filter(isHot).length,
      due_today: open.filter((j) => j.due === 'Today').length,
      done: mine.filter((j) => j.status === 'done').length,
    }
  }).filter((r) => Number(r.open) + Number(r.done) > 0).sort((a, b) => Number(b.open) - Number(a.open))
}

const HEADERS: Record<string, string> = {
  driver: 'Driver', customer: 'Customer', status: 'Status', open: 'Open', urgent_high: 'Urgent or high',
  due_today: 'Due today', done: 'Done', jobs: 'Jobs',
}

export function compare(b: Builder, ctx: AgentContext) {
  const p = ctx.prompt.toLowerCase()
  const dim: Dimension = /customer|client/.test(p) ? 'customer' : /status|stage|column/.test(p) ? 'status' : 'driver'
  const failing = /workload/.test(p) && ctx.attempt === 0
  const rows = aggregate(ctx.jobs, dim)

  b.think([
    `They want to compare jobs by ${dim}.`,
    'The reporting database is the quickest way to count them, so I will run one query and turn the result into a table.',
  ], [
    'Open work matters more than finished work here, so I will sort by open jobs.',
    'Urgent and high-priority jobs weigh more, so they get their own column.',
  ])
  b.plan([`Count jobs by ${dim}`, 'Build the table', 'Point out what stands out'])
  b.step(0, 'running')
  if (failing) {
    b.tool('run_query', { sql: SQL[dim], timeout_ms: 30000 }, {
      error: 'Timed out after 30 s. The reporting replica is busy.',
    }, 'Running query…')
    b.step(0, 'failed')
    b.fail(
      'The query service did not answer in time, so I could not build the comparison.',
      'Nothing was changed. Retrying usually works once the replica catches up.',
    )
    return
  }
  b.tool('run_query', { sql: SQL[dim] }, { output: rows, summary: plural(rows.length, 'row') }, 'Running query…')
  b.step(0, 'done')
  b.step(1, 'running')
  b.pause(350)
  b.step(1, 'done')
  b.step(2, 'running')

  const keys = rows.length ? Object.keys(rows[0]) : []
  const lines: string[] = []
  if (ctx.attempt && /workload/.test(p)) lines.push('The query went through this time.', '')
  lines.push(mdTable(keys.map((k) => HEADERS[k] ?? k), rows.map((r) => keys.map((k) => r[k]))))
  if (dim !== 'status' && rows.length > 1) {
    const top = rows[0]
    const people = rows.filter((r) => r[dim] !== 'Unassigned')
    const least = [...people].sort((a, b) => Number(a.open) - Number(b.open))[0]
    lines.push('')
    lines.push(`- **${top[dim]}** has the most open work: ${plural(Number(top.open), 'job')}, ${top.urgent_high} of them urgent or high.`)
    if (least && least !== top) lines.push(`- **${least[dim]}** has the fewest open jobs, so ${dim === 'driver' ? 'they are the best pick for new work' : 'they need the least chasing'}.`)
    const unassigned = rows.find((r) => r[dim] === 'Unassigned')
    if (unassigned && Number(unassigned.open)) lines.push(`- ${plural(Number(unassigned.open), 'open job')} ${Number(unassigned.open) === 1 ? 'has' : 'have'} nobody assigned.`)
    if (b.detail >= 3 && least && least !== top && dim === 'driver') {
      lines.push('', `### Suggestion`, `Move one of ${top[dim]}'s jobs to ${least[dim]} to even things out. Say “Assign DO-24812 to ${least[dim]}” and I will ask before I change it.`)
    }
  } else if (dim === 'status') {
    const open = rows.filter((r) => ['Backlog', 'Todo', 'In progress'].includes(String(r.status))).reduce((n, r) => n + Number(r.jobs), 0)
    lines.push('', `**${open}** of ${ctx.jobs.length} jobs are still open.`)
  }
  lines.push('', 'The table is saved as an artifact, so you can download it as CSV.')
  b.say(lines.join('\n'))
  b.step(2, 'done')
  b.artifact({ title: `Jobs by ${dim}`, kind: 'table', language: 'csv', content: csv(rows), source: { template: 'other' } })
  b.followUps(dim === 'driver'
    ? ['Break it down by customer', 'Assign DO-24812 to Mei Ling', 'Make it shorter']
    : ['Compare driver workload', 'Make it shorter'])
}
