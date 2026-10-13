import {
  Analytics01Icon, BinocularsIcon, BookOpen01Icon, ContractsIcon, CustomerSupportIcon, Invoice01Icon, MailReply01Icon,
  Mic01Icon, QuillWrite01Icon, ReceiptDollarIcon, Target02Icon, UserAdd01Icon, UserSearch01Icon,
} from '@hugeicons/core-free-icons'
import type { Agent, AgentDraft, AgentTemplate } from '@/blocks/ai/agents/agent-types'
import type { Recurrence } from '@/components/recurrence-picker'
import { at, USER } from '../data'

// The AI chat app's agents, on the demo clock. Five are Alex Morgan's own:
// the invoice clerk (runs when an email with an invoice arrives), the weekly
// operations report (Mondays 09:00), support triage (runs on each new
// ticket), competitor watch (Fridays 16:00) and the contract reviewer (run
// by hand, with a contracts knowledge base). Two are colleagues': the new
// hire helper, shared with the whole organisation, and a release notes
// writer shared with a few people. Explore has a dozen templates.
//
// Connector ids, tool names, skill ids and knowledge base ids are the ones
// in settings/connectors-data.ts, settings/skills-data.ts and
// knowledge/bases-data.ts.

const SGT = 'Asia/Singapore'
const weekly = (day: number, time: string): Recurrence => ({ kind: 'weekly', days: [day], time, timeZone: SGT })

