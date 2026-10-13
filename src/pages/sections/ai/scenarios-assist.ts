import { formatFileSize } from '@/lib/format'
import { plural } from '@/lib/text'
import { PRIORITY_RANK, dueRank, type Job } from '../../data'
import { isOpen, jobDetail, jobRow, mdTable, quote, short, stepsSummary } from './scenario-helpers'
import { emailBody, reportMarkdown } from './scenarios-jobs'
import { searchProjectKnowledge } from './scenarios-knowledge'
import { readFile, type AgentContext, type Builder } from './script'
import type { ArtifactKind, EmailTone, FileRef, Source } from './types'

// Scenarios for writing and research: code, web research, translate, plan,
// revise an artifact, read attached files, and the fallback answer.

// ---------------------------------------------------------------------------
// Scenario: code

const TS_SNIPPET = `type Job = {
  id: string
  title: string
  status: string
  priority: string
  driver: string
  due: string
}

const COLUMNS: (keyof Job)[] = ['id', 'title', 'status', 'priority', 'driver', 'due']

// Quote every cell, so commas and quotes in a title stay safe.
function cell(value: string) {
  return '"' + value.replaceAll('"', '""') + '"'
}

export function jobsToCsv(jobs: Job[]) {
  const rows = jobs.map((job) => COLUMNS.map((key) => cell(job[key])).join(','))
  return [COLUMNS.join(','), ...rows].join('\\n')
}

export function downloadCsv(jobs: Job[], name = 'jobs.csv') {
  const blob = new Blob([jobsToCsv(jobs)], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  link.click()
  URL.revokeObjectURL(url)
}`

const TS_DATE_FILTER = `

// Only the jobs due on one of the given days, e.g. ['Today', 'Tomorrow'].
export function dueOn(jobs: Job[], days: string[]) {
  return jobs.filter((job) => days.includes(job.due))
}

// downloadCsv(dueOn(jobs, ['Today']), 'due-today.csv')`

const SQL_SNIPPET = `-- Open jobs, most urgent first
select id, title, status, priority, driver, due
from jobs
where status in ('backlog', 'todo', 'progress')
order by
  case priority
    when 'urgent' then 0
    when 'high' then 1
    when 'medium' then 2
    when 'low' then 3
    else 4
  end,
  due nulls last;`

export function code(b: Builder, ctx: AgentContext) {
  const sql = /\bsql\b|\bquery\b/.test(ctx.prompt.toLowerCase())
  const sample = ctx.jobs[0]
  b.think([
    `They want ${sql ? 'a query' : 'code'} that works with the jobs.`,
    'I will read one job first, so the field names in the code match the data.',
  ], [
    sql ? 'Sorting by a CASE on priority keeps urgent jobs first without a lookup table.' : 'Quoting every CSV cell keeps commas in titles safe.',
    'Small pure functions are easy to test.',
  ])
  if (sample) b.tool('read_job', { id: sample.id }, { output: jobDetail(sample), summary: `${Object.keys(jobDetail(sample)).length} fields` }, `Reading ${sample.id}…`)
  const source = sql ? SQL_SNIPPET : TS_SNIPPET
  const lang = sql ? 'sql' : 'ts'
  const notes = sql
    ? ['- It skips done and cancelled jobs.', '- Jobs without a due date come last.']
    : ['- `jobsToCsv` is pure, so it is easy to test.', '- `downloadCsv` runs in the browser only: it needs `document`.']
  b.say([
    sql ? 'Here is a query for the open jobs, most urgent first:' : 'Here is a small TypeScript function that turns jobs into a CSV file:', '',
    `\`\`\`${lang}`, source, '```', '',
    ...(b.detail >= 2 ? notes : notes.slice(0, 1)),
  ].join('\n'))
  b.artifact({
    title: sql ? 'open-jobs.sql' : 'export-jobs.ts', kind: 'code', language: sql ? 'sql' : 'typescript',
    content: source, source: { template: 'other' },
  })
  b.followUps(sql ? ['Make it shorter', 'Write a TypeScript version'] : ['Add a date filter', 'Make it shorter'])
}

// ---------------------------------------------------------------------------
// Scenario: research on the web

type Topic = {
  name: string
  query: string
  sources: Source[]
  answer: (detail: number, jobs: Job[]) => string
  followUps: string[]
}

