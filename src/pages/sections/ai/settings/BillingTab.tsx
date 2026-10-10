import { HugeiconsIcon } from '@hugeicons/react'
import { CreditCardIcon, Download01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { BarList, type BarListItem } from '@/components/bar-list'
import { IconAction } from '@/components/icon-action'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { UsageMeter } from '@/components/usage-meter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadText } from '@/lib/download'
import { formatMoney, formatNumber, formatShortDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { MODELS, USER } from '../data'
import type { ModelId } from '../types'

// Plan and billing: the plan you are on, this month's usage (credits,
// storage, agent runs) and which models used the credits, the plans side by
// side, and past invoices with a receipt to download. Every figure but the
// credits is made up; nothing is charged.

const SEATS = 5
const SEAT_PRICE = 30
const RENEWS = new Date(2026, 9, 1)

// How this month's used credits split between the models.
const SHARE: Record<ModelId, number> = { balanced: 0.48, depth: 0.27, swift: 0.15, 'depth-max': 0.1 }

type Plan = { id: string; name: string; price: string; per?: string; lines: string[]; cta: string }

const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: '$0', lines: ['Swift and Balanced models', '30 chats a day', '1 GB of file storage'], cta: 'Downgrade' },
  {
    id: 'pro', name: 'Pro', price: '$20', per: 'a month',
    lines: ['Every model, Depth Max included', '5× the credits of Free', 'Projects and artifacts', '10 GB of file storage'], cta: 'Switch',
  },
  {
    id: 'team', name: 'Team', price: `$${SEAT_PRICE}`, per: 'a seat a month',
    lines: ['Everything in Pro', 'Shared projects', 'Admin console and usage reports', 'Chats never used for training'], cta: 'Current plan',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'Custom',
    lines: ['Everything in Team', 'Single sign-on (SSO) and SCIM', 'Data retention controls', 'A named support contact'], cta: 'Contact sales',
  },
]
const CURRENT_PLAN = 'team'

type InvoiceStatus = 'Paid' | 'Refunded' | 'Upcoming'
type BillingInvoice = { number: string; date: Date; plan: string; amount: number; status: InvoiceStatus }

const TONE: Record<InvoiceStatus, Tone> = { Paid: 'success', Refunded: 'neutral', Upcoming: 'info' }

const INVOICES: BillingInvoice[] = [
  { number: 'INV-2026-0010', date: RENEWS, plan: `Team, ${SEATS} seats`, amount: SEATS * SEAT_PRICE, status: 'Upcoming' },
  { number: 'INV-2026-0009', date: new Date(2026, 8, 1), plan: `Team, ${SEATS} seats`, amount: SEATS * SEAT_PRICE, status: 'Paid' },
  { number: 'INV-2026-0008', date: new Date(2026, 7, 1), plan: 'Team, 4 seats', amount: 4 * SEAT_PRICE, status: 'Paid' },
  { number: 'INV-2026-0007', date: new Date(2026, 6, 1), plan: 'Pro', amount: 20, status: 'Refunded' },
]

const demo = (title: string) => () => toast(title, { description: 'Demo only. Nothing is charged or changed.' })

function receipt(invoice: BillingInvoice) {
  return [
    `Receipt ${invoice.number}`,
    '',
    `Date:      ${formatShortDate(invoice.date, { year: true })}`,
    `Billed to: ${USER.name} <${USER.email}>`,
    `Plan:      ${invoice.plan}`,
    `Amount:    ${formatMoney(invoice.amount)}`,
    `Status:    ${invoice.status}`,
    '',
    'Made-up receipt from a demo. Nothing was charged.',
    '',
  ].join('\n')
}

