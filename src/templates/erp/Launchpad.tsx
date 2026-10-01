import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowRight01Icon, Search01Icon, StarIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { formatDate, formatMoney, TODAY } from './format'
import { MODULES, pageFor } from './modules'
import { go } from './route'
import { useErp } from './store'
import type { EntityId, Role, Row } from './types'
import { MOD, ModuleMark, StatusBadge } from './ui'

// The launchpad: the first screen after sign-in. Your modules as tiles with
// live numbers, what needs your approval, what you opened last, and quick
// create. Everything respects the signed-in role.

type Approval = { entity: EntityId; row: Row; title: string; detail: string; approve: Record<string, string>; reject?: Record<string, string>; roles: Role[] }

const QUICK: { entity: EntityId; label: string; roles: Role[] }[] = [
  { entity: 'quotations', label: 'Quotation', roles: ['admin', 'sales', 'finance'] },
  { entity: 'salesOrders', label: 'Sales order', roles: ['admin', 'sales', 'finance'] },
  { entity: 'invoices', label: 'Customer invoice', roles: ['admin', 'finance'] },
  { entity: 'purchaseOrders', label: 'Purchase order', roles: ['admin', 'operations', 'finance'] },
  { entity: 'leads', label: 'Lead', roles: ['admin', 'sales'] },
  { entity: 'items', label: 'Item', roles: ['admin', 'operations'] },
  { entity: 'leave', label: 'Leave request', roles: ['admin', 'hr'] },
]

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Launchpad() {
  const { session, company, data, favourites, toggleFavourite, recent, openPeek, update, startCreate, setPaletteOpen } = useErp()
  const role = session?.role ?? 'admin'
  const modules = MODULES.filter((m) => m.id !== 'home' && m.roles.includes(role))
  const sorted = [...modules].sort((a, b) => Number(favourites.includes(b.id)) - Number(favourites.includes(a.id)))

  const approvals: Approval[] = [
    ...data.purchaseOrders.filter((r) => r.status === 'Awaiting approval').map((row) => ({
      entity: 'purchaseOrders' as EntityId, row, title: `${row.id} · ${row.vendor}`, detail: `${formatMoney(Number(row.amount))} · requested by ${row.buyer}`,
      approve: { status: 'Approved' }, reject: { status: 'Rejected' }, roles: ['admin', 'finance'] as Role[],
    })),
    ...data.requisitions.filter((r) => r.status === 'Awaiting approval').map((row) => ({
      entity: 'requisitions' as EntityId, row, title: `${row.id} · ${row.item}`, detail: `${row.quantity} units · est. ${formatMoney(Number(row.estimate))}`,
      approve: { status: 'Approved' }, reject: { status: 'Rejected' }, roles: ['admin', 'operations', 'finance'] as Role[],
    })),
    ...data.leave.filter((r) => r.status === 'Pending').map((row) => ({
      entity: 'leave' as EntityId, row, title: `${row.employee} · ${row.type}`, detail: `${row.days} ${Number(row.days) === 1 ? 'day' : 'days'} from ${formatDate(String(row.from))}`,
      approve: { status: 'Approved' }, reject: { status: 'Rejected' }, roles: ['admin', 'hr'] as Role[],
    })),
    ...data.invoices.filter((r) => r.status === 'Overdue').map((row) => ({
      entity: 'invoices' as EntityId, row, title: `${row.id} · ${row.customer}`, detail: `${formatMoney(Number(row.balance))} overdue since ${formatDate(String(row.due))}`,
      approve: {}, roles: ['admin', 'finance', 'sales'] as Role[],
    })),
  ].filter((a) => a.roles.includes(role)).slice(0, 7)

  const today = new Date(`${TODAY}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 @2xl:px-6 @2xl:py-8">
      <header className="grid gap-4">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{greeting()}, {session?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm">{today} · {company?.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="bg-card text-muted-foreground hover:border-foreground/15 focus-visible:ring-ring/40 flex h-10 w-full max-w-2xl items-center gap-2.5 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
        >
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4" />
          Search records, pages and actions
          <KbdGroup className="ml-auto"><Kbd>{MOD}</Kbd><Kbd>K</Kbd></KbdGroup>
        </button>
      </header>

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
                  <ModuleMark icon={m.icon} colour={m.colour} size="lg" />
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
        <section aria-labelledby="lp-attention" className="bg-card min-w-0 rounded-lg border">
          <header className="flex items-center justify-between border-b px-3.5 py-2.5">
            <h2 id="lp-attention" className="text-xs font-medium">Needs your attention</h2>
            <span className="text-muted-foreground text-[11px] tabular-nums">{approvals.length}</span>
          </header>
          {approvals.length ? (
            <ul className="divide-y">
              {approvals.map((a) => {
                const status = String(a.row.status)
                return (
                  <li key={a.row.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5">
                    <button type="button" onClick={() => openPeek(a.entity, a.row.id)} className="focus-visible:ring-ring/40 grid min-w-0 flex-1 gap-0.5 rounded text-left outline-none focus-visible:ring-2">
                      <span className="truncate text-xs font-medium">{a.title}</span>
                      <span className="text-muted-foreground truncate text-[11px]">{a.detail}</span>
                    </button>
                    <StatusBadge status={status} />
                    <div className="flex gap-1">
                      {a.entity === 'invoices' ? (
                        <Button size="sm" variant="outline" onClick={() => toast.success(`Reminder sent for ${a.row.id}`, { description: `To ${a.row.customer}'s accounts team.` })}>
                          Send reminder
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => {
                            update(a.entity, [a.row.id], a.reject ?? {})
                            toast(`Rejected ${a.row.id}`)
                          }}>
                            Reject
                          </Button>
                          <Button size="sm" onClick={() => {
                            update(a.entity, [a.row.id], a.approve)
                            toast.success(`Approved ${a.row.id}`)
                          }}>
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground px-3.5 py-8 text-center text-xs">You're all caught up.</p>
          )}
        </section>

        <div className="grid min-w-0 content-start gap-3">
          <section aria-labelledby="lp-create" className="bg-card rounded-lg border">
            <header className="border-b px-3.5 py-2.5">
              <h2 id="lp-create" className="text-xs font-medium">Create</h2>
            </header>
            <div className="flex flex-wrap gap-1.5 p-3.5">
              {QUICK.filter((q) => q.roles.includes(role)).map((q) => (
                <Button key={q.entity} variant="outline" size="sm" onClick={() => startCreate(q.entity)}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> {q.label}
                </Button>
              ))}
            </div>
          </section>

          <section aria-labelledby="lp-recent" className="bg-card rounded-lg border">
            <header className="border-b px-3.5 py-2.5">
              <h2 id="lp-recent" className="text-xs font-medium">Recently opened</h2>
            </header>
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
                        {home && <ModuleMark icon={home.module.icon} colour={home.module.colour} size="sm" />}
                        <span className="text-muted-foreground shrink-0 font-mono text-[11px]">{r.id}</span>
                        <span className="min-w-0 flex-1 truncate">{r.label}</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground px-3.5 py-6 text-center text-xs">Records you open show up here.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
