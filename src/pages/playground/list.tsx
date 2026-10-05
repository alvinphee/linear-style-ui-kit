import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { LabelChip } from '@/components/label-dot'
import { NoAssignee, UserAvatar } from '@/components/person'
import { PRIORITIES, PRIORITY_ORDER, PriorityIcon, type Priority } from '@/components/priority-icon'
import { StatusIcon, WORKFLOW_STATUS, type WorkflowStatus } from '@/components/status-icon'
import { Button } from '@/components/ui/button'
import { DisplayMenu, type DisplayOption } from '@/blocks/display-menu'
import { GroupedList, GroupedListRow, type ListGroup } from '@/blocks/grouped-list'
import { Demos, Example, Playground, bool, component, element, imports, indent, lit, str, type Values } from './Playground'

// The list page's blocks: the grouped list (group headers that fold, dense
// rows, selection) and the Display menu that sets how it shows. The issues
// are a made-up product team's.

/* ---------- Sample issues ---------- */

const BUG = { name: 'Bug', colour: 'oklch(0.65 0.18 10)' }
const FEATURE = { name: 'Feature', colour: 'oklch(0.62 0.15 250)' }
const DESIGN = { name: 'Design', colour: 'oklch(0.6 0.17 300)' }

type Issue = {
  id: string
  title: string
  status: WorkflowStatus
  priority: Priority
  label?: { name: string; colour: string }
  assignee?: string
  // Days ago, for "Last updated".
  updated: number
}

const ISSUES: Issue[] = [
  { id: 'ENG-142', title: 'Invoices page shows the wrong tax rate', status: 'progress', priority: 'urgent', label: BUG, assignee: 'Maya Ross', updated: 0 },
  { id: 'ENG-139', title: 'Single sign-on for the Business plan', status: 'progress', priority: 'high', label: FEATURE, assignee: 'Sam Lee', updated: 1 },
  { id: 'ENG-151', title: 'Export members as CSV', status: 'todo', priority: 'medium', label: FEATURE, assignee: 'Priya Nair', updated: 2 },
  { id: 'ENG-148', title: 'Onboarding checklist skips step 3', status: 'todo', priority: 'high', label: BUG, updated: 0 },
  { id: 'ENG-155', title: 'Refresh the empty states', status: 'todo', priority: 'low', label: DESIGN, assignee: 'Maya Ross', updated: 5 },
  { id: 'ENG-133', title: 'Rate limit the public API', status: 'done', priority: 'medium', assignee: 'Sam Lee', updated: 3 },
  { id: 'ENG-129', title: 'Date picker opens off screen in Safari', status: 'done', priority: 'low', label: BUG, assignee: 'Priya Nair', updated: 6 },
]

// Linear's order for a list grouped by status: work in hand first.
const STATUS_GROUPS: WorkflowStatus[] = ['progress', 'todo', 'backlog', 'done', 'cancelled']

const GROUPINGS = ['status', 'priority', 'none'] as const
type Grouping = (typeof GROUPINGS)[number]

type IssueGroup = ListGroup<Issue>

function groupIssues(issues: Issue[], grouping: Grouping, showEmpty: boolean): IssueGroup[] {
  if (grouping === 'none') return [{ id: 'all', title: 'All issues', items: issues }]
  const groups: IssueGroup[] = grouping === 'status'
    ? STATUS_GROUPS.map((status) => ({
      id: status,
      title: WORKFLOW_STATUS[status].label,
      visual: <StatusIcon status={status} />,
      items: issues.filter((i) => i.status === status),
    }))
    : PRIORITY_ORDER.map((priority) => ({
      id: priority,
      title: PRIORITIES[priority].label,
      visual: <PriorityIcon priority={priority} />,
      items: issues.filter((i) => i.priority === priority),
    }))
  return showEmpty ? groups : groups.filter((g) => g.items.length > 0)
}

const PROPERTY_IDS = ['priority', 'id', 'status', 'labels', 'assignee'] as const
type PropertyId = (typeof PROPERTY_IDS)[number]
type Shown = Record<PropertyId, boolean>

const ALL_SHOWN: Shown = { priority: true, id: true, status: true, labels: true, assignee: true }

