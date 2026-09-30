import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, Building03Icon, Cancel01Icon, CheckmarkCircle02Icon, CircleIcon, Copy01Icon,
  FilterRemoveIcon, FolderAddIcon, Link01Icon, PartyIcon, Plug01Icon, Search01Icon, SearchRemoveIcon,
  Tick02Icon, UserAdd01Icon, UserIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Kbd } from '@/components/ui/kbd'
import type { Status } from '../data'
import { Panel, Section } from './shared'
import { Initials, StatusIcon } from './StatusSection'

export default function OnboardingSection() {
  return (
    <Section
      id="onboarding"
      title="Onboarding and empty states"
      description="A getting-started checklist and first-action empty states"
    >
      <ChecklistPanel />
      <NoProjectsPanel />
      <NoResultsPanel />
      <InvitePanel />
    </Section>
  )
}

/* ---------- Checklist ---------- */

const STEPS: { id: string; title: string; description: string; cta: string; icon: IconSvgElement }[] = [
  { id: 'workspace', title: 'Create your workspace', description: 'Pick a name and a URL for your team.', cta: 'Rename', icon: Building03Icon },
  { id: 'profile', title: 'Complete your profile', description: 'Add a photo so teammates know who is who.', cta: 'Edit profile', icon: UserIcon },
  { id: 'invite', title: 'Invite your team', description: 'Work moves faster with two or more people.', cta: 'Invite', icon: UserAdd01Icon },
  { id: 'project', title: 'Create your first project', description: 'Group work with a lead, a start and a target date.', cta: 'New project', icon: FolderAddIcon },
  { id: 'integration', title: 'Connect an integration', description: 'Bring in work from the tools you already use.', cta: 'Browse', icon: Plug01Icon },
]

