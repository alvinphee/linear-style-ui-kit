import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, FilterHorizontalIcon, Location01Icon } from '@hugeicons/core-free-icons'
import { Mention } from '@/components/mention'
import { UserAvatar } from '@/components/person'
import { StatusIcon } from '@/components/status-icon'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Label } from '@/components/ui/label'
import {
  Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger,
} from '@/components/ui/popover'
import { STATUS, type Status } from '../data'
import { Panel, Row, Section } from './shared'

const STATS = [
  { label: 'Jobs done', value: '128' },
  { label: 'On time', value: '96%' },
  { label: 'Photos', value: '1.4k' },
]

function HoverCardPanel() {
  return (
    <Panel title="Hover card" note="HoverCard: hover or tab to the mention" wide>
      <div className="flex gap-2.5">
        <UserAvatar name="Ravi" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="font-medium">Ravi</span>
            <span className="text-muted-foreground text-[11px]">commented on DO-24817 · 40 min ago</span>
          </p>
          <p className="mt-1 text-xs/relaxed">
            Loaded and on the way now.{' '}
            <HoverCard openDelay={150} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Mention href="#overlays-more" onClick={(e) => e.preventDefault()}>@meiling</Mention>
              </HoverCardTrigger>
              <HoverCardContent align="start" className="w-64 p-3">
                <MeiLingProfile />
              </HoverCardContent>
            </HoverCard>{' '}
            can you tell the site contact we will be at bay 4 by 4 pm?
          </p>
        </div>
      </div>
    </Panel>
  )
}

function MeiLingProfile() {
  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-2.5">
        <UserAvatar
          name="Mei Ling"
          className="size-10 *:data-[slot=avatar-fallback]:text-xs *:data-[slot=avatar-fallback]:font-medium"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">Mei Ling</p>
          <p className="text-muted-foreground truncate text-[11px]">Dispatcher · Operations</p>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
            <span className="bg-status-done size-1.5 rounded-full" /> Online
            <span aria-hidden>·</span>
            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3" /> Depot 2
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 divide-x rounded-md border">
        {STATS.map((s) => (
          <div key={s.label} className="grid gap-0.5 px-2 py-1.5">
            <dt className="text-muted-foreground truncate text-[10px]">{s.label}</dt>
            <dd className="text-xs font-medium tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" /> Joined March 2024
      </p>
    </div>
  )
}

export default function PopoversSection() {
  const [status, setStatus] = useState<Status>('progress')
  const [filters, setFilters] = useState<Record<Status, boolean>>({
    backlog: false, todo: true, progress: true, done: false, cancelled: false,
  })

  return (
    <Section id="popovers" title="Tooltips and popovers" description="Tooltips, popovers and hover cards">
      <Panel title="Filter popover" note="Popover with checkboxes">
        <Row>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
                Filter
                <span className="text-muted-foreground tabular-nums">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56">
              <PopoverHeader>
                <PopoverTitle>Status</PopoverTitle>
                <PopoverDescription>Show jobs with these statuses.</PopoverDescription>
              </PopoverHeader>
              <div className="grid gap-2">
                {(Object.keys(STATUS) as Status[]).map((s) => (
                  <Label key={s} className="flex items-center gap-2 font-normal">
                    <Checkbox
                      checked={filters[s]}
                      onCheckedChange={(v) => setFilters((f) => ({ ...f, [s]: v === true }))}
                    />
                    <StatusIcon status={s} /> {STATUS[s].label}
                  </Label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </Row>
      </Panel>

      <HoverCardPanel />
    </Section>
  )
}
