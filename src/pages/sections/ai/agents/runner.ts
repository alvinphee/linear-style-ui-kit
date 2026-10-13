import { useEffect, useMemo, useRef, useState } from 'react'
import type { AgentRun, AgentTriggerKind, RunApproval, RunStep } from '@/blocks/ai/agents/agent-types'
import { now, uid } from '../data'

// A made-up agent runner for the demo. No model: a started run plays a
// script, one step after another on timers, and stops at the approval step
// until someone allows or denies it. Denied, that step is skipped and the
// result says what was not done. Always allow remembers the tool, so the
// next run of any agent that uses it goes ahead without asking.
//
// It has no toasts of its own: pass `onEvent` and the app says what it likes
// when a run needs approval, succeeds or fails.

export type RunScript = {
  title: string
  steps: { label: string; tool?: string; detail?: string; ms: number }[]
  // The step that needs a person's yes before it runs.
  approvalAt?: number
  approval?: Omit<RunApproval, 'state'>
  result: string
  // The result when the approval was denied. Defaults to `result` with a note.
  deniedResult?: string
  // Fails when it reaches this step, with `error`. Retry plays it without failing.
  failAt?: number
  error?: string
}

const S = 1000

export const RUN_SCRIPTS: Record<string, RunScript> = {
  'ag-invoices': {
    title: 'Invoice from a new email',
    steps: [
      { label: 'Read the new email and its attachment', tool: 'mail.read_thread', detail: 'INV-5520 from Harbour Supplies', ms: 1.4 * S },
      { label: 'Read the invoice', detail: '6 lines, $3,860.00 due 30 Oct', ms: 1.8 * S },
      { label: 'Match it to the purchase order', tool: 'spreadsheets.read_sheet', detail: 'PO-2291 matches line by line', ms: 2 * S },
      { label: 'Draft a reply to the supplier', tool: 'mail.draft_reply', ms: 1.6 * S },
      { label: 'Send the reply', tool: 'mail.send_message', ms: 1.2 * S },
      { label: 'Add it to the invoice log', tool: 'spreadsheets.append_rows', ms: 1.2 * S },
    ],
    approvalAt: 4,
    approval: {
      title: 'Send a reply to Harbour Supplies?',
      summary: 'INV-5520 matches PO-2291. The reply confirms it is approved for payment on 30 Oct.',
      connectorId: 'mail',
      tool: 'send_message',
      actions: ['Send an email to accounts@harbour-supplies.example.com', 'Subject: “Re: Invoice INV-5520”', 'Mark the thread as done'],
    },
    result: '**INV-5520** from Harbour Supplies matches **PO-2291** and is logged for payment on **30 Oct**.\n\n- Total: $3,860.00 (6 lines)\n- Reply sent to the supplier\n- Added to the invoice log, row 214',
    deniedResult: '**INV-5520** from Harbour Supplies matches **PO-2291** and is logged for payment on **30 Oct**.\n\n- Total: $3,860.00 (6 lines)\n- Added to the invoice log, row 214\n\n> **Not done:** the reply to the supplier. You denied it, so nothing was sent. The draft is in your Drafts folder.',
  },
  'ag-ops-report': {
    title: 'Weekly operations report',
    steps: [
      { label: 'Read last week’s orders', tool: 'spreadsheets.read_sheet', detail: 'Orders 2026, 1,284 rows', ms: 2 * S },
      { label: 'Read open issues', tool: 'issue-tracker.search_issues', detail: '42 open, 9 closed this week', ms: 1.6 * S },
      { label: 'Work out the week’s numbers', ms: 2.2 * S },
      { label: 'Write the report', ms: 2 * S },
      { label: 'Save it to the shared drive', tool: 'cloud-drive.create_file', detail: 'Reports / Weekly', ms: 1.2 * S },
    ],
    result: '## Operations, week 40\n\n| | This week | Change |\n|---|---:|---:|\n| Orders | 1,284 | +6% |\n| On time | 96.1% | +0.8 pt |\n| Open issues | 42 | −9 |\n\nOn-time delivery is the best in eight weeks. Two late orders came from the same carrier; worth a call.\n\nSaved as **Weekly operations report, week 40** in Reports / Weekly.',
  },
  'ag-support-triage': {
    title: 'Triage a new ticket',
    steps: [
      { label: 'Read the new ticket', tool: 'support-desk.get_ticket', detail: '#8812 “Can’t export to CSV”', ms: 1.2 * S },
      { label: 'Search similar tickets', tool: 'support-desk.search_tickets', detail: '4 alike in 30 days', ms: 1.6 * S },
      { label: 'Check the help centre', tool: 'wiki.search_pages', detail: '“Exporting your data”', ms: 1.4 * S },
      { label: 'Set priority and owner', tool: 'support-desk.update_ticket', detail: 'Normal, Billing team', ms: 1.2 * S },
      { label: 'Draft a reply for the team', tool: 'support-desk.reply_to_ticket', ms: 1.8 * S },
    ],
    result: 'Ticket **#8812** is set to **Normal** and assigned to the **Billing team**.\n\n- Likely cause: exports over 50,000 rows time out (4 similar tickets this month)\n- A draft reply links to “Exporting your data” and suggests a date filter',
  },
  'ag-competitors': {
    title: 'Competitor watch',
    steps: [
      { label: 'Read the pricing pages of 4 competitors', tool: 'web-browser.fetch_page', detail: '4 pages', ms: 2.4 * S },
      { label: 'Compare with last week', ms: 1.6 * S },
      { label: 'Read their changelogs', tool: 'web-browser.fetch_page', detail: '3 new posts', ms: 1.8 * S },
      { label: 'Write the summary', ms: 1.8 * S },
    ],
    result: '## This week\n\n- **Northpeak** raised its Team plan from $12 to $14 a seat\n- **Fieldline** added an AI assistant to every plan\n- No change at **Orbitly** or **Castwell**\n\nWorth a look: Fieldline’s assistant answers from records, as ours does.',
  },
  'ag-contracts': {
    title: 'Review a contract',
    steps: [
      { label: 'Read the contract', tool: 'cloud-drive.read_file', detail: '18 pages', ms: 2 * S },
      { label: 'Compare with our standard terms', tool: 'wiki.read_page', detail: 'Standard terms v4', ms: 2.2 * S },
      { label: 'Flag the risky clauses', ms: 2 * S },
      { label: 'Write the summary', ms: 1.6 * S },
    ],
    result: '## 3 clauses to look at\n\n1. **Liability (8.2):** no cap. Our standard caps it at 12 months of fees.\n2. **Renewal (11.1):** renews for 3 years unless cancelled 90 days before. We use 1 year and 30 days.\n3. **Data (14.4):** lets them keep our data for 2 years after the end.\n\nEverything else matches our standard terms.',
  },
  'ag-onboarding': {
    title: 'Welcome pack for a new hire',
    steps: [
      { label: 'Read the new hire’s details', tool: 'crm.search_contacts', ms: 1.2 * S },
      { label: 'Find the team’s onboarding page', tool: 'wiki.search_pages', detail: '“Onboarding: Customer success”', ms: 1.4 * S },
      { label: 'Book the first-week meetings', tool: 'calendar.create_event', ms: 1.6 * S },
      { label: 'Write the welcome email', tool: 'mail.draft_reply', ms: 1.6 * S },
    ],
    approvalAt: 2,
    approval: {
      title: 'Book 4 meetings in the new hire’s first week?',
      summary: 'Invites go to the new hire, their manager and their buddy.',
      connectorId: 'calendar',
      tool: 'create_event',
      actions: ['Monday 10:00: Welcome and laptop set-up', 'Monday 14:00: Meet the team', 'Wednesday 11:00: Product tour', 'Friday 16:00: First-week check-in'],
    },
    result: 'The welcome pack is ready.\n\n- 4 meetings booked in the first week\n- Welcome email drafted, with the onboarding page and the buddy’s name',
    deniedResult: 'The welcome pack is ready, without the meetings.\n\n- Welcome email drafted, with the onboarding page and the buddy’s name\n\n> **Not done:** the first-week meetings. You denied it, so nothing was booked.',
  },
}

