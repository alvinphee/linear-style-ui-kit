import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowRight01Icon, StarIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { IconMark } from '@/components/mark'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { SearchTrigger } from '@/components/search-trigger'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription } from '@/components/ui/empty'
import { formatMoney } from '@/lib/format'
import { greeting, plural } from '@/lib/text'
import { Briefing, LaunchpadAsk } from './assistant/LaunchpadAi'
import { edition } from './edition'
import { formatDate, TODAY } from './format'
import { MODULES, pageFor } from './modules'
import { go } from './route'
import { useErp } from './store'
import type { EntityId, Role } from './types'
import { ApproveReject, StatusBadge, Worklist, type WorkItem } from './ui'

// The launchpad: the first screen after sign-in. Your modules as tiles with
// live numbers, what needs your approval, what you opened last, and quick
// create. Everything respects the signed-in role. The ERP + AI edition puts
// a prompt box in place of the search box, and the AI briefing under it.

// A worklist row, and the roles that see it.
type Attention = WorkItem & { roles: Role[] }

const QUICK: { entity: EntityId; label: string; roles: Role[] }[] = [
  { entity: 'quotations', label: 'Quotation', roles: ['admin', 'sales', 'finance'] },
  { entity: 'salesOrders', label: 'Sales order', roles: ['admin', 'sales', 'finance'] },
  { entity: 'invoices', label: 'Customer invoice', roles: ['admin', 'finance'] },
  { entity: 'purchaseOrders', label: 'Purchase order', roles: ['admin', 'operations', 'finance'] },
  { entity: 'leads', label: 'Lead', roles: ['admin', 'sales'] },
  { entity: 'items', label: 'Item', roles: ['admin', 'operations'] },
  { entity: 'leave', label: 'Leave request', roles: ['admin', 'hr'] },
]

