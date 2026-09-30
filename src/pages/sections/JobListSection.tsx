import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Camera01Icon, FilterHorizontalIcon, MoreHorizontalIcon, Sorting01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JOBS, STATUS, type Job, type Status } from '../data'
import { Section } from './shared'
import { Initials, PriorityIcon, StatusIcon } from './StatusSection'

const ORDER: Status[] = ['progress', 'todo', 'backlog', 'done', 'cancelled']
const TABS: Record<string, Status[]> = {
  all: ORDER,
  active: ['progress', 'todo', 'backlog'],
  closed: ['done', 'cancelled'],
}

export default function JobListSection() {
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState<string | null>('DO-24817')

  const groups = useMemo(
    () =>
      TABS[tab]
        .map((status) => ({ status, jobs: JOBS.filter((j) => j.status === status) }))
        .filter((g) => g.jobs.length > 0),
    [tab],
  )

  return (
    <Section id="list" title="Job list" description="A Linear-style list: grouped, dense, keyboard-first">
      <article className="bg-card overflow-hidden rounded-lg border lg:col-span-2">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All jobs</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} data-icon="inline-start" /> Filter
            </Button>
            <Button variant="ghost" size="sm">
              <HugeiconsIcon icon={Sorting01Icon} strokeWidth={2} data-icon="inline-start" /> Display
            </Button>
          </div>
        </header>
  
        {groups.map((group) => (
          <div key={group.status}>
            <div className="bg-subtle flex items-center gap-2 border-b px-3 py-1.5 text-xs">
              <StatusIcon status={group.status} />
              <span className="font-medium">{STATUS[group.status].label}</span>
              <span className="text-muted-foreground tabular-nums">{group.jobs.length}</span>
              <Button variant="ghost" size="icon-xs" className="ml-auto" aria-label={`Add ${STATUS[group.status].label} job`}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              </Button>
            </div>
            {group.jobs.map((job) => (
              <JobRow key={job.id} job={job} selected={selected === job.id} onSelect={() => setSelected(job.id)} />
            ))}
          </div>
        ))}
      </article>
    </Section>
  )
}

function JobRow({ job, selected, onSelect }: { job: Job; selected: boolean; onSelect: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      data-selected={selected}
      className="hover:bg-accent/60 data-[selected=true]:bg-accent group/row flex h-9 cursor-default items-center gap-2.5 border-b px-3 text-xs outline-none last:border-b-0 focus-visible:bg-accent"
    >
      <PriorityIcon priority={job.priority} />
      <span className="text-muted-foreground w-[4.75rem] shrink-0 whitespace-nowrap tabular-nums">{job.id}</span>
      <StatusIcon status={job.status} />
      <span className="min-w-0 flex-1 truncate font-medium">{job.title}</span>
      {job.photos > 0 && (
        <span className="text-muted-foreground hidden items-center gap-1 md:flex">
          <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3.5" />
          <span className="tabular-nums">{job.photos}</span>
        </span>
      )}
      <span className="text-muted-foreground hidden rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap lg:inline">
        {job.customer}
      </span>
      <span className="text-muted-foreground hidden w-16 text-right sm:inline">{job.due}</span>
      <Initials name={job.driver} className="size-5" />
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Actions for ${job.id}`}
        className="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
      </Button>
    </div>
  )
}
