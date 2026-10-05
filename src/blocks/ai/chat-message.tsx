import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon, ArrowLeft01Icon, ArrowRight01Icon, Copy01Icon, CornerDownRightIcon, FileTextIcon, Globe02Icon, PencilEdit02Icon, RefreshIcon, SparklesIcon, StopCircleIcon, ThumbsDownIcon, ThumbsUpIcon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { FileChip } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { Mention } from '@/components/mention'
import type { Citation } from '@/blocks/markdown'
import { useCopied } from '@/lib/clipboard'
import { plural } from '@/lib/text'

// The pieces of a chat with an AI, as plain layouts: the person's message
// (with attachments, mentions and an inline edit), the assistant's reply (a
// header, whatever body you give it, and an actions bar), and what a reply can
// hold besides text: sources, an artifact, an error, a "Stopped" note,
// follow-up suggestions, and the "What went wrong?" dialog behind thumbs down.
//
// Nothing here knows about a model or a store: data comes in as props and
// every action goes out as a callback. Some notes show from @md up, so put the
// chat in an @container.


export type ChatFile = {
  id: string
  name: string
  // In bytes.
  size?: number
  // The file type's icon (PDF, sheet…). Defaults to a plain file.
  icon?: IconSvgElement
}

// A leading /command and every match of `mentions` (@names) as mention pills.
function highlight(text: string, mentions?: RegExp | null): ReactNode[] {
  const out: ReactNode[] = []
  const command = text.match(/^\/\w+/)
  let rest = text
  if (command) {
    out.push(<Mention key="cmd">{command[0]}</Mention>)
    rest = text.slice(command[0].length)
  }
  if (!mentions) return [...out, rest]
  let last = 0
  let n = 0
  for (const m of rest.matchAll(mentions)) {
    const index = m.index ?? 0
    if (index > last) out.push(rest.slice(last, index))
    out.push(<Mention key={`m${n++}`}>{m[0]}</Mention>)
    last = index + m[0].length
  }
  out.push(rest.slice(last))
  return out
}

