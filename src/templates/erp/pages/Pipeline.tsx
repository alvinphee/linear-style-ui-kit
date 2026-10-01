import { useRef, useState, type DragEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Calendar03Icon, KanbanIcon, ListViewIcon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Initials } from '@/pages/sections/StatusSection'
import { ListPage } from '../ListPage'
import { LISTS } from '../modules'
import { useErp } from '../store'
import { TODAY, TONE_DOT, formatDate, formatMoney, formatMoneyShort, toneOf } from '../format'
import type { ListSpec, Row } from '../types'
import { PageHeader } from '../ui'

// CRM › Opportunities: the pipeline as a board, one column per stage, or the
// shared list. Moving an opportunity sets its stage and the stage's probability.

const STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const
type Stage = (typeof STAGES)[number]
type View = 'board' | 'list'

const PROBABILITY: Record<Stage, number> = { Discovery: 20, Proposal: 45, Negotiation: 70, Won: 100, Lost: 0 }

const isOpen = (stage: string) => stage !== 'Won' && stage !== 'Lost'
const total = (rows: Row[]) => rows.reduce((t, r) => t + Number(r.amount), 0)
const weightedValue = (rows: Row[]) => rows.reduce((t, r) => t + (Number(r.amount) * Number(r.probability)) / 100, 0)

// Open stages read soonest close first; closed ones most recent first.
function byClose(stage: Stage) {
  const dir = isOpen(stage) ? 1 : -1
  return (a: Row, b: Row) => String(a.close).localeCompare(String(b.close)) * dir
}

