import { plural } from '@/lib/text'
import type { Job } from '../../data'
import { TOPICS } from './scenarios-assist'
import { DATE_LABEL, byUrgency, isHot, isOpen, jobRow, short } from './scenario-helpers'
import { searchProjectKnowledge } from './scenarios-knowledge'
import { hash, type AgentContext, type Builder } from './script'
import type { Source } from './types'

// Deep research: any question, with Research on, becomes a long run. A short
// thought, a research plan whose steps tick through, many web searches and
// page reads with a running count ("Read 6 of 27 sources…"), then a report
// as an artifact (Summary, Findings with citations, What this means for us,
// Open questions, Sources), the sources part and a short chat message.
// Stopped part way, the reply keeps a note of how far it got.
//
// A topic's findings are listed most important first; a run reads the first
// 8, 10 or 12 (by the model's detail), so a citation [n] is always finding
// n - 1 and the summary and takeaways only cite the first eight.

type Finding = Source & { theme: number; finding: string }

type ResearchTopic = {
  match?: RegExp
  // "cold chain rules for pharma deliveries", in the middle of a sentence.
  name: string
  // The report's title.
  title: string
  steps: [string, string, string, string, string, string]
  queries: string[]
  themes: string[]
  findings: Finding[]
  summary: string
  takeaways: string[]
  // The open jobs the topic touches, and what each should do.
  affected: (jobs: Job[]) => Job[]
  action: (job: Job) => string
  extra: string[]
  openQuestions: string[]
  followUps: string[]
  demoNote?: boolean
}

const base = (name: string) => TOPICS.find((t) => t.name === name)!.sources
const from = (source: Source, theme: number, finding: string): Finding => ({ ...source, theme, finding })
const web = (title: string, domain: string, path: string, snippet: string, theme: number, finding: string): Finding => ({
  title, domain, url: `https://${domain}/${path}`, snippet, theme, finding,
})

const openWith = (label: string) => (jobs: Job[]) => jobs.filter((j) => isOpen(j) && j.labels.includes(label)).sort(byUrgency)

const COLD = base('cold chain rules for pharma deliveries')
const PALLETS = base('wooden pallets in export shipments')
const PHOTOS = base('proof of delivery photos')

