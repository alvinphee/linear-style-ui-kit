import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CommandIcon, Copy01Icon, Delete02Icon, FilterHorizontalIcon, MoreHorizontalIcon,
  PencilEdit02Icon, UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { STATUS, type Status } from '../data'
import { Panel, Row, Section } from './shared'
import { UserAvatar } from '@/components/person'
import { StatusIcon } from './StatusSection'

export default function OverlaysSection({ onOpenCommand }: { onOpenCommand: () => void }) {
  const [status, setStatus] = useState<Status>('progress')
  const [filters, setFilters] = useState<Record<Status, boolean>>({
    backlog: false, todo: true, progress: true, done: false, cancelled: false,
  })

  return (
    <Section id="overlays" title="Menus and overlays" description="Dropdowns, popovers, dialogs, the command menu and toasts">
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
                  <DropdownMenuShortcut>Ctrl D</DropdownMenuShortcut>
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

      <Panel title="Dialog" note="Confirm before a destructive action">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
              Delete job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete DO-24817?</DialogTitle>
              <DialogDescription>
                Its 3 proof photos go with it. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={() => toast('Job deleted', { description: 'Demo only.' })}>
                  Delete
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Panel>

      <Panel title="Command menu" note="Linear's signature: everything from the keyboard">
        <Row>
          <Button variant="outline" onClick={onOpenCommand}>
            <HugeiconsIcon icon={CommandIcon} strokeWidth={2} data-icon="inline-start" />
            Open command menu
          </Button>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Row>
      </Panel>

      <Panel title="Toasts" note="Sonner" wide>
        <Row>
          <Button variant="outline" onClick={() => toast.success('Proof photos uploaded', { description: '6 photos for DO-24801' })}>
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.info('Driver is 10 minutes away')}>Info</Button>
          <Button variant="outline" onClick={() => toast.warning('2 photos are missing', { description: 'DO-24812 needs a loading photo.' })}>
            Warning
          </Button>
          <Button variant="outline" onClick={() => toast.error('Upload failed', { description: 'Check the connection and try again.' })}>
            Error
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.promise(new Promise((resolve) => setTimeout(resolve, 1800)), {
                loading: 'Generating PDF report…',
                success: 'Report ready',
                error: 'Could not build the report',
              })
            }
          >
            Loading → done
          </Button>
          <Button
            variant="outline"
            onClick={() => toast('Job archived', { action: { label: 'Undo', onClick: () => toast('Restored') } })}
          >
            With undo
          </Button>
        </Row>
      </Panel>
    </Section>
  )
}
