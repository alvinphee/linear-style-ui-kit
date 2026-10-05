import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Calendar03Icon, KanbanIcon, ListViewIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { KanbanBoard, KanbanCard, KanbanCardMenu, type KanbanCardState, type KanbanColumn } from '@/blocks/kanban-board'
import { PageHeader } from '@/components/page-header'
import { UserAvatar } from '@/components/person'
import { TONE_DOT } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { ViewSwitch, type ViewOption } from '@/components/view-switch'
import { formatMoney } from '@/lib/format'
import { ListPage } from '../ListPage'
import { LISTS } from '../modules'
import { useErp } from '../store'
import { TODAY, formatDate, formatMoneyShort, toneOf } from '../format'
import type { ListSpec, Row } from '../types'
import { PAGE_HEADER } from '../ui'

// CRM › Opportunities: the pipeline as a board, one column per stage (the
// shared Kanban block), or the shared list. Moving an opportunity sets its
// stage and the stage's probability.

const STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const
type Stage = (typeof STAGES)[number]
type View = 'board' | 'list'

const VIEWS: ViewOption<View>[] = [
  { value: 'board', label: 'Board', icon: KanbanIcon },
  { value: 'list', label: 'List', icon: ListViewIcon },
]

const PROBABILITY: Record<Stage, number> = { Discovery: 20, Proposal: 45, Negotiation: 70, Won: 100, Lost: 0 }

const isOpen = (stage: string) => stage !== 'Won' && stage !== 'Lost'
const total = (rows: Row[]) => rows.reduce((t, r) => t + Number(r.amount), 0)
const weightedValue = (rows: Row[]) => rows.reduce((t, r) => t + (Number(r.amount) * Number(r.probability)) / 100, 0)

// The stages as the "Move to…" menu lists them: a dot in the stage's tone, and its probability.
const STAGE_COLUMNS: KanbanColumn<Stage>[] = STAGES.map((stage) => ({
  id: stage,
  title: stage,
  visual: <span className={cn('size-2 shrink-0 rounded-full', TONE_DOT[toneOf(stage)])} />,
  hint: `${PROBABILITY[stage]}%`,
}))

// Open stages read soonest close first; closed ones most recent first.
function byClose(stage: Stage) {
  const dir = isOpen(stage) ? 1 : -1
  return (a: Row, b: Row) => String(a.close).localeCompare(String(b.close)) * dir
}

function stageNote(stage: Stage, cards: Row[]) {
  if (isOpen(stage)) return `${PROBABILITY[stage]}% probability · ${formatMoneyShort(weightedValue(cards))} weighted`
  return stage === 'Won' ? 'Closed won' : 'Closed lost'
}

export function OpportunityPipeline() {
  const { data, update, openPeek, startCreate, peek } = useErp()
  const [view, setView] = useState<View>('board')

  const rows = data.opportunities
  const open = rows.filter((r) => isOpen(String(r.stage)))
  const summary = `${open.length} open · ${formatMoneyShort(total(open))} pipeline · ${formatMoneyShort(weightedValue(open))} weighted`
  const inStage = (stage: Stage) => rows.filter((r) => r.stage === stage)
  const columns = STAGE_COLUMNS.map((column) => {
    const cards = inStage(column.id)
    return { ...column, extra: formatMoneyShort(total(cards)), description: stageNote(column.id, cards) }
  })
  const items = STAGES.flatMap((stage) => inStage(stage).sort(byClose(stage)))

  function move(id: string, stage: Stage) {
    const row = rows.find((r) => r.id === id)
    if (!row || row.stage === stage) return
    update('opportunities', [id], { stage, probability: PROBABILITY[stage] })
    if (stage === 'Won') {
      toast.success(`${id} won`, { description: `${formatMoney(Number(row.amount), false)} from ${row.account}.` })
    } else {
      toast(`Moved ${id} to ${stage}`, { description: `Probability set to ${PROBABILITY[stage]}%.` })
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        className={PAGE_HEADER}
        title="Opportunities"
        description={summary}
        actions={
          <>
            <ViewSwitch views={VIEWS} value={view} onChange={setView} showLabels label="Layout" />
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
        <KanbanBoard
          className="flex-1 px-4 pt-0 pb-4 @2xl:px-6"
          columnClassName="w-60 max-w-80 grow"
          columns={columns}
          items={items}
          columnOf={(row) => String(row.stage) as Stage}
          onMove={move}
          itemName={{ one: 'opportunity', other: 'opportunities' }}
          renderCard={(row, card) => (
            <OpportunityCard
              row={row}
              card={card}
              selected={peek?.entity === 'opportunities' && peek.id === row.id}
              onOpen={() => openPeek('opportunities', row.id)}
            />
          )}
        />
      )}
    </div>
  )
}

function OpportunityCard({ row, card, selected, onOpen }: {
  row: Row
  card: KanbanCardState<Stage>
  selected: boolean
  onOpen: () => void
}) {
  const stage = String(row.stage) as Stage
  const close = String(row.close ?? '')
  const owner = String(row.owner ?? '')
  const late = isOpen(stage) && close !== '' && close < TODAY

  return (
    <KanbanCard
      card={card}
      onOpen={onOpen}
      selected={selected}
      className="gap-1"
      menu={
        <KanbanCardMenu label={`Move ${row.id} to another stage`} columns={STAGE_COLUMNS} value={stage} onMove={card.moveTo} className="bg-card">
          <DropdownMenuItem onSelect={onOpen}>Open</DropdownMenuItem>
        </KanbanCardMenu>
      }
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
            <UserAvatar name={owner} className="size-5" />
            <span className="sr-only">Owner: {owner}</span>
          </span>
        )}
      </div>
    </KanbanCard>
  )
}
