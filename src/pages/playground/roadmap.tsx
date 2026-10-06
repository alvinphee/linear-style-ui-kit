import { toast } from 'sonner'
import { UserAvatar } from '@/components/person'
import { GanttChart, type GanttItem, type GanttZoom } from '@/blocks/gantt-chart'
import { Demos, Playground, bool, element, imports, indent, lit, str, type Values } from './Playground'

// The roadmap page's block: GanttChart, here with a made-up website
// relaunch's tasks. The roadmap below it is the same block with projects.

const date = (month: number, day: number) => Date.UTC(2026, month - 1, day)
// A UTC midnight back as the date() call that made it, for the code.
const dateCode = (t: number) => `date(${new Date(t).getUTCMonth() + 1}, ${new Date(t).getUTCDate()})`

type Task = GanttItem & { owner: string }

const TASKS: Task[] = [
  {
    id: 'research', name: 'User research', owner: 'Priya Nair', start: date(10, 1), end: date(10, 14), progress: 100,
    colour: 'oklch(0.62 0.15 250)', milestones: [{ name: 'Findings shared', date: date(10, 14) }],
  },
  {
    id: 'design', name: 'Page designs', owner: 'Maya Ross', start: date(10, 8), end: date(10, 30), progress: 70,
    colour: 'oklch(0.6 0.17 300)', milestones: [{ name: 'Design review', date: date(10, 21) }],
  },
  { id: 'build', name: 'Build the new site', owner: 'Sam Lee', start: date(10, 19), end: date(11, 20), progress: 25, colour: 'oklch(0.7 0.12 215)' },
  { id: 'copy', name: 'Write the copy', owner: 'Priya Nair', start: date(10, 26), end: date(11, 13), progress: 10, colour: 'oklch(0.68 0.14 155)' },
  {
    id: 'launch', name: 'Launch', owner: 'Maya Ross', start: date(11, 23), end: date(11, 27), progress: 0,
    colour: 'oklch(0.74 0.15 70)', milestones: [{ name: 'Go live', date: date(11, 27) }],
  },
]

const ZOOMS = ['weeks', 'months'] as const
const LABELS = ['name', 'name and owner'] as const

type ChartOptions = { zoom: GanttZoom; owner: boolean; today: boolean; milestones: boolean; legend: boolean; open: boolean; empty: boolean }

function chartOptions(v: Values): ChartOptions {
  return {
    zoom: str(v, 'zoom') as GanttZoom,
    owner: str(v, 'labels') === 'name and owner',
    today: bool(v, 'today'),
    milestones: bool(v, 'milestones'),
    legend: bool(v, 'legend'),
    open: bool(v, 'open'),
    empty: bool(v, 'empty'),
  }
}

const tasksFor = ({ milestones, empty }: ChartOptions): Task[] =>
  empty ? [] : milestones ? TASKS : TASKS.map((t) => ({ ...t, milestones: undefined }))

function ChartPreview(o: ChartOptions) {
  const tasks = tasksFor(o)
  return (
    <GanttChart
      // The zoom is only read on mount, so a new default mounts a fresh chart.
      key={o.zoom}
      className="w-full"
      items={tasks}
      start={date(10, 1)}
      end={date(11, 30)}
      today={o.today ? date(10, 20) : undefined}
      defaultZoom={o.zoom}
      labelHeading="Task"
      summary={`Oct – Nov 2026 · ${tasks.length} tasks`}
      legend={o.legend}
      renderLabel={o.owner ? (t) => (
        <>
          <span className="min-w-0 flex-1 truncate text-xs font-medium">{t.name}</span>
          <UserAvatar name={t.owner} className="hidden size-5 sm:flex" />
        </>
      ) : undefined}
      details={(t) => `Owner: ${t.owner}`}
      onItemClick={o.open ? (t) => toast(t.name, { description: 'Demo only: this would open the task.' }) : undefined}
    />
  )
}

function chartCode(v: Values) {
  const o = chartOptions(v)
  const head = imports({
    '@/blocks/gantt-chart': ['GanttChart', 'type GanttItem'],
    '@/components/person': o.owner ? ['UserAvatar'] : [],
  })
  const items = o.empty
    ? 'const tasks: (GanttItem & { owner: string })[] = []'
    : `const tasks: (GanttItem & { owner: string })[] = [\n${tasksFor(o).map((t) => {
      const plain = lit({ id: t.id, name: t.name, owner: t.owner, progress: t.progress, colour: t.colour })
      const dates = `start: ${dateCode(t.start)}, end: ${dateCode(t.end)}`
      const marks = t.milestones?.length
        ? `, milestones: [${t.milestones.map((m) => `{ name: ${lit(m.name)}, date: ${dateCode(m.date)} }`).join(', ')}]`
        : ''
      return indent(`${plain.replace(/ }$/, `, ${dates}${marks} }`)},`)
    }).join('\n')}\n]`
  const body = element('GanttChart', [
    'items={tasks}',
    'start={date(10, 1)}',
    'end={date(11, 30)}',
    o.today && 'today={date(10, 20)}',
    o.zoom !== 'weeks' && `defaultZoom="${o.zoom}"`,
    'labelHeading="Task"',
    'summary={`Oct – Nov 2026 · ${tasks.length} tasks`}',
    !o.legend && 'legend={false}',
    o.owner && `renderLabel={(t) => (\n  <>\n    <span className="min-w-0 flex-1 truncate text-xs font-medium">{t.name}</span>\n    <UserAvatar name={t.owner} className="size-5" />\n  </>\n)}`,
    'details={(t) => `Owner: ${t.owner}`}',
    o.open && 'onItemClick={(t) => openTask(t.id)}',
  ])
  return `${head}\n\n// Dates are UTC midnights; an item's end is its last day.\nconst date = (month: number, day: number) => Date.UTC(2026, month - 1, day)\n\n${items}\n\n${body}`
}

export default function RoadmapDemos() {
  return (
    <Demos>
      <Playground
        title="GanttChart"
        description="Items on a timeline of days. Weeks scrolls; Months fits the card."
        previewClassName="p-3 sm:p-6"
        controls={[
          { kind: 'select', name: 'zoom', label: 'Default zoom', options: ZOOMS, initial: 'weeks' },
          { kind: 'select', name: 'labels', label: 'Names column (renderLabel)', options: LABELS, initial: 'name and owner' },
          { kind: 'switch', name: 'today', label: 'Today', initial: true },
          { kind: 'switch', name: 'milestones', label: 'Milestones', initial: true },
          { kind: 'switch', name: 'legend', label: 'Legend', initial: true },
          { kind: 'switch', name: 'open', label: 'A click opens the item', initial: false },
          { kind: 'switch', name: 'empty', label: 'No items', initial: false },
        ]}
        render={(v) => <ChartPreview {...chartOptions(v)} />}
        code={chartCode}
      />
    </Demos>
  )
}
