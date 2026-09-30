import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Building03Icon, Cancel01Icon, Tick02Icon, UserGroupIcon, UserIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Panel, Section } from './shared'

type Billing = 'monthly' | 'yearly'

type Plan = {
  id: string
  name: string
  icon: IconSvgElement
  description: string
  // null is "Custom": priced by sales, not shown.
  price: Record<Billing, number> | null
  unit: string
  note: (billing: Billing) => string
  cta: string
  popular?: boolean
  features: { label: string; included: boolean }[]
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    icon: UserIcon,
    description: 'For individuals and small side projects.',
    price: { monthly: 0, yearly: 0 },
    unit: 'forever',
    note: () => 'No card needed',
    cta: 'Get started',
    features: [
      { label: 'Up to 3 members', included: true },
      { label: '250 issues', included: true },
      { label: 'Basic integrations', included: true },
      { label: 'Cycles and roadmaps', included: false },
      { label: 'Guest access', included: false },
      { label: 'Admin roles', included: false },
      { label: 'SAML single sign-on', included: false },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    icon: UserGroupIcon,
    description: 'For growing teams that ship every week.',
    price: { monthly: 10, yearly: 8 },
    unit: 'per member / month',
    note: (b) => (b === 'yearly' ? 'Billed yearly as $96 per member' : 'Billed monthly, cancel any time'),
    cta: 'Start 14-day trial',
    popular: true,
    features: [
      { label: 'Unlimited members', included: true },
      { label: 'Unlimited issues', included: true },
      { label: 'All integrations', included: true },
      { label: 'Cycles and roadmaps', included: true },
      { label: 'Guest access', included: true },
      { label: 'Admin roles', included: true },
      { label: 'SAML single sign-on', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building03Icon,
    description: 'For large organisations with security reviews.',
    price: null,
    unit: '',
    note: () => 'Volume pricing from 50 seats',
    cta: 'Contact sales',
    features: [
      { label: 'Unlimited members', included: true },
      { label: 'Unlimited issues', included: true },
      { label: 'All integrations', included: true },
      { label: 'Cycles and roadmaps', included: true },
      { label: 'Guest access', included: true },
      { label: 'Admin roles', included: true },
      { label: 'SAML single sign-on', included: true },
    ],
  },
]

type Cell = boolean | string
const COMPARE: { group: string; rows: { label: string; values: [Cell, Cell, Cell] }[] }[] = [
  {
    group: 'Usage',
    rows: [
      { label: 'Members', values: ['Up to 3', 'Unlimited', 'Unlimited'] },
      { label: 'Issues', values: ['250', 'Unlimited', 'Unlimited'] },
      { label: 'File uploads', values: ['10 MB each', '250 MB each', 'Unlimited'] },
      { label: 'Activity history', values: ['30 days', 'Unlimited', 'Unlimited'] },
    ],
  },
  {
    group: 'Planning',
    rows: [
      { label: 'Custom views', values: [true, true, true] },
      { label: 'Cycles', values: [false, true, true] },
      { label: 'Roadmaps', values: [false, true, true] },
      { label: 'Insights and charts', values: [false, true, true] },
    ],
  },
  {
    group: 'Security',
    rows: [
      { label: 'Two-factor sign-in', values: [true, true, true] },
      { label: 'Admin roles', values: [false, true, true] },
      { label: 'SAML single sign-on', values: [false, false, true] },
      { label: 'Audit log', values: [false, false, true] },
    ],
  },
  {
    group: 'Support',
    rows: [
      { label: 'Help centre and community', values: [true, true, true] },
      { label: 'Email support', values: [false, true, true] },
      { label: 'Uptime SLA', values: [false, false, '99.9%'] },
      { label: 'Dedicated success manager', values: [false, false, true] },
    ],
  },
]

const FAQ = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes. Upgrades apply straight away and the difference is prorated. Downgrades apply at the end of the billing period.',
  },
  {
    q: 'How does yearly billing work?',
    a: 'You pay for twelve months up front and save 20% compared with paying monthly. Members added during the year are prorated.',
  },
  {
    q: 'What counts as a member?',
    a: 'Anyone who can create or edit issues. Guests who only view and comment are free on the Team plan.',
  },
  {
    q: 'Is there a free trial of Team?',
    a: 'Team comes with a 14-day trial. No card is needed, and the workspace moves back to Free if you do not upgrade.',
  },
  {
    q: 'Do you offer discounts?',
    a: 'Non-profits and schools get 50% off Team. Contact sales with proof of status.',
  },
  {
    q: 'How can I pay?',
    a: 'By card on every plan. Enterprise can also pay by invoice.',
  },
]

const demo = () => toast('Demo only', { description: 'Nothing was bought or sent.' })

function headerPrice(plan: Plan, billing: Billing) {
  if (!plan.price) return 'Custom'
  const price = plan.price[billing]
  return price ? `$${price} / member` : '$0'
}

