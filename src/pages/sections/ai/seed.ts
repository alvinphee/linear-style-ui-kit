import { JOBS, type Job } from '../../data'
import { DEFAULT_MODEL, MINUTE, at, modelById, uid } from './data'
import { buildScript, continueAfterApproval, materialise, type Sink } from './engine'
import { artifactRef, lastArtifactIn, withArtifact } from './helpers'
import type {
  Artifact, AssistantMessage, Chat, FileRef, Message, ModelId, Modes, Part, PartOf, Project, Reply,
} from './types'

// Made-up projects and chats. The chats are built by running the real
// scripts on a virtual clock, so the history looks exactly like live replies.

const SEED_PROJECTS: Project[] = [
  {
    id: 'p-q4', name: 'Q4 planning', colour: 'var(--chart-1)',
    description: 'Targets, capacity and hiring for October to December.',
    instructions: 'Keep answers short. Use tables for numbers, and write dates like 2 Oct.',
    files: [
      { id: 'k1', name: 'Q4 targets.xlsx', size: 48_300, kind: 'sheet' },
      { id: 'k2', name: 'Capacity plan.pdf', size: 1_240_000, kind: 'pdf' },
      { id: 'k3', name: 'Hiring notes.docx', size: 86_000, kind: 'doc' },
    ],
  },
  {
    id: 'p-support', name: 'Customer support', colour: 'var(--chart-2)',
    description: 'Replies to customers about delays, damage and refunds.',
    instructions: 'Friendly, plain English. Always offer a next step. Sign off as the Operations team.',
    files: [
      { id: 'k4', name: 'Refund policy.pdf', size: 320_000, kind: 'pdf' },
      { id: 'k5', name: 'Tone of voice.md', size: 12_400, kind: 'text' },
      { id: 'k6', name: 'Top questions.csv', size: 22_800, kind: 'csv' },
    ],
  },
  {
    id: 'p-ops', name: 'Operations', colour: 'var(--chart-3)',
    description: 'Daily jobs, drivers and depot work.',
    instructions: 'Refer to jobs by their DO number. Flag anything due today.',
    files: [
      { id: 'k7', name: 'Depot map.png', size: 640_000, kind: 'image' },
      { id: 'k8', name: 'Driver roster.xlsx', size: 35_100, kind: 'sheet' },
      { id: 'k9', name: 'Safety checklist.pdf', size: 410_000, kind: 'pdf' },
    ],
  },
]

type Turn = {
  prompt: string
  model?: ModelId
  modes?: Partial<Modes>
  attempts?: number
  approve?: 'approved' | 'denied'
  attachments?: FileRef[]
  feedback?: 'up' | 'down'
  jobs?: Job[]
}

type Seed = { projects: Project[]; chats: Chat[]; artifacts: Artifact[] }