const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    match: TOPICS[0].match,
    name: 'cold chain rules for pharma deliveries',
    title: 'Cold chain for pharma deliveries',
    steps: [
      'Find the current rules for chilled medicines',
      'Read the guidance on monitoring and logs',
      'Compare how carriers handle excursions',
      'Look for export and airport exceptions',
      'Check which of our jobs are affected',
      'Write the report',
    ],
    queries: [
      'cold chain rules pharmaceutical deliveries 2 to 8 °C', 'good distribution practice transport medicines',
      'temperature mapping delivery vehicles', 'pre-cooling refrigerated truck before loading',
      'temperature log interval pharma transport audit', 'data logger live upload cold chain',
      'logger calibration certificate requirements', 'temperature excursion procedure carrier',
      'excursion report contents pharma', 'multi-drop route chilled door openings',
      'chilled export pallet insulated cover', 'airport cargo terminal chilled acceptance window',
      'driver training medicines transport', 'cold chain audit common findings',
    ],
    themes: ['Temperature range and pre-cooling', 'Monitoring and records', 'Excursions: who decides', 'Export and airports'],
    findings: [
      from(COLD[0], 0, 'Chilled medicines must stay between **2 and 8 °C** from pick-up to hand-over, in the depot as well as on the road.'),
      from(COLD[1], 1, 'Auditors expect a reading at least every **15 minutes**, kept with the delivery record. A gap in the log counts as an excursion.'),
      from(COLD[2], 2, 'When a load leaves the range, **quarantine it and call the customer**. The customer, not the carrier, decides whether it can be used.'),
      web('Good distribution practice for transport: a summary', 'regulator.example.gov', 'gdp/transport', 'Vehicles carrying medicines must be qualified for temperature.', 0,
        'Vehicles must be **temperature-mapped** once a year and after any repair to the cooling unit.'),
      web('Pre-cooling: how long is long enough?', 'fleet.example.com', 'reefer/pre-cooling', 'Load into a cold truck, not a warm one.', 0,
        'Pre-cool the load space for **30 to 45 minutes** before loading. A warm truck is the most common cause of early excursions.'),
      web('Data loggers compared', 'loggers.example.net', 'compare/2026', 'Loggers that upload during the trip.', 1,
        'Loggers that **upload during the trip** let the office act before hand-over, rather than finding problems afterwards.'),
      from(COLD[3], 3, 'Chilled export pallets need **insulated covers and one data logger per pallet**, not one per container.'),
      web('Door openings on multi-drop routes', 'coldchain.example.org', 'guides/multi-drop', 'Each stop lets warm air in.', 0,
        'On multi-drop routes each door opening can lift the load space by **2 to 3 °C**, so chilled stops should come first.'),
      web('Excursion reports: what to include', 'quality.example.org', 'excursion-reports', 'Peak, duration and the logger ID.', 2,
        'An excursion report gives the peak temperature, how long it lasted and the logger ID, and goes out **within one hour**.'),
      web('Calibrating thermometers and loggers', 'metrology.example.org', 'calibration/loggers', 'Calibrate every year.', 1,
        'Loggers need a calibration certificate no older than **12 months**, kept with the fleet records.'),
      web('Chilled hand-overs at airport cargo terminals', 'aircargo.example.com', 'chilled-acceptance', 'Terminals accept chilled cargo at set times.', 3,
        'Airport terminals accept chilled cargo only in **set windows**. A missed window can mean hours on an unchilled apron.'),
      web('Training drivers for medicine loads', 'training.example.net', 'courses/medicines', 'A yearly refresher for drivers.', 2,
        'Drivers carrying medicines should have a **refresher once a year**, including what to do in an excursion.'),
    ],
    summary: 'Chilled medicines must stay between 2 and 8 °C from pick-up to hand-over [1], with a reading at least every 15 minutes [2]. The rules themselves are settled; the risk is in daily practice: loading into a warm truck [5] and opening the doors on multi-drop routes [8]. When a load leaves the range it is quarantined, and the customer decides what happens to it [3].',
    takeaways: [
      'The range is **2 to 8 °C** for the whole trip, depot included [1].',
      'Log the temperature **every 15 minutes**; a gap counts as an excursion [2].',
      'On an excursion, **quarantine and call the customer**: they decide, not us [3].',
    ],
    affected: openWith('cold'),
    action: (job) => 'pre-cool the truck, print the temperature log before wrapping, and put the chilled stop first on the route.',
    extra: ['Check that every logger has a calibration certificate from the last 12 months [10].'],
    openQuestions: [
      'When were our trucks last temperature-mapped? The guidance expects once a year [4].',
      'Do our loggers upload during the trip, or only when the job is closed?',
      'Who at each customer decides on an excursion out of office hours?',
    ],
    followUps: ['Make a checklist for drivers', 'Make it shorter'],
  },
  {
    match: TOPICS[1].match,
    name: 'wooden pallets in export shipments',
    title: 'Wooden pallets in export shipments',
    steps: [
      'Find the current rules for wooden packaging',
      'Read the treatment and marking standards',
      'Compare what happens at the border',
      'Look for exemptions and alternatives',
      'Check which of our jobs ship abroad',
      'Write the report',
    ],
    queries: [
      'rules for wooden pallets in export shipments', 'wood packaging heat treatment standard',
      'pallet treatment stamp position', 'heat treatment core temperature 56 °C 30 minutes',
      'container held at port wooden pallet', 'rejected wood packaging what happens',
      'repaired pallet treatment status', 'dunnage bracing export rules',
      'treatment certificate customs request', 'plywood crate exempt wood packaging',
      'plastic vs wooden export pallets cost', 'fumigation pallets airing before loading',
      'export packing checklist photos', 'countries inspecting wood packaging on arrival',
    ],
    themes: ['Treatment and marking', 'At the border', 'Paperwork', 'Alternatives to wood'],
    findings: [
      from(PALLETS[0], 0, 'Wooden pallets and crates must be **heat-treated or fumigated**, with the treatment stamp on two opposite sides.'),
      from(PALLETS[1], 1, 'A **missing or smudged stamp** is the most common reason a container is held; the fix is re-treating or replacing the pallet at the port.'),
      from(PALLETS[2], 2, 'Customs can ask for the treatment certificate, so it belongs **with the job**, not only with the supplier.'),
      web('Heat treatment: core temperature and time', 'standards.example.org', 'wood-packaging/heat', 'The core must reach 56 °C.', 0,
        'Heat treatment means the wood’s core reaches **56 °C for at least 30 minutes**. Kiln-dried alone does not count.'),
      web('Which countries inspect wooden packaging', 'trade.example.gov', 'inspections/wood', 'Inspection on arrival is common.', 1,
        'Most importing countries inspect wooden packaging on arrival, and some check **every** consignment from certain origins.'),
      web('Repaired pallets and the stamp', 'pallets.example.com', 'repairs', 'Repairs need treated wood too.', 0,
        'A pallet repaired with untreated wood **loses its status**; repaired boards need their own stamp.'),
      from(PALLETS[3], 3, 'Plastic and metal pallets need **no treatment**, but cost more and are harder to get back.'),
      web('Dunnage and bracing count too', 'freight.example.com', 'dunnage', 'Bracing inside the container is packaging.', 0,
        'Wooden **dunnage and bracing** inside the container fall under the same rules as the pallets.'),
      web('What happens to rejected packaging', 'customs.example.gov', 'wood/rejections', 'Treat, destroy or return.', 1,
        'Rejected packaging is treated, destroyed or sent back **at the shipper’s cost**, and the cargo waits until it is done.'),
      web('An export packing checklist', 'handbook.example.org', 'export-packing', 'Photograph the stamps.', 2,
        'Teams that **photograph the stamps** before loading answer port queries in minutes rather than days.'),
      web('Plywood and particle board', 'materials.example.net', 'engineered-wood', 'Processed wood is exempt.', 3,
        'Plywood and particle board are processed wood and **exempt**, which makes them a common choice for crates.'),
      web('Fumigated pallets: airing before loading', 'safety.example.org', 'fumigation/airing', 'Let the gas clear first.', 0,
        'Fumigated pallets must be **aired before loading**, and some ports no longer accept certain fumigants.'),
    ],
    summary: 'Wooden pallets in export shipments must be heat-treated or fumigated and stamped [1]; heat treatment means a 56 °C core for 30 minutes [4]. The common failure is not the rule but the stamp: a missing or smudged mark holds the container [2], and a repaired pallet loses its status [6]. Keep the treatment certificate with the job [3].',
    takeaways: [
      'Every wooden pallet needs **treatment and a clear stamp** [1].',
      'A smudged or missing stamp is the **top reason containers are held** [2].',
      'File the **treatment certificate with the job** [3].',
    ],
    affected: openWith('export'),
    action: () => 'photograph the pallet stamps before loading and file the treatment certificate with the job.',
    extra: ['Plastic pallets avoid treatment altogether, at a higher price [7].'],
    openQuestions: [
      'Does our pallet supplier stamp the boards it uses for repairs [6]?',
      'Who keeps the treatment certificates today, and can drivers find them at the port?',
      'Would plywood crates cost less than re-treating at the port?',
    ],
    followUps: ['Make a checklist for drivers', 'Make it shorter'],
  },
  {
    match: TOPICS[2].match,
    name: 'proof of delivery photos',
    title: 'Proof of delivery photos',
    steps: [
      'Find what good proof of delivery looks like',
      'Read the guidance on photos and signatures',
      'Compare what holds up in disputes',
      'Look for privacy and storage rules',
      'Check which of our jobs lack photos',
      'Write the report',
    ],
    queries: [
      'proof of delivery photo best practice', 'signed delivery note photo dispute',
      'photographing damage for claims', 'delivery photo timestamp location',
      'delivery disputes short count evidence', 'low light delivery photo trailer',
      'refused delivery what to photograph', 'privacy people in delivery photos',
      'how long to keep proof of delivery', 'container seal number photo',
      'proof of delivery contract requirements', 'photo compression signature readable',
      'proof of delivery app vs camera', 'delivery photo checklist drivers',
    ],
    themes: ['What to photograph', 'Making photos hold up', 'Damage and disputes', 'Privacy and storage'],
    findings: [
      from(PHOTOS[0], 0, 'Three photos settle most disputes: **the whole load, the signed note and any damage**.'),
      from(PHOTOS[1], 1, 'The signed note should be flat and readable, with the **job number in the frame**.'),
      from(PHOTOS[2], 2, 'Photograph damage **close up with something for scale**, then from far enough away to show where it is.'),
      web('Timestamps and location', 'fleet.example.com', 'pod/metadata', 'Keep the time and place with the photo.', 1,
        'Photos taken in the app keep the **time and place** with the job; gallery uploads lose them.'),
      web('What customers dispute', 'claims.example.org', 'disputes', 'Short counts lead the list.', 2,
        'Most delivery disputes are about **short counts**, so a photo that shows every pallet settles them fastest.'),
      web('Low light and blurry photos', 'help.example.net', 'pod/low-light', 'Use the flash inside trailers.', 1,
        'Use the flash in trailers and docks: a **blurry photo counts as no photo**.'),
      web('When a customer refuses a delivery', 'docs.example.com', 'pod/refusals', 'Photograph the reason on the note.', 2,
        'When a delivery is refused, photograph the goods and **the reason written on the note** before leaving.'),
      web('Container seals', 'freight.example.com', 'seals', 'Seal numbers before and after.', 0,
        'For containers, photograph the **seal number** before opening and after closing.'),
      web('People in delivery photos', 'privacy.example.org', 'workplace-photos', 'Leave faces out.', 3,
        'Leave **faces and other vehicles’ number plates** out of the frame; retake if someone walks in.'),
      web('How long to keep delivery photos', 'records.example.org', 'retention', 'As long as invoices can be disputed.', 3,
        'Keep delivery photos for as long as invoices can be disputed, usually **12 to 24 months**.'),
      web('Photos named in contracts', 'legal.example.net', 'pod-clauses', 'Key accounts list the photos they expect.', 0,
        'Key-account contracts often **name the photos they expect**; missing ones can hold up payment.'),
      web('Compressing photos without losing detail', 'mobile.example.com', 'photo-size', 'Keep text readable.', 3,
        'Upload at a size that keeps the note readable: heavy compression makes **signatures illegible**.'),
    ],
    summary: 'Good proof of delivery comes down to three photos: the whole load, the signed note and any damage [1]. The note needs the job number in the frame [2] and damage needs something for scale [3]. Taking them in the app keeps the time and place with the job [4], which is what settles the most common dispute, the short count [5].',
    takeaways: [
      'Take **three photos**: the load, the signed note, any damage [1].',
      'Get the **job number in the frame** of the signed note [2].',
      'Use the **app, not the camera**, so time and place are saved [4].',
    ],
    affected: (jobs) => jobs.filter((j) => isOpen(j) && j.photos === 0).sort(byUrgency),
    action: () => 'has no photos yet: take the three before hand-over.',
    extra: ['Container jobs also need the seal number photographed [8].'],
    openQuestions: [
      'Do any key-account contracts name the photos they expect [11]?',
      'How long do we keep delivery photos today?',
      'Should the app refuse to close a job without its photos?',
    ],
    followUps: ['Make a checklist for drivers', 'Make it shorter'],
  },
]