const GENERIC: RunScript = {
  title: 'Run',
  steps: [
    { label: 'Read the request', ms: 1.2 * S },
    { label: 'Work on it', ms: 2 * S },
    { label: 'Write the result', ms: 1.4 * S },
  ],
  result: 'Done.',
}

export type RunEvent = { type: 'awaiting' | 'succeeded' | 'failed' | 'cancelled'; run: AgentRun }

type Stored = { runs: AgentRun[]; always: string[] }

function load(key: string | undefined, initial: AgentRun[]): Stored {
  if (key) {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw) as Stored
        if (Array.isArray(parsed.runs)) return { runs: parsed.runs, always: Array.isArray(parsed.always) ? parsed.always : [] }
      }
    } catch {
      // Blocked or broken storage: start from the sample runs.
    }
  }
  return { runs: initial, always: [] }
}

const toolKey = (approval: { connectorId?: string; tool?: string }) =>
  approval.tool ? `${approval.connectorId ?? ''}.${approval.tool}` : undefined

const progressOf = (steps: RunStep[]) =>
  Math.round((steps.filter((s) => s.state === 'done' || s.state === 'skipped').length / Math.max(1, steps.length)) * 100)

export function useAgentRuns(initial: AgentRun[], options: {
  storageKey?: string
  // Called when a run starts waiting for approval, succeeds, fails or is cancelled.
  onEvent?: (event: RunEvent) => void
} = {}) {
  const { storageKey } = options
  const [state, setState] = useState(() => load(storageKey, initial))
  // The source of truth, so timer callbacks always read the latest runs.
  const ref = useRef(state)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const onEvent = useRef(options.onEvent)
  useEffect(() => {
    onEvent.current = options.onEvent
  })

  // Made once: every function reads refs only, so none goes stale.
  const engine = useMemo(() => {
    // Scripts of runs started (or retried) in this visit; others use their agent's.
    const scripts = new Map<string, RunScript>()
    // Runs played again: Retry plays them without failing.
    const retried = new Set<string>()
    const find = (runId: string) => ref.current.runs.find((r) => r.id === runId)

    const commit = (next: Stored) => {
      ref.current = next
      setState(next)
    }

    const update = (runId: string, change: (run: AgentRun) => AgentRun) => {
      const runs = ref.current.runs.map((r) => (r.id === runId ? change(r) : r))
      commit({ ...ref.current, runs })
      return runs.find((r) => r.id === runId)
    }

    const emit = (type: RunEvent['type'], run?: AgentRun) => {
      if (run) onEvent.current?.({ type, run })
    }

    const scriptOf = (run: AgentRun): RunScript => {
      const own = scripts.get(run.id)
      if (own) return own
      const byAgent = RUN_SCRIPTS[run.agentId]
      // A sample run plays its agent's timings when its steps line up with them.
      if (byAgent && byAgent.steps.length === run.steps.length) return byAgent
      return {
        ...GENERIC,
        steps: run.steps.map((s) => ({ label: s.label, tool: s.tool, detail: s.detail, ms: 1.8 * S })),
        result: run.result ?? GENERIC.result,
      }
    }

    const clear = (runId: string) => {
      const timer = timers.current.get(runId)
      if (timer) clearTimeout(timer)
      timers.current.delete(runId)
    }

    // Finish step `index` of a run after `ms`, then move on.
    const schedule = (runId: string, index: number, ms: number) => {
      clear(runId)
      timers.current.set(runId, setTimeout(() => {
        timers.current.delete(runId)
        advance(runId, index)
      }, ms))
    }

    // Starts step `index`: runs it, waits for approval, fails, or ends the run.
    const begin = (runId: string, index: number) => {
      const run = find(runId)
      if (!run) return
      const script = scriptOf(run)
      const t = now()
      if (index >= run.steps.length) {
        const denied = run.approval?.state === 'denied'
        emit('succeeded', update(runId, (r) => ({
          ...r, status: 'succeeded', progress: 100, finishedAt: t, seen: false,
          result: denied
            ? script.deniedResult ?? `${script.result}\n\n> **Not done:** ${r.approval?.title ?? 'the step that needed approval'} You denied it.`
            : script.result,
        })))
        return
      }
      const approval = script.approvalAt === index ? script.approval : undefined
      if (approval && run.approval?.state !== 'allowed' && run.approval?.state !== 'denied') {
        const key = toolKey(approval)
        if (!key || !ref.current.always.includes(key)) {
          emit('awaiting', update(runId, (r) => ({
            ...r, status: 'awaiting', seen: false, progress: progressOf(r.steps), approval: { ...approval, state: 'pending' },
          })))
          return
        }
        // Always allowed before: note it and go on.
        update(runId, (r) => ({ ...r, approval: { ...approval, state: 'allowed' } }))
      }
      if (script.failAt === index && !retried.has(runId)) {
        emit('failed', update(runId, (r) => ({
          ...r, status: 'failed', finishedAt: t, seen: false, error: script.error ?? 'Something went wrong.',
          steps: r.steps.map((s, i) => (i === index ? { ...s, state: 'failed', startedAt: t, finishedAt: t } : s)),
        })))
        return
      }
      update(runId, (r) => ({
        ...r, status: 'running', progress: progressOf(r.steps),
        steps: r.steps.map((s, i) => (i === index ? { ...s, state: 'running', startedAt: t, finishedAt: undefined } : s)),
      }))
      schedule(runId, index, script.steps[index]?.ms ?? 1.8 * S)
    }

    const advance = (runId: string, index: number) => {
      if (find(runId)?.status !== 'running') return
      const t = now()
      update(runId, (r) => {
        const steps = r.steps.map((s, i) => (i === index ? { ...s, state: 'done' as const, finishedAt: t } : s))
        return { ...r, steps, progress: progressOf(steps) }
      })
      begin(runId, index + 1)
    }

    // Keeps runs that were going when the page loaded going.
    const resume = () => {
      for (const run of ref.current.runs) {
        if (run.status !== 'running' && run.status !== 'queued') continue
        const index = run.steps.findIndex((s) => s.state === 'running' || s.state === 'pending')
        if (index < 0) begin(run.id, run.steps.length)
        else if (run.steps[index].state === 'running') schedule(run.id, index, scriptOf(run).steps[index]?.ms ?? 1.8 * S)
        else begin(run.id, index)
      }
    }

    const stopAll = () => {
      timers.current.forEach(clearTimeout)
      timers.current.clear()
    }

    // Starts a run of an agent: its script, or the one given. Returns its id.
    const start = (agentId: string, title?: string, script?: RunScript, trigger: AgentTriggerKind = 'manual') => {
      const chosen = script ?? RUN_SCRIPTS[agentId] ?? GENERIC
      const id = uid('run-')
      const run: AgentRun = {
        id, agentId, title: title ?? chosen.title, trigger, status: 'running', progress: 0, startedAt: now(), seen: true,
        steps: chosen.steps.map((s, i) => ({ id: `${id}-s${i}`, label: s.label, tool: s.tool, detail: s.detail, state: 'pending' })),
      }
      scripts.set(id, chosen)
      commit({ ...ref.current, runs: [run, ...ref.current.runs] })
      begin(id, 0)
      return id
    }

    // Allow once, or Always allow: the tool is remembered and never asks again.
    const approve = (runId: string, mode: 'once' | 'always') => {
      const run = find(runId)
      if (!run || run.status !== 'awaiting' || !run.approval) return
      const key = toolKey(run.approval)
      if (mode === 'always' && key && !ref.current.always.includes(key)) {
        commit({ ...ref.current, always: [...ref.current.always, key] })
      }
      const index = run.steps.findIndex((s) => s.state === 'pending')
      update(runId, (r) => ({ ...r, status: 'running', seen: true, approval: r.approval && { ...r.approval, state: 'allowed' } }))
      begin(runId, index < 0 ? run.steps.length : index)
    }

    // The step that needed approval is skipped; the rest of the run goes on.
    const deny = (runId: string) => {
      const run = find(runId)
      if (!run || run.status !== 'awaiting' || !run.approval) return
      const index = run.steps.findIndex((s) => s.state === 'pending')
      const t = now()
      update(runId, (r) => {
        const steps = r.steps.map((s, i) => (i === index
          ? { ...s, state: 'skipped' as const, detail: 'Denied, not done', startedAt: t, finishedAt: t }
          : s))
        return { ...r, status: 'running', seen: true, steps, progress: progressOf(steps), approval: r.approval && { ...r.approval, state: 'denied' } }
      })
      begin(runId, index < 0 ? run.steps.length : index + 1)
    }

    const cancel = (runId: string) => {
      const run = find(runId)
      if (!run || !(run.status === 'running' || run.status === 'queued' || run.status === 'awaiting')) return
      clear(runId)
      const t = now()
      emit('cancelled', update(runId, (r) => ({
        ...r, status: 'cancelled', finishedAt: t, seen: true,
        steps: r.steps.map((s) => (s.state === 'running' || s.state === 'pending'
          ? { ...s, state: 'skipped' as const, finishedAt: s.startedAt ? t : undefined }
          : s)),
      })))
    }

    // Plays a failed or cancelled run again from the start, in place.
    const retry = (runId: string) => {
      const run = find(runId)
      if (!run || !(run.status === 'failed' || run.status === 'cancelled')) return
      const script = scriptOf(run)
      retried.add(runId)
      scripts.set(runId, script)
      update(runId, (r) => ({
        ...r, status: 'running', progress: 0, startedAt: now(), finishedAt: undefined, error: undefined, result: undefined,
        approval: undefined, seen: true,
        steps: script.steps.map((s, i) => ({ id: `${r.id}-s${i}`, label: s.label, tool: s.tool, detail: s.detail, state: 'pending' })),
      }))
      begin(runId, 0)
    }

    const markSeen = (runId: string) => {
      if (find(runId) && !find(runId)!.seen) update(runId, (r) => ({ ...r, seen: true }))
    }

    return { resume, stopAll, start, approve, deny, cancel, retry, markSeen }
  }, [])

  // Resume on mount; stop every timer on unmount.
  useEffect(() => {
    engine.resume()
    return engine.stopAll
  }, [engine])

  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // Full or blocked storage: the runs still work for this visit.
    }
  }, [state, storageKey])

  const runs = state.runs
  const counts = useMemo(() => ({
    running: runs.filter((r) => r.status === 'running' || r.status === 'queued').length,
    awaiting: runs.filter((r) => r.status === 'awaiting').length,
    unseen: runs.filter((r) => !r.seen).length,
  }), [runs])

  const { start, approve, deny, cancel, retry, markSeen } = engine
  return { runs, alwaysAllowed: state.always, start, approve, deny, cancel, retry, markSeen, counts }
}
