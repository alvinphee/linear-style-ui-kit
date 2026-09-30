import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon, Archive01Icon, Building03Icon, Calendar03Icon, Camera01Icon, Copy01Icon,
  CursorPointer02Icon, Delete02Icon, FilterHorizontalIcon, InboxIcon, KanbanIcon,
  LeftToRightListBulletIcon, Link01Icon, Location01Icon, Notification03Icon, PencilEdit02Icon,
  Settings01Icon, SidebarLeftIcon, SidebarRightIcon, UserGroupIcon, UserIcon, UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem,
  ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator,
  ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PEOPLE, STATUS, type Status } from '../data'
import { Panel, Row, Section } from './shared'
import { Initials, PriorityIcon, StatusIcon } from './StatusSection'

export default function OverlaysMoreSection() {
  return (
    <Section id="overlays-more" title="More overlays" description="Context menus, sheets, drawers, confirm dialogs and hover cards">
      <ContextMenuPanel />
      <SheetPanel />
      <DrawerPanel />
      <ConfirmPanel />
      <HoverCardPanel />
    </Section>
  )
}

function ContextMenuPanel() {
  const [status, setStatus] = useState<Status>('todo')
  const [watching, setWatching] = useState(true)
  const [showPhotos, setShowPhotos] = useState(false)

  function moveTo(value: string) {
    const next = value as Status
    setStatus(next)
    toast(`Moved DO-24812 to ${STATUS[next].label}`)
  }

  return (
    <Panel title="Context menu" note="Right-click, or focus it and press Shift+F10">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            role="group"
            tabIndex={0}
            aria-label="Job DO-24812"
            aria-describedby="context-hint"
            className="data-[state=open]:bg-accent/60 grid gap-2 rounded-lg border border-dashed border-foreground/15 p-3 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <span id="context-hint" className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <HugeiconsIcon icon={CursorPointer02Icon} strokeWidth={2} className="size-3.5" />
              Right-click this card
              <span className="sr-only">, or press Shift+F10 to open its menu</span>
            </span>
            <div className="bg-card grid gap-1.5 rounded-md border p-2.5 shadow-xs">
              <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-[11px]">
                <PriorityIcon priority="medium" />
                <span className="tabular-nums">DO-24812</span>
                {showPhotos && (
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3" /> 0
                  </span>
                )}
                {watching && (
                  <span className="ml-auto" title="Watching">
                    <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} className="size-3" />
                    <span className="sr-only">Watching</span>
                  </span>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <StatusIcon status={status} />
                <span className="truncate text-xs font-medium">Wrap and label export cargo</span>
              </div>
              <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-[11px]">
                <span className="truncate">Orchid Pharma</span>
                <span aria-hidden>·</span>
                <span className="whitespace-nowrap">Tomorrow</span>
                <Initials name="Daniel" className="ml-auto size-5" />
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel>DO-24812</ContextMenuLabel>
          <ContextMenuGroup>
            <ContextMenuItem onSelect={() => toast('Editing DO-24812')}>
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} /> Edit
              <ContextMenuShortcut>E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => toast.success('Link copied')}>
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} /> Copy link
              <ContextMenuShortcut>Ctrl L</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => toast('Duplicated as DO-24818')}>
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Duplicate
              <ContextMenuShortcut>Ctrl D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <HugeiconsIcon icon={STATUS[status].icon} strokeWidth={2} /> Move to
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuRadioGroup value={status} onValueChange={moveTo}>
                  {(Object.keys(STATUS) as Status[]).map((s) => (
                    <ContextMenuRadioItem key={s} value={s}>
                      <StatusIcon status={s} /> {STATUS[s].label}
                    </ContextMenuRadioItem>
                  ))}
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} /> Assign
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                {PEOPLE.map((name) => (
                  <ContextMenuItem key={name} onSelect={() => toast(`Assigned DO-24812 to ${name}`)}>
                    <Initials name={name} className="size-5" /> {name}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem checked={watching} onCheckedChange={setWatching}>
            <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} /> Watch job
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={showPhotos} onCheckedChange={setShowPhotos}>
            <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} /> Show photo count
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={() => toast('Job deleted', { description: 'Demo only. Nothing was removed.' })}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Panel>
  )
}

function SheetPanel() {
  return (
    <Panel title="Side sheet" note="Sheet, side=right and side=left">
      <Row>
        <JobPeekSheet />
        <NavigationSheet />
      </Row>
    </Panel>
  )
}

