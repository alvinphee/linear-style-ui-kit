import { HugeiconsIcon } from '@hugeicons/react'
import { Archive01Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { StatusIcon } from '@/components/status-icon'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { type Status } from '../data'
import { Panel, Row, Section } from './shared'

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

export default function DialogsSection() {
  return (
    <Section id="dialogs" title="Dialogs" description="Dialogs, alert dialogs, and confirming before a delete">
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

      <ConfirmPanel />
    </Section>
  )
}
