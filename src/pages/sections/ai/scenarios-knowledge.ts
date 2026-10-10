import { plural } from '@/lib/text'
import { mdTable, quote, short } from './scenario-helpers'
import type { AgentContext, Builder } from './script'
import type { FileKind, Project, Source } from './types'

// Scenario: an answer from a project's files, with citations. The project's
// knowledge is searched (search_knowledge), the trail shows the passages it
// found, the answer cites them [1][2], and the reply ends with the documents
// as sources. Nothing is read: each seeded file has a few made-up passages.

type Passage = {
  id: string
  file: string
  kind: FileKind
  page?: number
  text: string
  // Words in a question that this passage answers.
  terms: string[]
}

const PASSAGES: Passage[] = [
  // Customer support
  {
    id: 'refund-30', file: 'Refund policy.pdf', kind: 'pdf', page: 1,
    text: 'Customers can ask for a refund within 30 days of delivery. Refunds go back to the original payment method within 5 to 7 working days.',
    terms: ['refund', 'money back', 'return', 'policy', 'days'],
  },
  {
    id: 'refund-500', file: 'Refund policy.pdf', kind: 'pdf', page: 2,
    text: 'Refunds over $500 need a team lead’s approval before they are issued. Below that amount, any support agent can approve a refund on the spot.',
    terms: ['refund', 'approv', 'team lead', '$', 'policy'],
  },
  {
    id: 'refund-damage', file: 'Refund policy.pdf', kind: 'pdf', page: 3,
    text: 'Damaged goods: ask the customer for photos within 48 hours of delivery. If the damage happened in transit, offer a full refund or a free re-delivery, whichever the customer prefers.',
    terms: ['damag', 'broken', 'pallet', 'complain', 'photo', 'refund'],
  },
  {
    id: 'refund-late', file: 'Refund policy.pdf', kind: 'pdf', page: 4,
    text: 'Late deliveries: for a delay of more than 24 hours, offer a 10% credit on the next order. Delays alone are not refunded.',
    terms: ['late', 'delay', 'credit', 'compensat', 'refund'],
  },
  {
    id: 'tone-apology', file: 'Tone of voice.md', kind: 'text',
    text: 'Start with the answer, then the reason. Apologise once, plainly (“Sorry, your pallet arrived damaged.”) and never blame the driver or the customer.',
    terms: ['reply', 'respond', 'tone', 'apolog', 'complain', 'damag'],
  },
  {
    id: 'tone-next', file: 'Tone of voice.md', kind: 'text',
    text: 'Always end with a next step: what we will do, by when, and who to contact. Sign off as the Operations team, never as a single agent.',
    terms: ['reply', 'next step', 'sign', 'complain', 'tone'],
  },
  {
    id: 'tone-plain', file: 'Tone of voice.md', kind: 'text',
    text: 'Use plain English: short sentences and no jargon. Write “delivery”, not “consignment”, and “proof of delivery”, not “POD”.',
    terms: ['tone', 'plain', 'jargon', 'word', 'style', 'write'],
  },
  {
    id: 'faq-where', file: 'Top questions.csv', kind: 'csv',
    text: 'Where is my delivery? · 38% of questions · Answer with the job number and the driver’s arrival window.',
    terms: ['where', 'track', 'most', 'top questions', 'ask'],
  },
  {
    id: 'faq-address', file: 'Top questions.csv', kind: 'csv',
    text: 'Can I change the delivery address? · 14% of questions · Yes, until the job is in progress. After that it is a new job.',
    terms: ['address', 'change', 'most', 'top questions', 'ask'],
  },
  {
    id: 'faq-refund', file: 'Top questions.csv', kind: 'csv',
    text: 'How do I get a refund? · 11% of questions · Link to the refund form and say how long it takes (5 to 7 working days).',
    terms: ['refund', 'most', 'top questions', 'ask'],
  },
  // Q4 planning
  {
    id: 'q4-ontime', file: 'Q4 targets.xlsx', kind: 'sheet',
    text: 'On-time delivery · Q3 actual 93% · Q4 target 96%, measured weekly per depot.',
    terms: ['target', 'goal', 'on-time', 'on time', 'q4', 'kpi'],
  },
  {
    id: 'q4-revenue', file: 'Q4 targets.xlsx', kind: 'sheet',
    text: 'Revenue · Q3 actual $3.6M · Q4 target $4.2M across October to December, with December carrying about 40% because of the holiday peak.',
    terms: ['target', 'goal', 'revenue', 'q4', 'december', 'kpi'],
  },
  {
    id: 'q4-cost', file: 'Q4 targets.xlsx', kind: 'sheet',
    text: 'Cost per delivery · Q3 actual $41 · Q4 target under $38, mainly from fewer failed first attempts.',
    terms: ['target', 'goal', 'cost', 'q4', 'kpi'],
  },
  {
    id: 'cap-peak', file: 'Capacity plan.pdf', kind: 'pdf', page: 3,
    text: 'Peak weeks start on 23 Nov. They need 6 extra trucks on short-term hire and two weekend shifts at the Jurong depot.',
    terms: ['capacity', 'peak', 'truck', 'fleet', 'weekend', 'target'],
  },
  {
    id: 'cap-drivers', file: 'Capacity plan.pdf', kind: 'pdf', page: 5,
    text: 'Hiring 4 drivers by 15 Nov covers the peak without anyone working more than 10 hours of overtime a week.',
    terms: ['capacity', 'hir', 'driver', 'overtime', 'peak'],
  },
  {
    id: 'hire-roles', file: 'Hiring notes.docx', kind: 'doc', page: 1,
    text: 'Q4 hiring: 4 drivers and 1 dispatcher. Interviews in the week of 19 Oct, with start dates by 9 Nov so new drivers ride along before the peak.',
    terms: ['hir', 'recruit', 'headcount', 'dispatcher', 'interview', 'driver'],
  },
  // Operations
  {
    id: 'roster-weekend', file: 'Driver roster.xlsx', kind: 'sheet',
    text: 'Weekend shifts: Siti and Marcus on Saturdays, Daniel on Sundays. Shift swaps need a day’s notice to the dispatcher.',
    terms: ['roster', 'shift', 'weekend', 'saturday', 'sunday', 'swap'],
  },
  {
    id: 'safety-trip', file: 'Safety checklist.pdf', kind: 'pdf', page: 1,
    text: 'Before every trip: tyres, lights and mirrors, and the load strapped at both ends. Hi-vis vests on in the yard at all times.',
    terms: ['safety', 'check', 'trip', 'hi-vis', 'tyre', 'strap'],
  },
  {
    id: 'safety-near-miss', file: 'Safety checklist.pdf', kind: 'pdf', page: 2,
    text: 'Report any near miss the same day, in the app, with a photo. Nobody is blamed for reporting one.',
    terms: ['safety', 'near miss', 'incident', 'report'],
  },
]

