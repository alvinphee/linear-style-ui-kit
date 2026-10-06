import { formatMoney, formatNumber } from '@/lib/format'
import { plural } from '@/lib/text'
import { ROLE_LABEL } from '../data'
import { TODAY, addDays, daysBetween, formatDate } from '../format'
import { MODULES, moduleById } from '../modules'
import type { Data, EntityId, ErpModule, Role, Row } from '../types'

// Ask AI's answers. They are scripted from the live records (no model is
// called): about 25 kinds of question, matched by keywords, each answered
// with the numbers and record numbers as they are right now. The side panel,
// the full-page Assistant and the launchpad's AI briefing all answer from here.

/* ---------- Answers ---------- */

// A record number inside an answer. It renders as a button that opens the record.
export type Ref = { entity: EntityId; id: string }
export type Inline = string | Ref
export type Block = { kind: 'p'; parts: Inline[] } | { kind: 'list'; items: Inline[][] }
export type Link = { label: string; module: string; page: string }
export type Answer = { blocks: Block[]; source?: string; links?: Link[]; followUps?: string[] }

const p = (...parts: Inline[]): Block => ({ kind: 'p', parts })
const list = (items: Inline[][]): Block => ({ kind: 'list', items })
const ref = (entity: EntityId, id: string): Ref => ({ entity, id })