export const SAMPLE_AGENTS: Agent[] = [
  {
    id: 'ag-invoices',
    name: 'Invoice clerk',
    description: 'Reads supplier invoices as they arrive, checks them against purchase orders and logs them in the payables sheet.',
    icon: Invoice01Icon,
    colour: 'var(--chart-4)',
    instructions: `You are the accounts payable clerk for our operations team. When an email arrives with an invoice attached, you read the invoice, check it and record it. You never pay anything.

## For each invoice
1. Read the supplier, invoice number, date, due date, currency and total, line by line.
2. Find the purchase order it quotes in **Purchase orders 2026** and compare quantities and prices.
3. Add a row to the **Payables** sheet with what you found, and a status: *Matched*, *Price differs* or *No PO*.
4. Apply the approval limits in \`approval-limits.xlsx\` and name the approver.

## When something is off
- A price that differs by more than 2%, a missing PO or a duplicate invoice number goes in the row as a note.
- Draft a short, polite reply to the supplier asking for a corrected invoice. **Ask before sending it.**

Keep amounts in the invoice's currency, with two decimals. Never change a row someone else wrote.`,
    starters: [
      'Check the invoices that came in today',
      'Which invoices are due this week and not yet approved?',
      'Find duplicate invoice numbers in the payables sheet',
      'Draft a reply to Northwind about their price difference',
    ],
    model: 'balanced',
    files: [
      { id: 'agf-1', name: 'approval-limits.xlsx', size: 18_400 },
      { id: 'agf-2', name: 'Supplier payment terms.pdf', size: 214_000 },
    ],
    knowledgeBases: [],
    connectors: {
      mail: { search_mail: 'always', read_thread: 'always', draft_reply: 'always', send_message: 'ask' },
      spreadsheets: { search_spreadsheets: 'always', read_sheet: 'always', append_rows: 'always', update_cells: 'ask' },
      'cloud-drive': { search_files: 'always', read_file: 'always', create_file: 'off', share_file: 'off' },
    },
    skills: ['sk-invoices', 'sk-sheets'],
    triggers: [
      {
        id: 'tr-inv-mail',
        kind: 'event',
        enabled: true,
        connectorId: 'mail',
        event: 'mail.new_email',
        eventLabel: 'New email',
        filter: 'has:attachment subject:invoice',
      },
      { id: 'tr-inv-manual', kind: 'manual', enabled: true },
    ],
    access: 'private',
    owner: USER.name,
    templateId: 'tpl-invoice-clerk',
    createdAt: at(41, 10, 12),
    updatedAt: at(3, 16, 40),
  },
  {
    id: 'ag-ops-report',
    name: 'Weekly operations report',
    description: 'Every Monday morning, sums up last week’s deliveries, delays and open issues, and drafts the report for the team.',
    icon: Analytics01Icon,
    colour: 'var(--chart-1)',
    instructions: `You write the weekly operations report for the leadership team. It goes out on Monday morning and covers the week before, Monday to Sunday.

## What goes in
- **Headline numbers:** jobs completed, on-time rate, average delay, and the change on the week before.
- **What went wrong:** the three biggest delays, each with its cause and what was done.
- **Open issues:** anything still blocked, with who owns it.
- **Next week:** known peaks, holidays and planned maintenance.

## How to write it
Start with a three-line summary a busy reader can stop after. Use a table for the numbers and short bullets for the rest. No jargon, no blame.

Save the report as a document in **Operations › Weekly reports**, named by the Monday's date. Draft the email to the leadership list, but **ask before sending**.`,
    starters: [
      'Write this week’s report now',
      'How did on-time delivery change over the last four weeks?',
      'List the open issues that have been blocked longest',
    ],
    model: 'depth',
    files: [{ id: 'agf-3', name: 'Report template.docx', size: 42_000 }],
    knowledgeBases: [],
    connectors: {
      spreadsheets: { search_spreadsheets: 'always', read_sheet: 'always', append_rows: 'off', update_cells: 'off' },
      'cloud-drive': { search_files: 'always', read_file: 'always', list_folder: 'always', create_file: 'always' },
      mail: { search_mail: 'always', draft_reply: 'always', send_message: 'ask' },
      'issue-tracker': { search_issues: 'always', get_issue: 'always' },
    },
    skills: ['sk-analysis', 'sk-minutes'],
    triggers: [{ id: 'tr-ops-weekly', kind: 'schedule', enabled: true, recurrence: weekly(1, '09:00') }],
    access: 'people',
    owner: USER.name,
    templateId: 'tpl-weekly-report',
    createdAt: at(63, 9, 30),
    updatedAt: at(9, 11, 5),
  },
  {
    id: 'ag-support-triage',
    name: 'Support triage',
    description: 'Reads each new ticket, sets its priority and team, links known issues and drafts a first reply for an agent to check.',
    icon: CustomerSupportIcon,
    colour: 'var(--chart-3)',
    instructions: `You triage customer support tickets as they arrive, so the support team starts each one with the work half done.

## For each new ticket
1. Read the ticket and the customer's last three tickets.
2. Set the **priority** from the support playbook: *Urgent* when a customer cannot work, *High* when a workaround exists, else *Normal*.
3. Set the **team**: Billing, Technical or Account.
4. Search the Issue Tracker for a known issue and link it in an internal note.
5. Draft a first reply in the customer's language, following the reply guide. Leave it as a draft.

## Never
- Send a reply to a customer yourself. **Always ask first.**
- Promise a date for a fix, a refund or a credit.
- Share another customer's details.

If a ticket mentions a security problem or personal data, set it to Urgent and assign it to the on-call lead.`,
    starters: [
      'Triage the tickets that came in overnight',
      'Which urgent tickets have no reply yet?',
      'Summarise this week’s tickets by cause',
    ],
    model: 'balanced',
    files: [],
    knowledgeBases: ['kb-support', 'kb-docs'],
    connectors: {
      'support-desk': { search_tickets: 'always', get_ticket: 'always', update_ticket: 'always', reply_to_ticket: 'ask' },
      'issue-tracker': { search_issues: 'always', get_issue: 'always', create_issue: 'ask', add_comment: 'off' },
    },
    skills: ['sk-email', 'sk-translate'],
    triggers: [
      {
        id: 'tr-sup-ticket',
        kind: 'event',
        enabled: true,
        connectorId: 'support-desk',
        event: 'support.new_ticket',
        eventLabel: 'New ticket',
      },
    ],
    access: 'people',
    owner: USER.name,
    templateId: 'tpl-ticket-triage',
    createdAt: at(28, 14, 0),
    updatedAt: at(1, 9, 20),
  },
  {
    id: 'ag-competitors',
    name: 'Competitor watch',
    description: 'Each Friday afternoon, reads competitors’ sites and news for pricing, product and hiring changes, and writes a short brief.',
    icon: BinocularsIcon,
    colour: 'var(--chart-2)',
    instructions: `You keep the team up to date on four competitors: their pricing, product launches, partnerships and hiring.

## Each week
- Visit each competitor's pricing page, changelog, blog and careers page.
- Compare with last week's brief in **Research › Competitor watch** and note only what changed.
- Search the web for news from the last seven days.

## The brief
Write one page:
- **Summary:** the two or three changes that matter most, and why.
- **By competitor:** a short section each. Say "No change" when nothing changed.
- **Sources:** every claim links to the page it came from.

Stick to facts you can link to. Mark anything you are not sure of as *unconfirmed*. Save the brief as a wiki page; do not post it anywhere else.`,
    starters: [
      'What changed in competitors’ pricing this month?',
      'Compare our plans with the two closest competitors',
      'Write this week’s brief now',
    ],
    model: 'depth',
    files: [{ id: 'agf-4', name: 'Competitor list.csv', size: 3_200 }],
    knowledgeBases: [],
    connectors: {
      'web-browser': { fetch_page: 'always', take_screenshot: 'always', find_links: 'always' },
      wiki: { search_pages: 'always', read_page: 'always', create_page: 'always', update_page: 'ask' },
    },
    skills: ['sk-analysis'],
    triggers: [{ id: 'tr-comp-weekly', kind: 'schedule', enabled: true, recurrence: weekly(5, '16:00') }],
    access: 'private',
    owner: USER.name,
    templateId: 'tpl-competitor',
    createdAt: at(20, 17, 15),
    updatedAt: at(6, 10, 0),
  },
  {
    id: 'ag-contracts',
    name: 'Contract reviewer',
    description: 'Summarises a contract you share and flags terms that differ from our standard positions: liability, renewal, notice.',
    icon: ContractsIcon,
    colour: 'var(--chart-5)',
    instructions: `You review commercial contracts before they go to Legal: supplier agreements, customer terms, NDAs and renewals. You help the person asking decide what to raise. You do not give legal advice.

## How to review
1. Summarise the contract in five lines: parties, what is bought or sold, term, value, governing law.
2. Compare each key clause with our standard positions in the contracts knowledge base.
3. List each difference in a table: clause, what it says, our standard, risk (*Low*, *Medium*, *High*).

## Always flag
- Liability that is uncapped, or capped above 12 months' fees.
- Automatic renewal with under 60 days' notice.
- No right to end the contract for convenience.
- Payment terms over 45 days, or penalties for late payment by us.

End with the questions to send back to the other side. Every *High* goes to Legal before anyone signs.

> This is not legal advice.`,
    starters: [
      'Review the attached supplier agreement',
      'What is our standard position on limitation of liability?',
      'Compare this NDA with our template',
    ],
    model: 'depth-max',
    files: [{ id: 'agf-5', name: 'Contract review checklist.pdf', size: 96_000 }],
    knowledgeBases: ['kb-contracts'],
    connectors: {
      'cloud-drive': { search_files: 'always', read_file: 'always', list_folder: 'always', create_file: 'off', share_file: 'off' },
    },
    skills: ['sk-contracts'],
    triggers: [{ id: 'tr-con-manual', kind: 'manual', enabled: true }],
    access: 'private',
    owner: USER.name,
    createdAt: at(12, 11, 45),
    updatedAt: at(12, 12, 30),
  },
]

