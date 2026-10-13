import type { AgentRun, RunStep } from '@/blocks/ai/agents/agent-types'
import type { RunAgent } from '@/blocks/ai/agents/run-status'
import { at } from '../data'
import { SAMPLE_AGENTS, SHARED_AGENTS } from './agents-data'

// Sample runs over the last three days, on the demo clock: most succeeded,
// one failed (a connector needs reconnecting), one waits for approval (the
// Invoice clerk wants to reply to a supplier) and one is running.

// The agents as the run views show them, from the agents' sample data.
export const RUN_AGENTS: Record<string, RunAgent> = Object.fromEntries(
  [...SAMPLE_AGENTS, ...SHARED_AGENTS].map((a) => [a.id, { name: a.name, icon: a.icon, colour: a.colour }]),
)

export const runAgentOf = (agentId: string): RunAgent => RUN_AGENTS[agentId] ?? { name: 'Agent' }

type StepSpec = [label: string, seconds: number, tool?: string, detail?: string]

// Steps that ran one after the other from `start`, all done unless marked.
function steps(runId: string, start: number, specs: StepSpec[], states: Partial<Record<number, RunStep['state']>> = {}): RunStep[] {
  let t = start
  return specs.map(([label, seconds, tool, detail], i) => {
    const state = states[i] ?? 'done'
    const step: RunStep = { id: `${runId}-s${i}`, label, tool, detail, state }
    if (state === 'done' || state === 'failed' || state === 'skipped') {
      step.startedAt = t
      t += seconds * 1000
      step.finishedAt = t
    } else if (state === 'running') {
      step.startedAt = t
    }
    return step
  })
}

const end = (s: RunStep[]) => s.reduce((n, step) => Math.max(n, step.finishedAt ?? 0), 0)

function run(base: Omit<AgentRun, 'finishedAt'>, finished = true): AgentRun {
  return finished ? { ...base, finishedAt: end(base.steps) + 1200 } : base
}

const TRIAGE: StepSpec[] = [
  ['Read the new ticket', 4, 'support-desk.get_ticket'],
  ['Search similar tickets', 6, 'support-desk.search_tickets'],
  ['Check the help centre', 5, 'wiki.search_pages'],
  ['Set priority and owner', 3, 'support-desk.update_ticket'],
  ['Draft a reply for the team', 9, 'support-desk.reply_to_ticket'],
]

const INVOICE: StepSpec[] = [
  ['Read the new email and its attachment', 5, 'mail.read_thread'],
  ['Read the invoice', 8],
  ['Match it to the purchase order', 11, 'spreadsheets.read_sheet'],
  ['Draft a reply to the supplier', 7, 'mail.draft_reply'],
  ['Send the reply', 3, 'mail.send_message'],
  ['Add it to the invoice log', 4, 'spreadsheets.append_rows'],
]

const runningStart = at(0, 18, 39)
const awaitingStart = at(0, 18, 12)