export default function Launchpad() {
  const { session, company, data, favourites, toggleFavourite, recent, openPeek, startCreate, setPaletteOpen } = useErp()
  const role = session?.role ?? 'admin'
  const modules = MODULES.filter((m) => m.id !== 'home' && m.roles.includes(role))
  const sorted = [...modules].sort((a, b) => Number(favourites.includes(b.id)) - Number(favourites.includes(a.id)))

  // Approvals first (purchase orders, requisitions, leave), then overdue invoices.
  const approvals: Attention[] = [
    ...data.purchaseOrders.filter((r) => r.status === 'Awaiting approval').map((row): Attention => ({
      id: row.id, entity: 'purchaseOrders', title: `${row.id} · ${row.vendor}`, detail: `${formatMoney(Number(row.amount))} · requested by ${row.buyer}`,
      aside: <StatusBadge status={String(row.status)} />, actions: <ApproveReject entity="purchaseOrders" id={row.id} />, roles: ['admin', 'finance'],
    })),
    ...data.requisitions.filter((r) => r.status === 'Awaiting approval').map((row): Attention => ({
      id: row.id, entity: 'requisitions', title: `${row.id} · ${row.item}`, detail: `${row.quantity} units · est. ${formatMoney(Number(row.estimate))}`,
      aside: <StatusBadge status={String(row.status)} />, actions: <ApproveReject entity="requisitions" id={row.id} />, roles: ['admin', 'operations', 'finance'],
    })),
    ...data.leave.filter((r) => r.status === 'Pending').map((row): Attention => ({
      id: row.id, entity: 'leave', title: `${row.employee} · ${row.type}`, detail: `${plural(Number(row.days), 'day')} from ${formatDate(String(row.from))}`,
      aside: <StatusBadge status={String(row.status)} />, actions: <ApproveReject entity="leave" id={row.id} />, roles: ['admin', 'hr'],
    })),
    ...data.invoices.filter((r) => r.status === 'Overdue').map((row): Attention => ({
      id: row.id, entity: 'invoices', title: `${row.id} · ${row.customer}`, detail: `${formatMoney(Number(row.balance))} overdue since ${formatDate(String(row.due))}`,
      aside: <StatusBadge status={String(row.status)} />,
      actions: (
        <Button size="sm" variant="outline" onClick={() => toast.success(`Reminder sent for ${row.id}`, { description: `To ${row.customer}'s accounts team.` })}>
          Send reminder
        </Button>
      ),
      roles: ['admin', 'finance', 'sales'],
    })),
  ].filter((a) => a.roles.includes(role)).slice(0, 7)

  const today = new Date(`${TODAY}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 @2xl:px-6 @2xl:py-8">
      <PageHeader size="lg" title={`${greeting()}, ${session?.name.split(' ')[0]}`} description={`${today} · ${company?.name}`} className="gap-4">
        {edition().assistant
          ? <LaunchpadAsk />
          : <SearchTrigger size="lg" label="Search records, pages and actions" onClick={() => setPaletteOpen(true)} className="max-w-2xl" />}
      </PageHeader>

      {edition().assistant && <Briefing />}

      <section aria-labelledby="lp-modules" className="grid gap-3">
        <div className="flex items-baseline justify-between">
          <h2 id="lp-modules" className="text-sm font-semibold tracking-tight">Your modules</h2>
          <span className="text-muted-foreground text-[11px]">Star a module to keep it first</span>
        </div>
        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {sorted.map((m) => {
            const starred = favourites.includes(m.id)
            return (
              <article key={m.id} className="bg-card hover:border-foreground/15 group relative grid min-w-0 gap-3 rounded-lg border p-3.5 transition-colors">
                <div className="flex items-start gap-3">
                  <IconMark icon={m.icon} colour={m.colour} size="lg" />
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <h3 className="text-[13px] font-semibold">
                      {/* The whole tile is the link; the star sits above it. */}
                      <button type="button" onClick={() => go(m.id, m.pages[0].id)} className="focus-visible:ring-ring/40 rounded text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:ring-2">
                        {m.name}
                      </button>
                    </h3>
                    <p className="text-muted-foreground text-xs">{m.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn('relative z-[1] -mt-1 -mr-1', starred ? 'text-[oklch(0.75_0.15_75)]' : 'text-muted-foreground pointer-fine:opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}
                    aria-label={starred ? `Unstar ${m.name}` : `Star ${m.name}`}
                    aria-pressed={starred}
                    onClick={() => toggleFavourite(m.id)}
                  >
                    <HugeiconsIcon icon={StarIcon} strokeWidth={2} className={cn(starred && '[&_path]:fill-current')} />
                  </Button>
                </div>
                {m.metric && <p className="text-xs tabular-nums">{m.metric(data)}</p>}
                <div className="relative z-[1] flex flex-wrap gap-1">
                  {m.pages.filter((p) => p.id !== 'overview').slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => go(m.id, p.id)}
                      className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/40 h-6 rounded-md border px-2 text-[11px] outline-none focus-visible:ring-2"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          as="section"
          title="Needs your attention"
          action={<span className="text-muted-foreground text-[11px] tabular-nums">{approvals.length}</span>}
          bodyClassName="p-0"
        >
          <Worklist items={approvals} empty="You're all caught up." />
        </Panel>

        <div className="grid min-w-0 content-start gap-3">
          <Panel as="section" title="Create">
            <div className="flex flex-wrap gap-1.5">
              {QUICK.filter((q) => q.roles.includes(role)).map((q) => (
                <Button key={q.entity} variant="outline" size="sm" onClick={() => startCreate(q.entity)}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> {q.label}
                </Button>
              ))}
            </div>
          </Panel>

          <Panel as="section" title="Recently opened" bodyClassName="p-0">
            {recent.length ? (
              <ul className="py-1">
                {recent.map((r) => {
                  const home = pageFor(r.entity)
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (home) go(home.module.id, home.page.id)
                          openPeek(r.entity, r.id)
                        }}
                        className="hover:bg-accent/60 focus-visible:bg-accent flex w-full min-w-0 items-center gap-2.5 px-3.5 py-1.5 text-left text-xs outline-none"
                      >
                        {home && <IconMark icon={home.module.icon} colour={home.module.colour} size="sm" />}
                        <span className="text-muted-foreground shrink-0 font-mono text-[11px]">{r.id}</span>
                        <span className="min-w-0 flex-1 truncate">{r.label}</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <Empty className="px-3.5 py-6">
                <EmptyDescription>Records you open show up here.</EmptyDescription>
              </Empty>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