export const SHARED_AGENTS: Agent[] = [
  {
    id: 'ag-onboarding',
    name: 'New hire helper',
    description: 'Answers new starters’ questions about policies, benefits, tools and their first weeks, from the HR policies.',
    icon: UserAdd01Icon,
    colour: 'var(--chart-3)',
    instructions: `You help people in their first three months with us. You answer questions about policies, benefits, time off, expenses, tools and who to ask, from the **HR policies** knowledge base.

## How to answer
- Be warm and brief. New starters have a lot to take in.
- Cite the policy you used, so they can read it in full.
- When the policies do not say, say so and name the person or team to ask. Never guess.

## Their first weeks
If someone asks what to do next, walk them through the onboarding checklist for their week, and offer to find a free slot with their buddy or manager.

Never discuss anyone's pay, performance or personal details. Send those questions to HR.`,
    starters: [
      'How do I book time off?',
      'What do I need to do in my first week?',
      'How do I claim expenses?',
      'Who do I ask about my laptop?',
    ],
    files: [{ id: 'agf-6', name: 'Onboarding checklist.pdf', size: 128_000 }],
    knowledgeBases: ['kb-hr'],
    connectors: {
      calendar: { list_events: 'always', find_free_time: 'always', create_event: 'ask' },
    },
    skills: [],
    triggers: [{ id: 'tr-onb-manual', kind: 'manual', enabled: true }],
    access: 'organisation',
    owner: 'Sam Lee',
    createdAt: at(120, 9, 0),
    updatedAt: at(14, 15, 10),
  },
  {
    id: 'ag-release-notes',
    name: 'Release notes writer',
    description: 'Turns the merged pull requests and closed issues of a release into clear notes for customers and a changelog page.',
    icon: QuillWrite01Icon,
    colour: 'var(--chart-2)',
    instructions: `You write release notes from what engineering shipped. Your readers are customers, not engineers.

## Steps
1. List the pull requests merged since the last release tag, and the issues they close.
2. Group the changes: **New**, **Improved**, **Fixed**. Leave out internal changes.
3. Write one line per change, starting with what the customer can now do.

## Style
Follow the brand guidelines. Short sentences, no ticket numbers, no code names. Put the most useful change first.

Save the notes as a draft wiki page in **Product › Release notes**. Ask before publishing.`,
    starters: [
      'Write the notes for this week’s release',
      'What did we fix for customers last month?',
    ],
    model: 'balanced',
    files: [],
    knowledgeBases: ['kb-docs'],
    connectors: {
      'code-repository': { search_code: 'always', list_pull_requests: 'always', read_file: 'always' },
      'issue-tracker': { search_issues: 'always', get_issue: 'always' },
      wiki: { search_pages: 'always', create_page: 'ask' },
    },
    skills: ['sk-brand'],
    triggers: [{ id: 'tr-rel-manual', kind: 'manual', enabled: true }],
    access: 'people',
    owner: 'Jo Tan',
    createdAt: at(34, 13, 20),
    updatedAt: at(4, 10, 45),
  },
]

