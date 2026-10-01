import {
  useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState,
  type ClipboardEvent, type DragEvent, type KeyboardEvent, type ReactNode, type Ref,
} from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowDown01Icon, ArrowUp02Icon, Attachment01Icon, Cancel01Icon, Mic01Icon, StopIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { FileChip, fileIcon, formatFileSize } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { UserAvatar } from '@/components/person'
import { AiMotion, useNow } from '@/components/thinking-indicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// The prompt box (composer) of an AI chat. A text area that grows with what
// is written (Enter sends, Shift+Enter adds a line), attached files as chips
// above it (pick, paste or drop them), and a toolbar under it: Attach, the
// mode toggles (Web search, Deep think…), your own `tools`, a model picker,
// Dictate, and Send, which turns into Stop while `running`. Under the box, a
// row of key hints and anything you put in `footer`.
//
// Text and attachments are yours when you pass `value` / `attachments` with
// their onChange; leave them out and the box keeps them, and clears both
// after each send (return false from onSubmit to keep them). `commands` ("/"
// at the start) and `getMentions` ("@" anywhere) open a suggestion menu above
// the box. Move focus in with `autoFocus`, by changing `focusKey`, or with
// the ref's focus().

export type PromptAttachment = {
  id: string
  name: string
  // In bytes.
  size: number
  // The picked file. Left out for a file known only by name (a restored draft).
  file?: File
  // Drawn before the name. Left out, it is picked from the file's extension.
  icon?: IconSvgElement
}

// A toggle in the toolbar, such as Web search. `on` is yours: flip it in onModeToggle.
export type PromptMode = { id: string; label: string; icon: IconSvgElement; on: boolean }

// A slash command, offered when the text starts with "/".
export type PromptCommand = { name: string; description?: string; icon?: IconSvgElement }

// One row of the "@" menu.
export type PromptSuggestion = {
  // Unique across the list.
  id: string
  // The heading it sits under: "People", "Projects"…
  group: string
  label: string
  // A muted line after the label, such as a record's title.
  hint?: string
  // What replaces "@query". Defaults to `@label ` (with the trailing space).
  insert?: string
  icon?: IconSvgElement
  // A CSS colour for the icon, built from theme tokens: var(--chart-2).
  colour?: string
  // A person: drawn as their initials avatar instead of an icon.
  person?: boolean
}

export type PromptModel = {
  id: string
  name: string
  description?: string
  icon?: IconSvgElement
  // A small pill after the name: "New", "Beta".
  badge?: string
  // A last muted line in the menu: speed, cost, context size…
  details?: ReactNode
}

export type PromptDictation = {
  // Called when recording stops. Resolve with the words heard; they are added
  // to the end of the text. The signal aborts when the box goes away first.
  transcribe: (signal: AbortSignal) => Promise<string> | string
  // Recording stops by itself after this long. 60 seconds when left out.
  maxMs?: number
  onStart?: () => void
  onCancel?: () => void
}

export type PromptBoxHandle = { focus: (options?: FocusOptions) => void }

type Menu = { kind: 'slash' | 'mention'; query: string; start: number; end: number }

type Item = {
  value: string
  group: string
  label: string
  hint?: string
  insert: string
  icon?: IconSvgElement
  colour?: string
  person?: boolean
  command?: boolean
}

// fileIcon, formatFileSize and the chip are the kit's (components/file-chip).
export { fileIcon, formatFileSize }

let attachmentSeq = 0
const toAttachment = (file: File): PromptAttachment => ({
  id: `att-${Date.now().toString(36)}-${(++attachmentSeq).toString(36)}`,
  name: file.name,
  size: file.size,
  file,
})

// State that is the caller's when they pass `value`, and the box's own when
// they don't. The setter takes an updater, read from the latest value.
function useControllable<T>(value: T | undefined, fallback: T, onChange?: (value: T) => void) {
  const [own, setOwn] = useState(fallback)
  const controlled = value !== undefined
  const current = controlled ? value : own
  const latest = useRef({ value: current, controlled, onChange })
  latest.current = { value: current, controlled, onChange }
  const set = useCallback((next: T | ((previous: T) => T)) => {
    const l = latest.current
    const resolved = typeof next === 'function' ? (next as (previous: T) => T)(l.value) : next
    l.value = resolved
    if (!l.controlled) setOwn(resolved)
    l.onChange?.(resolved)
  }, [])
  return [current, set] as const
}