// One row's cells. The status icon is left out when the groups already say it.
function IssueCells({ issue, grouping, shown = ALL_SHOWN }: { issue: Issue; grouping: Grouping; shown?: Shown }) {
  return (
    <>
      {shown.priority && grouping !== 'priority' && <PriorityIcon priority={issue.priority} />}
      {shown.id && <span className="text-muted-foreground w-14 shrink-0 tabular-nums">{issue.id}</span>}
      {shown.status && grouping !== 'status' && <StatusIcon status={issue.status} />}
      <span className="min-w-0 flex-1 truncate">{issue.title}</span>
      {shown.labels && issue.label && <LabelChip {...issue.label} className="hidden @md:inline-flex" />}
      {shown.assignee && (issue.assignee ? <UserAvatar name={issue.assignee} className="size-5" /> : <NoAssignee className="size-5" />)}
    </>
  )
}

/* ---------- Grouped list ---------- */

type ListOptions = {
  grouping: Grouping
  selection: boolean
  collapsible: boolean
  add: boolean
  framed: boolean
  showEmpty: boolean
}

function listOptions(v: Values): ListOptions {
  return {
    grouping: str(v, 'grouping') as Grouping,
    selection: bool(v, 'selection'),
    collapsible: bool(v, 'collapsible'),
    add: bool(v, 'add'),
    framed: bool(v, 'framed'),
    showEmpty: bool(v, 'showEmpty'),
  }
}

function ListPreview({ grouping, selection, collapsible, add, framed, showEmpty }: ListOptions) {
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="grid w-full max-w-2xl min-w-0 gap-2">
      <div className={cn('@container min-w-0 overflow-hidden', framed && 'bg-card rounded-lg border')}>
        <GroupedList
          aria-label="Issues"
          groups={groupIssues(ISSUES, grouping, showEmpty)}
          headers={grouping !== 'none'}
          collapsible={collapsible}
          framed={framed}
          selected={selection ? selected : undefined}
          onSelectedChange={selection ? setSelected : undefined}
          onAdd={add ? (group) => toast(`New issue in ${group.title}`, { description: 'Demo only.' }) : undefined}
          itemName={{ one: 'issue', other: 'issues' }}
          renderRow={(issue, row) => (
            <GroupedListRow row={row} active={open === issue.id} onOpen={() => setOpen(open === issue.id ? null : issue.id)}>
              <IssueCells issue={issue} grouping={grouping} />
            </GroupedListRow>
          )}
        />
      </div>
      <p className="text-muted-foreground flex h-6 items-center gap-2 text-[11px]" aria-live="polite">
        {selection && selected.length > 0 ? (
          <>
            {selected.length} selected
            <Button variant="ghost" size="xs" onClick={() => setSelected([])}>Clear</Button>
          </>
        ) : (
          <>Click a row to open it{selection ? '; X or the checkbox selects, Shift for a range' : ''}. Up and Down move.</>
        )}
      </p>
    </div>
  )
}

function groupsCode(grouping: Grouping, showEmpty: boolean) {
  if (grouping === 'none') return "const groups = [{ id: 'all', title: 'All issues', items: issues }]"
  const status = grouping === 'status'
  const keys = status ? STATUS_GROUPS : PRIORITY_ORDER
  const lines = [
    `const groups = (${lit(keys)} as const).map((${grouping}) => ({`,
    `  id: ${grouping},`,
    `  title: ${status ? 'WORKFLOW_STATUS' : 'PRIORITIES'}[${grouping}].label,`,
    `  visual: <${status ? 'StatusIcon status' : 'PriorityIcon priority'}={${grouping}} />,`,
    `  items: issues.filter((i) => i.${grouping} === ${grouping}),`,
    showEmpty ? '}))' : '})).filter((g) => g.items.length > 0)',
  ]
  return lines.join('\n')
}

