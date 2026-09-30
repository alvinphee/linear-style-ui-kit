import {
  useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent,
  type KeyboardEvent,
} from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon, ArrowUp02Icon, Attachment01Icon, Cancel01Icon, Folder01Icon, Globe02Icon, Mic01Icon,
  StopIcon, Task01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PEOPLE } from '../../data'
import { useJobs } from '../../jobs-store'
import { Initials } from '../StatusSection'
import { useActions } from './context'
import { SLASH_COMMANDS, now, toFileRef } from './data'
import { FileChip, IconAction } from './Message'
import { useNow } from './parts'
import type { FileRef, Modes, Project } from './types'

type Menu = { kind: 'slash' | 'mention'; query: string; start: number; end: number }

type Item = {
  value: string
  group: 'Commands' | 'People' | 'Jobs' | 'Projects'
  label: string
  hint?: string
  insert: string
  icon?: IconSvgElement
  colour?: string
}

const MAX_FILES = 5

const TRANSCRIPTS = [
  'Summarise the jobs due today and flag anything that is late.',
  'Draft an email to Bayview Foods about the delay on DO-24817.',
  'Compare driver workload this week.',
]
let transcriptIndex = 0
let handledFocusKey = 0

function detectMenu(value: string, caret: number): Menu | null {
  const before = value.slice(0, caret)
  const slash = before.match(/^\/(\w*)$/)
  if (slash) return { kind: 'slash', query: slash[1], start: 0, end: caret }
  const at = before.match(/(^|\s)@([\w-]*)$/)
  if (at) return { kind: 'mention', query: at[2], start: caret - at[2].length - 1, end: caret }
  return null
}

function ModeToggle({ icon, label, pressed, onToggle }: { icon: IconSvgElement; label: string; pressed: boolean; onToggle: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={pressed}
          aria-label={label}
          onClick={onToggle}
          className="text-muted-foreground aria-pressed:border-brand/30 aria-pressed:bg-brand/10 aria-pressed:text-brand hover:aria-pressed:bg-brand/15 hover:aria-pressed:text-brand h-7 rounded-full border border-transparent px-2"
        >
          <HugeiconsIcon icon={icon} strokeWidth={2} data-icon="inline-start" />
          <span className="hidden @lg:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{pressed ? `${label} is on` : `${label} is off`}</TooltipContent>
    </Tooltip>
  )
}