export default function PricingSection() {
  const [billing, setBilling] = useState<Billing>('monthly')

  return (
    <Section id="pricing" title="Pricing" description="Plans with a monthly and yearly switch">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={billing}
            onValueChange={(v) => v && setBilling(v as Billing)}
            aria-label="Billing period"
          >
            <ToggleGroupItem value="monthly" className="px-3">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="yearly" className="px-3">Yearly</ToggleGroupItem>
          </ToggleGroup>
          <Badge variant="outline" className="border-brand/30 bg-brand/10 text-brand dark:bg-brand/10">Save 20%</Badge>
        </div>
        <p className="text-muted-foreground text-[11px]">Prices in USD. Taxes may apply.</p>
        <p aria-live="polite" className="sr-only">
          {billing === 'yearly' ? 'Showing yearly prices, 20% off.' : 'Showing monthly prices.'}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3 lg:col-span-2">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billing={billing} />
        ))}
      </div>

      <Panel title="Compare plans" note="Scrolls sideways on small screens" wide className="min-w-0">
        <Table className="min-w-[560px] table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-card text-muted-foreground sticky left-0 z-10 w-[34%] font-normal">Feature</TableHead>
              {PLANS.map((plan) => (
                <TableHead
                  key={plan.id}
                  className={cn('h-auto py-2 text-center', plan.popular && 'bg-brand/5')}
                >
                  <span className="block">{plan.name}</span>
                  <span className="text-muted-foreground block text-[11px] font-normal tabular-nums">
                    {headerPrice(plan, billing)}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {COMPARE.map((group) => (
            <TableBody key={group.group}>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-t">
                <TableHead scope="rowgroup" colSpan={4} className="text-muted-foreground h-7 text-[11px]">
                  {group.group}
                </TableHead>
              </TableRow>
              {group.rows.map((row) => (
                <TableRow key={row.label} className="hover:bg-transparent">
                  <TableHead scope="row" className="bg-card sticky left-0 z-10 h-auto py-2 font-normal whitespace-normal">
                    {row.label}
                  </TableHead>
                  {row.values.map((value, i) => (
                    <TableCell key={PLANS[i].id} className={cn('text-center', PLANS[i].popular && 'bg-brand/5')}>
                      <CellValue value={value} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          ))}
        </Table>
      </Panel>

      <Panel title="Questions" note="Accordion" wide>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[FAQ.slice(0, 3), FAQ.slice(3)].map((column, c) => (
            <Accordion key={c} type="single" collapsible defaultValue={c === 0 ? 'q0' : undefined}>
              {column.map((item, i) => (
                <AccordionItem key={item.q} value={`q${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ))}
        </div>
      </Panel>
    </Section>
  )
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const price = plan.price?.[billing]
  const was = billing === 'yearly' && plan.price && plan.price.monthly > plan.price.yearly ? plan.price.monthly : null

  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        'bg-card flex min-w-0 flex-col gap-4 rounded-lg border p-4',
        plan.popular && 'border-brand/60 ring-brand/15 ring-[3px]',
      )}
    >
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md">
            <HugeiconsIcon icon={plan.icon} strokeWidth={2} className="size-3.5" />
          </span>
          <h3 id={`plan-${plan.id}`} className="text-sm font-semibold tracking-tight">{plan.name}</h3>
          {plan.popular && (
            <Badge variant="outline" className="border-brand/30 bg-brand/10 text-brand dark:bg-brand/10 ml-auto">
              Most popular
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{plan.description}</p>
      </div>

      <div className="grid gap-0.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          {price === undefined ? (
            <span className="text-3xl font-semibold tracking-tight">Custom</span>
          ) : (
            <>
              {/* Keyed on the price, so a new price re-mounts and plays the entrance. */}
              <span
                key={price}
                className="animate-in fade-in-0 slide-in-from-bottom-1 inline-block text-3xl font-semibold tracking-tight tabular-nums duration-300 motion-reduce:animate-none"
              >
                ${price}
              </span>
              {was !== null && (
                <span className="text-muted-foreground text-sm tabular-nums line-through">
                  <span className="sr-only">was </span>${was}
                </span>
              )}
              <span className="text-muted-foreground text-xs">{plan.unit}</span>
            </>
          )}
        </div>
        <p className="text-muted-foreground text-[11px]">{plan.note(billing)}</p>
      </div>

      <Button variant={plan.popular ? 'default' : 'outline'} className="w-full" onClick={demo}>
        {plan.cta}
      </Button>

      <ul className="grid gap-2 border-t pt-4 text-xs">
        {plan.features.map((f) => (
          <li key={f.label} className={cn('flex items-center gap-2', !f.included && 'text-muted-foreground')}>
            <HugeiconsIcon
              icon={f.included ? Tick02Icon : Cancel01Icon}
              strokeWidth={2}
              aria-hidden
              className={cn('size-3.5 shrink-0', f.included ? 'text-foreground' : 'text-muted-foreground/60')}
            />
            <span className="sr-only">{f.included ? 'Included: ' : 'Not included: '}</span>
            {f.label}
          </li>
        ))}
      </ul>
    </article>
  )
}

function CellValue({ value }: { value: Cell }) {
  if (typeof value === 'string') return <span className="tabular-nums">{value}</span>
  return (
    <>
      <HugeiconsIcon
        icon={value ? Tick02Icon : Cancel01Icon}
        strokeWidth={2}
        aria-hidden
        className={cn('inline-block size-3.5', value ? 'text-foreground' : 'text-muted-foreground/50')}
      />
      <span className="sr-only">{value ? 'Included' : 'Not included'}</span>
    </>
  )
}