export const TOPICS: (Topic & { match: RegExp })[] = [
  {
    match: /cold|pharma|temperature|chill|fridge|vaccine/,
    name: 'cold chain rules for pharma deliveries',
    query: 'cold chain rules pharmaceutical deliveries 2 to 8 °C',
    sources: [
      { title: 'Keeping medicines at 2 to 8 °C in transit', domain: 'coldchain.example.org', url: 'https://coldchain.example.org/guides/2-8', snippet: 'Most chilled medicines must stay between 2 and 8 °C from pick-up to hand-over.' },
      { title: 'Temperature logs: what auditors look for', domain: 'docs.example.com', url: 'https://docs.example.com/audits/temperature-logs', snippet: 'Record the temperature every 15 minutes and keep the log with the delivery.' },
      { title: 'Handling a temperature excursion', domain: 'help.example.net', url: 'https://help.example.net/excursions', snippet: 'Quarantine the load and call the customer before delivering.' },
      { title: 'Packing chilled pallets for export', domain: 'freight.example.com', url: 'https://freight.example.com/chilled-pallets', snippet: 'Insulated covers and one data logger per pallet.' },
    ],
    answer: (detail, jobs) => {
      const lines = [
        'Here is what the sources agree on for **cold chain pharma deliveries**:', '',
        '### Keep it between 2 and 8 °C',
        'Most medicines that need chilling must stay between **2 and 8 °C** from pick-up to hand-over [1]. Pre-cool the truck before loading, and keep the doors shut between stops.', '',
        '### Log the temperature',
        'Record the temperature at least every **15 minutes** and keep the log with the delivery [2]. A gap in the log counts as an excursion.', '',
        '### Know what to do when it goes wrong',
        'If the load leaves the range, **quarantine it and call the customer** before you deliver [3]. Do not throw it away: the customer decides.',
      ]
      if (detail >= 3) {
        lines.push('', '### For export', 'Chilled export pallets need insulated covers and one data logger per pallet [4].', '',
          mdTable(['Check', 'When'], [['Pre-cool the truck', 'Before loading'], ['Temperature log', 'Every 15 min'], ['Excursion report', 'Within 1 hour']]))
      }
      const job = jobs.find((j) => isOpen(j) && j.labels.includes('cold'))
      if (job) lines.push('', `For **${job.id}** (${job.customer || job.title}), this means printing the temperature log before wrapping.`)
      return lines.join('\n')
    },
    followUps: ['Make a checklist for drivers', 'Draft an email to Orchid Pharma'],
  },
  {
    match: /pallet|wood|fumigat|heat.?treat/,
    name: 'wooden pallets in export shipments',
    query: 'rules for wooden pallets in export shipments',
    sources: [
      { title: 'Export pallets: treatment and stamps', domain: 'freight.example.com', url: 'https://freight.example.com/pallets/treatment', snippet: 'Wooden pallets must be heat-treated or fumigated and stamped.' },
      { title: 'Why containers get held at the port', domain: 'docs.example.com', url: 'https://docs.example.com/customs/holds', snippet: 'A missing or smudged stamp is the most common reason.' },
      { title: 'Keeping treatment certificates on file', domain: 'help.example.net', url: 'https://help.example.net/certificates', snippet: 'Customs can ask for the certificate, so file it with the job.' },
      { title: 'Plastic or wood? Choosing export pallets', domain: 'blog.example.org', url: 'https://blog.example.org/pallet-choice', snippet: 'Plastic needs no treatment but costs more.' },
    ],
    answer: (detail, jobs) => {
      const lines = [
        'Here is a short guide to **wooden pallets in export shipments**:', '',
        '- **Treat the wood.** Most countries only accept wooden pallets that were heat-treated or fumigated, and stamped to prove it [1].',
        '- **Check the stamp before loading.** A missing or smudged stamp is the most common reason a container is held at the port [2].',
        '- **Keep the certificate with the paperwork.** Customs can ask for it, so file it with the job [3].',
      ]
      if (detail >= 2) lines.push('', 'Plastic and metal pallets need no treatment, but they cost more and are harder to get back [4].')
      if (detail >= 3) {
        lines.push('', mdTable(['Pallet', 'Needs treatment', 'Typical use'], [['Wood', 'Yes, with a stamp', 'Most export loads'], ['Plastic', 'No', 'Food and pharma'], ['Metal', 'No', 'Heavy machinery']]))
      }
      const job = jobs.find((j) => isOpen(j) && j.labels.includes('export'))
      if (job) lines.push('', `For **${job.id}**, check the pallet stamps before the cargo is loaded.`)
      return lines.join('\n')
    },
    followUps: ['Make a checklist for drivers', 'Summarise the urgent jobs'],
  },
  {
    match: /photo|proof|signature|evidence/,
    name: 'proof of delivery photos',
    query: 'proof of delivery photo best practice',
    sources: [
      { title: 'Proof of delivery: the photo checklist', domain: 'help.example.net', url: 'https://help.example.net/pod-photos', snippet: 'One photo of the load, one of the signed note, one of any damage.' },
      { title: 'Signed notes that hold up in a dispute', domain: 'docs.example.com', url: 'https://docs.example.com/pod/signatures', snippet: 'Flat, readable and with the job number in the frame.' },
      { title: 'Photographing damage', domain: 'claims.example.org', url: 'https://claims.example.org/damage-photos', snippet: 'Close up, with something in the frame for scale.' },
    ],
    answer: (detail) => [
      'Good delivery photos have three things in common:', '',
      '1. **The whole load in one shot**, taken before the doors close [1].',
      '2. **The signed delivery note**, flat and readable, with the job number visible [2].',
      '3. **Any damage, up close**, with something in the frame for scale [3].',
      ...(detail >= 2 ? ['', 'Take them in the app rather than the phone camera, so the time and place are saved with the job [1].'] : []),
    ].join('\n'),
    followUps: ['Summarise the urgent jobs', 'Make a checklist for drivers'],
  },
]

