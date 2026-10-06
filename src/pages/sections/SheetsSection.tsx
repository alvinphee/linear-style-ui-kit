import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon, Building03Icon, Calendar03Icon, FilterHorizontalIcon, InboxIcon, KanbanIcon,
  LeftToRightListBulletIcon, Settings01Icon, SidebarLeftIcon, SidebarRightIcon, UserGroupIcon, UserIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { LetterMark } from '@/components/mark'
import { NavHeading, NavItem } from '@/components/nav-item'
import { UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'
import { Button } from '@/components/ui/button'
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PEOPLE, STATUS, type Status } from '../data'
import { Panel, Row, Section } from './shared'

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
                    <UserAvatar name={name} className="size-5" /> {name}
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

  // Nav items recoloured for a sheet, which has no sidebar colours.
  function item(entry: { id: string; label: string; icon: IconSvgElement; count?: number }) {
    return (
      <NavItem
        key={entry.id}
        icon={entry.icon}
        label={entry.label}
        count={entry.count}
        active={active === entry.id}
        onClick={() => setActive(entry.id)}
        className="text-muted-foreground hover:bg-accent data-[active=true]:bg-accent data-[active=true]:text-foreground focus-visible:ring-ring/30"
      />
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
          <LetterMark text="KS" colour="var(--primary)" className="text-primary-foreground" />
          <SheetTitle className="text-[13px]">Kitchen Sink</SheetTitle>
          <SheetDescription className="sr-only">Workspace navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Workspace" className="grid min-h-0 flex-1 content-start gap-px overflow-y-auto px-2">
          {NAV.map(item)}
          <NavHeading>Workspace</NavHeading>
          {TEAMS.map(item)}
        </nav>
        <div className="flex items-center gap-2 border-t p-3">
          <UserAvatar name="You" />
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

export default function SheetsSection() {
  return (
    <Section id="sheets" title="Sheets and drawers" description="Panels that slide in from an edge, or sit docked beside the page">
      <SheetPanel />

      <DrawerPanel />
    </Section>
  )
}