const num = (r: Row, key: string) => Number(r[key] ?? 0)
const str = (r: Row, key: string) => String(r[key] ?? '')
const sum = (rows: Row[], key: string) => rows.reduce((t, r) => t + num(r, key), 0)
const is = (...statuses: string[]) => (r: Row) => statuses.includes(str(r, 'status'))
const most = (key: string) => (a: Row, b: Row) => num(b, key) - num(a, key)
const earliest = (key: string) => (a: Row, b: Row) => str(a, key).localeCompare(str(b, key))
const money = (n: number) => formatMoney(n, false)
const isAre = (n: number) => (n === 1 ? 'is' : 'are')
const inDays = (n: number) => addDays(TODAY, n)
// Leads into the example record: ", such as SO-1" for many, ": SO-1" for one.
const eg = (n: number, phrase: string) => (n === 1 ? ': ' : `, ${phrase} `)
export const firstName = (name: string) => name.split(' ')[0] || 'there'
const monthOf = (iso: string) =>
  new Date(`${iso.slice(0, 7)}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const span = (r: Row) => (str(r, 'from') === str(r, 'to') ? formatDate(str(r, 'from')) : `${formatDate(str(r, 'from'))} – ${formatDate(str(r, 'to'))}`)
const stamp = (at: string) => `${formatDate(at.slice(0, 10))}, ${at.slice(11)}`
const warehouse = (data: Data, id: string) => String(data.warehouses.find((w) => w.id === id)?.name ?? id)
const canOpen = (moduleId: string, role: Role) => !!moduleById(moduleId)?.roles.includes(role)

function thisWeek() {
  const monday = addDays(TODAY, -((new Date(`${TODAY}T00:00:00Z`).getUTCDay() + 6) % 7))
  return { start: monday, end: addDays(monday, 6) }
}

export const PROMPTS: Record<string, string[]> = {
  home: ['What needs my attention today?', 'What needs my approval?'],
  crm: ['Which opportunities close this month?', 'Which activities are overdue?', 'Which new leads score highest?'],
  sales: ['Summarise open sales orders', 'Which quotations expire this week?', 'What is ready to deliver?'],
  inventory: ['Which items are below the reorder point?', 'Which stock transfers are in transit?', 'Which warehouse is fullest?'],
  purchasing: ['What needs my approval?', 'Which purchase orders are late?', 'Who are our top vendors by spend?'],
  accounting: ['Which invoices are overdue?', 'Summarise accounts receivable', 'Which vendor bills are due this week?'],
  hr: ['Who is on leave this week?', 'When is the next payroll run?', 'How many employees are on probation?'],
  admin: ['Which users have not set up 2FA?', 'Which users are invited or suspended?', 'What changed in the audit trail today?'],
  forms: ['Which checks failed this week?', 'What was submitted today?'],
}

// The home prompts, then the first prompt of each module the role can open.
export function starterPrompts(role: Role) {
  const extra = MODULES.filter((m) => m.id !== 'home' && m.roles.includes(role)).map((m) => PROMPTS[m.id]?.[0]).filter((q): q is string => !!q)
  return [...new Set([...PROMPTS.home, ...extra])]
}

export function suggestions(module: ErpModule, role: Role) {
  if (module.id !== 'home' && module.roles.includes(role) && PROMPTS[module.id]) return PROMPTS[module.id]
  return starterPrompts(role).slice(0, 4)
}

type Pending = { entity: EntityId; noun: string; rows: Row[]; value?: string; detail: (r: Row) => string; link: Link }

// What waits for this role's approval, by record type. Matches the launchpad.
function pendingApprovals(data: Data, role: Role): Pending[] {
  const groups: (Pending & { roles: Role[] })[] = [
    {
      entity: 'purchaseOrders', noun: 'purchase order', roles: ['admin', 'finance'], value: 'amount',
      rows: data.purchaseOrders.filter(is('Awaiting approval')).sort(most('amount')),
      detail: (r) => ` (${str(r, 'vendor')}, ${money(num(r, 'amount'))})`,
      link: { label: 'Purchase orders', module: 'purchasing', page: 'orders' },
    },
    {
      entity: 'requisitions', noun: 'purchase requisition', roles: ['admin', 'operations', 'finance'], value: 'estimate',
      rows: data.requisitions.filter(is('Awaiting approval')).sort(most('estimate')),
      detail: (r) => ` (${str(r, 'item')}, ${formatNumber(num(r, 'quantity'))} units)`,
      link: { label: 'Purchase requisitions', module: 'purchasing', page: 'requisitions' },
    },
    {
      entity: 'leave', noun: 'leave request', roles: ['admin', 'hr'],
      rows: data.leave.filter(is('Pending')).sort(earliest('from')),
      detail: (r) => ` (${str(r, 'employee')}, ${span(r)})`,
      link: { label: 'Leave requests', module: 'hr', page: 'leave' },
    },
  ]
  return groups.filter((g) => g.roles.includes(role) && g.rows.length > 0)
}

export type Ctx = { data: Data; role: Role; name: string }
// `module` is where the records live: a role that can't open it gets no answer.
type Intent = { module: string; match: RegExp; answer: (ctx: Ctx) => Answer }

// First match wins, so the specific questions come before the broad ones.
const INTENTS: Intent[] = [
  {
    module: 'home', match: /^(hi|hello|hey|good (morning|afternoon|evening))\b/,
    answer: ({ name, role }) => ({
      blocks: [p(`Hi ${firstName(name)}. I can look things up across your modules. What would you like to know?`)],
      followUps: starterPrompts(role).slice(0, 3),
    }),
  },
  {
    module: 'home', match: /^(thanks|thank you|cheers|great|perfect)\b/,
    answer: () => ({ blocks: [p('Happy to help. Ask me anything else about your records.')] }),
  },
  {
    module: 'admin', match: /two.?factor|\b2fa\b|\bmfa\b/,
    answer: ({ data }) => {
      const without = data.users.filter((u) => !u.mfa && u.status !== 'Suspended')
      const on = data.users.filter((u) => u.mfa).length
      const source = plural(data.users.length, 'user')
      if (!without.length) return { blocks: [p('Every active user has two-factor authentication (2FA) set up.')], source }
      return {
        blocks: [
          p(`${on} of ${data.users.length} users have two-factor authentication (2FA) set up. ${plural(without.length, 'user')} ${without.length === 1 ? 'has' : 'have'} not:`),
          list(without.map((u) => [ref('users', u.id), ` · ${str(u, 'name')}, ${str(u, 'role')}, last active ${formatDate(str(u, 'lastActive'))}`])),
          p('Turn on "Require two-factor authentication" in company settings and they are asked at their next sign-in.'),
        ],
        source,
        links: [{ label: 'Company settings', module: 'admin', page: 'company' }, { label: 'Users', module: 'admin', page: 'users' }],
      }
    },
  },
  {
    module: 'admin', match: /audit|changed|who did|history|recent changes?/,
    answer: ({ data }) => {
      const events = [...data.audit].sort((a, b) => str(b, 'at').localeCompare(str(a, 'at')))
      const today = events.filter((e) => str(e, 'at').startsWith(TODAY)).length
      return {
        blocks: [
          p(`${plural(today, 'change')} ${today === 1 ? 'was' : 'were'} logged in the audit trail today. The latest:`),
          list(events.slice(0, 4).map((e) => [
            ref('audit', e.id), ` · ${str(e, 'actor')} ${str(e, 'action')}${str(e, 'target') ? ` ${str(e, 'target')}` : ''}, ${stamp(str(e, 'at'))}`,
          ])),
        ],
        source: plural(data.audit.length, 'audit event'),
        links: [{ label: 'Audit trail', module: 'admin', page: 'audit' }],
      }
    },
  },
  {
    module: 'admin', match: /\busers?\b|invit|suspend|\bseats?\b/,
    answer: ({ data }) => {
      const active = data.users.filter(is('Active')).length
      const waiting = data.users.filter(is('Invited', 'Suspended'))
      const blocks: Block[] = [p(`${active} of ${data.users.length} users are active.${waiting.length ? ` ${plural(waiting.length, 'user')} ${isAre(waiting.length)} invited or suspended:` : ''}`)]
      if (waiting.length) {
        blocks.push(
          list(waiting.map((u) => [ref('users', u.id), ` · ${str(u, 'name')}, ${str(u, 'role')}, ${str(u, 'status').toLowerCase()}`])),
          p('Open a user to resend the invitation or restore access.'),
        )
      }
      return {
        blocks,
        source: plural(data.users.length, 'user'),
        links: [{ label: 'Users', module: 'admin', page: 'users' }, { label: 'Roles and permissions', module: 'admin', page: 'roles' }],
      }
    },
  },
  {
    module: 'hr', match: /\bleave\b|holiday|time off|out of office|\baway\b|absent|vacation/,
    answer: ({ data }) => {
      const { start, end } = thisWeek()
      const week = `${formatDate(start)} – ${formatDate(end)}`
      const away = data.leave.filter((r) => r.status === 'Approved' && str(r, 'from') <= end && str(r, 'to') >= start).sort(earliest('from'))
      const pending = data.leave.filter(is('Pending')).sort(earliest('from'))
      const blocks: Block[] = away.length
        ? [
            p(`${plural(away.length, 'person', 'people')} ${away.length === 1 ? 'has' : 'have'} approved leave this week (${week}):`),
            list(away.map((r) => [ref('leave', r.id), ` · ${str(r, 'employee')}, ${str(r, 'type').toLowerCase()}, ${span(r)}`])),
          ]
        : [p(`Nobody has approved leave this week (${week}).`)]
      if (pending.length) {
        blocks.push(p(
          `${plural(pending.length, 'leave request')} ${isAre(pending.length)} waiting for approval. The earliest starts on ${formatDate(str(pending[0], 'from'))}: `,
          ref('leave', pending[0].id), '.',
        ))
      }
      return { blocks, source: plural(data.leave.length, 'leave request'), links: [{ label: 'Leave requests', module: 'hr', page: 'leave' }] }
    },
  },
  {
    module: 'hr', match: /payroll|pay run|salar|wages?\b/,
    answer: ({ data }) => {
      const runs = [...data.payroll].sort(earliest('period'))
      const next = runs.find(is('Draft'))
      const last = [...runs].reverse().find(is('Completed'))
      const blocks: Block[] = []
      if (next) {
        blocks.push(p(
          'The next payroll run is ', ref('payroll', next.id),
          ` for ${monthOf(str(next, 'period'))}: ${num(next, 'employees')} employees, ${money(num(next, 'gross'))} gross, paid on ${formatDate(str(next, 'payDate'))}. It is still a draft.`,
        ))
      }
      for (const r of runs.filter(is('Processing'))) blocks.push(p(`The ${monthOf(str(r, 'period'))} run, `, ref('payroll', r.id), ', is still processing.'))
      if (last) blocks.push(p(`The last completed run was ${monthOf(str(last, 'period'))}, at ${money(num(last, 'gross'))} gross.`))
      if (!blocks.length) blocks.push(p('There are no payroll runs yet.'))
      return { blocks, source: plural(data.payroll.length, 'payroll run'), links: [{ label: 'Payroll', module: 'hr', page: 'payroll' }] }
    },
  },
  {
    module: 'hr', match: /employees?|headcount|\bstaff\b|probation|new hires?/,
    answer: ({ data }) => {
      const probation = data.employees.filter(is('Probation')).sort(earliest('start'))
      const onLeave = data.employees.filter(is('On leave')).length
      const active = data.employees.filter(is('Active')).length
      const blocks: Block[] = [p(`You have ${data.employees.length} employees: ${active} active, ${onLeave} on leave and ${probation.length} on probation.`)]
      if (probation.length) {
        blocks.push(p('On probation:'), list(probation.map((e) => [
          ref('employees', e.id), ` · ${str(e, 'name')}, ${str(e, 'jobTitle').toLowerCase()}, started ${formatDate(str(e, 'start'))}`,
        ])))
      }
      return { blocks, source: plural(data.employees.length, 'employee'), links: [{ label: 'Employees', module: 'hr', page: 'employees' }] }
    },
  },
  {
    module: 'home', match: /approv|sign.?off|awaiting/,
    answer: ({ data, role }) => {
      const groups = pendingApprovals(data, role)
      const count = groups.reduce((n, g) => n + g.rows.length, 0)
      const source = 'your approval queue'
      if (!count) return { blocks: [p('Nothing is waiting for your approval right now.')], source }
      return {
        blocks: [
          p(`${plural(count, 'item')} ${isAre(count)} waiting for your approval:`),
          list(groups.map((g) => [
            `${plural(g.rows.length, g.noun)}${g.value ? ` worth ${money(sum(g.rows, g.value))}` : ''}, starting with `,
            ref(g.entity, g.rows[0].id), g.detail(g.rows[0]),
          ])),
          p('Open a record to approve or reject it. The launchpad lists them too.'),
        ],
        source,
        links: groups.map((g) => g.link),
      }
    },
  },
  {
    module: 'home', match: /attention|today|catch me up|priorit|what should i|focus on/,
    answer: ({ data, role, name }) => {
      const lines: Inline[][] = []
      const approvals = pendingApprovals(data, role)
      const waiting = approvals.reduce((n, g) => n + g.rows.length, 0)
      if (waiting) lines.push([`${plural(waiting, 'approval')} waiting${eg(waiting, 'starting with')}`, ref(approvals[0].entity, approvals[0].rows[0].id), '.'])
      if (canOpen('accounting', role)) {
        const overdue = data.invoices.filter(is('Overdue')).sort(most('balance'))
        if (overdue.length) {
          lines.push([`${plural(overdue.length, 'customer invoice')} overdue, ${money(sum(overdue, 'balance'))} in total${eg(overdue.length, 'the largest')}`, ref('invoices', overdue[0].id), ` (${str(overdue[0], 'customer')}).`])
        }
        const bills = data.bills.filter((r) => r.status === 'Open' && str(r, 'due') >= TODAY && str(r, 'due') <= inDays(7)).sort(earliest('due'))
        if (bills.length) lines.push([`${plural(bills.length, 'vendor bill')} due in the next 7 days${eg(bills.length, 'the first')}`, ref('bills', bills[0].id), ` on ${formatDate(str(bills[0], 'due'))}.`])
      }
      if (canOpen('sales', role)) {
        const ready = data.deliveries.filter(is('Ready to pick'))
        if (ready.length) lines.push([`${plural(ready.length, 'delivery', 'deliveries')} ready to pick${eg(ready.length, 'such as')}`, ref('deliveries', ready[0].id), ` for ${str(ready[0], 'customer')}.`])
      }
      if (canOpen('inventory', role)) {
        const out = data.items.filter(is('Out of stock'))
        if (out.length) lines.push([`${plural(out.length, 'item')} out of stock${eg(out.length, 'including')}`, ref('items', out[0].id), ` (${str(out[0], 'name')}).`])
      }
      if (canOpen('crm', role)) {
        const late = data.activities.filter(is('Overdue')).sort(earliest('due'))
        if (late.length) lines.push([`${plural(late.length, 'activity', 'activities')} overdue${eg(late.length, 'the oldest')}`, ref('activities', late[0].id), '.'])
      }
      if (canOpen('admin', role)) {
        const invited = data.users.filter(is('Invited'))
        if (invited.length) lines.push([`${plural(invited.length, 'user')} invited but not signed in yet${eg(invited.length, 'such as')}`, ref('users', invited[0].id), '.'])
      }
      return {
        blocks: lines.length
          ? [p(`Here's what needs you today, ${firstName(name)}:`), list(lines), p('Ask me about any of these for the detail.')]
          : [p(`Nothing urgent today, ${firstName(name)}. You're all caught up.`)],
        source: 'your modules',
        followUps: starterPrompts(role).filter((q) => !/attention/.test(q)).slice(0, 2),
      }
    },
  },
  {
    module: 'crm', match: /activit|follow.?ups?|\btasks?\b|\bcalls?\b|meetings?/,
    answer: ({ data }) => {
      const late = data.activities.filter(is('Overdue')).sort(earliest('due'))
      const soon = data.activities.filter((r) => r.status === 'Scheduled' && str(r, 'due') <= inDays(7)).length
      const blocks: Block[] = late.length
        ? [
            p(`${plural(late.length, 'activity', 'activities')} ${isAre(late.length)} overdue:`),
            list(late.slice(0, 3).map((r) => [ref('activities', r.id), ` · ${str(r, 'subject')}, ${str(r, 'owner')}, due ${formatDate(str(r, 'due'))}`])),
          ]
        : [p('No activities are overdue.')]
      blocks.push(p(soon ? `${plural(soon, 'activity', 'activities')} ${isAre(soon)} scheduled for the next 7 days.` : 'Nothing else is scheduled for the next 7 days.'))
      return { blocks, source: plural(data.activities.length, 'activity', 'activities'), links: [{ label: 'Activities', module: 'crm', page: 'activities' }] }
    },
  },
  {
    module: 'inventory', match: /reorder|low stock|out of stock|below|restock|stock level|run(ning)? out/,
    answer: ({ data }) => {
      const shortfall = (r: Row) => num(r, 'reorderPoint') - num(r, 'onHand')
      const low = data.items.filter(is('Low stock', 'Out of stock')).sort((a, b) => shortfall(b) - shortfall(a))
      const out = low.filter(is('Out of stock')).length
      const source = plural(data.items.length, 'item')
      if (!low.length) return { blocks: [p('Every item is above its reorder point.')], source }
      return {
        blocks: [
          p(`${plural(low.length, 'item')} ${isAre(low.length)} below the reorder point${out ? `, and ${out} of them ${isAre(out)} out of stock` : ''}. The biggest shortfalls:`),
          list(low.slice(0, 3).map((r) => [
            ref('items', r.id), ` · ${str(r, 'name')}: ${formatNumber(num(r, 'onHand'))} on hand, reorder point ${formatNumber(num(r, 'reorderPoint'))}`,
          ])),
          p('Raise a purchase requisition for these so purchasing can order more.'),
        ],
        source,
        links: [{ label: 'Items', module: 'inventory', page: 'items' }, { label: 'Purchase requisitions', module: 'purchasing', page: 'requisitions' }],
      }
    },
  },
  {
    module: 'inventory', match: /transfers?\b/,
    answer: ({ data }) => {
      const moving = data.transfers.filter(is('In transit')).sort(earliest('requested'))
      const drafts = data.transfers.filter(is('Draft')).length
      const blocks: Block[] = moving.length
        ? [
            p(`${plural(moving.length, 'stock transfer')} ${isAre(moving.length)} in transit.${moving.length > 3 ? ' The oldest:' : ''}`),
            list(moving.slice(0, 3).map((r) => [
              ref('transfers', r.id),
              ` · ${warehouse(data, str(r, 'from'))} → ${warehouse(data, str(r, 'to'))}, ${plural(num(r, 'lines'), 'line')}, requested ${formatDate(str(r, 'requested'))}`,
            ])),
          ]
        : [p('No stock transfers are in transit.')]
      if (drafts) blocks.push(p(`${plural(drafts, 'more transfer')} ${isAre(drafts)} still in draft.`))
      return { blocks, source: plural(data.transfers.length, 'stock transfer'), links: [{ label: 'Stock transfers', module: 'inventory', page: 'transfers' }] }
    },
  },
  {
    module: 'inventory', match: /warehouses?|utili[sz]|capacity|fullest|\bspace\b/,
    answer: ({ data }) => {
      const sorted = [...data.warehouses].sort(most('utilisation'))
      const top = sorted[0]
      const least = sorted[sorted.length - 1]
      if (!top) return { blocks: [p('No warehouses are set up yet.')] }
      const blocks: Block[] = [
        p(`${str(top, 'name')} is the fullest, at ${num(top, 'utilisation')}% utilisation.`),
        list(sorted.map((w) => [
          ref('warehouses', w.id), ` · ${str(w, 'name')}, ${str(w, 'city')}: ${num(w, 'utilisation')}% full, ${plural(num(w, 'skus'), 'stock line')}`,
        ])),
      ]
      if (top !== least && num(top, 'utilisation') >= 85) {
        blocks.push(p(`Consider a stock transfer from ${str(top, 'name')} to ${str(least, 'name')}, which is at ${num(least, 'utilisation')}%.`))
      }
      return { blocks, source: plural(data.warehouses.length, 'warehouse'), links: [{ label: 'Warehouses', module: 'inventory', page: 'warehouses' }] }
    },
  },
  {
    module: 'accounting', match: /\bbills?\b|payables?|\bap\b/,
    answer: ({ data }) => {
      const open = data.bills.filter(is('Open', 'Overdue'))
      const overdue = open.filter(is('Overdue')).sort(earliest('due'))
      const soon = open.filter((r) => r.status === 'Open' && str(r, 'due') >= TODAY && str(r, 'due') <= inDays(7)).sort(earliest('due'))
      const show = soon.length ? soon : overdue
      const blocks: Block[] = [
        p(`Accounts payable is ${money(sum(open, 'amount'))} across ${plural(open.length, 'open vendor bill')}. ${overdue.length} ${isAre(overdue.length)} overdue, worth ${money(sum(overdue, 'amount'))}.`),
        p(soon.length ? `${plural(soon.length, 'bill')} ${soon.length === 1 ? 'falls' : 'fall'} due in the next 7 days:` : overdue.length ? 'Nothing else falls due in the next 7 days. The oldest overdue:' : 'Nothing falls due in the next 7 days.'),
      ]
      if (show.length) blocks.push(list(show.slice(0, 3).map((r) => [ref('bills', r.id), ` · ${str(r, 'vendor')}, ${money(num(r, 'amount'))}, due ${formatDate(str(r, 'due'))}`])))
      return { blocks, source: plural(data.bills.length, 'vendor bill'), links: [{ label: 'Vendor bills', module: 'accounting', page: 'bills' }] }
    },
  },
  {
    module: 'purchasing', match: /purchase orders?|\bpos?\b|arriv|expected/,
    answer: ({ data }) => {
      const open = data.purchaseOrders.filter(is('Approved', 'Partially received'))
      const late = open.filter((r) => str(r, 'expected') < TODAY).sort(earliest('expected'))
      const waiting = data.purchaseOrders.filter(is('Awaiting approval')).length
      const blocks: Block[] = late.length
        ? [
            p(`${plural(late.length, 'open purchase order')} ${isAre(late.length)} past the expected date and not fully received, worth ${money(sum(late, 'amount'))}:`),
            list(late.slice(0, 3).map((r) => [
              ref('purchaseOrders', r.id),
              ` · ${str(r, 'vendor')}, ${money(num(r, 'amount'))}, expected ${formatDate(str(r, 'expected'))} (${plural(daysBetween(str(r, 'expected'), TODAY), 'day')} late)`,
            ])),
            p('Chase the vendors, then record a goods receipt when the goods arrive.'),
          ]
        : [p(open.length ? `None of the ${plural(open.length, 'open purchase order')} are late.` : 'There are no open purchase orders.')]
      if (waiting) blocks.push(p(`${plural(waiting, 'purchase order')} ${isAre(waiting)} still waiting for approval.`))
      return {
        blocks,
        source: plural(data.purchaseOrders.length, 'purchase order'),
        links: [{ label: 'Purchase orders', module: 'purchasing', page: 'orders' }, { label: 'Goods receipts', module: 'purchasing', page: 'receipts' }],
      }
    },
  },
  {
    module: 'purchasing', match: /vendors?|suppliers?|\bspend/,
    answer: ({ data }) => {
      const spend = new Map<string, { value: number; orders: number }>()
      for (const r of data.purchaseOrders) {
        if (r.status === 'Draft') continue
        const v = spend.get(str(r, 'vendor')) ?? { value: 0, orders: 0 }
        spend.set(str(r, 'vendor'), { value: v.value + num(r, 'amount'), orders: v.orders + 1 })
      }
      const ranked = [...spend.entries()].sort((a, b) => b[1].value - a[1].value)
      const all = ranked.reduce((t, [, s]) => t + s.value, 0)
      const top = ranked.slice(0, 3)
      const source = plural(data.purchaseOrders.length, 'purchase order')
      if (!top.length) return { blocks: [p('There is no purchase order spend yet.')], source }
      const share = Math.round((top.reduce((t, [, s]) => t + s.value, 0) / all) * 100)
      return {
        blocks: [
          p('Your top vendors by purchase order value:'),
          list(top.map(([vendor, s]): Inline[] => {
            const v = data.vendors.find((x) => x.name === vendor)
            const text = `${vendor}, ${money(s.value)} across ${plural(s.orders, 'order')}${v ? `, rated ${num(v, 'rating')} of 5` : ''}`
            return v ? [ref('vendors', v.id), ` · ${text}`] : [text]
          })),
          p(`Together they are ${share}% of the ${money(all)} on purchase orders, not counting drafts.`),
        ],
        source,
        links: [{ label: 'Vendors', module: 'purchasing', page: 'vendors' }],
      }
    },
  },
  {
    module: 'accounting', match: /overdue|\bowe|chase|collect|late pay|unpaid/,
    answer: ({ data }) => {
      const overdue = data.invoices.filter(is('Overdue')).sort(most('balance'))
      const source = plural(data.invoices.length, 'customer invoice')
      if (!overdue.length) return { blocks: [p('No customer invoices are overdue.')], source }
      const oldest = [...overdue].sort(earliest('due'))[0]
      return {
        blocks: [
          p(`${plural(overdue.length, 'customer invoice')} ${isAre(overdue.length)} overdue, worth ${money(sum(overdue, 'balance'))} in total. The largest:`),
          list(overdue.slice(0, 3).map((r) => [
            ref('invoices', r.id), ` · ${str(r, 'customer')}, ${money(num(r, 'balance'))}, ${plural(daysBetween(str(r, 'due'), TODAY), 'day')} overdue`,
          ])),
          p('The oldest, ', ref('invoices', oldest.id), `, has been due since ${formatDate(str(oldest, 'due'))}.`),
        ],
        source,
        links: [{ label: 'Customer invoices', module: 'accounting', page: 'invoices' }],
        followUps: ['Summarise accounts receivable'],
      }
    },
  },
  {
    module: 'accounting', match: /receivables?|\bar\b|ageing|aging|invoices?/,
    answer: ({ data }) => {
      const open = data.invoices.filter(is('Sent', 'Partially paid', 'Overdue'))
      const source = plural(data.invoices.length, 'customer invoice')
      if (!open.length) return { blocks: [p('Nothing is outstanding. Every customer invoice is paid.')], source }
      const age = (r: Row) => daysBetween(str(r, 'due'), TODAY)
      const bucket = (test: (days: number) => boolean) => money(sum(open.filter((r) => test(age(r))), 'balance'))
      const owed = new Map<string, number>()
      for (const r of open) owed.set(str(r, 'customer'), (owed.get(str(r, 'customer')) ?? 0) + num(r, 'balance'))
      const [topName, topValue] = [...owed.entries()].sort((a, b) => b[1] - a[1])[0]
      const topInvoice = open.filter((r) => r.customer === topName).sort(most('balance'))[0]
      return {
        blocks: [
          p(`Accounts receivable is ${money(sum(open, 'balance'))} across ${plural(open.length, 'open customer invoice')}. By age:`),
          list([
            [`Not yet due: ${bucket((d) => d <= 0)}`],
            [`1–30 days overdue: ${bucket((d) => d > 0 && d <= 30)}`],
            [`31–60 days overdue: ${bucket((d) => d > 30 && d <= 60)}`],
            [`Over 60 days: ${bucket((d) => d > 60)}`],
          ]),
          p(`${topName} owes the most, ${money(topValue)}. Their largest open invoice is `, ref('invoices', topInvoice.id), '.'),
        ],
        source,
        links: [{ label: 'Customer invoices', module: 'accounting', page: 'invoices' }, { label: 'Financial reports', module: 'accounting', page: 'reports' }],
        followUps: ['Which invoices are overdue?'],
      }
    },
  },
  {
    module: 'accounting', match: /cash|bank|reconcil|payments?/,
    answer: ({ data }) => {
      const cash = data.ledgerAccounts.find((r) => r.id === '1000')
      const pending = data.payments.filter(is('Pending')).sort(most('amount'))
      const blocks: Block[] = []
      if (cash) blocks.push(p(`Cash at bank is ${money(num(cash, 'balance'))} in the general ledger (account `, ref('ledgerAccounts', cash.id), ').'))
      blocks.push(p(pending.length
        ? `${plural(pending.length, 'payment')} ${isAre(pending.length)} waiting for bank reconciliation, worth ${money(sum(pending, 'amount'))}. The largest:`
        : 'Every payment is reconciled.'))
      if (pending.length) {
        blocks.push(list(pending.slice(0, 3).map((r) => [
          ref('payments', r.id), ` · ${r.direction === 'Received' ? 'from' : 'to'} ${str(r, 'party')}, ${money(num(r, 'amount'))}, ${formatDate(str(r, 'date'))}`,
        ])))
      }
      return { blocks, source: plural(data.payments.length, 'payment'), links: [{ label: 'Payments', module: 'accounting', page: 'payments' }] }
    },
  },
  {
    module: 'crm', match: /opportunit|\bclos(e|es|ing)\b|pipeline|\bdeals?\b|forecast/,
    answer: ({ data }) => {
      const month = TODAY.slice(0, 7)
      const monthName = monthOf(TODAY).split(' ')[0]
      const open = data.opportunities.filter((r) => !['Won', 'Lost'].includes(str(r, 'stage')))
      const closing = open.filter((r) => str(r, 'close').startsWith(month)).sort(most('amount'))
      const source = plural(data.opportunities.length, 'opportunity', 'opportunities')
      const links = [{ label: 'Opportunities', module: 'crm', page: 'opportunities' }]
      if (!closing.length) {
        const next = open.filter((r) => str(r, 'close') > month).sort(earliest('close'))[0]
        return {
          blocks: [p(`No open opportunities close in ${monthName}.`, ...(next ? [' The next is ', ref('opportunities', next.id), `, closing ${formatDate(str(next, 'close'))}.`] : []))],
          source,
          links,
        }
      }
      const weighted = closing.reduce((t, r) => t + (num(r, 'amount') * num(r, 'probability')) / 100, 0)
      return {
        blocks: [
          p(`${plural(closing.length, 'open opportunity', 'open opportunities')} ${closing.length === 1 ? 'closes' : 'close'} in ${monthName}, worth ${money(sum(closing, 'amount'))}, or ${money(weighted)} weighted by probability.`),
          list(closing.slice(0, 3).map((r) => [
            ref('opportunities', r.id), ` · ${str(r, 'name')}, ${str(r, 'account')}, ${money(num(r, 'amount'))} at ${num(r, 'probability')}%, closes ${formatDate(str(r, 'close'))}`,
          ])),
          p(`The whole open pipeline is ${money(sum(open, 'amount'))} across ${plural(open.length, 'opportunity', 'opportunities')}.`),
        ],
        source,
        links,
      }
    },
  },
  {
    module: 'crm', match: /\bleads?\b/,
    answer: ({ data }) => {
      const fresh = data.leads.filter(is('New')).sort(most('score'))
      const qualified = data.leads.filter(is('Qualified')).length
      const source = plural(data.leads.length, 'lead')
      if (!fresh.length) return { blocks: [p(`There are no new leads. ${plural(qualified, 'lead')} ${isAre(qualified)} qualified.`)], source }
      return {
        blocks: [
          p(`${plural(fresh.length, 'lead')} ${isAre(fresh.length)} new and not contacted yet. The highest scores:`),
          list(fresh.slice(0, 3).map((r) => [
            ref('leads', r.id), ` · ${str(r, 'name')} at ${str(r, 'company')}, score ${num(r, 'score')}, from ${str(r, 'source').toLowerCase()}`,
          ])),
          p(`${plural(qualified, 'more lead')} ${isAre(qualified)} qualified and ready to become opportunities.`),
        ],
        source,
        links: [{ label: 'Leads', module: 'crm', page: 'leads' }],
      }
    },
  },
  {
    module: 'sales', match: /quot/,
    answer: ({ data }) => {
      const sent = data.quotations.filter(is('Sent'))
      const source = plural(data.quotations.length, 'quotation')
      if (!sent.length) return { blocks: [p('No quotations are waiting on customers.')], source }
      const expiring = sent.filter((r) => str(r, 'validUntil') >= TODAY && str(r, 'validUntil') <= inDays(7)).sort(earliest('validUntil'))
      const show = expiring.length ? expiring : [...sent].sort(most('amount'))
      return {
        blocks: [
          p(`${plural(sent.length, 'quotation')} ${isAre(sent.length)} with customers, worth ${money(sum(sent, 'amount'))}. ${expiring.length
            ? `${plural(expiring.length, 'quotation')} ${expiring.length === 1 ? 'expires' : 'expire'} in the next 7 days:`
            : 'None expire in the next 7 days. The largest:'}`),
          list(show.slice(0, 3).map((r) => [ref('quotations', r.id), ` · ${str(r, 'customer')}, ${money(num(r, 'amount'))}, valid until ${formatDate(str(r, 'validUntil'))}`])),
        ],
        source,
        links: [{ label: 'Quotations', module: 'sales', page: 'quotations' }],
      }
    },
  },
  {
    module: 'sales', match: /deliver|\bship|\bpick|dispatch|in transit/,
    answer: ({ data }) => {
      const ready = data.deliveries.filter(is('Ready to pick')).sort(earliest('scheduled'))
      const transit = data.deliveries.filter(is('In transit')).length
      const blocks: Block[] = [p(`${plural(ready.length, 'delivery', 'deliveries')} ${isAre(ready.length)} ready to pick and ${transit} ${isAre(transit)} in transit.`)]
      if (ready.length) {
        blocks.push(list(ready.slice(0, 3).map((r) => [
          ref('deliveries', r.id), ` · ${str(r, 'customer')} from ${warehouse(data, str(r, 'warehouse'))}, for `, ref('salesOrders', str(r, 'order')),
          `, scheduled ${formatDate(str(r, 'scheduled'))}`,
        ])))
      }
      return { blocks, source: plural(data.deliveries.length, 'delivery', 'deliveries'), links: [{ label: 'Deliveries', module: 'sales', page: 'deliveries' }] }
    },
  },
  {
    module: 'sales', match: /sales|orders?\b|revenue|\bsell|bookings?/,
    answer: ({ data }) => {
      const open = data.salesOrders.filter(is('Confirmed', 'Processing')).sort(most('amount'))
      const shipped = data.salesOrders.filter(is('Shipped')).length
      const unpaid = data.salesOrders.filter((r) => r.payment === 'Unpaid' && r.status !== 'Cancelled')
      const blocks: Block[] = [
        p(`There ${isAre(open.length)} ${plural(open.length, 'open sales order')} worth ${money(sum(open, 'amount'))}, and ${shipped} more ${shipped === 1 ? 'has' : 'have'} shipped.${open.length ? ' The largest open orders:' : ''}`),
      ]
      if (open.length) {
        blocks.push(list(open.slice(0, 3).map((r) => [
          ref('salesOrders', r.id), ` · ${str(r, 'customer')}, ${money(num(r, 'amount'))}, ${str(r, 'status').toLowerCase()}, ordered ${formatDate(str(r, 'ordered'))}`,
        ])))
      }
      blocks.push(p(`${plural(unpaid.length, 'order')} ${isAre(unpaid.length)} still unpaid, worth ${money(sum(unpaid, 'amount'))}.`))
      return { blocks, source: plural(data.salesOrders.length, 'sales order'), links: [{ label: 'Sales orders', module: 'sales', page: 'orders' }] }
    },
  },
  {
    module: 'forms', match: /submitted today|today.?s (forms|submissions|checks)|forms? today/,
    answer: ({ data }) => {
      const rows = data.submissions.filter((r) => str(r, 'submittedAt').startsWith(TODAY)).sort((a, b) => str(b, 'submittedAt').localeCompare(str(a, 'submittedAt')))
      const failed = rows.filter((r) => r.result === 'Failed')
      if (!rows.length) return { blocks: [p('Nothing has been submitted today yet.')], links: [{ label: 'All forms', module: 'forms', page: 'catalogue' }] }
      return {
        blocks: [
          p(`${plural(rows.length, 'form')} ${rows.length === 1 ? 'was' : 'were'} submitted today${failed.length ? `, ${failed.length} with fails` : ', all passed or completed'}:`),
          list(rows.slice(0, 6).map((r) => [ref('submissions', r.id), ` · ${str(r, 'form')}${str(r, 'context') ? ` for ${str(r, 'context')}` : ''}, ${str(r, 'result').toLowerCase()}, by ${str(r, 'submittedBy')} at ${str(r, 'submittedAt').slice(11)}`])),
        ],
        source: plural(data.submissions.length, 'submission'),
        links: [{ label: 'Submissions', module: 'forms', page: 'submissions' }],
        followUps: ['Which checks failed this week?'],
      }
    },
  },
  {
    module: 'forms', match: /\bfail(ed|s|ures?)?\b|inspection|checklist|submission|\bforms?\b|survey|expense claim/,
    answer: ({ data }) => {
      const { start } = thisWeek()
      const week = data.submissions.filter((r) => str(r, 'submittedAt').slice(0, 10) >= start)
      const failed = week.filter((r) => r.result === 'Failed').sort((a, b) => num(b, 'failed') - num(a, 'failed'))
      if (!failed.length) {
        return {
          blocks: [p(`${plural(week.length, 'form')} ${week.length === 1 ? 'was' : 'were'} submitted this week and none failed a check.`)],
          source: plural(data.submissions.length, 'submission'),
          links: [{ label: 'Submissions', module: 'forms', page: 'submissions' }],
        }
      }
      return {
        blocks: [
          p(`${failed.length} of ${plural(week.length, 'form')} submitted this week failed a check:`),
          list(failed.slice(0, 6).map((r) => [ref('submissions', r.id), ` · ${str(r, 'form')}${str(r, 'context') ? ` for ${str(r, 'context')}` : ''}: ${plural(num(r, 'failed'), 'fail')}, ${formatDate(str(r, 'submittedAt').slice(0, 10))}`])),
          p('Open one to read the notes and photos on each failed check.'),
        ],
        source: plural(data.submissions.length, 'submission'),
        links: [{ label: 'Failed submissions', module: 'forms', page: 'submissions' }, { label: 'All forms', module: 'forms', page: 'catalogue' }],
        followUps: ['What was submitted today?'],
      }
    },
  },
]

// The module a question is about (where its records live), for filtering
// chats by type: "home" for questions across modules, null when no answer
// matches it.
export function topicOf(question: string) {
  const q = question.toLowerCase()
  return INTENTS.find((i) => i.match.test(q))?.module ?? null
}

export function respond(question: string, ctx: Ctx): Answer {
  const q = question.toLowerCase()
  const intent = INTENTS.find((i) => i.match.test(q))
  if (!intent) {
    return {
      blocks: [
        p("I couldn't match that to the records I can read. I answer from the live data in your modules: invoices, orders, stock, approvals, leave and more."),
        p('Try one of these, or name a record type such as customer invoices, purchase orders or leave requests.'),
      ],
      followUps: starterPrompts(ctx.role).slice(0, 3),
    }
  }
  const module = moduleById(intent.module)
  if (module && module.id !== 'home' && !module.roles.includes(ctx.role)) {
    return {
      blocks: [p(`That's in ${module.name}, which the ${ROLE_LABEL[ctx.role]} role can't open, so I can't read those records for you. Ask an administrator to add ${module.name} to your role.`)],
      followUps: starterPrompts(ctx.role).slice(0, 3),
    }
  }
  return intent.answer(ctx)
}