function genericTopic(prompt: string): Topic {
  const topic = short(prompt.replace(/^\/\w+\s*/, '').replace(/[?.!]+$/, ''), 50) || 'this topic'
  return {
    name: topic,
    query: topic.toLowerCase(),
    sources: [
      { title: `Getting started: ${topic}`, domain: 'docs.example.com', url: 'https://docs.example.com/guides/getting-started', snippet: 'Start from the official requirements, then add team rules.' },
      { title: 'Who owns what: a team playbook', domain: 'handbook.example.org', url: 'https://handbook.example.org/ownership', snippet: 'Write down who owns each step.' },
      { title: 'The weekly review checklist', domain: 'blog.example.net', url: 'https://blog.example.net/weekly-review', snippet: 'A short weekly review catches problems early.' },
    ],
    answer: () => [
      `This demo has no real model or web access, so these results are made up. Here is how a researched answer looks for **“${topic}”**:`, '',
      '- **Start from the source of truth.** Most guides begin with the official requirements, then add team rules on top [1].',
      '- **Write down who owns each step**, so nothing falls between two people [2].',
      '- **Check it on a schedule.** A short weekly review catches problems early [3].', '',
      'Ask about **cold chain rules**, **export pallets** or **delivery photos** for a fully scripted example.',
    ].join('\n'),
    followUps: ['What are the cold chain rules for pharma?', 'Rules for wooden export pallets'],
  }
}

export function research(b: Builder, ctx: AgentContext) {
  const p = ctx.prompt.toLowerCase()
  const topic = TOPICS.find((t) => t.match.test(p)) ?? genericTopic(ctx.prompt)
  const detail = b.detail
  const shown = detail >= 3 ? topic.sources : topic.sources.slice(0, 3)
  b.think([
    `They asked about ${topic.name}. This needs sources, so I will search the web.`,
    'I will keep the points the sources agree on and cite each one.',
  ], [
    'Where sources disagree I should say so rather than pick one.',
    'If a job in the workspace is affected, I should point it out.',
  ])
  searchProjectKnowledge(b, ctx)
  b.tool('web_search', { query: topic.query }, {
    output: topic.sources.slice(0, 3).map(({ title, url }) => ({ title, url })), summary: plural(3, 'result'),
  }, 'Searching the web…')
  if (shown.length > 3) {
    b.tool('web_search', { query: `${topic.query} export` }, {
      output: shown.slice(3).map(({ title, url }) => ({ title, url })), summary: plural(shown.length - 3, 'result'),
    }, 'Searching the web…')
  }
  b.say(topic.answer(detail, ctx.jobs))
  b.sources(shown)
  b.followUps(topic.followUps)
}