// Anything else: a believable report on the prompt's own words, said to be made up.
function genericTopic(prompt: string): ResearchTopic {
  const topic = short(prompt.replace(/^\/\w+\s*/, '').replace(/[?.!]+$/, ''), 50) || 'this topic'
  // A search query from a question: "How should we onboard new drivers" → "onboard new drivers".
  const q = topic.toLowerCase().replace(/^(how|what|why|when|who|which|where)( (should|do|does|can|is|are|to))?( (we|i|you|our))?\s+/, '') || topic.toLowerCase()
  const Topic = topic[0].toUpperCase() + topic.slice(1)
  return {
    name: `“${topic}”`,
    title: Topic,
    steps: [
      'Find the main guidance and requirements',
      'Read the most-cited sources',
      'Compare how other teams handle it',
      'Look for common mistakes',
      'Check what applies to our jobs',
      'Write the report',
    ],
    queries: [
      q, `${q} requirements`, `${q} best practice`, `${q} checklist`, `${q} common mistakes`, `${q} who is responsible`,
      `${q} examples`, `${q} 2026 changes`, `${q} small teams`, `${q} audit`, `${q} tools`, `${q} case study`,
      `${q} template`, `${q} questions to ask`,
    ],
    themes: ['The requirements', 'How teams handle it', 'Common mistakes', 'Keeping it up'],
    findings: [
      web(`Getting started: ${topic}`, 'docs.example.com', 'guides/getting-started', 'Start from the official requirements.', 0,
        'Most guides start from the **official requirements**, then add the team’s own rules on top.'),
      web('Who owns what: a team playbook', 'handbook.example.org', 'ownership', 'Write down who owns each step.', 1,
        'Teams that **name one owner per step** report fewer things falling between two people.'),
      web('The weekly review checklist', 'blog.example.net', 'weekly-review', 'A short weekly review catches problems early.', 3,
        'A **short weekly review** catches most problems before a customer does.'),
      web('Requirements explained', 'standards.example.org', 'explained', 'What is required and what is advice.', 0,
        'Sources separate what is **required** from what is only advice; mixing the two is a common source of extra work.'),
      web('Ten mistakes we made', 'community.example.com', 'threads/ten-mistakes', 'Lessons from a team that got it wrong.', 2,
        'The most common mistake is **writing the process down once and never revisiting it**.'),
      web('A survey of operations teams', 'research.example.edu', 'ops-survey-2026', 'How 400 teams work.', 1,
        'In a survey of 400 operations teams, those with a **written checklist** were twice as likely to rate the process as reliable.'),
      web('Templates that work', 'templates.example.com', 'ops', 'Start from a template, then trim it.', 3,
        'Starting from a **template and trimming it** is faster than writing from a blank page.'),
      web('When to ask an expert', 'advice.example.org', 'when-to-ask', 'Some questions need a specialist.', 2,
        'Where money, safety or the law is involved, sources recommend **checking with a specialist** before acting.'),
      web('Tools compared', 'reviews.example.net', 'ops-tools', 'Spreadsheets to dedicated apps.', 3,
        'A shared list in the tool the team already uses beats a **new tool nobody opens**.'),
      web('Measuring whether it works', 'metrics.example.com', 'measure', 'Pick one number to watch.', 3,
        'Pick **one number to watch** (late jobs, rework, complaints) and check it monthly.'),
      web('A case study from a small team', 'casestudies.example.org', 'small-team', 'Five people, one checklist.', 1,
        'A five-person team cut rework by a third by **reviewing every miss** in a ten-minute stand-up.'),
      web('Questions to ask before you start', 'faq.example.net', 'before-you-start', 'Who, what, when and how often.', 0,
        'Before starting, agree **who, what, when and how often**; most guides open with these four.'),
    ],
    summary: `The sources agree on a simple pattern: start from the official requirements [1], name one owner per step [2], and review it on a schedule [3]. The most common mistake is writing the process once and never revisiting it [5]; a written checklist makes the process markedly more reliable [6].`,
    takeaways: [
      'Start from the **official requirements**, then add team rules [1].',
      'Name **one owner per step** [2].',
      'Review it **weekly**; it catches problems early [3].',
    ],
    affected: (jobs) => jobs.filter((j) => isOpen(j) && isHot(j)).sort(byUrgency),
    action: () => 'is urgent or high priority: a good first case to try the checklist on.',
    extra: ['Where money, safety or the law is involved, check with a specialist first [8].'],
    openQuestions: [
      'Who would own this in our team?',
      'Which one number would show whether it is working?',
      'Is there an official requirement we must meet, or is this good practice only?',
    ],
    followUps: ['What are the cold chain rules for pharma?', 'Make it shorter'],
    demoNote: true,
  }
}