export function seedState(): Seed {
  let artifacts: Artifact[] = []
  const projects = SEED_PROJECTS.map((p) => ({ ...p, files: p.files.map((f) => ({ ...f })) }))

  function collect(reply: Reply): Sink {
    return {
      addPart: (part) => { reply.parts.push(part) },
      patchPart: (id, patch) => {
        const i = reply.parts.findIndex((p) => p.id === id)
        if (i >= 0) reply.parts[i] = { ...reply.parts[i], ...patch } as Part
      },
      activity: () => {},
      artifact: (draft) => {
        const ref = artifactRef(artifacts, draft, uid('a'))
        artifacts = withArtifact(artifacts, ref.artifactId, draft, reply.startedAt + 20_000)
        return ref
      },
      followUps: (items) => { reply.followUps = items },
      finish: (status) => { reply.status = status },
    }
  }

  function chat(id: string, title: string, projectId: string | null, start: number, turns: Turn[], opts: { pinned?: boolean; model?: ModelId } = {}): Chat {
    const project = projects.find((p) => p.id === projectId) ?? null
    const messages: Message[] = []
    let t = start
    for (const turn of turns) {
      messages.push({ id: uid('m'), role: 'user', text: turn.prompt, attachments: turn.attachments ?? [], at: t })
      const model = modelById(turn.model ?? opts.model ?? DEFAULT_MODEL)
      const modes: Modes = { web: false, deep: false, ...turn.modes }
      const versions: Reply[] = []
      let reviseId: string | undefined
      for (let attempt = 0; attempt < (turn.attempts ?? 1); attempt++) {
        const reply: Reply = { id: uid('r'), status: 'running', startedAt: t + 1200, parts: [], followUps: [] }
        const ctx = {
          prompt: turn.prompt, model, modes, jobs: turn.jobs ?? JOBS, reminded: [], attempt,
          attachments: turn.attachments ?? [], project,
          lastArtifact: lastArtifactIn(messages, artifacts, messages.length - 1), reviseId,
        }
        let end = materialise(buildScript(ctx), collect(reply), model, reply.startedAt)
        const approval = reply.parts.find((p): p is PartOf<'approval'> => p.type === 'approval')
        if (reply.status === 'awaiting' && approval && turn.approve) {
          approval.state = turn.approve
          reply.status = 'running'
          const plan = reply.parts.find((p): p is PartOf<'plan'> => p.type === 'plan')
          end = materialise(continueAfterApproval(approval.request, turn.approve, ctx), collect(reply), model, end + 4000, plan)
        }
        reply.finishedAt = end
        if (attempt === (turn.attempts ?? 1) - 1) reply.feedback = turn.feedback
        reviseId = reply.parts.find((p): p is PartOf<'artifact'> => p.type === 'artifact')?.artifactId ?? reviseId
        versions.push(reply)
        t = end + 40_000
      }
      const assistant: AssistantMessage = { id: uid('m'), role: 'assistant', model: model.id, versions, current: versions.length - 1 }
      messages.push(assistant)
      t += 3 * MINUTE
    }
    return { id, title, projectId, pinned: !!opts.pinned, updatedAt: Math.min(t, start + 20 * MINUTE), model: opts.model ?? DEFAULT_MODEL, messages }
  }

  // DO-24809 had nobody assigned before this chat, which is why it is Siti's now.
  const beforeAssigning = JOBS.map((j) => (j.id === 'DO-24809' ? { ...j, driver: '' } : j))

  const chats: Chat[] = [
    chat('c-urgent', 'Urgent jobs this week', null, at(0, 17, 52), [
      { prompt: 'Summarise the urgent jobs and check the Jurong bay hours', modes: { web: true }, feedback: 'up' },
      { prompt: 'Make it shorter' },
    ]),
    chat('c-email', 'Delay email to Bayview Foods', 'p-support', at(0, 15, 10), [
      { prompt: 'Draft an email to Bayview Foods about the delay on DO-24817', attempts: 2 },
    ]),
    chat('c-cold', 'Cold chain rules for pharma', null, at(1, 16, 30), [
      { prompt: 'What are the cold chain rules for pharma deliveries?', modes: { web: true, deep: true } },
    ], { pinned: true, model: 'depth' }),
    chat('c-workload', 'Driver workload comparison', null, at(1, 11, 5), [
      { prompt: 'Compare driver workload this week' },
    ]),
    chat('c-assign', 'Assign the export job', 'p-ops', at(3, 9, 40), [
      { prompt: 'Assign the unassigned export job to Siti', approve: 'approved', jobs: beforeAssigning },
    ], { model: 'swift' }),
    chat('c-status', 'Jobs by status', 'p-q4', at(4, 14, 20), [
      { prompt: 'Chart jobs by status' },
    ]),
    chat('c-csv', 'CSV export script', null, at(5, 10, 15), [
      {
        prompt: 'Write a TypeScript function that exports jobs to CSV',
        attachments: [{ id: 'f-sample', name: 'jobs-sample.csv', size: 4_200, kind: 'csv' }],
      },
    ], { model: 'depth' }),
    chat('c-notice', 'Translate the depot notice', null, at(18, 8, 30), [
      { prompt: '/translate to Spanish: From Monday 5 Oct, the depot opens at 6:30 am. Please park in bays 1 to 3 only.' },
    ], { model: 'swift' }),
  ]

  return { projects, chats, artifacts }
}