function listCode(v: Values) {
  const o = listOptions(v)
  const head = imports({
    react: ['useState'],
    sonner: o.add ? ['toast'] : [],
    '@/components/label-dot': ['LabelChip'],
    '@/components/person': ['NoAssignee', 'UserAvatar'],
    '@/components/priority-icon': o.grouping === 'priority' ? ['PRIORITIES', 'PriorityIcon'] : ['PriorityIcon'],
    '@/components/status-icon': o.grouping === 'status' ? ['StatusIcon', 'WORKFLOW_STATUS'] : ['StatusIcon'],
    '@/blocks/grouped-list': ['GroupedList', 'GroupedListRow'],
  })
  const cells = [
    o.grouping !== 'priority' && '<PriorityIcon priority={issue.priority} />',
    '<span className="text-muted-foreground w-14 shrink-0 tabular-nums">{issue.id}</span>',
    o.grouping !== 'status' && '<StatusIcon status={issue.status} />',
    '<span className="min-w-0 flex-1 truncate">{issue.title}</span>',
    '{issue.label && <LabelChip {...issue.label} />}',
    '{issue.assignee ? <UserAvatar name={issue.assignee} className="size-5" /> : <NoAssignee className="size-5" />}',
  ].filter(Boolean).join('\n')
  const row = [
    'renderRow={(issue, row) => (',
    '  <GroupedListRow row={row} active={open === issue.id} onOpen={() => setOpen(issue.id)}>',
    indent(cells, '    '),
    '  </GroupedListRow>',
    ')}',
  ].join('\n')
  const body = element('GroupedList', [
    'aria-label="Issues"',
    'groups={groups}',
    o.grouping === 'none' && 'headers={false}',
    !o.collapsible && 'collapsible={false}',
    o.framed && 'framed',
    o.selection && 'selected={selected}',
    o.selection && 'onSelectedChange={setSelected}',
    o.add && "onAdd={(group) => toast(`New issue in ${group.title}`)}",
    "itemName={{ one: 'issue', other: 'issues' }}",
    row,
  ])
  const state = [
    o.selection && 'const [selected, setSelected] = useState<string[]>([])',
    'const [open, setOpen] = useState<string | null>(null)',
  ].filter((s): s is string => Boolean(s))
  const framed = o.framed ? `<div className="bg-card overflow-hidden rounded-lg border">\n${indent(body)}\n</div>` : body
  return [
    head,
    '// issues: { id, title, status, priority, label?: { name, colour }, assignee? }[]',
    groupsCode(o.grouping, o.showEmpty),
    component('IssueList', state, framed),
  ].join('\n\n')
}

/* ---------- Display menu ---------- */

const GROUPING_OPTIONS: DisplayOption[] = [
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'none', label: 'No grouping' },
]

const ORDERING_OPTIONS: DisplayOption[] = [
  { id: 'priority', label: 'Priority' },
  { id: 'updated', label: 'Last updated' },
  { id: 'title', label: 'Title' },
]

const PROPERTY_OPTIONS: DisplayOption[] = [
  { id: 'priority', label: 'Priority' },
  { id: 'id', label: 'ID' },
  { id: 'status', label: 'Status' },
  { id: 'labels', label: 'Labels' },
  { id: 'assignee', label: 'Assignee' },
]

type Display = {
  layout: string
  grouping: Grouping
  ordering: string
  showEmpty: boolean
  showCompleted: boolean
  properties: Shown
}

const DEFAULT_DISPLAY: Display = {
  layout: 'list',
  grouping: 'status',
  ordering: 'priority',
  showEmpty: false,
  showCompleted: true,
  properties: ALL_SHOWN,
}

const sameDisplay = (a: Display, b: Display) => JSON.stringify(a) === JSON.stringify(b)
const labelOf = (options: DisplayOption[], id: string) => options.find((o) => o.id === id)?.label ?? id

function sortIssues(issues: Issue[], ordering: string) {
  const sorted = [...issues]
  if (ordering === 'priority') sorted.sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))
  if (ordering === 'updated') sorted.sort((a, b) => a.updated - b.updated)
  if (ordering === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title))
  return sorted
}

type DisplaySections = { layout: boolean; selects: boolean; switches: boolean; properties: boolean; reset: boolean }

// The menu over the page's display state; `sections` picks which parts it shows.
function IssueDisplayMenu({ display, onChange, sections, labelClassName }: {
  display: Display
  onChange: (display: Display) => void
  sections: DisplaySections
  labelClassName?: string
}) {
  const set = (patch: Partial<Display>) => onChange({ ...display, ...patch })
  return (
    <DisplayMenu
      layout={sections.layout ? { value: display.layout, onChange: (layout) => set({ layout }) } : undefined}
      selects={sections.selects ? [
        { id: 'grouping', label: 'Grouping', value: display.grouping, options: GROUPING_OPTIONS, onChange: (g) => set({ grouping: g as Grouping }) },
        { id: 'ordering', label: 'Ordering', value: display.ordering, options: ORDERING_OPTIONS, onChange: (ordering) => set({ ordering }) },
      ] : undefined}
      switches={sections.switches ? [
        { id: 'empty', label: 'Show empty groups', checked: display.showEmpty, onChange: (showEmpty) => set({ showEmpty }) },
        { id: 'completed', label: 'Show completed issues', checked: display.showCompleted, onChange: (showCompleted) => set({ showCompleted }) },
      ] : undefined}
      properties={sections.properties ? {
        options: PROPERTY_OPTIONS,
        value: display.properties,
        onChange: (id, shown) => set({ properties: { ...display.properties, [id]: shown } }),
      } : undefined}
      changed={!sameDisplay(display, DEFAULT_DISPLAY)}
      onReset={sections.reset ? () => onChange(DEFAULT_DISPLAY) : undefined}
      labelClassName={labelClassName}
    />
  )
}