function researchTopic(prompt: string): ResearchTopic {
  const p = prompt.toLowerCase()
  return RESEARCH_TOPICS.find((t) => t.match?.test(p)) ?? genericTopic(prompt)
}

// `total` split by weights, keeping the sum (largest remainder).
function split(total: number, weights: number[]) {
  const raw = weights.map((w) => total * w)
  const counts = raw.map(Math.floor)
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).filter(([, i]) => weights[i] > 0).sort((a, b) => b[0] - a[0])
  for (let k = 0; counts.reduce((a, b) => a + b, 0) < total; k++) counts[order[k % order.length][1]] += 1
  return counts
}

const plain = (text: string) => text.replace(/\*\*/g, '')

function reportMarkdown(topic: ResearchTopic, picked: Finding[], searches: number, jobs: Job[]) {
  const lines = [
    `# ${topic.title}`,
    `*Research report · ${DATE_LABEL()} · ${plural(picked.length, 'source')} from ${plural(searches, 'search', 'searches')}*`,
  ]
  if (topic.demoNote) lines.push('', '> This demo has no real web access: the sources and findings below are made up, to show how a research report looks.')
  lines.push('', '## Summary', topic.summary, '', '## Findings')
  topic.themes.forEach((theme, t) => {
    const items = picked.map((f, i) => ({ f, n: i + 1 })).filter(({ f }) => f.theme === t)
    if (!items.length) return
    lines.push('', `### ${theme}`, ...items.map(({ f, n }) => `- ${f.finding.replace(/\.$/, '')} [${n}].`))
  })
  const affected = topic.affected(jobs).slice(0, 4)
  lines.push('', '## What this means for us')
  if (affected.length) {
    for (const job of affected) {
      const who = [job.customer, job.driver || 'unassigned', job.due && `due ${job.due}`].filter(Boolean).join(', ')
      const action = topic.action(job)
      lines.push(`- **${job.id}** (${who})${action.startsWith('has') || action.startsWith('is') ? ' ' : ': '}${action}`)
    }
  } else {
    lines.push('- None of the open jobs is affected right now, so nothing changes this week.')
  }
  lines.push(...topic.extra.filter((line) => citesWithin(line, picked.length)).map((line) => `- ${line}`))
  lines.push('', '## Open questions', ...topic.openQuestions.filter((line) => citesWithin(line, picked.length)).map((line) => `- ${line}`))
  lines.push('', '## Sources', ...picked.map((f, i) => `${i + 1}. [${f.title}](${f.url}) · ${f.domain}`))
  return lines.join('\n')
}