function JobPeekSheet() {
  const [status, setStatus] = useState<Status>('progress')
  const [driver, setDriver] = useState('Ravi')

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={SidebarRightIcon} strokeWidth={2} data-icon="inline-start" />
          Job details
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0">
        <SheetHeader className="gap-1 border-b p-4 pr-12">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] tabular-nums">
            <PriorityIcon priority="urgent" /> DO-24817
          </span>
          <SheetTitle>Deliver 12 pallets to Jurong warehouse</SheetTitle>
          <SheetDescription>A quick peek. Changes save when you press Save.</SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-4">
          <PeekRow label="Status" htmlFor="peek-status">
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger id="peek-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {(Object.keys(STATUS) as Status[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    <StatusIcon status={s} /> {STATUS[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PeekRow>
          <PeekRow label="Assignee" htmlFor="peek-driver">
            <Select value={driver} onValueChange={setDriver}>
              <SelectTrigger id="peek-driver" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {PEOPLE.map((name) => (
                  <SelectItem key={name} value={name}>
                    <Initials name={name} className="size-5" /> {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PeekRow>
          <PeekRow label="Customer">
            <span className="flex h-7 items-center gap-1.5 text-xs">
              <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
              Bayview Foods
            </span>
          </PeekRow>
          <PeekRow label="Due">
            <span className="flex h-7 items-center gap-1.5 text-xs">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
              Today, before 5 pm
            </span>
          </PeekRow>
          <Separator />
          <div className="grid gap-1.5">
            <Label htmlFor="peek-note">Note for the driver</Label>
            <Textarea id="peek-note" placeholder="Bay 4, call the site contact on arrival…" />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end border-t p-3">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              onClick={() =>
                toast.success('DO-24817 saved', { description: `${STATUS[status].label} · assigned to ${driver}` })
              }
            >
              Save
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function PeekRow({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
      {htmlFor ? (
        <Label htmlFor={htmlFor} className="text-muted-foreground font-normal">{label}</Label>
      ) : (
        <span className="text-muted-foreground text-xs">{label}</span>
      )}
      {children}
    </div>
  )
}

const NAV: { id: string; label: string; icon: IconSvgElement; count?: number }[] = [
  { id: 'inbox', label: 'Inbox', icon: InboxIcon, count: 4 },
  { id: 'mine', label: 'My jobs', icon: UserIcon },
  { id: 'all', label: 'All jobs', icon: LeftToRightListBulletIcon },
  { id: 'board', label: 'Board', icon: KanbanIcon },
]

const TEAMS: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: 'customers', label: 'Customers', icon: Building03Icon },
  { id: 'team', label: 'Team', icon: UserGroupIcon },
  { id: 'reports', label: 'Reports', icon: Analytics01Icon },
]

function NavigationSheet() {
  const [active, setActive] = useState('all')

  function item(entry: { id: string; label: string; icon: IconSvgElement; count?: number }) {
    return (
      <button
        key={entry.id}
        type="button"
        onClick={() => setActive(entry.id)}
        aria-current={active === entry.id ? 'page' : undefined}
        className="hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:text-foreground text-muted-foreground flex h-7 items-center gap-2 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <HugeiconsIcon icon={entry.icon} strokeWidth={2} className="size-3.5" />
        <span className="flex-1 truncate">{entry.label}</span>
        {entry.count !== undefined && <span className="tabular-nums text-[11px]">{entry.count}</span>}
      </button>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} data-icon="inline-start" />
          Navigation
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 gap-0 sm:max-w-64">
        <SheetHeader className="flex-row items-center gap-2 p-3 pr-12">
          <span className="bg-primary text-primary-foreground grid size-5 place-items-center rounded text-[9px] font-semibold">KS</span>
          <SheetTitle className="text-[13px]">Kitchen Sink</SheetTitle>
          <SheetDescription className="sr-only">Workspace navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Workspace" className="grid min-h-0 flex-1 content-start gap-px overflow-y-auto px-2">
          {NAV.map(item)}
          <p className="text-muted-foreground px-2 pt-4 pb-1 text-[11px] font-medium">Workspace</p>
          {TEAMS.map(item)}
        </nav>
        <div className="flex items-center gap-2 border-t p-3">
          <Initials name="You" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">You</p>
            <p className="text-muted-foreground truncate text-[11px]">Admin</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Settings" onClick={() => setActive('settings')}>
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const SORTS = [
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Date created' },
]

function DrawerPanel() {
  const [sort, setSort] = useState('due')
  const [mine, setMine] = useState(false)
  const [closed, setClosed] = useState(false)
  const [photos, setPhotos] = useState(true)

  function reset() {
    setSort('due')
    setMine(false)
    setClosed(false)
    setPhotos(true)
  }

  const toggles = [
    { id: 'drawer-mine', label: 'Only my jobs', value: mine, set: setMine },
    { id: 'drawer-closed', label: 'Show closed jobs', value: closed, set: setClosed },
    { id: 'drawer-photos', label: 'Show photo counts', value: photos, set: setPhotos },
  ]

  return (
    <Panel title="Bottom drawer" note="Drawer (vaul): drag the handle down to close">
      <Row>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">
              <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
              Sort and filter
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto flex w-full max-w-sm min-h-0 flex-col">
              <DrawerHeader className="pb-2">
                <DrawerTitle>Sort and filter</DrawerTitle>
                <DrawerDescription>8 jobs match these settings.</DrawerDescription>
              </DrawerHeader>
              <div className="grid min-h-0 gap-3 overflow-y-auto px-4">
                <div className="grid gap-1">
                  <p className="text-muted-foreground text-[11px] font-medium">Sort by</p>
                  <RadioGroup value={sort} onValueChange={setSort} className="gap-0 rounded-lg border">
                    {SORTS.map((s) => (
                      <Label
                        key={s.value}
                        htmlFor={`sort-${s.value}`}
                        className="flex h-9 items-center justify-between border-b px-3 font-normal last:border-b-0"
                      >
                        {s.label}
                        <RadioGroupItem id={`sort-${s.value}`} value={s.value} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="grid gap-1">
                  <p className="text-muted-foreground text-[11px] font-medium">Show</p>
                  <div className="rounded-lg border">
                    {toggles.map((t) => (
                      <Label
                        key={t.id}
                        htmlFor={t.id}
                        className="flex h-9 items-center justify-between border-b px-3 font-normal last:border-b-0"
                      >
                        {t.label}
                        <Switch id={t.id} checked={t.value} onCheckedChange={t.set} />
                      </Label>
                    ))}
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => toast(`Sorted by ${SORTS.find((s) => s.value === sort)?.label.toLowerCase()}`)}
                  >
                    Show 8 jobs
                  </Button>
                </DrawerClose>
                <Button size="lg" variant="outline" className="w-full" onClick={reset}>
                  Reset
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
        <span className="text-muted-foreground text-xs">Best on a phone. Try it at 375px wide.</span>
      </Row>
    </Panel>
  )
}

const TO_ARCHIVE = [
  { id: 'DO-24801', status: 'done' as Status, title: 'Deliver 4 crates to Changi cargo' },
  { id: 'DO-24798', status: 'done' as Status, title: 'Fumigation certificate pick-up' },
  { id: 'DO-24790', status: 'cancelled' as Status, title: 'Re-deliver refused shipment' },
]

function ConfirmPanel() {
  return (
    <Panel title="Confirm dialog" note="AlertDialog: focus starts on Cancel">
      <div className="grid gap-3">
        <ul className="grid overflow-hidden rounded-md border">
          {TO_ARCHIVE.map((job) => (
            <li key={job.id} className="flex h-8 min-w-0 items-center gap-2 border-b px-2.5 text-xs last:border-b-0">
              <StatusIcon status={job.status} />
              <span className="text-muted-foreground shrink-0 tabular-nums">{job.id}</span>
              <span className="truncate">{job.title}</span>
            </li>
          ))}
        </ul>
        <Row>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} data-icon="inline-start" />
                Archive 3 jobs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-destructive/10 text-destructive">
                  <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} />
                </AlertDialogMedia>
                <AlertDialogTitle>Archive 3 jobs?</AlertDialogTitle>
                <AlertDialogDescription>
                  DO-24801, DO-24798 and DO-24790 leave every list and board. You can restore them from
                  the archive for 30 days.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    toast('3 jobs archived', { action: { label: 'Undo', onClick: () => toast('3 jobs restored') } })
                  }
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Row>
      </div>
    </Panel>
  )
}

const STATS = [
  { label: 'Jobs done', value: '128' },
  { label: 'On time', value: '96%' },
  { label: 'Photos', value: '1.4k' },
]

function HoverCardPanel() {
  return (
    <Panel title="Hover card" note="HoverCard: hover or tab to the mention" wide>
      <div className="flex gap-2.5">
        <Initials name="Ravi" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="font-medium">Ravi</span>
            <span className="text-muted-foreground text-[11px]">commented on DO-24817 · 40 min ago</span>
          </p>
          <p className="mt-1 text-xs/relaxed">
            Loaded and on the way now.{' '}
            <HoverCard openDelay={150} closeDelay={100}>
              <HoverCardTrigger asChild>
                <a
                  href="#overlays-more"
                  onClick={(e) => e.preventDefault()}
                  className={cn(
                    'bg-brand/10 text-brand rounded px-1 py-px font-medium outline-none',
                    'hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-ring/30',
                  )}
                >
                  @meiling
                </a>
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
        <Avatar size="lg">
          <AvatarFallback className="text-xs font-medium">ML</AvatarFallback>
        </Avatar>
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