const PASSAGE = Object.fromEntries(PASSAGES.map((p) => [p.id, p])) as Record<string, Passage>

type Cite = (id: string) => string

// A question the files answer, with the answer written out. `files` are the
// documents it reads; the scripted answer needs them all, and with only some
// of them the reply quotes the passages it found instead.
type Topic = {
  match: RegExp
  name: string
  files: string[]
  answer: (cite: Cite, detail: number, has: (file: string) => boolean) => string
  followUps: string[]
}

const TOPICS: Topic[] = [
  {
    match: /\bdamag|\bcomplain|\bbroken\b|\bcrushed\b/,
    name: 'how to reply to a damaged pallet complaint',
    files: ['Refund policy.pdf', 'Tone of voice.md'],
    answer: (cite, detail) => [
      'The refund policy and the tone of voice guide together say:', '',
      `1. **Apologise once, plainly**, and lead with the answer rather than the reason. Never blame the driver or the customer ${cite('tone-apology')}.`,
      `2. **Ask for photos** of the damage within 48 hours of delivery ${cite('refund-damage')}.`,
      `3. **Offer a full refund or a free re-delivery**, whichever they prefer ${cite('refund-damage')}. A refund over $500 needs a team lead’s approval first ${cite('refund-500')}.`,
      `4. **End with a next step**: what happens, by when, and who to contact, signed as the Operations team ${cite('tone-next')}.`,
      ...(detail >= 2 ? ['', 'A reply could start like this:', '',
        quote('Sorry, your pallet arrived damaged. Could you send us a photo or two of the damage by Friday? As soon as we have them, we will arrange a full refund or a free re-delivery, whichever suits you best.\n\nThe Operations team')] : []),
    ].join('\n'),
    followUps: ['What is our refund policy?', 'What do customers ask most?'],
  },
  {
    match: /\brefunds?\b|money back/,
    name: 'the refund policy',
    files: ['Refund policy.pdf'],
    answer: (cite, detail) => [
      'Here is the refund policy, from **Refund policy.pdf**:', '',
      `- **Within 30 days.** Customers can ask for a refund up to 30 days after delivery, and it reaches their original payment method in 5 to 7 working days ${cite('refund-30')}.`,
      `- **Over $500 needs a team lead.** Any support agent can approve a smaller refund on the spot ${cite('refund-500')}.`,
      `- **Damaged in transit:** once the customer sends photos (within 48 hours), offer a full refund or a free re-delivery ${cite('refund-damage')}.`,
      ...(detail >= 2 ? [`- **Late deliveries** get a 10% credit on the next order instead; a delay alone is not refunded ${cite('refund-late')}.`] : []),
      ...(detail >= 3 ? ['', 'The policy says nothing about short deliveries (part of an order missing), so check those with a team lead.'] : []),
    ].join('\n'),
    followUps: ['How should I reply to a damaged pallet complaint?', 'What do customers ask most?'],
  },
  {
    match: /tone of voice|house style|\bwording\b|how (should|do) (we|i) (sound|write)/,
    name: 'the tone of voice',
    files: ['Tone of voice.md'],
    answer: (cite) => [
      'The tone of voice guide comes down to three rules:', '',
      `- **Answer first, apologise once**, and never blame anyone ${cite('tone-apology')}.`,
      `- **Plain English**: short sentences, no jargon such as “consignment” or “POD” ${cite('tone-plain')}.`,
      `- **Always a next step**, signed as the Operations team ${cite('tone-next')}.`,
    ].join('\n'),
    followUps: ['How should I reply to a damaged pallet complaint?', 'What is our refund policy?'],
  },
  {
    match: /top questions|most (common|asked|often)|ask (us )?(the )?most|\bfaqs?\b/,
    name: 'the questions customers ask most',
    files: ['Top questions.csv'],
    answer: (cite) => [
      'From **Top questions.csv**, the three questions customers ask most:', '',
      mdTable(['Question', 'Share', 'How to answer'], [
        [`Where is my delivery? ${cite('faq-where')}`, '38%', 'The job number and the arrival window'],
        [`Can I change the address? ${cite('faq-address')}`, '14%', 'Yes, until the job is in progress'],
        [`How do I get a refund? ${cite('faq-refund')}`, '11%', 'The refund form, 5 to 7 working days'],
      ]),
    ].join('\n'),
    followUps: ['What is our refund policy?', 'How should I reply to a damaged pallet complaint?'],
  },
  {
    match: /\btargets?\b|\bgoals?\b|\bkpis?\b/,
    name: 'the Q4 targets',
    files: ['Q4 targets.xlsx'],
    answer: (cite, detail, has) => [
      'The Q4 targets, from **Q4 targets.xlsx**:', '',
      mdTable(['Measure', 'Q3 actual', 'Q4 target'], [
        [`On-time delivery ${cite('q4-ontime')}`, '93%', '96%'],
        [`Revenue ${cite('q4-revenue')}`, '$3.6M', '$4.2M'],
        [`Cost per delivery ${cite('q4-cost')}`, '$41', 'under $38'],
      ]), '',
      `December carries about 40% of the revenue target, because of the holiday peak ${cite('q4-revenue')}.`,
      ...(has('Capacity plan.pdf') ? [`To get there, the capacity plan adds 6 trucks from 23 Nov ${cite('cap-peak')}.`] : []),
      ...(detail >= 3 ? ['', 'On-time delivery is measured weekly per depot, so a bad week at one depot shows early.'] : []),
    ].join('\n'),
    followUps: ['How much extra capacity do we need for the peak?', 'Who are we hiring for Q4?'],
  },
  {
    match: /\bcapacity\b|\bpeak\b|extra trucks|\bfleet\b/,
    name: 'capacity for the peak',
    files: ['Capacity plan.pdf'],
    answer: (cite) => [
      'From **Capacity plan.pdf**:', '',
      `- **Peak weeks start on 23 Nov** and need 6 extra trucks on short-term hire, plus two weekend shifts at Jurong ${cite('cap-peak')}.`,
      `- **4 new drivers by 15 Nov** cover the peak with no more than 10 hours of overtime a week each ${cite('cap-drivers')}.`,
    ].join('\n'),
    followUps: ['What are the Q4 targets?', 'Who are we hiring for Q4?'],
  },
  {
    match: /\bhir(e|es|ing)\b|\brecruit|\bheadcount\b/,
    name: 'Q4 hiring',
    files: ['Hiring notes.docx'],
    answer: (cite, _detail, has) => [
      `Q4 hiring is **4 drivers and 1 dispatcher**, interviewed in the week of 19 Oct, starting by 9 Nov ${cite('hire-roles')}.`,
      ...(has('Capacity plan.pdf') ? ['', `That timing matters: the capacity plan needs the 4 drivers by 15 Nov to get through the peak without heavy overtime ${cite('cap-drivers')}.`] : []),
    ].join('\n'),
    followUps: ['What are the Q4 targets?', 'How much extra capacity do we need for the peak?'],
  },
  {
    match: /\broster\b|weekend shifts?|who('s| is) (on|working)/,
    name: 'the driver roster',
    files: ['Driver roster.xlsx'],
    answer: (cite) => `On weekends, **Siti and Marcus** drive on Saturdays and **Daniel** on Sundays. A shift swap needs a day’s notice to the dispatcher ${cite('roster-weekend')}.`,
    followUps: ['What is on the safety checklist?', 'Compare driver workload'],
  },
  {
    match: /\bsafety\b|pre-?trip|near miss|hi-?vis/,
    name: 'the safety checklist',
    files: ['Safety checklist.pdf'],
    answer: (cite) => [
      'From **Safety checklist.pdf**:', '',
      `- [ ] **Before every trip:** tyres, lights and mirrors, and the load strapped at both ends ${cite('safety-trip')}`,
      `- [ ] **In the yard:** hi-vis vests on at all times ${cite('safety-trip')}`,
      `- [ ] **Near misses:** report them the same day in the app, with a photo ${cite('safety-near-miss')}`,
    ].join('\n'),
    followUps: ['Who is on the weekend shifts?', 'Summarise the urgent jobs'],
  },
]

const fileNames = (project: Project | null) => new Set((project?.files ?? []).map((f) => f.name))

// The question the project's files answer, if any: the knowledge intent.
export function knowledgeTopic(project: Project | null, prompt: string) {
  const names = fileNames(project)
  if (!names.size) return undefined
  const p = prompt.toLowerCase()
  return TOPICS.find((t) => t.match.test(p) && t.files.some((f) => names.has(f)))
}

function hash(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

type Found = Passage & { score: number }

// A made-up search of the project's files: the passages an answer cites score
// highest, then any other passage that shares two words with the question.
function retrieve(project: Project, prompt: string, cited: string[] = []): Found[] {
  const names = fileNames(project)
  const p = prompt.toLowerCase()
  return PASSAGES
    .filter((passage) => names.has(passage.file))
    .map((passage): Found => {
      const jitter = (hash(passage.id + p) % 5) / 100
      const at = cited.indexOf(passage.id)
      if (at >= 0) return { ...passage, score: 0.96 - at * 0.03 - jitter }
      const hits = passage.terms.filter((t) => p.includes(t)).length
      return { ...passage, score: hits >= 2 ? Math.min(0.78, 0.5 + hits * 0.08) - jitter : 0 }
    })
    .filter((found) => found.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

const placeOf = (project: Project) => `${project.name} files`

function searchStep(b: Builder, project: Project, prompt: string, found: Found[]) {
  const documents = new Set(found.map((f) => f.file)).size
  b.tool('search_knowledge', { in: placeOf(project), query: short(prompt, 40), top_k: 5 }, {
    output: {
      passages: found.map((f) => ({ document: f.file, kind: f.kind, page: f.page, score: Number(f.score.toFixed(2)), text: f.text })),
    },
    summary: found.length ? `${plural(found.length, 'passage')} from ${plural(documents, 'document')}` : 'No matching passages',
  }, `Searching ${placeOf(project)}…`)
}

function toSource(passage: Passage, project: Project): Source {
  return {
    kind: 'document', title: passage.file, url: '', domain: placeOf(project), from: placeOf(project),
    snippet: passage.text, passage: passage.text, page: passage.page, documentKind: passage.kind,
  }
}

// For research and the fallback answer: search the project's files first, so
// the trail shows they were checked even when nothing in them matches.
export function searchProjectKnowledge(b: Builder, ctx: AgentContext) {
  if (!ctx.project?.files.length) return
  searchStep(b, ctx.project, ctx.prompt, retrieve(ctx.project, ctx.prompt))
}

export function knowledge(b: Builder, ctx: AgentContext) {
  const project = ctx.project!
  const topic = knowledgeTopic(project, ctx.prompt)!
  const names = fileNames(project)
  const has = (file: string) => names.has(file)
  const cited: string[] = []
  const cite: Cite = (id) => {
    if (!cited.includes(id)) cited.push(id)
    return `[${cited.indexOf(id) + 1}]`
  }

  let body: string
  if (topic.files.every(has)) {
    body = topic.answer(cite, b.detail, has)
  } else {
    // Some of the files it needs were removed: quote what is left.
    const found = PASSAGES.filter((p) => topic.files.includes(p.file) && has(p.file)).slice(0, 3)
    body = [
      `Here is what the ${project.name} files say about ${topic.name}:`, '',
      ...found.map((f) => `- **${f.file}**${f.page ? ` (p. ${f.page})` : ''}: ${f.text} ${cite(f.id)}`),
      '', `Some of the files I would normally use (${topic.files.filter((f) => !has(f)).join(', ')}) are not in this project, so this may be incomplete.`,
    ].join('\n')
  }

  b.think([
    `They are asking about ${topic.name}. The ${project.name} project has files on this, so I will answer from them rather than from memory.`,
    'I will search the project knowledge, keep to what the passages say, and cite each one.',
  ], ['Where the files do not cover part of the question, I should say so rather than guess.'])
  searchStep(b, project, ctx.prompt, retrieve(project, ctx.prompt, cited))
  b.say(body)
  b.sources(cited.map((id) => toSource(PASSAGE[id], project)))
  b.followUps(topic.followUps)
}