export function BillingTab({ credits }: { credits: number }) {
  const used = Math.min(100, Math.max(0, credits))
  const resets = formatShortDate(RENEWS)

  const byModel: BarListItem[] = used === 0 ? [] : MODELS
    .map((m) => {
      const value = used * SHARE[m.id]
      return {
        id: m.id,
        label: m.name,
        hint: plural(Math.round(value / m.cost), 'reply', 'replies'),
        value,
        display: `${value.toFixed(1)}%`,
        start: <HugeiconsIcon icon={m.icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />,
      }
    })
    .sort((a, b) => b.value - a.value)

  return (
    <>
      <SettingsHeader title="Billing and usage" description="Your plan, what you have used this month, and past invoices." />

      <SettingsGroup>
        <div className="flex flex-wrap items-start justify-between gap-3 p-3">
          <div className="grid min-w-0 gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Team plan</span>
              <Badge variant="secondary">Monthly</Badge>
            </div>
            <p className="text-muted-foreground text-xs tabular-nums">
              {formatMoney(SEATS * SEAT_PRICE, false)} a month · {SEATS} seats at {formatMoney(SEAT_PRICE, false)}
            </p>
            <p className="text-muted-foreground text-[11px]">Renews on {formatShortDate(RENEWS, { year: true })}</p>
          </div>
          <Button size="sm" onClick={demo('Change plan')}>Change plan</Button>
        </div>
        <SettingsRow
          label={
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="text-muted-foreground size-3.5" />
              Card ending 4242
            </span>
          }
          hint="Expires 08/2028. Invoices go to your email."
        >
          <Button variant="outline" size="sm" onClick={demo('Manage payment method')}>Manage payment method</Button>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Usage this month" description={`Credits and agent runs reset on ${resets}.`}>
        <div className="grid gap-4 p-3">
          <UsageMeter
            size="md"
            value={used}
            label="Monthly credits"
            count={`${Math.round(used)}% used`}
            note={used >= 100 ? 'Out of credits until they reset' : `${Math.round(100 - used)}% left`}
            noteEnd={`Resets on ${resets}`}
            warnAt={75}
            dangerAt={90}
          />
          <UsageMeter size="md" value={34} label="Storage" count="3.4 / 10 GB" note="Files, project knowledge and artifacts" />
          <UsageMeter size="md" value={28.4} label="Agent runs" count={`${formatNumber(142)} / ${formatNumber(500)}`} note="Tasks the agent carried out for you" />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Usage by model" description="How much of the monthly credits each model has used.">
        <BarList items={byModel} className="p-3" empty="No credits used yet this month." />
      </SettingsGroup>

      <SettingsGroup title="Compare plans" className="@container">
        <ul className="grid grid-cols-1 gap-2 p-3 @md:grid-cols-2">
          {PLANS.map((plan) => {
            const current = plan.id === CURRENT_PLAN
            return (
              <li
                key={plan.id}
                aria-current={current || undefined}
                className={cn('flex min-w-0 flex-col gap-2 rounded-lg border p-3', current && 'border-primary/50 bg-accent/40')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{plan.name}</span>
                  {current && <Badge>Current</Badge>}
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="text-base font-medium tabular-nums">{plan.price}</span>
                  {plan.per && <span className="text-muted-foreground text-[11px]">{plan.per}</span>}
                </p>
                <ul className="grid flex-1 gap-1">
                  {plan.lines.map((line) => (
                    <li key={line} className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-4">
                      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-foreground mt-px size-3 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={current ? 'secondary' : 'outline'}
                  size="sm"
                  disabled={current}
                  className="mt-1"
                  aria-label={current ? undefined : `${plan.cta}: ${plan.name}`}
                  onClick={demo(plan.id === 'enterprise' ? 'Contact sales' : `Switch to ${plan.name}`)}
                >
                  {plan.cta}
                </Button>
              </li>
            )
          })}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="Invoices" className="@container">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent [&>th]:text-muted-foreground [&>th]:h-8 [&>th]:text-[11px]">
              <TableHead className="pl-3">Date</TableHead>
              <TableHead className="hidden @md:table-cell">Number</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-0 pr-3"><span className="sr-only">Receipt</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map((invoice) => (
              <TableRow key={invoice.number}>
                <TableCell className="pl-3 tabular-nums">
                  <span className="block">{formatShortDate(invoice.date, { year: true })}</span>
                  <span className="text-muted-foreground block text-[11px] @md:hidden">{invoice.number}</span>
                </TableCell>
                <TableCell className="text-muted-foreground hidden tabular-nums @md:table-cell">{invoice.number}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(invoice.amount)}</TableCell>
                <TableCell><StatusBadge tone={TONE[invoice.status]}>{invoice.status}</StatusBadge></TableCell>
                <TableCell className="pr-3">
                  {invoice.status === 'Upcoming' ? (
                    <span className="block size-7" aria-hidden />
                  ) : (
                    <IconAction
                      label={`Download receipt ${invoice.number}`}
                      icon={Download01Icon}
                      onClick={() => {
                        downloadText(`receipt-${invoice.number}.txt`, receipt(invoice))
                        toast('Receipt downloaded', { description: `receipt-${invoice.number}.txt` })
                      }}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsGroup>
    </>
  )
}
