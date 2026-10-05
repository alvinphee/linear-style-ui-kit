import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Person } from '@/components/person'
import { StatusBadge as KitStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription } from '@/components/ui/empty'
import { formatMoney, formatNumber } from '@/lib/format'
import { formatDate, toneOf } from './format'
import { useErp } from './store'
import type { Column, EntityId, Value } from './types'

// The ERP's own parts on top of the kit: which status reads as which tone,
// how a cell shows its column's kind, the page padding, and the worklist of
// records that need you. The look is the kit's.

// The kit's page header, padded for an app page:
// <PageHeader className={PAGE_HEADER} … /> (from @/components/page-header).
export const PAGE_HEADER = 'px-4 pt-5 pb-3 @2xl:px-6'

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <KitStatusBadge tone={toneOf(status)} className={className}>{status}</KitStatusBadge>
}

// One cell, formatted by its column's kind.
export function CellValue({ column, value }: { column: Column; value: Value | undefined }) {
  if (value === undefined || value === '') return <span className="text-muted-foreground">—</span>
  switch (column.kind) {
    case 'id':
      return <span className="text-muted-foreground font-mono text-[11.5px] whitespace-nowrap">{String(value)}</span>
    case 'money':
      return <span className="tabular-nums whitespace-nowrap">{formatMoney(Number(value))}</span>
    case 'number':
      return <span className="tabular-nums">{formatNumber(Number(value))}</span>
    case 'percent':
      return <span className="tabular-nums">{Number(value)}%</span>
    case 'date':
      return <span className="whitespace-nowrap">{formatDate(String(value))}</span>
    case 'datetime': {
      const [date, time] = String(value).split(' ')
      return <span className="whitespace-nowrap tabular-nums">{formatDate(date)}, {time}</span>
    }
    case 'status':
      return <StatusBadge status={String(value)} />
    case 'person':
      return <Person name={String(value)} />
    case 'bool':
      return value
        ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-4" aria-label="On" />
        : <span className="text-muted-foreground">Off</span>
    default:
      // Table cells grow to their content, so the cap goes on the text itself.
      return <span className="block max-w-36 truncate @md:max-w-56 @4xl:max-w-72">{String(value)}</span>
  }
}

export const isNumeric = (column: Column) => column.kind === 'money' || column.kind === 'number' || column.kind === 'percent'

/* ---------- Worklist ---------- */

// One record in a worklist: what it is, a status or note beside it, and the
// buttons that deal with it.
export type WorkItem = { id: string; entity: EntityId; title: string; detail: string; aside?: ReactNode; actions?: ReactNode }

// A worklist: records that need you to act, one row each. The title opens
// the record's side panel; the status and the actions wrap under it on a
// narrow card. The launchpad's "Needs your attention" and every module
// overview's list. Put it in a Panel with bodyClassName="p-0".
export function Worklist({ items, empty }: { items: WorkItem[]; empty: ReactNode }) {
  const { openPeek } = useErp()
  if (!items.length) {
    return (
      <Empty className="px-3.5 py-8">
        <EmptyDescription>{empty}</EmptyDescription>
      </Empty>
    )
  }
  return (
    <ul className="divide-y">
      {items.map((it) => (
        <li key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5">
          <button
            type="button"
            onClick={() => openPeek(it.entity, it.id)}
            className="focus-visible:ring-ring/40 grid min-w-0 flex-1 basis-56 gap-0.5 rounded text-left outline-none focus-visible:ring-2"
          >
            <span className="truncate text-xs font-medium">{it.title}</span>
            <span className="text-muted-foreground truncate text-[11px] tabular-nums">{it.detail}</span>
          </button>
          {it.aside}
          {it.actions && <div className="flex shrink-0 items-center gap-1">{it.actions}</div>}
        </li>
      ))}
    </ul>
  )
}

// Reject and Approve for a worklist row: sets the record's status and says so.
export function ApproveReject({ entity, id }: { entity: EntityId; id: string }) {
  const { update } = useErp()
  return (
    <>
      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => {
        update(entity, [id], { status: 'Rejected' })
        toast(`Rejected ${id}`)
      }}>
        Reject
      </Button>
      <Button size="sm" onClick={() => {
        update(entity, [id], { status: 'Approved' })
        toast.success(`Approved ${id}`)
      }}>
        Approve
      </Button>
    </>
  )
}