function detectMenu(value: string, caret: number, slash: boolean, mention: boolean): Menu | null {
  const before = value.slice(0, caret)
  const command = slash && before.match(/^\/(\w*)$/)
  if (command) return { kind: 'slash', query: command[1], start: 0, end: caret }
  const at = mention && before.match(/(^|\s)@([\w-]*)$/)
  if (at) return { kind: 'mention', query: at[2], start: caret - at[2].length - 1, end: caret }
  return null
}

export function AttachmentChip({ attachment, onRemove, className }: {
  attachment: PromptAttachment
  onRemove?: () => void
  className?: string
}) {
  return <FileChip name={attachment.name} size={attachment.size} icon={attachment.icon} onRemove={onRemove} className={className} />
}

function ModeToggle({ mode, onToggle }: { mode: PromptMode; onToggle: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={mode.on}
          aria-label={mode.label}
          onClick={onToggle}
          className="text-muted-foreground aria-pressed:border-brand/30 aria-pressed:bg-brand/10 aria-pressed:text-brand hover:aria-pressed:bg-brand/15 hover:aria-pressed:text-brand h-7 rounded-full border border-transparent px-2"
        >
          <HugeiconsIcon icon={mode.icon} strokeWidth={2} data-icon="inline-start" />
          <span className="hidden @lg:inline">{mode.label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{mode.on ? `${mode.label} is on` : `${mode.label} is off`}</TooltipContent>
    </Tooltip>
  )
}

// The model picker: the current model's icon and name, opening a menu of
// models with their description. Also used on its own, in a chat header.
// `defaultId` marks one as "Default".
export function ModelPicker({ models, value, onChange, label = 'Model', defaultId, className }: {
  models: PromptModel[]
  value: string
  onChange: (id: string) => void
  // The menu's heading.
  label?: ReactNode
  defaultId?: string
  className?: string
}) {
  const model = models.find((m) => m.id === value) ?? models[0]
  if (!model) return null
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={`Model: ${model.name}`} className={cn('max-w-40 gap-1 px-1.5', className)}>
              {model.icon && <HugeiconsIcon icon={model.icon} strokeWidth={2} data-icon="inline-start" />}
              <span className="hidden truncate @md:inline">{model.name}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Choose a model</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={model.id} onValueChange={onChange}>
          {models.map((m) => (
            <DropdownMenuRadioItem key={m.id} value={m.id} className="items-start py-2">
              {m.icon && <HugeiconsIcon icon={m.icon} strokeWidth={2} className="mt-0.5" />}
              <span className="grid min-w-0 gap-1">
                <span className="flex items-center gap-1.5 font-medium">
                  {m.name}
                  {m.badge && <Badge className="h-4 px-1.5">{m.badge}</Badge>}
                  {m.id === defaultId && <span className="text-muted-foreground text-[10px] font-normal">Default</span>}
                </span>
                {m.description && <span className="text-muted-foreground text-[11px] leading-4">{m.description}</span>}
                {m.details && <span className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">{m.details}</span>}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RecordingBar({ since, onStop, onCancel }: { since: number; onStop: () => void; onCancel: () => void }) {
  const time = useNow(true, 250)
  const seconds = Math.max(0, Math.floor((time - since) / 1000))
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 pl-1" role="status" aria-label="Recording">
      <AiMotion />
      <span className="relative flex size-2.5 shrink-0">
        <span className="bg-destructive absolute inset-0 animate-ping rounded-full opacity-60" />
        <span className="bg-destructive relative size-2.5 rounded-full" />
      </span>
      <span className="text-xs font-medium">Listening</span>
      <span className="text-muted-foreground text-xs tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
      <span aria-hidden="true" className="flex h-4 min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className="ai-wave bg-muted-foreground/70 w-0.5 shrink-0 rounded-full"
            style={{ height: `${6 + ((i * 7) % 10)}px`, animationDelay: `${(i * 90) % 900}ms` }}
          />
        ))}
      </span>
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="destructive" size="icon" className="rounded-full" aria-label="Stop recording" onClick={onStop}>
            <HugeiconsIcon icon={StopIcon} strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Stop and transcribe</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function PromptBox({
  value, defaultValue = '', onValueChange, attachments: attachmentsProp, onAttachmentsChange, onSubmit,
  placeholder, label = 'Message', running = false, onStop, disabled = false, maxAttachments = 5, accept,
  modes, onModeToggle, tools, models, model, onModelChange, defaultModel, modelLabel, commands, getMentions,
  dictation, hints = true, footer, autoFocus, focusKey, ref, className,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  attachments?: PromptAttachment[]
  onAttachmentsChange?: (attachments: PromptAttachment[]) => void
  // The trimmed text and the files. Return false to keep them in the box.
  onSubmit: (text: string, attachments: PromptAttachment[]) => void | boolean
  // Defaults to "Ask anything", plus the @ and / hints when those menus are on.
  placeholder?: string
  // The text area's accessible name.
  label?: string
  // A reply is being written: Send becomes Stop, and nothing can be sent.
  running?: boolean
  onStop?: () => void
  disabled?: boolean
  // 0 turns attaching off: no button, no paste or drop.
  maxAttachments?: number
  // The file picker's accept list: "image/*,.pdf".
  accept?: string
  modes?: PromptMode[]
  onModeToggle?: (id: string) => void
  // More buttons, after the mode toggles.
  tools?: ReactNode
  // Shows the model picker at the end of the toolbar.
  models?: PromptModel[]
  model?: string
  onModelChange?: (id: string) => void
  defaultModel?: string
  modelLabel?: ReactNode
  commands?: PromptCommand[]
  // The "@" menu's rows for what was typed after the "@" (may be empty).
  getMentions?: (query: string) => PromptSuggestion[]
  // Shows Dictate.
  dictation?: PromptDictation
  // The key hints under the box.
  hints?: boolean
  // Shown at the end of the hint row, such as "Answers can be wrong".
  footer?: ReactNode
  autoFocus?: boolean
  // Change it to move focus into the box, e.g. after a starter card was used.
  focusKey?: number | string
  ref?: Ref<PromptBoxHandle>
  className?: string
}) {
  const [text, setText] = useControllable(value, defaultValue, onValueChange)
  const [files, setFiles] = useControllable(attachmentsProp, [] as PromptAttachment[], onAttachmentsChange)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [active, setActive] = useState('')
  const [recording, setRecording] = useState<number | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const autoStop = useRef<number | undefined>(undefined)
  const transcription = useRef<AbortController | null>(null)
  const dictationRef = useRef(dictation)
  dictationRef.current = dictation
  const textRef = useRef(text)
  textRef.current = text
  const lastFocusKey = useRef(focusKey)
  const listId = useId()
  const hintId = useId()

  const slash = !!commands?.length
  const mention = !!getMentions
  const canAttach = maxAttachments > 0

  useImperativeHandle(ref, () => ({ focus: (options) => areaRef.current?.focus(options) }), [])

  useEffect(() => () => {
    window.clearTimeout(autoStop.current)
    transcription.current?.abort()
  }, [])

  useEffect(() => {
    if (autoFocus) areaRef.current?.focus({ preventScroll: true })
    // Only on mount: autoFocus is the first focus, not a standing order.
  }, [])

  useEffect(() => {
    if (focusKey === lastFocusKey.current) return
    lastFocusKey.current = focusKey
    areaRef.current?.focus({ preventScroll: true })
  }, [focusKey])

  // field-sizing does the growing where supported; elsewhere, size by hand.
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el || CSS.supports('field-sizing', 'content')) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`
  }, [text])

  const items = useMemo((): Item[] => {
    if (!menu) return []
    const q = menu.query.toLowerCase()
    if (menu.kind === 'slash') {
      return (commands ?? []).filter((c) => c.name.startsWith(q)).map((c) => ({
        value: `cmd:${c.name}`, group: 'Commands', label: `/${c.name}`, hint: c.description, insert: `/${c.name} `, icon: c.icon, command: true,
      }))
    }
    return (getMentions?.(menu.query) ?? []).map((s) => ({
      value: s.id, group: s.group, label: s.label, hint: s.hint, insert: s.insert ?? `@${s.label} `, icon: s.icon, colour: s.colour, person: s.person,
    }))
  }, [menu, commands, getMentions])

  const open = !!menu && items.length > 0
  const activeValue = items.some((i) => i.value === active) ? active : items[0]?.value ?? ''
  const canSend = !disabled && !running && (!!text.trim() || files.length > 0) && recording === null && !transcribing

  const detect = (value: string, caret: number) => detectMenu(value, caret, slash, mention)

  function update(next: string, caret: number) {
    setText(next)
    setMenu(detect(next, caret))
  }

  function pick(item: Item) {
    if (!menu) return
    const next = text.slice(0, menu.start) + item.insert + text.slice(menu.end)
    const caret = menu.start + item.insert.length
    setText(next)
    setMenu(null)
    requestAnimationFrame(() => {
      const el = areaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list)
    if (!incoming.length || !canAttach) return
    const room = maxAttachments - files.length
    const limit = `Up to ${maxAttachments} ${maxAttachments === 1 ? 'file' : 'files'} per message`
    if (room <= 0) {
      toast(limit)
      return
    }
    if (incoming.length > room) toast(`Only the first ${room} ${room === 1 ? 'file was' : 'files were'} added`, { description: `${limit}.` })
    setFiles((current) => [...current, ...incoming.slice(0, room).map(toAttachment)])
  }

  function submit() {
    if (!canSend) return
    if (onSubmit(text.trim(), files) === false) return
    setText('')
    setFiles([])
    setMenu(null)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const index = items.findIndex((i) => i.value === activeValue)
        const next = (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
        setActive(items[next].value)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const item = items.find((i) => i.value === activeValue)
        if (item) pick(item)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setMenu(null)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    if (!canAttach || !e.clipboardData.files.length) return
    if (!e.clipboardData.getData('text')) e.preventDefault()
    addFiles(e.clipboardData.files)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    if (!canAttach) return
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function startRecording() {
    setRecording(Date.now())
    dictationRef.current?.onStart?.()
    window.clearTimeout(autoStop.current)
    autoStop.current = window.setTimeout(() => stopRecording(false), dictationRef.current?.maxMs ?? 60_000)
  }

  function stopRecording(cancel: boolean) {
    window.clearTimeout(autoStop.current)
    setRecording(null)
    const current = dictationRef.current
    if (cancel || !current) {
      current?.onCancel?.()
      areaRef.current?.focus()
      return
    }
    setTranscribing(true)
    transcription.current?.abort()
    const controller = new AbortController()
    transcription.current = controller
    Promise.resolve()
      .then(() => current.transcribe(controller.signal))
      .then((phrase) => {
        if (controller.signal.aborted) return
        transcription.current = null
        setTranscribing(false)
        const words = phrase.trim()
        if (words) {
          const before = textRef.current
          setText(before.trim() ? `${before.trimEnd()} ${words}` : words)
        }
        areaRef.current?.focus()
      })
      .catch(() => {
        if (controller.signal.aborted) return
        transcription.current = null
        setTranscribing(false)
        toast('Could not transcribe that', { description: 'Try again, or type instead.' })
      })
  }

  const groups = [...new Set(items.map((i) => i.group))]
  const keyHints = slash || mention

  return (
    <div className={cn('@container relative min-w-0', className)}>
      {open && (
        <div className="bg-popover text-popover-foreground ring-foreground/10 absolute bottom-full left-0 z-20 mb-2 w-72 max-w-full overflow-hidden rounded-lg shadow-md ring-1">
          <Command shouldFilter={false} value={activeValue} onValueChange={setActive} className="rounded-lg">
            <CommandList id={listId} aria-label={menu?.kind === 'slash' ? 'Commands' : 'Mentions'}>
              {groups.map((group) => (
                <CommandGroup key={group} heading={group}>
                  {items.filter((i) => i.group === group).map((item) => (
                    <CommandItem key={item.value} value={item.value} onMouseDown={(e) => e.preventDefault()} onSelect={() => pick(item)}>
                      {item.person
                        ? <UserAvatar name={item.label} className="size-5" />
                        : item.icon && <HugeiconsIcon icon={item.icon} strokeWidth={2} style={item.colour ? { color: item.colour } : undefined} />}
                      <span className={cn('shrink-0', !item.person && 'font-medium', item.command && 'font-mono')}>{item.label}</span>
                      {item.hint && <span className="text-muted-foreground min-w-0 truncate text-[11px]">{item.hint}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </div>
      )}

      <div
        onDragOver={(e) => {
          if (!canAttach || !e.dataTransfer.types.includes('Files')) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={onDrop}
        className={cn(
          'bg-card focus-within:border-ring/70 focus-within:ring-ring/20 rounded-xl border shadow-xs transition-[border-color,box-shadow] focus-within:ring-2',
          dragging && 'border-brand/60 ring-brand/20 ring-2',
          disabled && 'opacity-60',
        )}
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
            {files.map((file) => (
              <AttachmentChip key={file.id} attachment={file} onRemove={() => setFiles((current) => current.filter((f) => f.id !== file.id))} />
            ))}
          </div>
        )}
        <textarea
          ref={areaRef}
          rows={1}
          value={text}
          disabled={disabled}
          aria-label={label}
          aria-describedby={hints ? hintId : undefined}
          aria-controls={open ? listId : undefined}
          aria-autocomplete={keyHints ? 'list' : undefined}
          placeholder={dragging
            ? 'Drop files to attach them'
            : placeholder ?? `Ask anything${mention ? ', @ to mention' : ''}${slash ? ', / for commands' : ''}`}
          onChange={(e) => update(e.target.value, e.target.selectionStart)}
          onClick={(e) => setMenu(detect(e.currentTarget.value, e.currentTarget.selectionStart))}
          onBlur={() => setMenu(null)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className="placeholder:text-muted-foreground field-sizing-content block max-h-48 min-h-11 w-full resize-none overflow-y-auto bg-transparent px-3.5 pt-3 pb-1 text-[13px] leading-5 outline-none"
        />
        <div className="flex min-h-10 items-center gap-1 px-2 pb-2">
          {recording !== null ? (
            <RecordingBar since={recording} onStop={() => stopRecording(false)} onCancel={() => stopRecording(true)} />
          ) : (
            <>
              {canAttach && (
                <IconAction
                  label="Attach files"
                  icon={Attachment01Icon}
                  onClick={() => fileRef.current?.click()}
                  disabled={disabled || files.length >= maxAttachments}
                />
              )}
              {modes?.map((mode) => (
                <ModeToggle key={mode.id} mode={mode} onToggle={() => onModeToggle?.(mode.id)} />
              ))}
              {tools}
              <span className="flex-1" />
              {models && models.length > 0 && model !== undefined && onModelChange && (
                <ModelPicker models={models} value={model} onChange={onModelChange} label={modelLabel} defaultId={defaultModel} />
              )}
              {dictation && (transcribing ? (
                <span className="ai-shimmer px-2 text-xs font-medium" role="status"><AiMotion />Transcribing…</span>
              ) : (
                <IconAction label="Dictate" icon={Mic01Icon} onClick={startRecording} disabled={disabled} />
              ))}
            </>
          )}
          {running ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" className="rounded-full" aria-label="Stop the reply" onClick={onStop}>
                  <HugeiconsIcon icon={StopIcon} strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop</TooltipContent>
            </Tooltip>
          ) : recording === null && (
            <Button size="icon" className="rounded-full" aria-label="Send" disabled={!canSend} onClick={submit}>
              <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
            </Button>
          )}
        </div>
      </div>

      {canAttach && (
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={accept}
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      )}

      {(hints || footer || files.length > 0) && (
        <p id={hintId} className="text-muted-foreground mt-1.5 flex items-center gap-3 px-1 text-[11px]">
          {hints && (
            <>
              <span className="hidden items-center gap-1 @md:flex"><Kbd>Enter</Kbd> to send</span>
              <span className="hidden items-center gap-1 @md:flex"><Kbd>Shift</Kbd><Kbd>Enter</Kbd> new line</span>
              {keyHints && (
                <span className="flex items-center gap-1 @md:ml-auto">
                  {mention && <><Kbd>@</Kbd> mention</>}
                  {mention && slash && ' '}
                  {slash && <><Kbd>/</Kbd> commands</>}
                </span>
              )}
            </>
          )}
          {footer}
          {files.length > 0 && (
            <Button
              variant="link"
              size="xs"
              className={cn('text-muted-foreground ml-auto h-auto p-0', hints && keyHints && '@md:ml-0')}
              onClick={() => setFiles([])}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
              Clear files
            </Button>
          )}
        </p>
      )}
    </div>
  )
}