export const SAMPLE_RUNS: AgentRun[] = [
  run({
    id: 'run-triage-8812', agentId: 'ag-support-triage', title: 'Ticket #8812 “Can’t export to CSV”', trigger: 'event',
    status: 'running', progress: 40, startedAt: runningStart, seen: true,
    steps: steps('run-triage-8812', runningStart, [
      ['Read the new ticket', 4, 'support-desk.get_ticket', '#8812 “Can’t export to CSV”'],
      ['Search similar tickets', 6, 'support-desk.search_tickets', '4 alike in 30 days'],
      ['Check the help centre', 5, 'wiki.search_pages', '“Exporting your data”'],
      ['Set priority and owner', 3, 'support-desk.update_ticket'],
      ['Draft a reply for the team', 9, 'support-desk.reply_to_ticket'],
    ], { 2: 'running', 3: 'pending', 4: 'pending' }),
  }, false),

  run({
    id: 'run-invoices-5520', agentId: 'ag-invoices', title: 'INV-5520 from Harbour Supplies', trigger: 'event',
    status: 'awaiting', progress: 67, startedAt: awaitingStart, seen: false,
    steps: steps('run-invoices-5520', awaitingStart, [
      ['Read the new email and its attachment', 5, 'mail.read_thread', 'INV-5520 from Harbour Supplies'],
      ['Read the invoice', 8, undefined, '6 lines, $3,860.00 due 30 Oct'],
      ['Match it to the purchase order', 11, 'spreadsheets.read_sheet', 'PO-2291 matches line by line'],
      ['Draft a reply to the supplier', 7, 'mail.draft_reply'],
      ['Send the reply', 3, 'mail.send_message'],
      ['Add it to the invoice log', 4, 'spreadsheets.append_rows'],
    ], { 4: 'pending', 5: 'pending' }),
    approval: {
      title: 'Send a reply to Harbour Supplies?',
      summary: 'INV-5520 matches PO-2291. The reply confirms it is approved for payment on 30 Oct.',
      connectorId: 'mail',
      tool: 'send_message',
      actions: ['Send an email to accounts@harbour-supplies.example.com', 'Subject: “Re: Invoice INV-5520”', 'Mark the thread as done'],
      state: 'pending',
    },
  }, false),

  run({
    id: 'run-invoices-batch', agentId: 'ag-invoices', title: 'Invoices from 3 new emails', trigger: 'event',
    status: 'succeeded', progress: 100, startedAt: at(0, 14, 5), seen: false,
    steps: steps('run-invoices-batch', at(0, 14, 5), INVOICE),
    approval: {
      title: 'Send replies to 3 suppliers?', summary: 'All three invoices match their purchase orders.',
      connectorId: 'mail', tool: 'send_message', state: 'allowed',
      actions: ['Reply to Kestrel Paper', 'Reply to Orchard Office Supply', 'Reply to Bluewater Freight'],
    },
    result: '## 3 invoices logged\n\n| Invoice | Supplier | Amount | Due |\n|---|---|---:|---|\n| INV-2214 | Kestrel Paper | $412.00 | 14 Oct |\n| OOS-9083 | Orchard Office Supply | $1,086.50 | 21 Oct |\n| BF-33017 | Bluewater Freight | $2,940.00 | 30 Oct |\n\nAll three match their purchase orders. Replies sent; added to the invoice log.',
  }),

  run({
    id: 'run-triage-8807', agentId: 'ag-support-triage', title: 'Ticket #8807 “Invoice shows the wrong VAT”', trigger: 'event',
    status: 'succeeded', progress: 100, startedAt: at(0, 11, 20), seen: false,
    steps: steps('run-triage-8807', at(0, 11, 20), TRIAGE),
    result: 'Ticket **#8807** is set to **High** and assigned to the **Billing team**.\n\n- The customer’s country changed last week; the invoice used the old VAT rate\n- A draft reply explains the credit note the team can issue',
  }),

  run({
    id: 'run-contracts-brightline', agentId: 'ag-contracts', title: 'Brightline reseller agreement', trigger: 'manual',
    status: 'succeeded', progress: 100, startedAt: at(0, 10, 2), seen: true, chatId: 'chat-contract-brightline',
    steps: steps('run-contracts-brightline', at(0, 10, 2), [
      ['Read the contract', 14, 'cloud-drive.read_file', '18 pages'],
      ['Compare with our standard terms', 21, 'wiki.read_page', 'Standard terms v4'],
      ['Flag the risky clauses', 26],
      ['Write the summary', 11],
    ]),
    result: '## 3 clauses to look at\n\n1. **Liability (8.2):** no cap. Our standard caps it at 12 months of fees.\n2. **Renewal (11.1):** renews for 3 years unless cancelled 90 days before. We use 1 year and 30 days.\n3. **Data (14.4):** lets them keep our data for 2 years after the end.\n\nEverything else matches our standard terms.',
  }),

  run({
    id: 'run-onboarding-priya', agentId: 'ag-onboarding', title: 'Welcome pack for Priya Nair', trigger: 'manual',
    status: 'cancelled', progress: 25, startedAt: at(0, 9, 15), seen: true,
    steps: steps('run-onboarding-priya', at(0, 9, 15), [
      ['Read the new hire’s details', 6, 'crm.search_contacts'],
      ['Find the team’s onboarding page', 4, 'wiki.search_pages'],
      ['Book the first-week meetings', 0, 'calendar.create_event'],
      ['Write the welcome email', 0, 'mail.draft_reply'],
    ], { 1: 'skipped', 2: 'skipped', 3: 'skipped' }),
  }),

  run({
    id: 'run-triage-8790', agentId: 'ag-support-triage', title: 'Ticket #8790 “Two-factor code never arrives”', trigger: 'event',
    status: 'succeeded', progress: 100, startedAt: at(1, 16, 44), seen: true,
    steps: steps('run-triage-8790', at(1, 16, 44), TRIAGE),
    result: 'Ticket **#8790** is set to **Urgent** and assigned to the **Security team**.\n\n- 3 other customers on the same mail provider reported it today\n- A draft reply suggests the authenticator app while the team looks into it',
  }),

  run({
    id: 'run-competitors-w39', agentId: 'ag-competitors', title: 'Pricing changes this week', trigger: 'manual',
    status: 'succeeded', progress: 100, startedAt: at(1, 15, 0), seen: true,
    steps: steps('run-competitors-w39', at(1, 15, 0), [
      ['Read the pricing pages of 4 competitors', 38, 'web-browser.fetch_page', '4 pages'],
      ['Compare with last week', 12],
      ['Read their changelogs', 24, 'web-browser.fetch_page', '3 new posts'],
      ['Write the summary', 15],
    ]),
    result: '## This week\n\n- **Northpeak** raised its Team plan from $12 to $14 a seat\n- **Fieldline** added an AI assistant to every plan\n- No change at **Orbitly** or **Castwell**\n\nWorth a look: Fieldline’s assistant answers from records, as ours does.',
  }),

  run({
    id: 'run-invoices-kestrel', agentId: 'ag-invoices', title: 'INV-2209 from Kestrel Paper', trigger: 'event',
    status: 'succeeded', progress: 100, startedAt: at(1, 9, 31), seen: true,
    steps: steps('run-invoices-kestrel', at(1, 9, 31), INVOICE, { 4: 'skipped' }),
    approval: {
      title: 'Send a reply to Kestrel Paper?', summary: 'INV-2209 is $86 more than PO-2270.',
      connectorId: 'mail', tool: 'send_message', state: 'denied',
      actions: ['Send an email to billing@kestrel-paper.example.com', 'Ask for a corrected invoice'],
    },
    result: '**INV-2209** from Kestrel Paper is **$86 more** than **PO-2270** and is on hold.\n\n> **Not done:** the reply to the supplier. You denied it, so nothing was sent. The draft is in your Drafts folder.',
  }),

  run({
    id: 'run-ops-w40', agentId: 'ag-ops-report', title: 'Weekly operations report, week 40', trigger: 'schedule',
    status: 'failed', progress: 20, startedAt: at(2, 9, 0), seen: false,
    error: 'The Spreadsheets connector needs reconnecting: its sign-in expired. Reconnect it in Settings › Connectors, then retry.',
    steps: steps('run-ops-w40', at(2, 9, 0), [
      ['Read last week’s orders', 3, 'spreadsheets.read_sheet', 'Orders 2026'],
      ['Read open issues', 0, 'issue-tracker.search_issues'],
      ['Work out the week’s numbers', 0],
      ['Write the report', 0],
      ['Save it to the shared drive', 0, 'cloud-drive.create_file'],
    ], { 0: 'failed', 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' }),
  }),

  run({
    id: 'run-onboarding-sam', agentId: 'ag-onboarding', title: 'Welcome pack for Sam Okafor', trigger: 'manual',
    status: 'succeeded', progress: 100, startedAt: at(2, 14, 10), seen: true,
    steps: steps('run-onboarding-sam', at(2, 14, 10), [
      ['Read the new hire’s details', 5, 'crm.search_contacts'],
      ['Find the team’s onboarding page', 6, 'wiki.search_pages', '“Onboarding: Sales”'],
      ['Book the first-week meetings', 9, 'calendar.create_event', '4 meetings'],
      ['Write the welcome email', 12, 'mail.draft_reply'],
    ]),
    approval: {
      title: 'Book 4 meetings in Sam’s first week?', summary: 'Invites go to Sam, their manager and their buddy.',
      connectorId: 'calendar', tool: 'create_event', state: 'allowed',
      actions: ['Monday 10:00: Welcome and laptop set-up', 'Monday 14:00: Meet the team', 'Wednesday 11:00: Product tour', 'Friday 16:00: First-week check-in'],
    },
    result: 'The welcome pack for **Sam Okafor** is ready.\n\n- 4 meetings booked in the first week\n- Welcome email drafted, with the onboarding page and Jordan as Sam’s buddy',
  }),

  run({
    id: 'run-triage-8771', agentId: 'ag-support-triage', title: 'Ticket #8771 “Add a teammate to our plan”', trigger: 'event',
    status: 'succeeded', progress: 100, startedAt: at(2, 11, 5), seen: true,
    steps: steps('run-triage-8771', at(2, 11, 5), TRIAGE),
    result: 'Ticket **#8771** is set to **Low** and assigned to **Customer success**.\n\n- Answered by “Inviting people to your workspace”\n- A draft reply walks through it in three steps',
  }),
]

// A run that has not started yet, for the run card's Queued state.
export const QUEUED_RUN: AgentRun = {
  id: 'run-competitors-queued', agentId: 'ag-competitors', title: 'Competitor watch, week 41', trigger: 'schedule',
  status: 'queued', progress: 0, startedAt: at(0, 18, 38), seen: true,
  steps: steps('run-competitors-queued', at(0, 18, 38), [
    ['Read the pricing pages of 4 competitors', 0, 'web-browser.fetch_page'],
    ['Compare with last week', 0],
  ], { 0: 'pending', 1: 'pending' }),
}