export function OpportunityPipeline() {
  const { data, update, openPeek, startCreate, peek } = useErp()
  const [view, setView] = useState<View>('board')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  // Read synchronously in dragover, before the state update above has rendered.
  const dragRef = useRef<string | null>(null)

  const rows = data.opportunities
  const open = rows.filter((r) => isOpen(String(r.stage)))
  const summary = `${open.length} open · ${formatMoneyShort(total(open))} pipeline · ${formatMoneyShort(weightedValue(open))} weighted`

  function move(id: string, stage: Stage, refocus = false) {
    const row = rows.find((r) => r.id === id)
    if (!row || row.stage === stage) return
    update('opportunities', [id], { stage, probability: PROBABILITY[stage] })
    if (stage === 'Won') {
      toast.success(`${id} won`, { description: `${formatMoney(Number(row.amount), false)} from ${row.account}.` })
    } else {
      toast(`Moved ${id} to ${stage}`, { description: `Probability set to ${PROBABILITY[stage]}%.` })
    }
    // The card remounts in its new column, so keyboard focus follows it there.
    if (refocus) setTimeout(() => document.querySelector<HTMLElement>(`[data-opportunity="${id}"]`)?.focus(), 0)
  }

  function startDrag(e: DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    dragRef.current = id
    // Deferred so the browser takes the drag image before the card fades.
    setTimeout(() => setDraggingId(id), 0)
  }

  function endDrag() {
    dragRef.current = null
    setDraggingId(null)
    setOver(null)
  }

  function dropTarget(stage: Stage) {
    return {
      onDragOver: (e: DragEvent) => {
        if (!dragRef.current) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (over !== stage) setOver(stage)
      },
      onDragLeave: (e: DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setOver((s) => (s === stage ? null : s))
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault()
        const id = dragRef.current ?? e.dataTransfer.getData('text/plain')
        endDrag()
        if (id) move(id, stage)
      },
      'data-over': over === stage,
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Opportunities"
        description={summary}
        actions={
          <>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={view}
              onValueChange={(v) => v && setView(v as View)}
              aria-label="Layout"
            >
              <ToggleGroupItem value="board" className="text-xs">
                <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} data-icon="inline-start" /> Board
              </ToggleGroupItem>
              <ToggleGroupItem value="list" className="text-xs">
                <HugeiconsIcon icon={ListViewIcon} strokeWidth={2} data-icon="inline-start" /> List
              </ToggleGroupItem>
            </ToggleGroup>
            <Button size="sm" onClick={() => startCreate('opportunities')}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New opportunity
            </Button>
          </>
        }
      />

      {view === 'list' ? (
        <div className="flex flex-1 flex-col">
          <ListPage spec={LISTS.opportunities as ListSpec} embedded />
        </div>
      ) : (
        <div className="flex flex-1 gap-3 overflow-x-auto px-4 pb-4 @2xl:px-6">
          {STAGES.map((stage) => {
            const cards = rows.filter((r) => r.stage === stage).sort(byClose(stage))
            return (
              <section
                key={stage}
                aria-label={`${stage}, ${cards.length} ${cards.length === 1 ? 'opportunity' : 'opportunities'}`}
                {...dropTarget(stage)}
                className="bg-subtle data-[over=true]:border-brand/50 data-[over=true]:bg-brand/5 data-[over=true]:ring-brand/20 flex w-60 max-w-80 shrink-0 grow flex-col rounded-lg border p-2 transition-colors data-[over=true]:ring-2"
              >
                <ColumnHeader stage={stage} cards={cards} />
                <ul className="flex flex-1 flex-col gap-2">
                  {cards.length ? (
                    cards.map((row) => (
                      <OpportunityCard
                        key={row.id}
                        row={row}
                        selected={peek?.entity === 'opportunities' && peek.id === row.id}
                        dragging={draggingId === row.id}
                        onOpen={() => openPeek('opportunities', row.id)}
                        onMove={(s) => move(row.id, s, true)}
                        onDragStart={(e) => startDrag(e, row.id)}
                        onDragEnd={endDrag}
                      />
                    ))
                  ) : (
                    <li className="text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed text-xs">
                      {over === stage ? 'Drop here' : 'No opportunities'}
                    </li>
                  )}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ColumnHeader({ stage, cards }: { stage: Stage; cards: Row[] }) {
  const note = isOpen(stage)
    ? `${PROBABILITY[stage]}% probability · ${formatMoneyShort(weightedValue(cards))} weighted`
    : stage === 'Won' ? 'Closed won' : 'Closed lost'
  return (
    <header className="grid gap-0.5 px-1 pb-2">
      <div className="flex h-5 items-center gap-1.5">
        <span className={cn('size-2 shrink-0 rounded-full', TONE_DOT[toneOf(stage)])} />
        <h2 className="truncate text-xs font-medium">{stage}</h2>
        <span className="text-muted-foreground text-xs tabular-nums">{cards.length}</span>
        <span className="ml-auto text-xs font-medium tabular-nums">{formatMoneyShort(total(cards))}</span>
      </div>
      <p className="text-muted-foreground text-[11px] tabular-nums">{note}</p>
    </header>
  )
}

function OpportunityCard({ row, selected, dragging, onOpen, onMove, onDragStart, onDragEnd }: {
  row: Row
  selected: boolean
  dragging: boolean
  onOpen: () => void
  onMove: (stage: Stage) => void
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
}) {
  const stage = String(row.stage) as Stage
  const close = String(row.close ?? '')
  const owner = String(row.owner ?? '')
  const late = isOpen(stage) && close !== '' && close < TODAY

  return (
    <li className="group/card relative">
      {/* The menu button sits beside this element, not inside it, so no button is nested in a button. */}
      <div
        role="button"
        tabIndex={0}
        draggable
        data-opportunity={row.id}
        data-selected={selected}
        data-dragging={dragging}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="bg-card hover:ring-foreground/10 focus-visible:ring-ring/40 data-[selected=true]:border-brand/40 grid cursor-grab gap-1 rounded-md border p-2.5 shadow-xs transition-[box-shadow,opacity] outline-none hover:ring-1 focus-visible:ring-2 active:cursor-grabbing data-[dragging=true]:opacity-40"
      >
        <span className="text-muted-foreground h-4 pr-6 font-mono text-[11px]">{row.id}</span>
        <p className="line-clamp-2 leading-snug font-medium">{String(row.name)}</p>
        <p className="text-muted-foreground truncate text-xs">{String(row.account)}</p>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px]">
          <span className="text-[13px] font-medium tabular-nums">{formatMoney(Number(row.amount), false)}</span>
          <span className="text-muted-foreground tabular-nums">
            {Number(row.probability)}%<span className="sr-only"> probability</span>
          </span>
          {close && (
            <span className={cn('ml-auto inline-flex items-center gap-1 whitespace-nowrap', late ? 'text-destructive' : 'text-muted-foreground')}>
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
              <span className="sr-only">{late ? 'Close date passed:' : 'Closes'}</span>
              {formatDate(close)}
            </span>
          )}
          {owner && (
            <span title={owner} className={cn(!close && 'ml-auto')}>
              <Initials name={owner} className="size-5" />
              <span className="sr-only">Owner: {owner}</span>
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Move ${row.id} to another stage`}
            className="bg-card absolute top-2 right-2 pointer-fine:opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 data-[state=open]:opacity-100"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={onOpen}>Open</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Move to…</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={stage} onValueChange={(s) => onMove(s as Stage)}>
            {STAGES.map((s) => (
              <DropdownMenuRadioItem key={s} value={s}>
                <span className={cn('size-2 shrink-0 rounded-full', TONE_DOT[toneOf(s)])} />
                {s}
                <span className="text-muted-foreground ml-auto tabular-nums">{PROBABILITY[s]}%</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
