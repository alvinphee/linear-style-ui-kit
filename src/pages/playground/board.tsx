import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { LabelChip } from '@/components/label-dot'
import { NoAssignee, UserAvatar } from '@/components/person'
import { PriorityIcon, type Priority } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  KanbanBoard, KanbanCard, KanbanCardMenu, type KanbanCardState, type KanbanColumn, type KanbanVariant,
} from '@/blocks/kanban-board'
import { Demos, Gallery, Playground, bool, component, element, imports, indent, pick, str, type Values } from './Playground'

// The board page's card: KanbanCard, the shell every card on a KanbanBoard
// is drawn in (it drags, opens, shows the selected state), with its … menu.
// The cards are a made-up marketing team's.

/* ---------- Sample cards ---------- */

type Stage = 'todo' | 'progress' | 'done'

type Task = {
  id: string
  title: string
  stage: Stage
  priority: Priority
  label?: { name: string; colour: string }
  assignee?: string
}

const LAUNCH = { name: 'Launch', colour: 'oklch(0.62 0.15 250)' }
const CONTENT = { name: 'Content', colour: 'oklch(0.64 0.15 155)' }

const TASKS: Task[] = [
  { id: 'MKT-41', title: 'Write the launch blog post', stage: 'progress', priority: 'high', label: LAUNCH, assignee: 'Maya Ross' },
  { id: 'MKT-44', title: 'Record the product walkthrough', stage: 'todo', priority: 'medium', label: CONTENT, assignee: 'Sam Lee' },
  { id: 'MKT-46', title: 'Update the pricing page screenshots', stage: 'todo', priority: 'low' },
  { id: 'MKT-38', title: 'Draft the customer newsletter', stage: 'done', priority: 'medium', label: CONTENT, assignee: 'Priya Nair' },
]

const COLUMNS: KanbanColumn<Stage>[] = [
  { id: 'todo', title: 'Todo', visual: <StatusIcon status="todo" /> },
  { id: 'progress', title: 'In progress', visual: <StatusIcon status="progress" /> },
  { id: 'done', title: 'Done', visual: <StatusIcon status="done" /> },
]

const VARIANTS = ['default', 'compact'] as const

const demo = (label: string) => () => toast(label, { description: 'Demo only.' })

// What a card shows: its number and priority, the title, its label and who has it.
function TaskContent({ task, properties }: { task: Task; properties: boolean }) {
  return (
    <>
      <div className="text-muted-foreground flex items-center gap-1.5 pr-6 text-[11px]">
        <PriorityIcon priority={task.priority} />
        <span className="tabular-nums">{task.id}</span>
      </div>
      <p className="text-xs leading-snug font-medium">{task.title}</p>
      {properties && (
        <div className="flex items-center gap-1.5">
          {task.label && <LabelChip {...task.label} />}
          <span className="ml-auto">
            {task.assignee ? <UserAvatar name={task.assignee} className="size-5" /> : <NoAssignee className="size-5" />}
          </span>
        </div>
      )}
    </>
  )
}

/* ---------- Playground ---------- */

type BoardOptions = { variant: KanbanVariant; menu: boolean; selectable: boolean; properties: boolean }

function boardOptions(v: Values): BoardOptions {
  return {
    variant: str(v, 'variant') as KanbanVariant,
    menu: bool(v, 'menu'),
    selectable: bool(v, 'selectable'),
    properties: bool(v, 'properties'),
  }
}

function BoardPreview({ variant, menu, selectable, properties }: BoardOptions) {
  const [tasks, setTasks] = useState(TASKS)
  const [selected, setSelected] = useState<string | null>('MKT-41')
  return (
    <div className={cn('bg-background w-full max-w-3xl min-w-0 overflow-hidden rounded-lg border', variant === 'compact' && 'h-80')}>
      <KanbanBoard
        columns={COLUMNS}
        items={tasks}
        columnOf={(t) => t.stage}
        onMove={(id, stage) => setTasks((all) => all.map((t) => (t.id === id ? { ...t, stage } : t)))}
        itemName={{ one: 'task', other: 'tasks' }}
        variant={variant}
        className={variant === 'compact' ? 'h-full' : undefined}
        renderCard={(task, card) => (
          <KanbanCard
            card={card}
            onOpen={() => (selectable ? setSelected(task.id) : toast(task.id, { description: task.title }))}
            selected={selectable && selected === task.id}
            menu={menu ? (
              <KanbanCardMenu label={`Move ${task.id} to another column`} columns={COLUMNS} value={task.stage} onMove={card.moveTo}>
                <DropdownMenuItem onSelect={demo(`Edit ${task.id}`)}>
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={demo(`Copied ${task.id}`)}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Copy link
                </DropdownMenuItem>
              </KanbanCardMenu>
            ) : undefined}
          >
            <TaskContent task={task} properties={properties} />
          </KanbanCard>
        )}
      />
    </div>
  )
}

