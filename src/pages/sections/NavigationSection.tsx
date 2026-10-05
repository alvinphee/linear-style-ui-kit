import { useState, type MouseEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon, BookOpen01Icon, CodeIcon, Home01Icon, News01Icon, RepeatIcon, SentIcon,
  SparklesIcon, Target02Icon, Task01Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList,
  NavigationMenuTrigger, navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Textarea } from '@/components/ui/textarea'
import { LABEL_BY_ID, PRIORITY, STATUS, type Priority, type Status } from '../data'
import { Panel, Section } from './shared'
import { LabelChip } from '@/components/label-dot'
import { LetterMark } from '@/components/mark'
import { Person, UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

function BreadcrumbPanel() {
  return (
    <Panel title="Breadcrumb" note="Ellipsis opens the hidden levels">
      <div className="grid gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={stay} className="flex items-center gap-1">
                <HugeiconsIcon icon={Home01Icon} strokeWidth={2} className="size-3.5" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Show hidden levels"
                  className="hover:text-foreground focus-visible:ring-ring/30 flex items-center rounded-sm outline-none focus-visible:ring-2"
                >
                  <BreadcrumbEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {['Workspace', 'Teams', 'Engineering'].map((level) => (
                    <DropdownMenuItem key={level} onSelect={() => toast(`Go to ${level}`, { description: 'Demo link' })}>
                      {level}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={stay}>Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mobile app redesign</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Breadcrumb>
          <BreadcrumbList className="gap-1">
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={stay} className="flex items-center gap-1.5">
                <LetterMark text="EN" colour="var(--brand)" size="xs" />
                Engineering
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/60">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={stay}>Issues</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/60">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="tabular-nums">ENG-142</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </Panel>
  )
}

// First, last, and the pages either side of the current one. A gap of one
// page shows that page instead of an ellipsis.
function pageItems(page: number, total: number): (number | 'gap')[] {
  const keep = [...new Set([1, page - 1, page, page + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  const items: (number | 'gap')[] = []
  keep.forEach((p, i) => {
    const prev = keep[i - 1]
    if (prev !== undefined && p - prev === 2) items.push(prev + 1)
    else if (prev !== undefined && p - prev > 2) items.push('gap')
    items.push(p)
  })
  return items
}

function PaginationPanel() {
  const total = 10
  const perPage = 20
  const [page, setPage] = useState(3)
  const go = (p: number) => (e: MouseEvent) => {
    e.preventDefault()
    setPage(Math.min(total, Math.max(1, p)))
  }
  const endClass = 'pointer-events-none opacity-50'

  return (
    <Panel title="Pagination" note="10 pages, ellipsis, disabled ends">
      <div className="grid gap-3">
        <Pagination>
          <PaginationContent className="flex-wrap justify-center">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={go(page - 1)}
                aria-disabled={page === 1}
                tabIndex={page === 1 ? -1 : undefined}
                className={cn(page === 1 && endClass)}
              />
            </PaginationItem>
            {pageItems(page, total).map((item, i) =>
              item === 'gap' ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink href="#" isActive={item === page} onClick={go(item)} className="tabular-nums">
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={go(page + 1)}
                aria-disabled={page === total}
                tabIndex={page === total ? -1 : undefined}
                className={cn(page === total && endClass)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p aria-live="polite" className="text-muted-foreground text-center text-xs tabular-nums">
          Page {page} of {total} · showing {(page - 1) * perPage + 1}–{page * perPage} of {total * perPage}
        </p>
      </div>
    </Panel>
  )
}

const PRODUCT: { title: string; description: string; icon: IconSvgElement }[] = [
  { title: 'Issues', description: 'Track bugs and tasks with fast keyboard flows.', icon: Task01Icon },
  { title: 'Cycles', description: 'Plan focused two-week sprints for each team.', icon: RepeatIcon },
  { title: 'Projects', description: 'Ship bigger goals with milestones and updates.', icon: Target02Icon },
  { title: 'Insights', description: 'Charts across teams, cycles and labels.', icon: Analytics01Icon },
]

const RESOURCES: { title: string; icon: IconSvgElement }[] = [
  { title: 'Documentation', icon: BookOpen01Icon },
  { title: 'Changelog', icon: News01Icon },
  { title: 'API reference', icon: CodeIcon },
  { title: 'Community', icon: UserGroupIcon },
]

function openDemo(title: string) {
  return (e: MouseEvent) => {
    e.preventDefault()
    toast(title, { description: 'Demo link' })
  }
}

function NavigationMenuPanel() {
  return (
    <Panel title="Navigation menu" note="NavigationMenu, a marketing-style top bar" wide>
      <div className="bg-subtle flex min-w-0 items-center gap-2 rounded-md border px-2 py-1">
        {/* The root spans the bar, so on small screens the dropdown can use the bar's full width. */}
        <NavigationMenu className="max-w-none min-w-0 flex-1 justify-start">
          <NavigationMenuList className="flex-none flex-wrap justify-start">
            <NavigationMenuItem className="mr-1 flex items-center gap-1.5 px-1 text-xs font-semibold">
              <span className="bg-brand text-primary-foreground flex size-5 items-center justify-center rounded-md">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3" />
              </span>
              <span className="hidden sm:inline">Orbit</span>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-7">Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[min(28rem,calc(100vw-5rem))] max-w-full grid-cols-1 gap-0.5 sm:grid-cols-2 md:max-w-none">
                  {PRODUCT.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink href="#" onClick={openDemo(item.title)} className="items-start gap-2.5">
                        <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-md border">
                          <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" />
                        </span>
                        <span className="grid min-w-0 gap-0.5">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-muted-foreground text-[11px] leading-snug">{item.description}</span>
                        </span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-7">Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[min(14rem,calc(100vw-5rem))] max-w-full gap-0.5 md:max-w-none">
                  {RESOURCES.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink href="#" onClick={openDemo(item.title)}>
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                        {item.title}
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#" onClick={openDemo('Pricing')} className={cn(navigationMenuTriggerStyle(), 'h-7')}>
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button size="sm">Sign up</Button>
        </div>
      </div>
    </Panel>
  )
}

const INBOX: {
  id: string
  from: string
  title: string
  preview: string
  time: string
  unread: boolean
  status: Status
  priority: Priority
  labels: string[]
}[] = [
  {
    id: 'ORB-214', from: 'Mei Ling', title: 'Review the onboarding emails', time: '2m', unread: true,
    preview: 'Can you look at the welcome email copy before Friday? The second email feels long.',
    status: 'progress', priority: 'high', labels: ['key'],
  },
  {
    id: 'ORB-209', from: 'Daniel', title: 'Billing page crashes on Safari', time: '1h', unread: true,
    preview: 'Stack trace attached. It only happens when the card form loads twice.',
    status: 'todo', priority: 'urgent', labels: ['fragile'],
  },
  {
    id: 'ORB-198', from: 'Siti', title: 'Q4 roadmap draft', time: '3h', unread: false,
    preview: 'First pass is in the doc. Comments welcome, especially on the analytics theme.',
    status: 'todo', priority: 'medium', labels: ['export'],
  },
  {
    id: 'ORB-190', from: 'Ravi', title: 'Raise API rate limits for teams', time: 'Mon', unread: false,
    preview: 'Two customers hit the limit during imports. Proposal: 600 requests a minute.',
    status: 'backlog', priority: 'low', labels: [],
  },
  {
    id: 'ORB-176', from: 'Ali', title: 'Design review notes', time: 'Fri', unread: false,
    preview: 'Notes from Thursday. The settings layout is approved, the sidebar needs another pass.',
    status: 'done', priority: 'none', labels: ['oversize'],
  },
]

function ResizablePanesPanel() {
  const [selectedId, setSelectedId] = useState(INBOX[0].id)
  const item = INBOX.find((i) => i.id === selectedId) ?? INBOX[0]

  return (
    <Panel title="Resizable panes" note="ResizablePanelGroup, drag or use arrow keys on a handle" wide>
      <div className="h-72 overflow-hidden rounded-md border">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="30%" minSize="18%">
            <div className="flex h-full min-w-0 flex-col">
              <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b px-2.5">
                <span className="text-xs font-medium">Inbox</span>
                <span className="text-muted-foreground text-[11px] tabular-nums">{INBOX.filter((i) => i.unread).length} new</span>
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {INBOX.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      aria-current={i.id === selectedId ? 'true' : undefined}
                      onClick={() => setSelectedId(i.id)}
                      className={cn(
                        'hover:bg-accent focus-visible:ring-ring/30 grid w-full min-w-0 gap-0.5 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2',
                        i.id === selectedId && 'bg-accent',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        {i.unread && <span aria-label="Unread" className="bg-brand size-1.5 shrink-0 rounded-full" />}
                        <span className="truncate text-xs font-medium">{i.from}</span>
                        <span className="text-muted-foreground ml-auto shrink-0 text-[10px]">{i.time}</span>
                      </span>
                      <span className="text-muted-foreground truncate text-[11px]">{i.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="45%" minSize="25%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="68%" minSize="30%">
                <article className="h-full min-w-0 overflow-y-auto p-3">
                  <div className="text-muted-foreground mb-1 flex min-w-0 items-center gap-1.5 text-[11px]">
                    <UserAvatar name={item.from} className="size-4" />
                    <span className="truncate">{item.from} · {item.time}</span>
                  </div>
                  <h4 className="mb-2 text-sm font-medium tracking-tight">{item.title}</h4>
                  <p className="text-muted-foreground text-xs/relaxed">{item.preview}</p>
                  <p className="text-muted-foreground mt-2 text-xs/relaxed">
                    Reply here or open the issue to see the full thread, linked pull requests and activity.
                  </p>
                </article>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="32%" minSize="22%">
                <form
                  className="flex h-full min-w-0 flex-col gap-2 p-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    toast('Reply sent', { description: 'Demo only.' })
                  }}
                >
                  <Textarea aria-label="Reply" placeholder="Write a reply…" className="min-h-0 flex-1 field-sizing-fixed" />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm">
                      <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" />
                      Reply
                    </Button>
                  </div>
                </form>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="25%" minSize="18%">
            <aside className="h-full min-w-0 overflow-y-auto p-3">
              <p className="text-muted-foreground mb-2 text-[11px] font-medium tabular-nums">{item.id}</p>
              <dl className="grid gap-2.5 text-xs">
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-[11px]">Status</dt>
                  <dd className="flex min-w-0 items-center gap-1.5">
                    <StatusIcon status={item.status} />
                    <span className="truncate">{STATUS[item.status].label}</span>
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-[11px]">Priority</dt>
                  <dd className="flex min-w-0 items-center gap-1.5">
                    <PriorityIcon priority={item.priority} />
                    <span className="truncate">{PRIORITY[item.priority].label}</span>
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-[11px]">Reporter</dt>
                  <dd className="min-w-0">
                    <Person name={item.from} className="gap-1.5" avatarClassName="size-4" />
                  </dd>
                </div>
                {item.labels.length > 0 && (
                  <div className="grid gap-1">
                    <dt className="text-muted-foreground text-[11px]">Labels</dt>
                    <dd className="flex min-w-0 flex-wrap gap-1">
                      {item.labels.map((id) => (
                        <LabelChip key={id} name={LABEL_BY_ID[id].name} colour={LABEL_BY_ID[id].colour} className="text-foreground" />
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Panel>
  )
}

export default function NavigationSection() {
  return (
    <Section id="navigation" title="Navigation" description="Breadcrumbs, pagination, menus and resizable panes">
      <BreadcrumbPanel />
      <PaginationPanel />
      <NavigationMenuPanel />
      <ResizablePanesPanel />
    </Section>
  )
}