function RecordingBar({ since, onStop, onCancel }: { since: number; onStop: () => void; onCancel: () => void }) {
  const time = useNow(true, 250)
  const seconds = Math.max(0, Math.floor((time - since) / 1000))
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 pl-1" role="status" aria-label="Recording">
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

export function PromptBox({ running, modes, projects, placeholder, focusKey = 0, className }: {
  running: boolean
  modes: Modes
  projects: Project[]
  placeholder?: string
  // Bump to move focus into the box, e.g. after a starter card was used.
  focusKey?: number
  className?: string
}) {
  const actions = useActions()
  const { jobs } = useJobs()
  const [text, setText] = useState('')
  const [files, setFiles] = useState<FileRef[]>([])
  const [menu, setMenu] = useState<Menu | null>(null)
  const [active, setActive] = useState('')
  const [recording, setRecording] = useState<number | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const autoStop = useRef<number | undefined>(undefined)
  const transcribeTimer = useRef<number | undefined>(undefined)
  const listId = useId()
  const hintId = useId()

  useEffect(() => () => {
    window.clearTimeout(autoStop.current)
    window.clearTimeout(transcribeTimer.current)
  }, [])

  // A remount (say, opening another chat) must not grab focus again, so the
  // last request that was honoured is remembered across instances.
  useEffect(() => {
    if (!focusKey || focusKey === handledFocusKey) return
    handledFocusKey = focusKey
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
      return SLASH_COMMANDS.filter((c) => c.name.startsWith(q)).map((c) => ({
        value: `cmd:${c.name}`, group: 'Commands', label: `/${c.name}`, hint: c.description, insert: `/${c.name} `, icon: c.icon,
      }))
    }
    const people: Item[] = PEOPLE.filter((p) => p.toLowerCase().includes(q)).slice(0, 4).map((p) => ({
      value: `person:${p.toLowerCase()}`, group: 'People', label: p, insert: `@${p} `,
    }))
    const jobItems: Item[] = jobs
      .filter((j) => j.id.toLowerCase().includes(q) || j.title.toLowerCase().includes(q))
      .slice(0, 4)
      .map((j) => ({ value: `job:${j.id.toLowerCase()}`, group: 'Jobs', label: j.id, hint: j.title, insert: `@${j.id} `, icon: Task01Icon }))
    const projectItems: Item[] = projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 3).map((p) => ({
      value: `project:${p.id}`, group: 'Projects', label: p.name, insert: `@${p.name} `, icon: Folder01Icon, colour: p.colour,
    }))
    return [...people, ...jobItems, ...projectItems]
  }, [menu, jobs, projects])

  const open = !!menu && items.length > 0
  const activeValue = items.some((i) => i.value === active) ? active : items[0]?.value ?? ''
  const canSend = !running && (!!text.trim() || files.length > 0) && recording === null && !transcribing

  function update(value: string, caret: number) {
    setText(value)
    setMenu(detectMenu(value, caret))
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
    if (!incoming.length) return
    const room = MAX_FILES - files.length
    if (room <= 0) {
      toast('Up to 5 files per message')
      return
    }
    if (incoming.length > room) toast(`Only the first ${room} ${room === 1 ? 'file was' : 'files were'} added`, { description: 'Up to 5 files per message.' })
    setFiles((current) => [...current, ...incoming.slice(0, room).map(toFileRef)])
  }

  function submit() {
    if (!canSend) return
    actions.send(text.trim() || 'Take a look at the attached files', files)
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
    if (!e.clipboardData.files.length) return
    if (!e.clipboardData.getData('text')) e.preventDefault()
    addFiles(e.clipboardData.files)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function startRecording() {
    setRecording(now())
    window.clearTimeout(autoStop.current)
    autoStop.current = window.setTimeout(() => stopRecording(false), 15_000)
  }

  function stopRecording(cancel: boolean) {
    window.clearTimeout(autoStop.current)
    setRecording(null)
    if (cancel) {
      areaRef.current?.focus()
      return
    }
    setTranscribing(true)
    transcribeTimer.current = window.setTimeout(() => {
      setTranscribing(false)
      const phrase = TRANSCRIPTS[transcriptIndex++ % TRANSCRIPTS.length]
      setText((current) => (current.trim() ? `${current.trimEnd()} ${phrase}` : phrase))
      areaRef.current?.focus()
    }, 800)
  }

  const groups = [...new Set(items.map((i) => i.group))]

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
                      {item.group === 'People'
                        ? <Initials name={item.label} className="size-5" />
                        : item.icon && <HugeiconsIcon icon={item.icon} strokeWidth={2} style={item.colour ? { color: item.colour } : undefined} />}
                      <span className={cn('shrink-0', item.group !== 'People' && 'font-medium', item.group === 'Commands' && 'font-mono')}>{item.label}</span>
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
          if (!e.dataTransfer.types.includes('Files')) return
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
        )}
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
            {files.map((file) => (
              <FileChip key={file.id} file={file} onRemove={() => setFiles((current) => current.filter((f) => f.id !== file.id))} />
            ))}
          </div>
        )}
        <textarea
          ref={areaRef}
          rows={1}
          value={text}
          aria-label="Message"
          aria-describedby={hintId}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          placeholder={dragging ? 'Drop files to attach them' : placeholder ?? 'Ask anything, @ to mention, / for commands'}
          onChange={(e) => update(e.target.value, e.target.selectionStart)}
          onClick={(e) => setMenu(detectMenu(e.currentTarget.value, e.currentTarget.selectionStart))}
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
              <IconAction label="Attach files" icon={Attachment01Icon} onClick={() => fileRef.current?.click()} disabled={files.length >= MAX_FILES} />
              <ModeToggle icon={Globe02Icon} label="Web search" pressed={modes.web} onToggle={() => actions.setModes({ ...modes, web: !modes.web })} />
              <ModeToggle icon={AiBrain01Icon} label="Deep think" pressed={modes.deep} onToggle={() => actions.setModes({ ...modes, deep: !modes.deep })} />
              <span className="flex-1" />
              {transcribing ? (
                <span className="ai-shimmer px-2 text-xs font-medium" role="status">Transcribing…</span>
              ) : (
                <IconAction label="Dictate" icon={Mic01Icon} onClick={startRecording} />
              )}
            </>
          )}
          {running ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" className="rounded-full" aria-label="Stop the reply" onClick={actions.stop}>
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

      <input
        ref={fileRef}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <p id={hintId} className="text-muted-foreground mt-1.5 flex items-center gap-3 px-1 text-[11px]">
        <span className="hidden items-center gap-1 @md:flex"><Kbd>Enter</Kbd> to send</span>
        <span className="hidden items-center gap-1 @md:flex"><Kbd>Shift</Kbd><Kbd>Enter</Kbd> new line</span>
        <span className="flex items-center gap-1 @md:ml-auto"><Kbd>@</Kbd> mention <Kbd>/</Kbd> commands</span>
        {files.length > 0 && (
          <Button variant="link" size="xs" className="text-muted-foreground ml-auto h-auto p-0 @md:ml-0" onClick={() => setFiles([])}>
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
            Clear files
          </Button>
        )}
      </p>
    </div>
  )
}