// A line that cites a source the run did not read is left out.
const citesWithin = (line: string, count: number) => [...line.matchAll(/\[(\d+)\]/g)].every((m) => Number(m[1]) <= count)

export function deepResearch(b: Builder, ctx: AgentContext) {
  const topic = researchTopic(ctx.prompt)
  const detail = b.detail
  const count = ([8, 10, 12] as const)[detail - 1]
  const searches = Math.min(14, count + (ctx.modes.deep ? 2 : 1))
  const picked = topic.findings.slice(0, count)
  // Faster models read fewer sources and slower ones more, so each search and
  // page is paced to keep every run between about 25 and 40 s.
  const pace = ctx.model.speed === 3 ? 1.05 : ctx.model.speed === 1 ? 0.95 : 1
  const seed = hash(ctx.prompt)

  b.think([
    `This is a deep research request on ${topic.name}. I will plan it, search widely, read the best sources and write a report with citations.`,
  ], [
    'Where sources disagree I will say so, and I will check which of our jobs it touches.',
  ])
  b.plan(topic.steps)

  let found = 0
  let read = 0
  let searched = 0

  const stopNote = () => {
    if (!read) {
      return `**Stopped after ${plural(searched, 'search', 'searches')}**, before any sources were read. No report was written.\n\nAsk again with Research on to run the full research.`
    }
    return [
      `**Stopped after ${read} of ${count} sources.** The report was not written, but here is what the sources read so far say:`, '',
      ...picked.slice(0, Math.min(read, 4)).map((f) => `- ${plain(f.finding)}`), '',
      'Ask again with Research on to run the full research and get the report.',
    ].join('\n')
  }

  const search = () => {
    const i = searched
    const results = 2 + ((seed + i * 7) % 3)
    const hits = Array.from({ length: results }, (_, k) => topic.findings[(i * 2 + k) % topic.findings.length])
    found += results
    searched += 1
    b.tool('web_search', { query: topic.queries[i % topic.queries.length] }, {
      output: hits.map(({ title, url }) => ({ title, url })), summary: plural(results, 'result'),
    }, found > results ? `Searching the web · ${plural(found - results, 'source')} found…` : 'Searching the web…', Math.round((1150 + ((seed >> (i % 8)) % 4) * 100) * pace))
    b.onStop(stopNote())
  }

  const readPage = () => {
    const f = picked[read]
    const words = 600 + ((seed + read * 131) % 2400)
    b.tool('read_file', { url: f.url, title: f.title }, {
      output: { title: f.title, domain: f.domain, words, relevant: plain(f.finding) }, summary: plural(words, 'word'),
    }, read ? `Read ${read} of ${found} sources…` : `Reading the first of ${plural(found, 'source')}…`, Math.round((600 + ((seed + read) % 3) * 100) * pace))
    read += 1
    b.onStop(stopNote())
  }

  // Steps 0–3 search and read; 4 checks the jobs; 5 writes the report.
  const searchesPer = split(searches, [0.4, 0, 0.35, 0.25])
  const readsPer = split(count, [0, 0.4, 0.35, 0.25])
  for (let step = 0; step < 4; step++) {
    b.step(step, 'running')
    if (step === 0) {
      b.onStop(stopNote())
      searchProjectKnowledge(b, ctx)
    }
    for (let k = 0; k < Math.max(searchesPer[step], readsPer[step]); k++) {
      if (k < searchesPer[step]) search()
      if (k < readsPer[step]) readPage()
    }
    if (step === 2) {
      b.activity(`Comparing ${plural(read, 'source')}…`)
      b.pause(Math.round(1200 * pace))
    }
    b.step(step, 'done')
    b.pause(Math.round(300 * pace))
  }

  b.step(4, 'running')
  const affected = topic.affected(ctx.jobs)
  b.tool('search_jobs', { status: ['Backlog', 'Todo', 'In progress'] }, {
    output: affected.map(jobRow), summary: plural(affected.length, 'job'),
  }, 'Checking our jobs…')
  b.step(4, 'done')

  b.step(5, 'running')
  b.activity('Writing the report…')
  b.onStop(`**Stopped while writing the report**, after reading all ${count} sources. Ask again with Research on to get the report.`)
  b.pause(Math.round(2500 * pace))
  const title = `${topic.title}: research report`
  b.say([
    `I researched **${topic.name}**: ${plural(searches, 'search', 'searches')}, ${plural(found, 'source')} found and the best ${count} read. The full report is in **${title}**.`, '',
    '**Key takeaways**',
    ...topic.takeaways.map((t) => `- ${t}`),
    ...(affected.length === 1 ? ['', `It touches one open job, **${affected[0].id}**; the report says what to do.`] : []),
    ...(affected.length > 1 ? ['', `It touches ${plural(affected.length, 'open job')}, starting with **${affected[0].id}**; the report says what to do for each.`] : []),
    ...(topic.demoNote ? ['', 'This demo has no real web access, so the sources are made up. Try **cold chain rules**, **export pallets** or **delivery photos** for a fully scripted report.'] : []),
  ].join('\n'))
  b.artifact({
    title, kind: 'document', language: 'markdown', content: reportMarkdown(topic, picked, searches, ctx.jobs), source: { template: 'other' },
  })
  b.onStop()
  b.step(5, 'done')
  b.sources(picked.map(({ title, url, domain, snippet }): Source => ({ title, url, domain, snippet })))
  b.followUps(topic.followUps)
}