// ---------------------------------------------------------------------------
// Scenarios: translate, plan, revise, general

const NOTICE = {
  English: 'From Monday 5 Oct, the depot opens at 6:30 am. Please park in bays 1 to 3 only, and scan your pass at the gate. Thank you.',
  French: 'À partir du lundi 5 octobre, le dépôt ouvre à 6 h 30. Merci de vous garer uniquement sur les quais 1 à 3 et de scanner votre badge à l’entrée. Merci.',
  Spanish: 'A partir del lunes 5 de octubre, el depósito abre a las 6:30. Aparque solo en los muelles 1 a 3 y escanee su pase en la entrada. Gracias.',
}

function emailIn(job: Job, lang: 'French' | 'Spanish') {
  const who = job.customer || ''
  if (lang === 'French') {
    const driver = job.driver
      ? `${job.driver} est en route et appellera votre contact sur site 15 minutes avant son arrivée.`
      : 'Nous attribuons un chauffeur et vous enverrons son nom très vite.'
    return [
      `**Objet :** Point sur votre livraison ${job.id}`, '',
      `Bonjour l’équipe ${who},`, '',
      `Votre livraison **${job.id}** (« ${job.title} ») a environ 45 minutes de retard. ${driver}`, '',
      'Si le quai ferme avant notre arrivée, nous réserverons un autre quai et vous préviendrons aussitôt.', '',
      'Toutes nos excuses pour l’attente, et merci de votre patience.', '',
      'Cordialement,\nL’équipe Opérations',
    ].join('\n')
  }
  const driver = job.driver
    ? `${job.driver} está en camino y llamará a su contacto en el lugar 15 minutos antes de llegar.`
    : 'Estamos asignando un conductor y le enviaremos su nombre en breve.'
  return [
    `**Asunto:** Novedades sobre su entrega ${job.id}`, '',
    `Hola, equipo de ${who}:`, '',
    `Su entrega **${job.id}** («${job.title}») lleva unos 45 minutos de retraso. ${driver}`, '',
    'Si el muelle cierra antes de que lleguemos, reservaremos otro y le avisaremos de inmediato.', '',
    'Disculpe la espera y gracias por su paciencia.', '',
    'Saludos cordiales,\nEl equipo de Operaciones',
  ].join('\n')
}

export function translate(b: Builder, ctx: AgentContext) {
  const p = ctx.prompt.toLowerCase()
  const lang = /spanish|español|espanol/.test(p) ? 'Spanish' : 'French'
  const other = !/french|spanish|español|espanol|français|francais/.test(p)
    && /german|malay|chinese|japanese|tamil|hindi|arabic|italian|korean|thai/.test(p)
  const last = ctx.lastArtifact
  const job = last?.artifact.source.template === 'email'
    ? ctx.jobs.find((j) => j.id === (last.artifact.source as { jobId: string }).jobId)
    : undefined
  b.think([
    job ? `They want the email in ${lang}.` : `They want the depot notice in ${lang}.`,
    'Job numbers, names and times stay as they are; only the words change.',
  ], ['Dates are written the local way, and the tone should stay polite.'])
  const note = other ? `\n\nThis demo only has French and Spanish, so here is ${lang}.` : ''
  if (job && last) {
    const content = emailIn(job, lang)
    b.say(`Here is the email in ${lang}. I kept the job number and names as they are.${note}\n\n${quote(content)}`)
    b.artifact({
      title: `${last.artifact.title} (${lang})`, kind: 'document', language: 'markdown', content,
      source: { template: 'other' },
    })
    b.followUps(['Make it shorter', lang === 'French' ? 'Translate it to Spanish' : 'Translate it to French'])
    return
  }
  b.say([
    `Here is the depot notice in ${lang}:${note}`, '',
    quote(NOTICE[lang]), '',
    ...(b.detail >= 2 ? ['The original, for reference:', '', quote(NOTICE.English)] : []),
  ].join('\n'))
  b.followUps([lang === 'French' ? 'Now in Spanish' : 'Now in French', 'Plan tomorrow’s deliveries'])
}

const SLOTS = ['07:30', '09:00', '10:30', '13:00', '14:30']

