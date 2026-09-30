import { Fragment, memo, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, Copy01Icon, CornerDownRightIcon, PencilEdit02Icon,
  RefreshIcon, SparklesIcon, ThumbsDownIcon, ThumbsUpIcon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useActions } from './context'
import { FILE_ICONS, formatDuration, formatSize, modelById } from './data'
import { copyToClipboard, currentReply, replyText } from './helpers'
import { Markdown } from './markdown'
import {
  ActivityLine, ApprovalCard, ArtifactCard, ErrorCard, PlanBlock, SourcesRow, StoppedNote, ThinkingBlock,
  ToolCard, TypingDots,
} from './parts'
import type { AssistantMessage, FileRef, Part, PartOf, UserMessage } from './types'

export function IconAction({ label, icon, onClick, pressed, disabled, className }: {
  label: string
  icon: IconSvgElement
  onClick: () => void
  pressed?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
          className={cn('text-muted-foreground', pressed && 'bg-muted text-foreground', className)}
        >
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function useCopied() {
  const [copied, setCopied] = useState(false)
  return [copied, (text: string) => {
    copyToClipboard(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }] as const
}

export function FileChip({ file, onRemove }: { file: FileRef; onRemove?: () => void }) {
  return (
    <span className="bg-card inline-flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-md border pr-1 pl-2 text-xs">
      <HugeiconsIcon icon={FILE_ICONS[file.kind]} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{file.name}</span>
      <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{formatSize(file.size)}</span>
      {onRemove ? (
        <Button variant="ghost" size="icon-xs" aria-label={`Remove ${file.name}`} className="text-muted-foreground" onClick={onRemove}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      ) : <span className="w-1" />}
    </span>
  )
}

function highlight(text: string, mentions: RegExp | null): ReactNode[] {
  const out: ReactNode[] = []
  const command = text.match(/^\/\w+/)
  let rest = text
  if (command) {
    out.push(<span key="cmd" className="bg-brand/10 text-brand rounded px-1 py-px font-medium">{command[0]}</span>)
    rest = text.slice(command[0].length)
  }
  if (!mentions) return [...out, rest]
  let last = 0
  let n = 0
  for (const m of rest.matchAll(mentions)) {
    const index = m.index ?? 0
    if (index > last) out.push(rest.slice(last, index))
    out.push(<span key={`m${n++}`} className="bg-brand/10 text-brand rounded px-1 py-px font-medium">{m[0]}</span>)
    last = index + m[0].length
  }
  out.push(rest.slice(last))
  return out
}

export const UserMessageView = memo(function UserMessageView({ chatId, message, mentions }: {
  chatId: string
  message: UserMessage
  mentions: RegExp | null
}) {
  const actions = useActions()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.text)
  const [copied, copy] = useCopied()

  function save() {
    if (!draft.trim()) return
    setEditing(false)
    actions.editMessage(chatId, message.id, draft.trim())
  }

  return (
    <div className="group/user flex min-w-0 flex-col items-end gap-1">
      {message.attachments.length > 0 && (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
          {message.attachments.map((file) => <FileChip key={file.id} file={file} />)}
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
            <span className="text-muted-foreground mr-auto hidden pl-1.5 text-[11px] @md:inline">Sending replaces the replies below</span>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" disabled={!draft.trim()} onClick={save}>Send</Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted max-w-[85%] min-w-0 rounded-2xl rounded-br-md px-3.5 py-2 text-[13px] leading-relaxed break-words whitespace-pre-wrap">
          {highlight(message.text, mentions)}
        </div>
      )}
      {!editing && (
        <div className="flex gap-0.5 opacity-0 transition-opacity group-focus-within/user:opacity-100 group-hover/user:opacity-100 [@media(hover:none)]:opacity-100">
          <IconAction label={copied ? 'Copied' : 'Copy'} icon={copied ? Tick02Icon : Copy01Icon} onClick={() => copy(message.text)} />
          <IconAction
            label="Edit"
            icon={PencilEdit02Icon}
            onClick={() => {
              setDraft(message.text)
              setEditing(true)
            }}
          />
        </div>
      )}
    </div>
  )
})

const REASONS = ['Not accurate', 'Wrong jobs or data', 'Ignored instructions', 'Too long', 'Too slow', 'Other']

function FeedbackDialog({ open, onOpenChange, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reasons: string[], note: string) => void
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
          <DialogTitle>What went wrong?</DialogTitle>
          <DialogDescription>Pick what fits. This demo sends nothing anywhere.</DialogDescription>
        </DialogHeader>
        <div role="group" aria-label="Reasons" className="flex flex-wrap gap-1.5">
          {REASONS.map((reason) => (
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

type Group = { tools: PartOf<'tool'>[]; key: string } | { part: Part; key: string }

function groupParts(parts: Part[]): Group[] {
  const groups: Group[] = []
  for (const part of parts) {
    const last = groups[groups.length - 1]
    if (part.type === 'tool' && last && 'tools' in last) last.tools.push(part)
    else if (part.type === 'tool') groups.push({ tools: [part], key: part.id })
    else groups.push({ part, key: part.id })
  }
  return groups
}

export const AssistantMessageView = memo(function AssistantMessageView({ chatId, message, isLast, openArtifactId }: {
  chatId: string
  message: AssistantMessage
  isLast: boolean
  openArtifactId: string | null
}) {
  const actions = useActions()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [copied, copy] = useCopied()
  const reply = currentReply(message)
  const model = modelById(reply.model ?? message.model)
  const running = reply.status === 'running'
  const settled = !running && reply.status !== 'awaiting'
  const sources = reply.parts.find((p): p is PartOf<'sources'> => p.type === 'sources')?.sources
  const lastPart = reply.parts[reply.parts.length - 1]
  const streaming = lastPart?.type === 'text' && lastPart.streaming
  const address = [chatId, message.id, reply.id] as const

  function renderPart(part: Part) {
    switch (part.type) {
      case 'thinking':
        return <ThinkingBlock part={part} />
      case 'plan':
        return <PlanBlock part={part} />
      case 'tool':
        return <ToolCard part={part} />
      case 'approval':
        return <ApprovalCard part={part} onDecide={(decision) => actions.decide(...address, part.id, decision)} />
      case 'text':
        return <Markdown text={part.text} streaming={part.streaming} sources={sources} />
      case 'sources':
        return <SourcesRow sources={part.sources} />
      case 'artifact':
        return (
          <ArtifactCard
            part={part}
            active={openArtifactId === part.artifactId}
            onOpen={() => actions.openArtifact(part.artifactId, part.version)}
          />
        )
      case 'error':
        return <ErrorCard part={part} onRetry={isLast ? () => actions.regenerate(chatId, message.id) : undefined} />
    }
  }

  return (
    <article className="grid min-w-0 gap-3" aria-label={`Reply from ${model.name}`}>
      <header className="flex h-5 items-center gap-2 text-xs">
        <span className="bg-brand/10 text-brand grid size-5 shrink-0 place-items-center rounded-full">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3" />
        </span>
        <span className="font-medium">{model.name}</span>
        {reply.finishedAt !== undefined && settled && (
          <span className="text-muted-foreground text-[11px] tabular-nums">· {formatDuration(reply.finishedAt - reply.startedAt)}</span>
        )}
      </header>

      {running && reply.parts.length === 0 && <TypingDots />}
      {groupParts(reply.parts).map((group) => (
        <Fragment key={group.key}>
          {'tools' in group
            ? <div className="grid min-w-0 gap-1.5">{group.tools.map((tool) => <ToolCard key={tool.id} part={tool} />)}</div>
            : renderPart(group.part)}
        </Fragment>
      ))}
      {running && reply.activity && reply.parts.length > 0 && !streaming && (
        <ActivityLine text={reply.activity} since={reply.startedAt} />
      )}
      {reply.status === 'stopped' && <StoppedNote />}

      {settled && (
        <div className="-mt-1 -ml-1 flex flex-wrap items-center gap-0.5">
          <IconAction label={copied ? 'Copied' : 'Copy'} icon={copied ? Tick02Icon : Copy01Icon} onClick={() => copy(replyText(reply))} />
          <IconAction label="Regenerate" icon={RefreshIcon} onClick={() => actions.regenerate(chatId, message.id)} />
          <IconAction
            label="Good reply"
            icon={ThumbsUpIcon}
            pressed={reply.feedback === 'up'}
            onClick={() => {
              const next = reply.feedback === 'up' ? undefined : 'up'
              actions.feedback(...address, next)
              if (next) toast('Thanks for the feedback')
            }}
          />
          <IconAction
            label="Bad reply"
            icon={ThumbsDownIcon}
            pressed={reply.feedback === 'down'}
            onClick={() => (reply.feedback === 'down' ? actions.feedback(...address, undefined) : setFeedbackOpen(true))}
          />
          {message.versions.length > 1 && (
            <div role="group" aria-label="Reply versions" className="text-muted-foreground ml-1 flex items-center text-[11px]">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Previous version"
                disabled={message.current === 0}
                onClick={() => actions.selectVersion(chatId, message.id, message.current - 1)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <span className="px-0.5 tabular-nums">{message.current + 1} / {message.versions.length}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Next version"
                disabled={message.current === message.versions.length - 1}
                onClick={() => actions.selectVersion(chatId, message.id, message.current + 1)}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
            </div>
          )}
        </div>
      )}

      {isLast && settled && reply.followUps.length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-1.5" role="group" aria-label="Suggested follow-ups">
          {reply.followUps.map((text) => (
            <Button key={text} variant="outline" size="sm" className="h-auto min-h-6 max-w-full rounded-full py-0.5 text-left font-normal whitespace-normal" onClick={() => actions.send(text, [])}>
              <HugeiconsIcon icon={CornerDownRightIcon} strokeWidth={2} data-icon="inline-start" className="text-muted-foreground" />
              {text}
            </Button>
          ))}
        </div>
      )}

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onSubmit={(reasons) => {
          actions.feedback(...address, 'down')
          toast('Thanks for the feedback', { description: reasons.length ? reasons.join(', ') : 'Demo only. Nothing was sent.' })
        }}
      />
    </article>
  )
})
