import type { Status } from '../data'
import { Section } from './shared'
import { UserAvatar } from '@/components/person'
import { StatusIcon } from '@/components/status-icon'
import { GanttChart, type GanttItem } from '@/blocks/gantt-chart'

// The roadmap: made-up projects on the Gantt chart block. Dates are UTC
// midnights, as the block expects.
const date = (month: number, day: number) => Date.UTC(2026, month - 1, day)

type Project = GanttItem & { lead: string; status: Status }

const PROJECTS: Project[] = [
  {
    id: 'onboarding', name: 'New onboarding', lead: 'Mei Ling', status: 'done',
    start: date(9, 1), end: date(9, 25), progress: 100, colour: 'oklch(0.62 0.15 250)',
    milestones: [{ name: 'Shipped to all workspaces', date: date(9, 25) }],
  },
  {
    id: 'billing', name: 'Usage-based billing', lead: 'Daniel', status: 'progress',
    start: date(9, 8), end: date(10, 23), progress: 62, colour: 'oklch(0.6 0.17 300)',
    milestones: [{ name: 'Invoices beta', date: date(10, 5) }],
  },
  {
    id: 'mobile', name: 'Mobile app', lead: 'Siti', status: 'progress',
    start: date(9, 15), end: date(11, 27), progress: 34, colour: 'oklch(0.7 0.12 215)',
    milestones: [{ name: 'Internal beta', date: date(10, 16) }, { name: 'Store release', date: date(11, 27) }],
  },
  {
    id: 'design', name: 'Design system 2.0', lead: 'Ravi', status: 'progress',
    start: date(9, 21), end: date(12, 11), progress: 18, colour: 'oklch(0.68 0.14 155)',
    milestones: [{ name: 'Tokens frozen', date: date(10, 30) }],
  },
  {
    id: 'search', name: 'Search API', lead: 'Ali', status: 'todo',
    start: date(10, 12), end: date(11, 20), progress: 0, colour: 'oklch(0.74 0.15 70)',
    milestones: [{ name: 'Public docs', date: date(11, 20) }],
  },
  {
    id: 'audit', name: 'Audit log', lead: 'Mei Ling', status: 'backlog',
    start: date(11, 9), end: date(12, 18), progress: 0, colour: 'oklch(0.65 0.18 10)',
  },
]

export default function RoadmapSection() {
  return (
    <Section id="roadmap" title="Roadmap" description="A timeline of projects">
      <GanttChart
        className="lg:col-span-2"
        items={PROJECTS}
        start={date(9, 1)}
        end={date(12, 31)}
        today={date(9, 30)}
        labelHeading="Project"
        summary={`Sep – Dec 2026 · ${PROJECTS.length} projects`}
        renderLabel={(p) => (
          <>
            <StatusIcon status={p.status} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium">{p.name}</span>
            <UserAvatar name={p.lead} className="hidden size-5 sm:flex" />
          </>
        )}
        details={(p) => `Lead: ${p.lead}`}
      />
    </Section>
  )
}
