import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon, ArrowLeft01Icon, ArrowRight01Icon, BookOpen01Icon, Copy01Icon, CornerDownRightIcon, FileTextIcon, GitBranchIcon,
  Globe02Icon, MoreHorizontalIcon, PencilEdit02Icon, RefreshIcon, SparklesIcon, StopCircleIcon, StopIcon, ThumbsDownIcon,
  ThumbsUpIcon, Tick02Icon, VolumeHighIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { FileChip } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { Mention } from '@/components/mention'
import { SourceMark, citationMeta, isDocumentCitation, type Citation } from '@/blocks/markdown'
import { useCopied } from '@/lib/clipboard'
import { plural } from '@/lib/text'

// The pieces of a chat with an AI, as plain layouts: the person's message
// (with attachments, mentions and an inline edit), the assistant's reply (a
// header, whatever body you give it, and an actions bar), and what a reply can
// hold besides text: sources, an artifact, an error, a "Stopped" note,
// follow-up suggestions, and the "What went wrong?" dialog behind thumbs down.
// An edited message can keep its branches ("‹ 1 / 2 ›"), any message can be
// branched into a new chat, and a reply can be read aloud (useReadAloud).
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

// A version pager: "‹ 2 / 3 ›". For regenerated replies and edited messages.
export type VersionPagerProps = { current: number; total: number; onChange: (index: number) => void }

function VersionPager({ current, total, onChange, label, noun, className }: VersionPagerProps & {
  label: string
  // "version" or "branch", for the arrows' names.
  noun: string
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('text-muted-foreground flex items-center text-[11px]', className)}>
      <Button variant="ghost" size="icon-xs" aria-label={`Previous ${noun}`} disabled={current === 0} onClick={() => onChange(current - 1)}>
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
      </Button>
      <span className="px-0.5 tabular-nums" aria-live="polite">
        <span className="sr-only">{noun} </span>{current + 1} / {total}
      </span>
      <Button variant="ghost" size="icon-xs" aria-label={`Next ${noun}`} disabled={current === total - 1} onClick={() => onChange(current + 1)}>
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
      </Button>
    </div>
  )
}

