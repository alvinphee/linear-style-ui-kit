import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Camera01Icon, Copy01Icon, CursorPointer02Icon, Delete02Icon, Link01Icon, MoreHorizontalIcon, Notification03Icon,
  PencilEdit02Icon, UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { MOD } from '@/components/shortcut'
import { StatusIcon } from '@/components/status-icon'
import { Button } from '@/components/ui/button'
import {
  ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel,
  ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub,
  ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { STATUS, type Status, PEOPLE } from '../data'
import { Panel, Row, Section } from './shared'

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
                <UserAvatar name="Daniel" className="ml-auto size-5" />
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
              <ContextMenuShortcut>{MOD} L</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => toast('Duplicated as DO-24818')}>
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Duplicate
              <ContextMenuShortcut>{MOD} D</ContextMenuShortcut>
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
                    <UserAvatar name={name} className="size-5" /> {name}
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

export default function MenusSection() {
  const [status, setStatus] = useState<Status>('progress')

  return (
    <Section id="menus" title="Menus" description="Dropdown and context menus, built from one list of items">
      <Panel title="Row actions menu" note="DropdownMenu with shortcuts and a submenu">
        <Row>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
                Job actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>DO-24817</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} /> Edit
                  <DropdownMenuShortcut>E</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Duplicate
                  <DropdownMenuShortcut>{MOD} D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} /> Assign driver
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {['Ravi', 'Mei Ling', 'Daniel', 'Siti'].map((n) => (
                      <DropdownMenuItem key={n}>
                        <UserAvatar name={n} className="size-4" /> {n}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={status} onValueChange={(v) => setStatus(v as Status)}>
                {(Object.keys(STATUS) as Status[]).map((s) => (
                  <DropdownMenuRadioItem key={s} value={s}>
                    <StatusIcon status={s} /> {STATUS[s].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete
                <DropdownMenuShortcut>Del</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            Status: <StatusIcon status={status} /> {STATUS[status].label}
          </span>
        </Row>
      </Panel>

      <ContextMenuPanel />
    </Section>
  )
}