export function plan(b: Builder, ctx: AgentContext) {
  const open = ctx.jobs.filter(isOpen).sort((a, b) => dueRank(a.due) - dueRank(b.due) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
  const next = open.filter((j) => j.due !== 'Today').slice(0, 4)
  const list = next.length ? next : open.slice(0, 4)
  b.think([
    'They want a plan for tomorrow.',
    'I will take the open jobs due next and put them in a sensible order: chilled and export cargo early, long drives before short ones.',
  ], [
    'Each stop should name the driver, so the plan can be sent as it is.',
    'A last check for missing photos at the end of the day saves chasing later.',
  ])
  b.plan(['Find the next jobs', 'Check who is assigned', 'Put the stops in order', 'Write the plan'])
  b.step(0, 'running')
  b.tool('search_jobs', { status: ['Backlog', 'Todo', 'In progress'], due: ['Tomorrow', '2 Oct', '4 Oct'] }, {
    output: list.map(jobRow), summary: plural(list.length, 'job'),
  }, 'Searching jobs…')
  b.step(0, 'done')
  b.step(1, 'running')
  if (list[0] && b.detail >= 2) b.tool('read_job', { id: list[0].id }, { output: jobDetail(list[0]), summary: stepsSummary(list[0]) }, `Reading ${list[0].id}…`)
  else b.pause(400)
  b.step(1, 'done')
  b.step(2, 'running')
  b.pause(500)
  b.step(2, 'done')
  b.step(3, 'running')
  if (!list.length) {
    b.say('There are no open jobs, so tomorrow is clear.')
    b.step(3, 'done')
    return
  }
  const lines = ['## Plan for tomorrow', '']
  list.forEach((job, i) => {
    const who = job.driver || 'unassigned'
    const note = job.labels.includes('cold') ? ' Keep it between 2 and 8 °C.' : job.labels.includes('export') ? ' Check the export labels.' : ''
    lines.push(`- [ ] **${SLOTS[i]}** ${job.id}, *${job.title.toLowerCase()}* (${who}).${note}`)
  })
  lines.push(`- [ ] **16:00** Check every job has its delivery photos before closing.`)
  const unassigned = list.filter((j) => !j.driver)
  if (unassigned.length) lines.push('', `**Watch out:** ${unassigned.map((j) => j.id).join(', ')} ${unassigned.length === 1 ? 'has' : 'have'} nobody assigned yet.`)
  if (b.detail >= 3) lines.push('', 'Send this to the drivers tonight, so they can load in the morning without waiting.')
  b.say(lines.join('\n'))
  b.step(3, 'done')
  const first = list[0]
  b.followUps([`Mark ${first.id} as in progress`, 'Draft an email to Bayview Foods'])
}

function shorten(content: string, kind: ArtifactKind) {
  if (kind === 'table') return content.split('\n').slice(0, 4).join('\n')
  if (kind === 'code') {
    return content.split('\n').filter((l) => !/^\s*(\/\/|--)/.test(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }
  const blocks = content.split(/\n{2,}/)
  let longKept = 0
  const kept = blocks.flatMap((block) => {
    const first = block.trimStart()
    if (/^#{1,6}\s/.test(first) || first.startsWith('|') || first.startsWith('**Subject') || block.length <= 60) return [block]
    if (/^(\s*[-*]|\s*\d+\.)\s/.test(first)) return [block.split('\n').filter((l) => /^\s*([-*]|\d+\.)\s/.test(l)).slice(0, 2).join('\n')]
    longKept += 1
    return longKept === 1 ? [block] : []
  })
  return kept.join('\n\n')
}

export function revise(b: Builder, ctx: AgentContext) {
  const last = ctx.lastArtifact!
  const { artifact } = last
  const p = ctx.prompt.toLowerCase()
  const mode = /shorter|shorten|condense|tighten|brief|trim/.test(p) ? 'shorter'
    : /formal|polite/.test(p) ? 'formal'
      : /warm|friendl/.test(p) ? 'warmer' : 'longer'
  const job = artifact.source.template === 'email'
    ? ctx.jobs.find((j) => j.id === (artifact.source as { jobId: string }).jobId)
    : undefined

  let content = last.content
  let source = artifact.source
  let intro = ''
  if (job) {
    const tone: EmailTone = mode === 'shorter' ? 'short' : mode === 'formal' ? 'formal' : mode === 'warmer' ? 'warm' : 'standard'
    content = emailBody(job, tone)
    source = { template: 'email', jobId: job.id, tone }
    intro = { shorter: 'Here is a shorter version. It keeps the delay and the next step.', formal: 'Here is a more formal version.', warmer: 'Here is a warmer version.', longer: 'Here is the full version again.' }[mode]
  } else if (artifact.source.template === 'report') {
    content = reportMarkdown(ctx.jobs, mode === 'shorter' ? 1 : 4)
    intro = mode === 'shorter'
      ? 'Here is a shorter version: just the summary and the table.'
      : 'Here is a longer version, with the other open jobs added at the end.'
  } else if (mode === 'shorter') {
    content = shorten(last.content, artifact.kind)
    intro = artifact.kind === 'code' ? 'Here it is without the comments.' : artifact.kind === 'table' ? 'Here are the top rows only.' : 'Here is a shorter version.'
  } else if (artifact.kind === 'code' && artifact.language === 'typescript') {
    content = last.content.includes('dueOn') ? last.content : last.content + TS_DATE_FILTER
    intro = 'I added a `dueOn` helper that keeps only the jobs due on the days you pass in.'
  } else {
    intro = 'It already reads well, so I only tidied it. The content is the same.'
  }

  b.think([`They want the ${artifact.title} ${mode === 'longer' ? 'expanded' : mode}.`, 'I will keep the facts and change only the length and tone.'])
  b.pause(250)
  b.say(`${intro} It is saved as a new version of **${artifact.title}**.`)
  b.artifact({ title: artifact.title, kind: artifact.kind, language: artifact.language, content, source, reviseId: artifact.id })
  b.followUps(job
    ? [mode === 'formal' ? 'Make it warmer' : 'Make it more formal', 'Translate it to French']
    : ['Make it longer', 'Mark the jobs due today as done'])
}

const FILE_KIND_LABEL: Record<FileRef['kind'], string> = {
  pdf: 'PDF', sheet: 'Spreadsheet', doc: 'Document', csv: 'CSV', text: 'Text', image: 'Image', code: 'Code', other: 'File',
}

export function files(b: Builder, ctx: AgentContext) {
  const list = ctx.attachments.slice(0, 3)
  b.think([
    `They shared ${plural(list.length, 'file')} and want to know what is in ${list.length === 1 ? 'it' : 'them'}.`,
    'I will read each one and give a short overview, then suggest what to do next.',
  ])
  b.say([
    `Here is what I found in ${list.length === 1 ? 'the file' : `the ${list.length} files`}:`, '',
    mdTable(['File', 'Type', 'Size', 'Contents'], list.map((f) => [f.name, FILE_KIND_LABEL[f.kind], formatFileSize(f.size), readFile(f).summary])),
    '', 'This demo does not open the files, so the contents above are made up. Ask me to compare them with the job list, or to draft a reply about them.',
  ].join('\n'), false)
  b.followUps(['Compare them with the urgent jobs', 'Draft an email about them'])
}

export function general(b: Builder, ctx: AgentContext) {
  const p = ctx.prompt.toLowerCase().trim()
  const hello = /^(hi|hello|hey|yo|hiya|good (morning|afternoon|evening))\b/.test(p)
  b.think([
    hello ? 'A greeting. I should say hello and show what I can do.' : `The question is “${short(ctx.prompt)}”. None of my scripted skills matches it closely.`,
    'I will answer briefly and point to what works in this workspace.',
  ])
  searchProjectKnowledge(b, ctx)
  b.say([
    hello ? 'Hi! Here is what I can do in this workspace:' : 'I do not have a scripted answer for that, since this demo has no real model behind it. Here is what I can do:', '',
    '- **Summarise** open and urgent jobs, straight from the job list',
    '- **Draft** emails to customers, with the job details filled in',
    '- **Update** jobs, after you approve each change',
    '- **Compare** workload by driver, customer or status',
    '- **Research** a topic on the web, with sources', '',
    'Type **/** for commands or **@** to mention a person, job or project.',
  ].join('\n'))
  b.followUps(['Summarise the urgent jobs', 'Compare driver workload', 'What are the cold chain rules for pharma?'])
}