export const AGENT_CATEGORIES = ['Finance', 'Operations', 'Support', 'Sales', 'HR', 'Research', 'Writing']

// A template's fields, with the empty ones filled in.
const template = (
  t: Partial<AgentDraft> & Pick<AgentTemplate, 'id' | 'name' | 'description' | 'instructions' | 'category' | 'publisher' | 'uses'>,
): AgentTemplate => ({
  starters: [],
  files: [],
  knowledgeBases: [],
  connectors: {},
  skills: [],
  triggers: [{ id: `${t.id}-manual`, kind: 'manual', enabled: true }],
  access: 'private',
  ...t,
})

export const AGENT_TEMPLATES: AgentTemplate[] = [
  template({
    id: 'tpl-invoice-clerk',
    name: 'Invoice clerk',
    category: 'Finance',
    publisher: 'Built in',
    uses: 18_400,
    description: 'Reads invoices from your inbox, matches them to purchase orders and logs them in a sheet.',
    icon: Invoice01Icon,
    colour: 'var(--chart-4)',
    instructions: `You process supplier invoices that arrive by email. Read each one, match it to its purchase order and add a row to the payables sheet.

Flag price differences, missing purchase orders and duplicate invoice numbers. Draft a reply to the supplier when something is off, and ask before sending it.`,
    starters: ['Check today’s invoices', 'Which invoices are due this week?'],
    connectors: {
      mail: { search_mail: 'always', read_thread: 'always', draft_reply: 'always', send_message: 'ask' },
      spreadsheets: { read_sheet: 'always', append_rows: 'always' },
    },
    skills: ['sk-invoices'],
    triggers: [
      { id: 'tpl-inv-mail', kind: 'event', enabled: true, connectorId: 'mail', event: 'mail.new_email', eventLabel: 'New email', filter: 'has:attachment subject:invoice' },
    ],
  }),
  template({
    id: 'tpl-expense-checker',
    name: 'Expense report checker',
    category: 'Finance',
    publisher: 'Finance team',
    uses: 2_310,
    description: 'Checks expense claims against the travel and expenses policy, and lists what needs a receipt or approval.',
    icon: ReceiptDollarIcon,
    colour: 'var(--chart-4)',
    instructions: `You check expense claims before they are approved. For each line, check the amount against the policy limits, the receipt against the amount, and the category against what was bought.

List each problem with the policy rule it breaks. Never approve or reject a claim yourself: the approver decides.`,
    starters: ['Check this expense report', 'What is the hotel limit for a trip abroad?'],
    files: [{ id: 'tpl-exp-1', name: 'Travel and expenses policy.pdf', size: 188_000 }],
    connectors: { spreadsheets: { read_sheet: 'always' } },
  }),
  template({
    id: 'tpl-weekly-report',
    name: 'Weekly operations report',
    category: 'Operations',
    publisher: 'Built in',
    uses: 9_870,
    description: 'Every Monday, sums up last week’s numbers, delays and open issues in a short report.',
    icon: Analytics01Icon,
    colour: 'var(--chart-1)',
    instructions: `Every Monday, write a one-page report on the week before: the headline numbers and their change, the biggest problems and their causes, and what is still open.

Start with a three-line summary. Use a table for numbers. Save it as a document and draft the email, asking before you send it.`,
    starters: ['Write this week’s report now'],
    connectors: {
      spreadsheets: { read_sheet: 'always' },
      'cloud-drive': { read_file: 'always', create_file: 'always' },
    },
    skills: ['sk-analysis'],
    triggers: [{ id: 'tpl-ops-weekly', kind: 'schedule', enabled: true, recurrence: weekly(1, '09:00') }],
  }),
  template({
    id: 'tpl-meeting-actions',
    name: 'Meeting follow-ups',
    category: 'Operations',
    publisher: 'Built in',
    uses: 14_050,
    description: 'After each recorded meeting, writes the minutes, lists decisions and files action items with owners.',
    icon: Mic01Icon,
    colour: 'var(--chart-4)',
    instructions: `After a meeting is recorded, read its transcript and write the minutes: who came, what was decided and what happens next.

Turn each action into an item with one owner and a due date. When the owner or date was not said, mark it *to confirm* rather than guessing.`,
    starters: ['Write up my last meeting', 'What did I agree to do this week?'],
    connectors: {
      'meeting-notes': { list_meetings: 'always', get_transcript: 'always', create_action_items: 'ask' },
    },
    skills: ['sk-minutes'],
  }),
  template({
    id: 'tpl-ticket-triage',
    name: 'Support triage',
    category: 'Support',
    publisher: 'Built in',
    uses: 11_200,
    description: 'Sets each new ticket’s priority and team, links known issues and drafts a first reply.',
    icon: CustomerSupportIcon,
    colour: 'var(--chart-3)',
    instructions: `When a ticket arrives, read it and the customer's history. Set its priority and team, link any known issue and draft a first reply in the customer's language.

Never send a reply yourself, and never promise a fix date or a refund.`,
    starters: ['Triage the tickets from overnight'],
    connectors: {
      'support-desk': { get_ticket: 'always', update_ticket: 'always', reply_to_ticket: 'ask' },
    },
    triggers: [
      { id: 'tpl-sup-ticket', kind: 'event', enabled: true, connectorId: 'support-desk', event: 'support.new_ticket', eventLabel: 'New ticket' },
    ],
  }),
  template({
    id: 'tpl-reply-drafter',
    name: 'Reply drafter',
    category: 'Support',
    publisher: 'Support team',
    uses: 3_480,
    description: 'Drafts replies to customer emails in your voice, from your help articles and past answers.',
    icon: MailReply01Icon,
    colour: 'var(--chart-2)',
    instructions: `Draft a reply to the customer email you are given. Answer from the help articles first; link the one you used.

Match the customer's language and tone, keep it under 150 words and end with one clear next step. Leave it as a draft.`,
    starters: ['Draft a reply to this email', 'Make this reply shorter and warmer'],
    connectors: { mail: { read_thread: 'always', draft_reply: 'always', send_message: 'off' } },
    skills: ['sk-email'],
  }),
  template({
    id: 'tpl-lead-research',
    name: 'Lead researcher',
    category: 'Sales',
    publisher: 'Built in',
    uses: 7_640,
    description: 'Builds a one-page brief on a company before a sales call: what they do, recent news and who to talk to.',
    icon: UserSearch01Icon,
    colour: 'var(--chart-1)',
    instructions: `Before a sales call, research the company you are given from public sources: what it does, its size, recent news, funding and open roles.

Write a one-page brief with three questions to ask on the call. Link every fact to its source.`,
    starters: ['Research this company before my call', 'Who should I talk to there?'],
    connectors: { 'web-browser': { fetch_page: 'always', find_links: 'always' } },
  }),
  template({
    id: 'tpl-deal-digest',
    name: 'Pipeline digest',
    category: 'Sales',
    publisher: 'Sales operations',
    uses: 1_920,
    description: 'Every weekday morning, lists deals that moved, deals gone quiet and what to do next on each.',
    icon: Target02Icon,
    colour: 'var(--chart-5)',
    instructions: `Each weekday morning, look at the deals you own. List those that changed stage yesterday, those with no activity for 14 days, and those closing this month.

For each quiet deal, suggest one next step. Keep the whole digest readable in two minutes.`,
    starters: ['Which deals have gone quiet?'],
    connectors: { crm: { list_deals: 'always', get_account: 'always', log_activity: 'ask' } },
    triggers: [{ id: 'tpl-deal-daily', kind: 'schedule', enabled: true, recurrence: { kind: 'weekdays', time: '08:30', timeZone: SGT } }],
  }),
  template({
    id: 'tpl-onboarding',
    name: 'New hire helper',
    category: 'HR',
    publisher: 'People team',
    uses: 5_310,
    description: 'Answers new starters’ questions about policies, benefits and their first weeks.',
    icon: UserAdd01Icon,
    colour: 'var(--chart-3)',
    instructions: `Help people in their first months. Answer questions about policies, benefits, time off and tools from the HR policies, and cite the policy you used.

When the policies do not say, name the team to ask. Never discuss pay or performance.`,
    starters: ['How do I book time off?', 'What do I do in my first week?'],
    knowledgeBases: ['kb-hr'],
  }),
  template({
    id: 'tpl-policy-answers',
    name: 'Policy answers',
    category: 'HR',
    publisher: 'Built in',
    uses: 4_090,
    description: 'Answers any question about company policies, with the passage it comes from.',
    icon: BookOpen01Icon,
    colour: 'var(--chart-1)',
    instructions: `Answer questions about company policies from the knowledge you are given, quoting the passage you used.

If two policies disagree, show both and say which is newer. If nothing covers the question, say so.`,
    starters: ['What is the remote work policy?'],
  }),
  template({
    id: 'tpl-competitor',
    name: 'Competitor watch',
    category: 'Research',
    publisher: 'Built in',
    uses: 6_720,
    description: 'Each week, checks competitors’ sites and news for changes, and writes a short brief with sources.',
    icon: BinocularsIcon,
    colour: 'var(--chart-2)',
    instructions: `Each week, visit each competitor's pricing page, changelog and blog, and search the news. Note only what changed since last week.

Write a one-page brief: the changes that matter most, then a short section per competitor. Link every claim.`,
    starters: ['What changed this week?'],
    connectors: { 'web-browser': { fetch_page: 'always', take_screenshot: 'always', find_links: 'always' } },
    triggers: [{ id: 'tpl-comp-weekly', kind: 'schedule', enabled: true, recurrence: weekly(5, '16:00') }],
  }),
  template({
    id: 'tpl-blog-writer',
    name: 'Blog post drafter',
    category: 'Writing',
    publisher: 'Marketing team',
    uses: 8_150,
    description: 'Turns an outline or notes into a first draft in the brand voice, with a title and summary.',
    icon: QuillWrite01Icon,
    colour: 'var(--chart-5)',
    instructions: `Turn the notes or outline you are given into a blog post draft of 600 to 900 words, in the brand voice.

Offer three titles and a two-line summary. Mark any claim that needs a source with *[source needed]*.`,
    starters: ['Draft a post from these notes', 'Suggest five titles for this post'],
    skills: ['sk-brand'],
  }),
]
