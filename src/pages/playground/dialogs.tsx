import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon, Archive01Icon, Delete02Icon, MoreHorizontalIcon, PencilEdit02Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconAction } from '@/components/icon-action'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Demos, Gallery, Playground, Variants, bool, element, imports, jsx, str } from './Playground'

const ALERT_SIZES = ['default', 'sm'] as const

const DIALOG_FOOTERS = ['actions', 'close button', 'none'] as const

type AlertSize = (typeof ALERT_SIZES)[number]

// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)

// jsx() quotes every string, so a value written as '{…}' is turned back into an expression.
const expr = (snippet: string) => snippet.replace(/="\{([^"]*)\}"/g, '={$1}')

const pick = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

const ICON = (name: string, inline?: 'inline-start' | 'inline-end') =>
  `<HugeiconsIcon icon={${name}} strokeWidth={2}${inline ? ` data-icon="${inline}"` : ''} />`

/* Dialog */

const RELEASE_NOTES = [
  'Search now covers comments and attachments.',
  'Saved views can be shared with a team.',
  'Keyboard shortcuts work inside the issue sidebar.',
  'Board columns remember their collapsed state.',
  'Bulk edit supports labels and due dates.',
  'Faster sync when you come back online.',
  'New webhooks for project updates.',
  'Exports include custom fields.',
  'Dark mode contrast is higher on charts.',
  'Cycle reports show scope changes.',
  'Mentions suggest people from the same team first.',
  'The command menu finds settings pages.',
]