// The person's message, on the right. Copy and Edit show on hover (always
// on touch screens); Edit turns the bubble into a box, and Enter sends the
// new text to `onEdit`.
export function UserMessage({ text, attachments = [], mentions, onCopy, onEdit, editNote = 'Sending replaces the replies below', className }: {
  text: string
  attachments?: ChatFile[]
  // Highlights matches as mentions; give it the `g` flag.
  mentions?: RegExp | null
  onCopy?: (text: string) => void
  onEdit?: (text: string) => void
  editNote?: string
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const [copied, flagCopied] = useCopied()

  function save() {
    if (!draft.trim()) return
    setEditing(false)
    onEdit?.(draft.trim())
  }

  return (
    <div className={cn('group/user flex min-w-0 flex-col items-end gap-1', className)}>
      {attachments.length > 0 && (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
          {attachments.map(({ id, ...file }) => <FileChip key={id} {...file} />)}
        </div>
      )}
      {editing ? (
        <div className="bg-card focus-within:border-ring focus-within:ring-ring/30 grid w-full max-w-[85%] gap-2 rounded-2xl border p-2 focus-within:ring-2">
          <textarea
            autoFocus
            aria-label="Edit message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                save()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                setEditing(false)
              }
            }}
            className="field-sizing-content max-h-48 min-h-10 w-full resize-none bg-transparent px-1.5 py-1 text-[13px] outline-none"
          />
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-muted-foreground mr-auto hidden pl-1.5 text-[11px] @md:inline">{editNote}</span>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" disabled={!draft.trim()} onClick={save}>Send</Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted max-w-[85%] min-w-0 rounded-2xl rounded-br-md px-3.5 py-2 text-[13px] leading-relaxed break-words whitespace-pre-wrap">
          {highlight(text, mentions)}
        </div>
      )}
      {!editing && (onCopy || onEdit) && (
        <div className="flex gap-0.5 opacity-0 transition-opacity group-focus-within/user:opacity-100 group-hover/user:opacity-100 [@media(hover:none)]:opacity-100">
          {onCopy && (
            <IconAction
              label={copied ? 'Copied' : 'Copy'}
              icon={copied ? Tick02Icon : Copy01Icon}
              onClick={() => {
                onCopy(text)
                flagCopied()
              }}
            />
          )}
          {onEdit && (
            <IconAction
              label="Edit"
              icon={PencilEdit02Icon}
              onClick={() => {
                setDraft(text)
                setEditing(true)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

// The assistant's reply: a header (icon, name, and `meta` such as how long it
// took), the body, then `actions` (a MessageActions bar, FollowUps…).
export function AssistantMessage({ name, icon = SparklesIcon, meta, label, children, actions, className }: {
  name: string
  icon?: IconSvgElement
  meta?: ReactNode
  // The reply's accessible name. Defaults to "Reply from {name}".
  label?: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <article className={cn('grid min-w-0 gap-3', className)} aria-label={label ?? `Reply from ${name}`}>
      <header className="flex h-5 items-center gap-2 text-xs">
        <span className="bg-brand/10 text-brand grid size-5 shrink-0 place-items-center rounded-full">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3" />
        </span>
        <span className="font-medium">{name}</span>
        {meta && <span className="text-muted-foreground text-[11px] tabular-nums">· {meta}</span>}
      </header>
      {children}
      {actions}
    </article>
  )
}

export type Feedback = 'up' | 'down'

type ActionLabels = { copy: string; copied: string; regenerate: string; up: string; down: string }
const ACTION_LABELS: ActionLabels = { copy: 'Copy', copied: 'Copied', regenerate: 'Regenerate', up: 'Good reply', down: 'Bad reply' }

// The bar under a reply. Each action shows only when its callback is given.
// Thumbs are toggles: `onFeedback` gets the new value, or undefined when the
// pressed one is clicked again. `versions` adds a "2 / 3" pager for
// regenerated replies.
export function MessageActions({ onCopy, onRegenerate, regenerateDisabled, feedback, onFeedback, versions, labels, children, className }: {
  onCopy?: () => void
  onRegenerate?: () => void
  regenerateDisabled?: boolean
  feedback?: Feedback | null
  onFeedback?: (value: Feedback | undefined) => void
  versions?: { current: number; total: number; onChange: (index: number) => void }
  labels?: Partial<ActionLabels>
  // More actions, after the built-in ones.
  children?: ReactNode
  className?: string
}) {
  const [copied, flagCopied] = useCopied()
  const text = { ...ACTION_LABELS, ...labels }
  return (
    <div className={cn('flex flex-wrap items-center gap-0.5', className)}>
      {onCopy && (
        <IconAction
          label={copied ? text.copied : text.copy}
          icon={copied ? Tick02Icon : Copy01Icon}
          onClick={() => {
            onCopy()
            flagCopied()
          }}
        />
      )}
      {onRegenerate && <IconAction label={text.regenerate} icon={RefreshIcon} disabled={regenerateDisabled} onClick={onRegenerate} />}
      {onFeedback && (
        <>
          <IconAction
            label={text.up}
            icon={ThumbsUpIcon}
            pressed={feedback === 'up'}
            onClick={() => onFeedback(feedback === 'up' ? undefined : 'up')}
          />
          <IconAction
            label={text.down}
            icon={ThumbsDownIcon}
            pressed={feedback === 'down'}
            onClick={() => onFeedback(feedback === 'down' ? undefined : 'down')}
          />
        </>
      )}
      {children}
      {versions && versions.total > 1 && (
        <div role="group" aria-label="Reply versions" className="text-muted-foreground ml-1 flex items-center text-[11px]">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Previous version"
            disabled={versions.current === 0}
            onClick={() => versions.onChange(versions.current - 1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <span className="px-0.5 tabular-nums">{versions.current + 1} / {versions.total}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Next version"
            disabled={versions.current === versions.total - 1}
            onClick={() => versions.onChange(versions.current + 1)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </div>
      )}
    </div>
  )
}

// Suggested next questions, as pills under the last reply.
// Also suggested questions before a chat starts, with another label and icon.
export function FollowUps({ items, onPick, label = 'Suggested follow-ups', icon = CornerDownRightIcon, className }: {
  items: string[]
  onPick: (text: string) => void
  label?: string
  icon?: IconSvgElement
  className?: string
}) {
  if (!items.length) return null
  return (
    <div className={cn('flex min-w-0 flex-wrap gap-1.5', className)} role="group" aria-label={label}>
      {items.map((text) => (
        <Button key={text} variant="outline" size="sm" className="h-auto min-h-6 max-w-full rounded-full py-0.5 text-left font-normal whitespace-normal" onClick={() => onPick(text)}>
          <HugeiconsIcon icon={icon} strokeWidth={2} data-icon="inline-start" className="text-muted-foreground" />
          {text}
        </Button>
      ))}
    </div>
  )
}

// "What went wrong?" after a thumbs down: reasons as toggles and a note.
export function FeedbackDialog({ open, onOpenChange, reasons, onSubmit, title = 'What went wrong?', description = 'Pick what fits.' }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reasons: string[]
  onSubmit: (reasons: string[], note: string) => void
  title?: string
  description?: string
}) {
  const [picked, setPicked] = useState<string[]>([])
  const [note, setNote] = useState('')
  const toggle = (reason: string) => setPicked((p) => (p.includes(reason) ? p.filter((r) => r !== reason) : [...p, reason]))
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setPicked([])
          setNote('')
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div role="group" aria-label="Reasons" className="flex flex-wrap gap-1.5">
          {reasons.map((reason) => (
            <Button
              key={reason}
              variant="outline"
              size="sm"
              aria-pressed={picked.includes(reason)}
              onClick={() => toggle(reason)}
              className="aria-pressed:border-brand/40 aria-pressed:bg-brand/10 aria-pressed:text-brand rounded-full font-normal"
            >
              {picked.includes(reason) && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />}
              {reason}
            </Button>
          ))}
        </div>
        <Textarea aria-label="More detail" placeholder="Anything else? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!picked.length && !note.trim()}
            onClick={() => {
              onSubmit(picked, note)
              onOpenChange(false)
              setPicked([])
              setNote('')
            }}
          >
            Send feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// The sources a reply used, as a row of cards numbered like its citations.
export function SourcesRow({ sources, className }: { sources: Citation[]; className?: string }) {
  return (
    <div className={cn('grid min-w-0 gap-1.5', className)}>
      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
        <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-3" />
        {plural(sources.length, 'source')}
      </span>
      <ol className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1">
        {sources.map((source, i) => (
          <li key={source.url} className="w-52 shrink-0">
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:bg-accent/60 focus-visible:ring-ring/30 flex h-full min-w-0 flex-col gap-1.5 rounded-lg border p-2.5 outline-none focus-visible:ring-2"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-[11px]">
                <span aria-hidden="true" className="bg-muted text-muted-foreground grid size-4 shrink-0 place-items-center rounded-[4px] text-[9px] font-semibold uppercase">
                  {source.domain[0]}
                </span>
                <span className="text-muted-foreground min-w-0 truncate">{source.domain}</span>
                <span className="text-muted-foreground ml-auto tabular-nums">{i + 1}</span>
              </span>
              <span className="line-clamp-2 text-xs font-medium">{source.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}

// An artifact the reply made (a document, a table, code), opened beside the
// chat. `active` while it is the one showing.
export function ArtifactCard({ title, icon = FileTextIcon, kind, version, active, onOpen, className }: {
  title: string
  icon?: IconSvgElement
  // What it is, in words: "Document", "Table".
  kind?: string
  version?: number
  active?: boolean
  onOpen: () => void
  className?: string
}) {
  const meta = [kind, version !== undefined && `v${version}`].filter(Boolean).join(' · ')
  return (
    <div className={cn('flex min-w-0 items-center gap-3 rounded-lg border p-2.5', active && 'border-brand/40 bg-brand/5', className)}>
      <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-md">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{title}</p>
        {meta && <p className="text-muted-foreground text-[11px]">{meta}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={onOpen} aria-label={version !== undefined ? `Open ${title}, version ${version}` : `Open ${title}`}>
        {active ? 'Showing' : 'Open'}
      </Button>
    </div>
  )
}

export function ErrorCard({ message, detail, onRetry, className }: {
  message: string
  detail?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div role="alert" className={cn('border-destructive/30 bg-destructive/5 flex min-w-0 flex-wrap items-start gap-2.5 rounded-lg border p-3', className)}>
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive mt-0.5 size-4 shrink-0" />
      <div className="grid min-w-0 flex-1 gap-0.5 text-xs">
        <p className="font-medium">{message}</p>
        {detail && <p className="text-muted-foreground">{detail}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
          Retry
        </Button>
      )}
    </div>
  )
}

// Shown when the person stopped the reply.
export function StoppedNote({ children = 'Stopped', className }: { children?: ReactNode; className?: string }) {
  return (
    <p className={cn('text-muted-foreground flex items-center gap-1.5 text-xs', className)}>
      <HugeiconsIcon icon={StopCircleIcon} strokeWidth={2} className="size-3.5" /> {children}
    </p>
  )
}