function ChecklistPanel() {
  const [done, setDone] = useState<Set<string>>(() => new Set(['workspace', 'profile']))
  const [dismissed, setDismissed] = useState(false)
  const count = done.size
  const allDone = count === STEPS.length

  function setStep(id: string, value: boolean) {
    setDone((prev) => {
      const next = new Set(prev)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <Panel title="Get started" note="Click a circle to mark a step done">
      {dismissed ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">Checklist hidden. It stays in the Help menu.</span>
          <Button variant="outline" size="sm" onClick={() => setDismissed(false)}>Show again</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3">
            <ProgressRing value={count} total={STEPS.length} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{allDone ? 'Setup complete' : 'Set up your workspace'}</p>
              <p className="text-muted-foreground text-[11px] tabular-nums" aria-live="polite">
                {count} of {STEPS.length} done
              </p>
            </div>
            <Button
              variant="link"
              size="xs"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>

          <ul className="grid grid-cols-1">
            {STEPS.map((step) => {
              const isDone = done.has(step.id)
              return (
                <li key={step.id} className="flex items-center gap-3 border-t py-2.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={step.title}
                    onClick={() => setStep(step.id, !isDone)}
                    className="group/check focus-visible:ring-ring/50 grid size-5 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2"
                  >
                    <HugeiconsIcon
                      icon={isDone ? CheckmarkCircle02Icon : CircleIcon}
                      strokeWidth={2}
                      className={cn(
                        'size-4.5 transition-colors',
                        isDone ? 'text-status-done' : 'text-muted-foreground group-hover/check:text-foreground',
                      )}
                    />
                  </button>
                  <HugeiconsIcon icon={step.icon} strokeWidth={2} className="text-muted-foreground hidden size-3.5 shrink-0 sm:block" />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-xs font-medium', isDone && 'text-muted-foreground line-through')}>
                      {step.title}
                    </p>
                    <p className="text-muted-foreground truncate text-[11px]">{step.description}</p>
                  </div>
                  {!isDone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStep(step.id, true)
                        toast.success(step.title, { description: 'Demo only. Marked as done.' })
                      }}
                    >
                      {step.cta}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>

          {allDone && (
            <p className="text-brand flex items-center gap-2 border-t pt-3 text-xs font-medium">
              <HugeiconsIcon icon={PartyIcon} strokeWidth={2} className="size-4" />
              All done. Your workspace is ready to go.
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

function ProgressRing({ value, total }: { value: number; total: number }) {
  const r = 15
  const circumference = 2 * Math.PI * r
  return (
    <div aria-hidden className="relative grid size-10 shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 size-10 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-foreground/10" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / total)}
          className="stroke-brand transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="text-[10px] font-medium tabular-nums">{value}/{total}</span>
    </div>
  )
}

/* ---------- Empty: first run ---------- */

function NoProjectsPanel() {
  return (
    <Panel title="First run" note="No data yet, one clear action">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Projects group related work, with a lead, a start date and a target. Create one to get going.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => toast('Demo only. No project was created.')}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create project
              <Kbd className="bg-primary-foreground/15 text-primary-foreground ml-1">P</Kbd>
            </Button>
            <Button variant="outline" onClick={() => toast('Demo only. There are no templates.')}>
              Use a template
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </Panel>
  )
}

/* ---------- Empty: no results ---------- */

const SEARCHABLE: { name: string; status: Status; lead: string }[] = [
  { name: 'Usage-based billing', status: 'progress', lead: 'Daniel' },
  { name: 'Mobile app', status: 'progress', lead: 'Siti' },
  { name: 'Design system 2.0', status: 'progress', lead: 'Ravi' },
  { name: 'Search API', status: 'todo', lead: 'Ali' },
  { name: 'New onboarding', status: 'done', lead: 'Mei Ling' },
]

function NoResultsPanel() {
  const [query, setQuery] = useState('dock')
  const [activeOnly, setActiveOnly] = useState(true)
  const q = query.trim().toLowerCase()
  const results = SEARCHABLE.filter((p) => (!activeOnly || p.status !== 'done') && p.name.toLowerCase().includes(q))

  return (
    <Panel title="No search results" note="Say why, offer a way out">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="min-w-0 flex-1 basis-40">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search projects"
              placeholder="Search projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          {activeOnly && (
            <Badge variant="outline" className="h-6 gap-1 pr-1">
              Status: Active
              <button
                type="button"
                aria-label="Remove filter Status: Active"
                onClick={() => setActiveOnly(false)}
                className="hover:bg-muted focus-visible:ring-ring/50 grid size-4 place-items-center rounded-full outline-none focus-visible:ring-2"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-2.5" />
              </button>
            </Badge>
          )}
        </div>

        {results.length === 0 ? (
          <Empty className="border py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No results for “{query.trim()}”</EmptyTitle>
              <EmptyDescription>
                {activeOnly
                  ? 'Nothing active matches. Check the spelling, or clear the filters to search every project.'
                  : 'Check the spelling, or try a shorter word.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setActiveOnly(false)
                }}
              >
                <HugeiconsIcon icon={FilterRemoveIcon} strokeWidth={2} data-icon="inline-start" />
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            <ul className="rounded-lg border">
              {results.map((p) => (
                <li key={p.name} className="flex h-9 items-center gap-2.5 border-b px-3 text-xs last:border-b-0">
                  <StatusIcon status={p.status} />
                  <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                  <Initials name={p.lead} className="size-5" />
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-[11px]">
                {results.length} {results.length === 1 ? 'project' : 'projects'}
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setQuery('dock')
                  setActiveOnly(true)
                }}
              >
                Reset demo
              </Button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}

/* ---------- Empty: team of one ---------- */

const INVITE_LINK = 'https://example.com/join/k3f9-x27q'

function InvitePanel() {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(INVITE_LINK)
      setCopied(true)
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy', { description: 'Select the link and copy it yourself.' })
    }
  }

  return (
    <Panel title="Team of one" note="Empty state with a share link">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia>
            <div className="flex -space-x-1.5">
              <Avatar className="ring-card size-7 ring-2">
                <AvatarFallback className="text-[10px]">AM</AvatarFallback>
              </Avatar>
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="bg-card text-muted-foreground ring-card grid size-7 place-items-center rounded-full border border-dashed ring-2"
                >
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3" />
                </span>
              ))}
            </div>
          </EmptyMedia>
          <EmptyTitle>Invite your team</EmptyTitle>
          <EmptyDescription>Assign work, mention people and review together. It is just you in here so far.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => toast('Demo only. Nothing was sent.')}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            Invite people
          </Button>
          <span className="text-muted-foreground text-[11px]">or share a link</span>
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              readOnly
              value={INVITE_LINK}
              aria-label="Invite link"
              className="text-muted-foreground"
              onFocus={(e) => e.currentTarget.select()}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={copyLink} aria-label="Copy invite link">
                <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} />
                {copied ? 'Copied' : 'Copy'}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </EmptyContent>
      </Empty>
    </Panel>
  )
}