// "More actions" on a message: a menu of whatever else it offers.
function MoreActions({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconAction label={label} icon={MoreHorizontalIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

function BranchItem({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect}>
      <HugeiconsIcon icon={GitBranchIcon} strokeWidth={2} /> {label}
    </DropdownMenuItem>
  )
}

// The person's message, on the right. Copy and Edit show on hover (always
// on touch screens); Edit turns the bubble into a box, and Enter sends the
// new text to `onEdit`. When an edit keeps the old conversation as a branch,
// `branches` shows "‹ 1 / 2 ›" to switch between them (always visible), and
// `onBranch` adds Branch in new chat to a More actions menu.
export function UserMessage({
  text, attachments = [], mentions, onCopy, onEdit, editNote = 'Sending replaces the replies below', branches, onBranch,
  branchLabel = 'Branch in new chat', className,
}: {
  text: string
  attachments?: ChatFile[]
  // Highlights matches as mentions; give it the `g` flag.
  mentions?: RegExp | null
  onCopy?: (text: string) => void
  onEdit?: (text: string) => void
  editNote?: string
  branches?: VersionPagerProps
  onBranch?: () => void
  branchLabel?: string
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const [copied, flagCopied] = useCopied()
  const hasBranches = !!branches && branches.total > 1

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
      {!editing && (onCopy || onEdit || onBranch || hasBranches) && (
        <div className="flex items-center gap-0.5">
          {(onCopy || onEdit || onBranch) && (
            <div className="flex gap-0.5 opacity-0 transition-opacity group-focus-within/user:opacity-100 group-hover/user:opacity-100 has-[[data-state=open]]:opacity-100 [@media(hover:none)]:opacity-100">
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
              {onBranch && (
                <MoreActions label="More actions">
                  <BranchItem label={branchLabel} onSelect={onBranch} />
                </MoreActions>
              )}
            </div>
          )}
          {branches && hasBranches && <VersionPager {...branches} label="Message branches" noun="branch" />}
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

type ActionLabels = {
  copy: string
  copied: string
  regenerate: string
  up: string
  down: string
  readAloud: string
  stopReading: string
  more: string
  branch: string
}
const ACTION_LABELS: ActionLabels = {
  copy: 'Copy',
  copied: 'Copied',
  regenerate: 'Regenerate',
  up: 'Good reply',
  down: 'Bad reply',
  readAloud: 'Read aloud',
  stopReading: 'Stop reading',
  more: 'More actions',
  branch: 'Branch in new chat',
}

// The bar under a reply. Each action shows only when its callback is given.
// Thumbs are toggles: `onFeedback` gets the new value, or undefined when the
// pressed one is clicked again. `readAloud` is a toggle too, pressed while
// the reply is being read (useReadAloud does the speaking; leave it out when
// the browser cannot speak). `onBranch` and `menu` fill a More actions menu.
// `versions` adds a "2 / 3" pager for regenerated replies.
export function MessageActions({
  onCopy, onRegenerate, regenerateDisabled, feedback, onFeedback, readAloud, onBranch, menu, versions, labels, children,
  className,
}: {
  onCopy?: () => void
  onRegenerate?: () => void
  regenerateDisabled?: boolean
  feedback?: Feedback | null
  onFeedback?: (value: Feedback | undefined) => void
  readAloud?: { reading: boolean; onToggle: () => void }
  onBranch?: () => void
  // More menu items (DropdownMenuItem), after Branch in new chat.
  menu?: ReactNode
  versions?: VersionPagerProps
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
      {readAloud && (
        <IconAction
          label={readAloud.reading ? text.stopReading : text.readAloud}
          icon={readAloud.reading ? StopIcon : VolumeHighIcon}
          pressed={readAloud.reading}
          onClick={readAloud.onToggle}
        />
      )}
      {children}
      {(onBranch || menu) && (
        <MoreActions label={text.more}>
          {onBranch && <BranchItem label={text.branch} onSelect={onBranch} />}
          {menu}
        </MoreActions>
      )}
      {versions && versions.total > 1 && <VersionPager {...versions} label="Reply versions" noun="version" className="ml-1" />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Read aloud: a reply spoken by the browser (speechSynthesis). One reply is
// read at a time: starting another stops the first.

export const canReadAloud = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

// Markdown as something worth hearing: no symbols, link text without the
// address, no citation numbers, code blocks named rather than read out, and
// a full stop after a line (a heading, a list item) that has none.
export function speakableText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, '\nCode block.\n')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]*\[\d+\]/g, '')
    .replace(/^[ \t]*\|?[ \t:|-]+\|[ \t:|-]*$/gm, '')
    .replace(/[ \t]*\|[ \t]*/g, ', ')
    .replace(/^\s*(#{1,6}|[-*+]|\d+\.|>)\s+/gm, '')
    .replace(/[*_~`#]+/g, '')
    .split('\n')
    .map((line) => line.replace(/^,\s*|,\s*$/g, '').trim())
    .filter(Boolean)
    .map((line) => (/[.!?:;]$/.test(line) ? line : `${line}.`))
    .join(' ')
}

// Some browsers stop a long utterance part way, so the text is read in
// sentence-sized pieces.
function chunks(text: string, max = 220) {
  const out: string[] = []
  let current = ''
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (current && current.length + sentence.length + 1 > max) {
      out.push(current)
      current = sentence
    } else current = current ? `${current} ${sentence}` : sentence
  }
  if (current) out.push(current)
  return out
}

// The reader speaking now, so another can stop it.
let speaking: { id: object; stop: () => void } | null = null

// Reads text aloud. `voice` picks the first system voice whose name holds it
// ("Aria"); when none matches, `pitch` is used instead so voices still
// differ. `rate` is the speed (1 is normal). Stops on unmount.
export function useReadAloud({ voice, rate = 1, pitch = 1 }: { voice?: string; rate?: number; pitch?: number } = {}) {
  const [reading, setReading] = useState(false)
  const run = useRef<object | null>(null)
  const supported = canReadAloud()

  const stop = useCallback(() => {
    const own = run.current
    if (!own) return
    run.current = null
    setReading(false)
    if (speaking?.id === own) {
      speaking = null
      window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => stop, [stop])

  const start = useCallback((text: string) => {
    if (!canReadAloud()) return
    speaking?.stop()
    window.speechSynthesis.cancel()
    const pieces = chunks(speakableText(text))
    if (!pieces.length) return
    const id = {}
    const done = () => {
      if (run.current === id) {
        run.current = null
        setReading(false)
      }
      if (speaking?.id === id) speaking = null
    }
    const match = voice
      ? window.speechSynthesis.getVoices().find((v) => v.name.toLowerCase().includes(voice.toLowerCase()))
      : undefined
    pieces.forEach((piece, i) => {
      const utterance = new SpeechSynthesisUtterance(piece)
      utterance.rate = rate
      if (match) {
        utterance.voice = match
        utterance.lang = match.lang
      } else utterance.pitch = pitch
      utterance.onerror = done
      if (i === pieces.length - 1) utterance.onend = done
      window.speechSynthesis.speak(utterance)
    })
    run.current = id
    speaking = { id, stop }
    setReading(true)
  }, [voice, rate, pitch, stop])

  const toggle = useCallback((text: string) => {
    if (run.current) stop()
    else start(text)
  }, [start, stop])

  return { supported, reading, start, stop, toggle }
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

const SOURCE_CARD = 'flex h-full w-full min-w-0 flex-col gap-1.5 rounded-lg border p-2.5 text-left outline-none'
const SOURCE_CARD_ACTIVE = 'hover:bg-accent/60 focus-visible:ring-ring/30 focus-visible:ring-2'

// The sources a reply used, as a row of cards numbered like its citations. A
// web page opens in a new tab. A document (a project file, a knowledge base's
// page) shows its file icon, name and page, and a click calls `onOpen` with
// its index, to show the passage in a source panel.
export function SourcesRow({ sources, onOpen, className }: {
  sources: Citation[]
  onOpen?: (index: number) => void
  className?: string
}) {
  const documents = sources.filter(isDocumentCitation).length
  return (
    <div className={cn('grid min-w-0 gap-1.5', className)}>
      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
        <HugeiconsIcon icon={documents === sources.length ? BookOpen01Icon : Globe02Icon} strokeWidth={2} className="size-3" />
        {plural(sources.length, 'source')}
      </span>
      <ol className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1">
        {sources.map((source, i) => {
          const document = isDocumentCitation(source)
          const top = (
            <span className="flex min-w-0 items-center gap-1.5 text-[11px]">
              <SourceMark source={source} />
              <span className="text-muted-foreground min-w-0 truncate">{document ? source.from ?? source.domain : source.domain}</span>
              <span className="text-muted-foreground ml-auto tabular-nums">{i + 1}</span>
            </span>
          )
          const title = (
            <span className="line-clamp-2 text-xs font-medium">
              {source.title}
              {document && source.page !== undefined && <span className="text-muted-foreground font-normal"> · p. {source.page}</span>}
            </span>
          )
          return (
            <li key={`${i}-${source.url || source.title}`} className="w-52 shrink-0">
              {!document ? (
                <a href={source.url} target="_blank" rel="noreferrer noopener" className={cn(SOURCE_CARD, SOURCE_CARD_ACTIVE)}>
                  {top}
                  {title}
                </a>
              ) : onOpen ? (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Source ${i + 1}: ${source.title}, ${citationMeta(source)}. Show the passage`}
                  onClick={() => onOpen(i)}
                  className={cn(SOURCE_CARD, SOURCE_CARD_ACTIVE)}
                >
                  {top}
                  {title}
                </button>
              ) : (
                <div className={SOURCE_CARD}>
                  {top}
                  {title}
                </div>
              )}
            </li>
          )
        })}
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
