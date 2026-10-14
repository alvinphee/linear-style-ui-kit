import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  BubbleChatIcon, Building06Icon, Camera01Icon, Copy01Icon, FileTextIcon, Globe02Icon, Link01Icon, LiveStreaming01Icon,
  Tick02Icon, Unlink02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { copyText, useCopied } from '@/lib/clipboard'
import { formatAgo } from '@/lib/format'
import { plural } from '@/lib/text'

// Share a chat with an AI as a link, as the big chat apps do. A snapshot
// link shows the chat as it is now (later messages are not shared until the
// link is updated); a live link shows new messages too. Choose whether the
// chat's artifacts go with it and who can open it, see a preview of what
// they will see, then create the link, copy it, update it or revoke it.
// The app keeps the link and builds its address; the dialog reports each
// change.

// Snapshot: the chat as it is when the link is made. Live: as it is whenever
// the link is opened.
export type ShareChatMode = 'snapshot' | 'live'

// Who can open the link: anyone who has it, or only people signed in to the
// organisation.
export type ShareChatAccess = 'link' | 'organisation'

export type ShareChatOptions = { mode: ShareChatMode; access: ShareChatAccess; includeArtifacts: boolean }

export type ShareChatLink = {
  url: string
  createdAt: number | Date
  mode: ShareChatMode
  access?: ShareChatAccess
  includeArtifacts?: boolean
  // How many messages a snapshot holds, to say when the chat has moved on.
  messageCount?: number
  views?: number
}

export type ShareChatDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  chat: { title: string; messageCount: number; hasArtifacts: boolean }
  // The chat's link, once it has one.
  link?: ShareChatLink | null
  // Who shared it, for the preview: "Shared by …". Left out: no byline.
  sharedBy?: string
  organisation?: string
  // The time "Created 5 min ago" is measured from. Defaults to the clock.
  now?: number
  onCreate: (options: ShareChatOptions) => void
  // Changes the link's options (and retakes a snapshot). Left out: an
  // existing link's options are read only.
  onUpdate?: (options: ShareChatOptions) => void
  onRevoke: () => void
  // After the link is copied.
  onCopy?: (url: string) => void
  // False when the organisation only lets chats be shared with its people:
  // "Anyone with the link" is left out.
  allowPublic?: boolean
  className?: string
}

const DEFAULTS: ShareChatOptions = { mode: 'snapshot', access: 'link', includeArtifacts: true }

const optionsOf = (link: ShareChatLink): ShareChatOptions => ({
  mode: link.mode,
  access: link.access ?? DEFAULTS.access,
  includeArtifacts: link.includeArtifacts ?? DEFAULTS.includeArtifacts,
})

type Choice<T extends string> = { value: T; title: string; hint: string; icon: IconSvgElement }