function DisplayPreview({ sections }: { sections: DisplaySections }) {
  const [display, setDisplay] = useState(DEFAULT_DISPLAY)
  const shown = PROPERTY_OPTIONS.filter((p) => display.properties[p.id as PropertyId]).map((p) => p.label)
  const facts: [string, string][] = [
    ['Layout', labelOf([{ id: 'list', label: 'List' }, { id: 'board', label: 'Board' }], display.layout)],
    ['Grouping', labelOf(GROUPING_OPTIONS, display.grouping)],
    ['Ordering', labelOf(ORDERING_OPTIONS, display.ordering)],
    ['Empty groups', display.showEmpty ? 'Shown' : 'Hidden'],
    ['Completed', display.showCompleted ? 'Shown' : 'Hidden'],
    ['Properties', shown.length ? shown.join(', ') : 'None'],
  ]
  return (
    <div className="grid w-72 max-w-full justify-items-center gap-4">
      <IssueDisplayMenu display={display} onChange={setDisplay} sections={sections} />
      <dl className="bg-card grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-lg border p-3 text-[11px]">
        {facts.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function displayCode(v: Values) {
  const s = displaySections(v)
  const head = imports({
    react: ['useState'],
    '@/blocks/display-menu': ['DisplayMenu', 'type DisplayOption'],
  })
  const options = [
    s.selects && `const groupings: DisplayOption[] = ${lit(GROUPING_OPTIONS)}`,
    s.selects && `const orderings: DisplayOption[] = ${lit(ORDERING_OPTIONS)}`,
    s.properties && `const properties: DisplayOption[] = ${lit(PROPERTY_OPTIONS)}`,
  ].filter(Boolean).join('\n')
  const defaults = `const DEFAULT = ${lit({
    layout: s.layout ? DEFAULT_DISPLAY.layout : undefined,
    grouping: s.selects ? DEFAULT_DISPLAY.grouping : undefined,
    ordering: s.selects ? DEFAULT_DISPLAY.ordering : undefined,
    showEmpty: s.switches ? DEFAULT_DISPLAY.showEmpty : undefined,
    showCompleted: s.switches ? DEFAULT_DISPLAY.showCompleted : undefined,
    properties: s.properties ? DEFAULT_DISPLAY.properties : undefined,
  })}`
  const body = element('DisplayMenu', [
    s.layout && 'layout={{ value: display.layout, onChange: (layout) => set({ layout }) }}',
    s.selects && [
      'selects={[',
      "  { id: 'grouping', label: 'Grouping', value: display.grouping, options: groupings, onChange: (grouping) => set({ grouping }) },",
      "  { id: 'ordering', label: 'Ordering', value: display.ordering, options: orderings, onChange: (ordering) => set({ ordering }) },",
      ']}',
    ].join('\n'),
    s.switches && [
      'switches={[',
      "  { id: 'empty', label: 'Show empty groups', checked: display.showEmpty, onChange: (showEmpty) => set({ showEmpty }) },",
      "  { id: 'completed', label: 'Show completed issues', checked: display.showCompleted, onChange: (showCompleted) => set({ showCompleted }) },",
      ']}',
    ].join('\n'),
    s.properties && [
      'properties={{',
      '  options: properties,',
      '  value: display.properties,',
      '  onChange: (id, shown) => set({ properties: { ...display.properties, [id]: shown } }),',
      '}}',
    ].join('\n'),
    'changed={JSON.stringify(display) !== JSON.stringify(DEFAULT)}',
    s.reset && 'onReset={() => setDisplay(DEFAULT)}',
  ])
  const state = [
    'const [display, setDisplay] = useState(DEFAULT)',
    'const set = (patch: Partial<typeof DEFAULT>) => setDisplay((d) => ({ ...d, ...patch }))',
  ]
  return [head, options, defaults, component('IssuesDisplay', state, body)].filter(Boolean).join('\n\n')
}

function displaySections(v: Values): DisplaySections {
  return {
    layout: bool(v, 'layout'),
    selects: bool(v, 'selects'),
    switches: bool(v, 'switches'),
    properties: bool(v, 'properties'),
    reset: bool(v, 'reset'),
  }
}

/* ---------- Together ---------- */

const EVERY_SECTION: DisplaySections = { layout: false, selects: true, switches: true, properties: true, reset: true }

// The Display menu driving the list: grouping, ordering, empty groups,
// completed issues and the row's properties all apply at once.
function ListWithDisplay() {
  const [display, setDisplay] = useState(DEFAULT_DISPLAY)
  const issues = sortIssues(display.showCompleted ? ISSUES : ISSUES.filter((i) => i.status !== 'done'), display.ordering)
  return (
    <div className="bg-card @container mx-auto w-full max-w-2xl min-w-0 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
        <span className="text-xs font-medium">Issues</span>
        <IssueDisplayMenu display={display} onChange={setDisplay} sections={EVERY_SECTION} />
      </div>
      <GroupedList
        aria-label="Issues"
        groups={groupIssues(issues, display.grouping, display.showEmpty)}
        headers={display.grouping !== 'none'}
        framed
        itemName={{ one: 'issue', other: 'issues' }}
        renderRow={(issue, row) => (
          <GroupedListRow row={row} onOpen={() => toast(issue.id, { description: issue.title })}>
            <IssueCells issue={issue} grouping={display.grouping} shown={display.properties} />
          </GroupedListRow>
        )}
      />
    </div>
  )
}

const TOGETHER_CODE = `// display and set: the page's display state, as in the DisplayMenu playground.
// groupIssues: the issues in groups for display.grouping, as in the GroupedList one.
<div className="bg-card overflow-hidden rounded-lg border">
  <div className="flex items-center justify-between border-b px-3 py-1.5">
    <span className="text-xs font-medium">Issues</span>
    <DisplayMenu selects={…} switches={…} properties={…} changed={changed} onReset={reset} />
  </div>
  <GroupedList
    aria-label="Issues"
    groups={groupIssues(issues, display.grouping, display.showEmpty)}
    headers={display.grouping !== 'none'}
    framed
    renderRow={(issue, row) => (
      <GroupedListRow row={row} onOpen={() => openIssue(issue.id)}>
        {display.properties.id && <span className="text-muted-foreground w-14 tabular-nums">{issue.id}</span>}
        <span className="min-w-0 flex-1 truncate">{issue.title}</span>
        {display.properties.labels && issue.label && <LabelChip {...issue.label} />}
      </GroupedListRow>
    )}
  />
</div>`

export default function ListDemos() {
  return (
    <Demos>
      <Playground
        title="GroupedList"
        description="Group headers that fold, dense rows, arrow keys, and selection with X or Shift"
        controls={[
          { kind: 'select', name: 'grouping', label: 'Grouped by (groups)', options: GROUPINGS, initial: 'status' },
          { kind: 'switch', name: 'selection', label: 'Selection', initial: true },
          { kind: 'switch', name: 'collapsible', label: 'Collapsible', initial: true },
          { kind: 'switch', name: 'add', label: 'Add button (onAdd)', initial: true },
          { kind: 'switch', name: 'framed', label: 'Framed', initial: true },
          { kind: 'switch', name: 'showEmpty', label: 'Empty groups', initial: false },
        ]}
        render={(v) => {
          const o = listOptions(v)
          // A fresh list when the grouping changes, so folded groups start open.
          return <ListPreview key={o.grouping} {...o} />
        }}
        code={listCode}
      />

      <Playground
        title="DisplayMenu"
        description="How a list or board shows: layout, grouping, ordering, switches and properties"
        controls={[
          { kind: 'switch', name: 'layout', label: 'Layout tiles', initial: true },
          { kind: 'switch', name: 'selects', label: 'Selects (grouping, ordering)', initial: true },
          { kind: 'switch', name: 'switches', label: 'Switches', initial: true },
          { kind: 'switch', name: 'properties', label: 'Display properties', initial: true },
          { kind: 'switch', name: 'reset', label: 'Reset (onReset)', initial: true },
        ]}
        render={(v) => <DisplayPreview sections={displaySections(v)} />}
        code={displayCode}
      />

      <Example title="Display menu over a grouped list" note="Every change applies at once" code={TOGETHER_CODE}>
        <ListWithDisplay />
      </Example>
    </Demos>
  )
}