function GalleryDialog({ trigger, title, description, className, showCloseButton, children, footer = true }: {
  trigger: string
  title: string
  description: string
  className?: string
  showCloseButton?: boolean
  children?: ReactNode
  footer?: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{trigger}</Button>
      </DialogTrigger>
      <DialogContent className={className} showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {footer && (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Continue</Button>
            </DialogClose>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DialogDemos() {
  return (
    <>
      <Playground
        title="Dialog"
        description="Close button, footer and title"
        controls={[
          { kind: 'text', name: 'title', label: 'Title', initial: 'Rename project' },
          { kind: 'select', name: 'footer', label: 'Footer', options: DIALOG_FOOTERS, initial: 'actions' },
          { kind: 'switch', name: 'close', label: 'Close button', initial: true },
        ]}
        render={(v) => {
          const footer = str(v, 'footer')
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
                  Rename
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={bool(v, 'close')}>
                <DialogHeader>
                  <DialogTitle>{str(v, 'title') || 'Rename project'}</DialogTitle>
                  <DialogDescription>The name shows in the sidebar and in links.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-1.5">
                  <Label htmlFor="playground-project-name">Name</Label>
                  <Input id="playground-project-name" defaultValue="Website refresh" />
                </div>
                {footer === 'actions' && (
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={() => toast.success('Project renamed', { description: 'Demo only.' })}>Save</Button>
                    </DialogClose>
                  </DialogFooter>
                )}
                {footer === 'close button' && <DialogFooter showCloseButton />}
              </DialogContent>
            </Dialog>
          )
        }}
        code={(v) => {
          const footer = str(v, 'footer')
          const actions = footer === 'actions'
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['PencilEdit02Icon'],
            '@/components/ui/button': ['Button'],
            '@/components/ui/dialog': pick(
              'Dialog', actions && 'DialogClose', 'DialogContent', 'DialogDescription', footer !== 'none' && 'DialogFooter',
              'DialogHeader', 'DialogTitle', 'DialogTrigger',
            ),
            '@/components/ui/input': ['Input'],
            '@/components/ui/label': ['Label'],
          })
          const body = jsx('Dialog', {}, [
            jsx('DialogTrigger', { asChild: true }, jsx('Button', { variant: 'outline' }, [ICON('PencilEdit02Icon', 'inline-start'), 'Rename'])),
            jsx('DialogContent', { showCloseButton: bool(v, 'close') ? undefined : '{false}' }, [
              jsx('DialogHeader', {}, [
                `<DialogTitle>${str(v, 'title') || 'Rename project'}</DialogTitle>`,
                '<DialogDescription>The name shows in the sidebar and in links.</DialogDescription>',
              ]),
              jsx('div', { className: 'grid gap-1.5' }, [
                '<Label htmlFor="project-name">Name</Label>',
                '<Input id="project-name" defaultValue="Website refresh" />',
              ]),
              actions ? jsx('DialogFooter', {}, [
                jsx('DialogClose', { asChild: true }, '<Button variant="outline">Cancel</Button>'),
                jsx('DialogClose', { asChild: true }, '<Button>Save</Button>'),
              ]) : '',
              footer === 'close button' ? '<DialogFooter showCloseButton />' : '',
            ]),
          ])
          return `${head}\n\n${expr(body)}`
        }}
      />

      <Gallery
        title="Dialog layouts"
        note="Width, long content and no close button"
        items={[
          {
            label: 'sm:max-w-lg',
            node: (
              <GalleryDialog
                trigger="Wide"
                title="Invite people"
                description="They get an email with a link to join the workspace."
                className="sm:max-w-lg"
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="gallery-invite">Emails</Label>
                  <Input id="gallery-invite" placeholder="sam@example.com, kim@example.com" />
                </div>
              </GalleryDialog>
            ),
          },
          {
            label: 'scrolling body',
            node: (
              <GalleryDialog
                trigger="Long content"
                title="What's new"
                description="Changes in the last release."
                className="max-h-[min(30rem,85vh)] grid-rows-[auto_minmax(0,1fr)_auto]"
              >
                <ul className="text-muted-foreground -mx-4 grid list-disc gap-2 overflow-y-auto border-y py-3 pr-4 pl-8">
                  {RELEASE_NOTES.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </GalleryDialog>
            ),
          },
          {
            label: 'showCloseButton={false}',
            node: (
              <GalleryDialog
                trigger="No ×"
                title="Leave without saving?"
                description="Your draft is kept for 7 days."
                showCloseButton={false}
              />
            ),
          },
        ]}
      />
    </>
  )
}

/* Alert dialog */

function AlertDialogPreview({ size, media, title, compact }: { size: AlertSize; media: boolean; title: string; compact?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {compact ? (
          <Button variant="outline" size="sm">Open</Button>
        ) : (
          <Button variant="destructive">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
            Delete project
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          {media && (
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>Its 42 issues and their comments go with it. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => toast('Project deleted', { description: 'Demo only. Nothing was removed.' })}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AlertDialogDemos() {
  return (
    <>
      <Playground
        title="Alert dialog"
        description="A confirm that a click outside does not close"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: ALERT_SIZES, initial: 'default' },
          { kind: 'text', name: 'title', label: 'Title', initial: 'Delete this project?' },
          { kind: 'switch', name: 'media', label: 'Icon', initial: true },
        ]}
        render={(v) => (
          <AlertDialogPreview size={str(v, 'size') as AlertSize} media={bool(v, 'media')} title={str(v, 'title') || 'Delete this project?'} />
        )}
        code={(v) => {
          const media = bool(v, 'media')
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': pick(media && 'Alert02Icon', 'Delete02Icon'),
            '@/components/ui/alert-dialog': pick(
              'AlertDialog', 'AlertDialogAction', 'AlertDialogCancel', 'AlertDialogContent', 'AlertDialogDescription',
              'AlertDialogFooter', 'AlertDialogHeader', media && 'AlertDialogMedia', 'AlertDialogTitle', 'AlertDialogTrigger',
            ),
            '@/components/ui/button': ['Button'],
          })
          const body = jsx('AlertDialog', {}, [
            jsx('AlertDialogTrigger', { asChild: true }, jsx('Button', { variant: 'destructive' }, [ICON('Delete02Icon', 'inline-start'), 'Delete project'])),
            jsx('AlertDialogContent', { size: unless(str(v, 'size'), 'default') }, [
              jsx('AlertDialogHeader', {}, [
                media ? jsx('AlertDialogMedia', { className: 'bg-destructive/10 text-destructive dark:bg-destructive/20' }, ICON('Alert02Icon')) : '',
                `<AlertDialogTitle>${str(v, 'title') || 'Delete this project?'}</AlertDialogTitle>`,
                '<AlertDialogDescription>Its 42 issues and their comments go with it. This cannot be undone.</AlertDialogDescription>',
              ]),
              jsx('AlertDialogFooter', {}, [
                '<AlertDialogCancel>Cancel</AlertDialogCancel>',
                '<AlertDialogAction variant="destructive">Delete</AlertDialogAction>',
              ]),
            ]),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Alert dialog sizes"
        note="size × media · click to open"
        rows={{ name: 'size', values: ALERT_SIZES }}
        cols={{ name: 'media', values: ['icon', 'none'] as const }}
        render={(size, media) => <AlertDialogPreview size={size} media={media === 'icon'} title="Delete this project?" compact />}
      />
    </>
  )
}

/* DeleteConfirm: the kit's confirm step, built on the alert dialog */

const CONFIRM_ICONS = {
  trash: { icon: Delete02Icon, name: 'Delete02Icon' },
  archive: { icon: Archive01Icon, name: 'Archive01Icon' },
  none: { icon: null, name: '' },
} as const

type ConfirmIcon = keyof typeof CONFIRM_ICONS

const CONFIRM_TEXT = 'Its 42 issues and their comments go with it. This cannot be undone.'

const confirmed = (label: string) => () => toast(label, { description: 'Demo only. Nothing was changed.' })

// Opened from a menu item: there is no trigger to go back to, so focus
// returns to the menu's button once the dialog closes.
function MenuDeleteConfirm() {
  const [open, setOpen] = useState(false)
  const more = useRef<HTMLButtonElement>(null)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconAction ref={more} label="Project actions" icon={MoreHorizontalIcon} variant="outline" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onSelect={confirmed('Renamed')}>
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setOpen(true)}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteConfirm
        open={open}
        onOpenChange={setOpen}
        returnFocusRef={more}
        title="Delete Website refresh?"
        description={CONFIRM_TEXT}
        onConfirm={confirmed('Project deleted')}
      />
    </>
  )
}

function DeleteConfirmDemos() {
  return (
    <>
      <Playground
        title="DeleteConfirm"
        description="The kit's confirm step: one component for any delete"
        controls={[
          { kind: 'text', name: 'title', label: 'Title', initial: 'Delete this project?' },
          { kind: 'text', name: 'confirmLabel', label: 'Confirm label', initial: 'Delete' },
          { kind: 'switch', name: 'destructive', label: 'Destructive', initial: true },
          { kind: 'select', name: 'icon', label: 'Icon', options: Object.keys(CONFIRM_ICONS), initial: 'trash' },
          { kind: 'select', name: 'size', label: 'Size', options: ALERT_SIZES, initial: 'default' },
        ]}
        render={(v) => {
          const confirmLabel = str(v, 'confirmLabel') || 'Delete'
          return (
            <DeleteConfirm
              title={str(v, 'title') || 'Delete this project?'}
              description={CONFIRM_TEXT}
              confirmLabel={confirmLabel}
              destructive={bool(v, 'destructive')}
              icon={CONFIRM_ICONS[str(v, 'icon') as ConfirmIcon].icon}
              size={str(v, 'size') as AlertSize}
              onConfirm={confirmed(confirmLabel)}
            >
              <Button variant="outline">{confirmLabel} project</Button>
            </DeleteConfirm>
          )
        }}
        code={(v) => {
          const icon = str(v, 'icon') as ConfirmIcon
          const confirmLabel = str(v, 'confirmLabel') || 'Delete'
          const head = imports({
            '@hugeicons/core-free-icons': icon === 'archive' ? ['Archive01Icon'] : [],
            '@/components/delete-confirm': ['DeleteConfirm'],
            '@/components/ui/button': ['Button'],
          })
          const body = element('DeleteConfirm', [
            `title="${str(v, 'title') || 'Delete this project?'}"`,
            `description="${CONFIRM_TEXT}"`,
            confirmLabel !== 'Delete' && `confirmLabel="${confirmLabel}"`,
            !bool(v, 'destructive') && 'destructive={false}',
            icon === 'none' ? 'icon={null}' : icon === 'archive' && 'icon={Archive01Icon}',
            unless(str(v, 'size'), 'default') && `size="${str(v, 'size')}"`,
            'onConfirm={deleteProject}',
          ], `<Button variant="outline">${confirmLabel} project</Button>`)
          return `${head}\n\n${body}`
        }}
      />

      <Gallery
        title="DeleteConfirm in use"
        note="Children are the trigger; or drive it with open and onOpenChange"
        items={[
          { label: 'from a menu item', node: <MenuDeleteConfirm /> },
          {
            label: 'milder: destructive={false}',
            node: (
              <DeleteConfirm
                title="Archive Website refresh?"
                description="It leaves the sidebar and stops showing in search. You can restore it from Settings."
                confirmLabel="Archive"
                destructive={false}
                icon={Archive01Icon}
                onConfirm={confirmed('Project archived')}
              >
                <Button variant="outline" size="sm">Archive</Button>
              </DeleteConfirm>
            ),
          },
          {
            label: 'size="sm", icon={null}',
            node: (
              <DeleteConfirm
                title="Remove this label?"
                description="It comes off the 6 issues that have it."
                confirmLabel="Remove"
                icon={null}
                size="sm"
                onConfirm={confirmed('Label removed')}
              >
                <Button variant="outline" size="sm">Remove label</Button>
              </DeleteConfirm>
            ),
          },
        ]}
      />
    </>
  )
}

export default function DialogsDemos() {
  return (
    <Demos>
      <DialogDemos />

      <AlertDialogDemos />

      <DeleteConfirmDemos />
    </Demos>
  )
}