function boardCode(v: Values) {
  const o = boardOptions(v)
  const head = imports({
    react: ['useState'],
    '@/components/label-dot': o.properties ? ['LabelChip'] : [],
    '@/components/person': o.properties ? ['UserAvatar'] : [],
    '@/components/status-icon': ['StatusIcon'],
    '@/blocks/kanban-board': pick('KanbanBoard', 'KanbanCard', o.menu && 'KanbanCardMenu', 'type KanbanColumn'),
  })
  const columns = [
    "const columns: KanbanColumn<'todo' | 'progress' | 'done'>[] = [",
    "  { id: 'todo', title: 'Todo', visual: <StatusIcon status=\"todo\" /> },",
    "  { id: 'progress', title: 'In progress', visual: <StatusIcon status=\"progress\" /> },",
    "  { id: 'done', title: 'Done', visual: <StatusIcon status=\"done\" /> },",
    ']',
  ].join('\n')
  const content = [
    '<span className="text-muted-foreground text-[11px] tabular-nums">{task.id}</span>',
    '<p className="text-xs font-medium">{task.title}</p>',
    o.properties && [
      '<div className="flex items-center gap-1.5">',
      '  {task.label && <LabelChip {...task.label} />}',
      '  {task.assignee && <UserAvatar name={task.assignee} className="ml-auto size-5" />}',
      '</div>',
    ].join('\n'),
  ].filter(Boolean).join('\n')
  const card = element('KanbanCard', [
    'card={card}',
    o.selectable ? 'onOpen={() => setSelected(task.id)}' : 'onOpen={() => openTask(task.id)}',
    o.selectable && 'selected={selected === task.id}',
    o.menu && [
      'menu={',
      '  <KanbanCardMenu',
      '    label={`Move ${task.id} to another column`}',
      '    columns={columns}',
      '    value={task.stage}',
      '    onMove={card.moveTo}',
      '  />',
      '}',
    ].join('\n'),
  ], content)
  const body = element('KanbanBoard', [
    'columns={columns}',
    'items={tasks}',
    'columnOf={(t) => t.stage}',
    'onMove={(id, stage) => setTasks((all) => all.map((t) => (t.id === id ? { ...t, stage } : t)))}',
    "itemName={{ one: 'task', other: 'tasks' }}",
    o.variant === 'compact' && 'variant="compact"',
    `renderCard={(task, card) => (\n${indent(card)}\n)}`,
  ])
  const state = [
    'const [tasks, setTasks] = useState(initialTasks)',
    o.selectable && 'const [selected, setSelected] = useState<string | null>(null)',
  ].filter((s): s is string => Boolean(s))
  return [
    head,
    "// initialTasks: { id, title, stage: 'todo' | 'progress' | 'done', label?, assignee? }[]",
    columns,
    component('TaskBoard', state, body),
  ].join('\n\n')
}

/* ---------- States ---------- */

// A card's state without a board around it, to show one look at a time.
function stillCard(id: string, variant: KanbanVariant, dragging = false): KanbanCardState<Stage> {
  return {
    cardProps: {
      draggable: true,
      onDragStart: () => {},
      onDragEnd: () => {},
      'data-dragging': dragging,
      'data-kanban-card': id,
    },
    dragging,
    moveTo: () => {},
    variant,
  }
}

function StateCard({ variant = 'default', selected, dragging, menu }: {
  variant?: KanbanVariant
  selected?: boolean
  dragging?: boolean
  menu?: boolean
}) {
  const task = TASKS[0]
  return (
    <div className={variant === 'compact' ? 'w-56' : 'w-64'}>
      <KanbanCard
        card={stillCard(task.id, variant, dragging)}
        onOpen={demo(`Opened ${task.id}`)}
        selected={selected}
        menu={menu ? <KanbanCardMenu label={`Move ${task.id} to another column`} columns={COLUMNS} value={task.stage} onMove={demo('Moved')} /> : undefined}
      >
        <TaskContent task={task} properties />
      </KanbanCard>
    </div>
  )
}

export default function BoardDemos() {
  return (
    <Demos>
      <Playground
        title="KanbanCard"
        description="Drag a card to another column, or use its … menu. Enter or Space opens it."
        controls={[
          { kind: 'select', name: 'variant', label: 'Board variant', options: VARIANTS, initial: 'default' },
          { kind: 'switch', name: 'menu', label: 'Menu (KanbanCardMenu)', initial: true },
          { kind: 'switch', name: 'selectable', label: 'Selected on open', initial: true },
          { kind: 'switch', name: 'properties', label: 'Label and assignee', initial: true },
        ]}
        previewClassName="p-3 sm:p-6"
        render={(v) => <BoardPreview key={str(v, 'variant')} {...boardOptions(v)} />}
        code={boardCode}
      />

      <Gallery
        title="KanbanCard states"
        note="The menu shows on hover or focus with a mouse, always on a touch screen"
        items={[
          { label: 'rest', node: <StateCard /> },
          { label: 'selected', node: <StateCard selected /> },
          { label: 'dragging', node: <StateCard dragging /> },
          { label: 'with menu', node: <StateCard menu /> },
          { label: 'compact', node: <StateCard variant="compact" menu /> },
        ]}
      />
    </Demos>
  )
}
