import { differenceInCalendarDays, parseISO } from 'date-fns'
import { formatMoney, formatShortDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { CUSTOMERS } from '../../data'
import { now } from './data'
import { mdTable } from './scenario-helpers'
import { Builder, type AgentContext, type BuilderContext } from './script'
import type { Invoice, ReminderRequest } from './types'

// Scenario: send payment reminders for overdue invoices (needs approval).
// The invoices are made up and fixed; the workspace only remembers which
// ones already got a reminder, so nobody is chased twice.

const INVOICES: Invoice[] = [
  { id: 'INV-2026-0398', customer: 'Tanjong Paints', contact: 'accounts@tanjongpaints.example', amount: 4_860, due: '2026-09-02' },
  { id: 'INV-2026-0409', customer: 'Bayview Foods', contact: 'billing@bayviewfoods.example', amount: 2_340, due: '2026-09-09' },
  { id: 'INV-2026-0415', customer: 'Lumen Electronics', contact: 'ap@lumen.example', amount: 7_125, due: '2026-09-15' },
  { id: 'INV-2026-0427', customer: 'Redhill Printing', contact: 'finance@redhillprinting.example', amount: 1_980, due: '2026-10-07' },
  { id: 'INV-2026-0433', customer: 'Orchid Pharma', contact: 'payables@orchidpharma.example', amount: 12_400, due: '2026-10-14' },
]

const daysLate = (invoice: Invoice) => differenceInCalendarDays(now(), parseISO(invoice.due))
const dueLabel = (invoice: Invoice) => formatShortDate(parseISO(invoice.due))

export function reminders(b: Builder, ctx: AgentContext) {
  const p = ctx.prompt.toLowerCase()
  const customer = CUSTOMERS.find((c) => p.includes(c.toLowerCase()))
  const overdue = INVOICES.filter((i) => daysLate(i) > 0 && (!customer || i.customer === customer))
  const toSend = overdue.filter((i) => !ctx.reminded.includes(i.id))
  const skipped = overdue.length - toSend.length

  b.think([
    'They want to chase unpaid invoices.',
    'I will find the overdue ones first, then ask before I email anyone, because a sent email cannot be taken back.',
  ], [
    'Invoices that already got a reminder can be left out, so nobody is chased twice.',
  ])
  b.plan(['Find the overdue invoices', 'Ask for approval', 'Send the reminders'])
  b.step(0, 'running')
  b.tool('search_invoices', { status: 'Overdue', ...(customer && { customer }) }, {
    output: overdue.map((i) => ({
      id: i.id, customer: i.customer, amount: i.amount, due: i.due,
      status: ctx.reminded.includes(i.id) ? 'Reminder sent' : 'Overdue',
    })),
    summary: plural(overdue.length, 'invoice'),
  }, 'Searching invoices…')
  b.step(0, 'done')

  if (!toSend.length) {
    b.step(1, 'done')
    b.step(2, 'done')
    b.say(overdue.length
      ? `Nothing to send: ${overdue.length === 1 ? `**${overdue[0].id}** already got` : `all ${overdue.length} overdue invoices already got`} a reminder.`
      : `No overdue invoices${customer ? ` for ${customer}` : ''}, so there is nobody to chase.`)
    b.followUps(['Summarise the urgent jobs', 'Compare driver workload'])
    return
  }

  b.step(1, 'running')
  const total = toSend.reduce((n, i) => n + i.amount, 0)
  const left = skipped ? ` I left out ${plural(skipped, 'invoice')} that already got a reminder.` : ''
  b.say([
    `I found **${plural(toSend.length, 'overdue invoice')}**, ${formatMoney(total, false)} in total.${left}`, '',
    mdTable(['Invoice', 'Customer', 'Amount', 'Due', 'Late'], toSend.map((i) => [
      i.id, i.customer, formatMoney(i.amount, false), dueLabel(i), plural(daysLate(i), 'day'),
    ])), '',
    'Please check the reminders below before I send them.',
  ].join('\n'))
  b.approval({
    kind: 'reminders',
    title: toSend.length === 1 ? 'Send a payment reminder?' : 'Send payment reminders?',
    summary: `${plural(toSend.length, 'overdue invoice')}. Each billing contact gets one short email.`,
    invoices: toSend,
  })
}

export function continueReminders(request: ReminderRequest, decision: 'approved' | 'denied', ctx: BuilderContext) {
  const b = new Builder(ctx, 350)
  const n = request.invoices.length
  if (decision === 'approved') {
    b.step(1, 'done')
    b.step(2, 'running')
    b.tool('send_reminders', { id: request.invoices.map((i) => i.id) }, {
      output: { sent: n, emails: request.invoices.map((i) => ({ invoice: i.id, to: i.contact })) },
      summary: `${n} sent`,
    }, `Sending ${plural(n, 'reminder')}…`)
    b.step(2, 'done')
    b.say([
      `Done. I sent **${plural(n, 'payment reminder')}**:`, '',
      ...request.invoices.map((i) => `- **${i.id}** ${i.customer}, ${formatMoney(i.amount, false)}: sent to ${i.contact}`), '',
      'If you ask again, I will leave these out so nobody is chased twice.',
    ].join('\n'))
    b.followUps(['Summarise the urgent jobs', 'Compare driver workload'])
  } else {
    b.step(1, 'failed')
    const first = request.invoices[0].customer
    b.say([
      'Okay, I did not send anything.', '',
      `To chase just one customer, say for example “Send a payment reminder to ${first}”.`,
    ].join('\n'))
    b.followUps([`Send a payment reminder to ${first}`, 'Summarise the urgent jobs'])
  }
  return b.events
}