// Two or more options as radio cards, one column on a phone.
function ChoiceCards<T extends string>({ label, value, options, disabled, onChange }: {
  label: string
  value: T
  options: Choice<T>[]
  disabled?: boolean
  onChange: (value: T) => void
}) {
  const id = useId()
  return (
    <div className="grid min-w-0 gap-1.5">
      <p id={`${id}-label`} className="text-muted-foreground text-[11px] font-medium">{label}</p>
      <RadioGroup
        aria-labelledby={`${id}-label`}
        value={value}
        onValueChange={(v) => onChange(v as T)}
        disabled={disabled}
        className="grid-cols-1 gap-1.5 @sm:grid-cols-2"
      >
        {options.map((o) => (
          <FieldLabel key={o.value} htmlFor={`${id}-${o.value}`} className="min-w-0">
            <Field orientation="horizontal" data-disabled={disabled || undefined} className="items-start">
              <RadioGroupItem value={o.value} id={`${id}-${o.value}`} className="mt-0.5" />
              <FieldContent className="min-w-0">
                <FieldTitle className="text-xs">
                  <HugeiconsIcon icon={o.icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                  {o.title}
                </FieldTitle>
                <FieldDescription className="text-[11px] leading-4">{o.hint}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </div>
  )
}

function Fact({ icon, children }: { icon: IconSvgElement; children: ReactNode }) {
  return (
    <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1 text-[11px]">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}

export function ShareChatDialog({ open, onOpenChange, className, ...props }: ShareChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg', className)}>
        {/* Mounted while open, so the choices start from the link each time it opens. */}
        <ShareChatBody {...props} />
      </DialogContent>
    </Dialog>
  )
}

function ShareChatBody({
  chat, link, sharedBy, organisation = 'your organisation', now, onCreate, onUpdate, onRevoke, onCopy, allowPublic = true,
}: Omit<ShareChatDialogProps, 'open' | 'onOpenChange' | 'className'>) {
  const [options, setOptions] = useState<ShareChatOptions>(() => {
    const start = link ? optionsOf(link) : DEFAULTS
    return allowPublic ? start : { ...start, access: 'organisation' }
  })
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [copied, flagCopied] = useCopied()
  // Revoking removes the button that asked; focus moves to Create link.
  const createRef = useRef<HTMLButtonElement>(null)
  // Creating one does too; focus moves to Copy.
  const copyRef = useRef<HTMLButtonElement>(null)
  const hadLink = useRef(!!link)
  useEffect(() => {
    if (link && !hadLink.current) copyRef.current?.focus()
    hadLink.current = !!link
  }, [link])
  const set = <K extends keyof ShareChatOptions>(key: K, value: ShareChatOptions[K]) => setOptions((o) => ({ ...o, [key]: value }))

  const locked = !!link && !onUpdate
  const saved = link ? optionsOf(link) : null
  const changed = !!saved && (saved.mode !== options.mode || saved.access !== options.access || saved.includeArtifacts !== options.includeArtifacts)
  // A snapshot misses what was said after it.
  const missed = link?.mode === 'snapshot' && link.messageCount !== undefined ? Math.max(0, chat.messageCount - link.messageCount) : 0
  const shownCount = link?.mode === 'snapshot' && options.mode === 'snapshot' && !changed && link.messageCount !== undefined
    ? link.messageCount
    : chat.messageCount
  const withArtifacts = chat.hasArtifacts && options.includeArtifacts

  async function copy() {
    if (!link) return
    if (await copyText(link.url, { success: false })) {
      flagCopied()
      onCopy?.(link.url)
    }
  }

  return (
    <>
      <DialogHeader className="px-4 pt-4 pb-3 pr-10">
        <DialogTitle>{link ? 'Chat shared' : 'Share chat'}</DialogTitle>
        <DialogDescription>
          {link
            ? 'Anyone who can open the link reads this chat. They cannot reply in it or see your other chats.'
            : 'Make a link to this chat. People who open it can read it, but cannot reply or see your other chats.'}
        </DialogDescription>
      </DialogHeader>

      <div className="@container grid min-w-0 gap-4 px-4 pb-4">
        {/* What they will see */}
        <section aria-label="Preview" className="bg-muted/40 grid min-w-0 gap-1.5 rounded-lg border p-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-background grid size-7 shrink-0 place-items-center rounded-md border">
              <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{chat.title}</p>
              <p className="text-muted-foreground truncate text-[11px]">
                {plural(shownCount, 'message')}
                {sharedBy && <> · Shared by {sharedBy}</>}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
            <Fact icon={options.mode === 'snapshot' ? Camera01Icon : LiveStreaming01Icon}>
              {options.mode === 'snapshot' ? 'Snapshot' : 'Live'}
            </Fact>
            <Fact icon={options.access === 'link' ? Globe02Icon : Building06Icon}>
              {options.access === 'link' ? 'Anyone with the link' : `People at ${organisation}`}
            </Fact>
            {chat.hasArtifacts && (
              <Fact icon={FileTextIcon}>{withArtifacts ? 'Artifacts included' : 'Without artifacts'}</Fact>
            )}
          </div>
        </section>

        <ChoiceCards
          label="What they see"
          value={options.mode}
          disabled={locked}
          onChange={(v) => set('mode', v)}
          options={[
            { value: 'snapshot', title: 'Snapshot', hint: 'The chat as it is now. Later messages are not shared.', icon: Camera01Icon },
            { value: 'live', title: 'Live', hint: 'New messages show up for them too.', icon: LiveStreaming01Icon },
          ]}
        />

        <ChoiceCards
          label="Who can open it"
          value={options.access}
          disabled={locked}
          onChange={(v) => set('access', v)}
          options={[
            ...(allowPublic ? [{ value: 'link' as const, title: 'Anyone with the link', hint: 'No sign-in needed.', icon: Globe02Icon }] : []),
            {
              value: 'organisation', title: `People at ${organisation}`, icon: Building06Icon,
              hint: allowPublic ? 'They sign in to open it.' : `They sign in to open it. ${organisation} doesn't allow links for anyone else.`,
            },
          ]}
        />

        <ArtifactsSwitch
          checked={withArtifacts}
          disabled={locked || !chat.hasArtifacts}
          hint={chat.hasArtifacts ? 'Documents, tables and code the chat made.' : 'This chat has no artifacts.'}
          onChange={(v) => set('includeArtifacts', v)}
        />

        {link && (
          <div className="grid min-w-0 gap-1.5">
            <div className="flex min-w-0 gap-1.5">
              <Input
                readOnly
                aria-label="Shared link"
                value={link.url}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 font-mono text-[11px]"
              />
              <Button ref={copyRef} variant="outline" onClick={copy} className="shrink-0">
                <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} data-icon="inline-start" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Created {formatAgo(+link.createdAt, now)}
              {link.views !== undefined && <> · {link.views ? plural(link.views, 'view') : 'No views yet'}</>}
              {missed > 0 && <> · {plural(missed, 'newer message')} not in the snapshot{onUpdate ? '. Update the link to add them.' : ''}</>}
            </p>
          </div>
        )}
      </div>

      <DialogFooter className="bg-muted/40 flex-row flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
        {link ? (
          <>
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmRevoke(true)}>
              <HugeiconsIcon icon={Unlink02Icon} strokeWidth={2} data-icon="inline-start" />
              Revoke link
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              {onUpdate && (changed || missed > 0) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onUpdate(options)
                    // The button goes once the link matches; focus stays in the dialog.
                    requestAnimationFrame(() => copyRef.current?.focus())
                  }}
                >
                  Update link
                </Button>
              )}
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </div>
          </>
        ) : (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button ref={createRef} onClick={() => onCreate({ ...options, includeArtifacts: withArtifacts })}>
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} data-icon="inline-start" />
              Create link
            </Button>
          </div>
        )}
      </DialogFooter>

      <DeleteConfirm
        open={confirmRevoke}
        onOpenChange={setConfirmRevoke}
        size="sm"
        icon={Unlink02Icon}
        title="Revoke this link?"
        description="The link stops working for everyone who has it. The chat stays in your history."
        confirmLabel="Revoke link"
        onConfirm={onRevoke}
        afterConfirm={() => createRef.current?.focus()}
      />
    </>
  )
}

function ArtifactsSwitch({ checked, disabled, hint, onChange }: {
  checked: boolean
  disabled?: boolean
  hint: string
  onChange: (value: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="grid min-w-0 gap-0.5">
        <label htmlFor={id} className={cn('text-xs font-medium', disabled && 'opacity-50')}>Include artifacts</label>
        <p id={`${id}-hint`} className="text-muted-foreground text-[11px]">{hint}</p>
      </div>
      <Switch id={id} aria-describedby={`${id}-hint`} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}
