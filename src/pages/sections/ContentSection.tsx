import { useEffect, useId, useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon, Camera01Icon, Cancel01Icon, CheckmarkCircle02Icon, CloudUploadIcon, DragDropVerticalIcon,
  File01Icon, Heading02Icon, LeftToRightListBulletIcon, LeftToRightListNumberIcon, Link01Icon, Pdf01Icon,
  Image01Icon, Loading03Icon, QuoteDownIcon, SourceCodeIcon, TextBoldIcon, TextItalicIcon, TextStrikethroughIcon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Shortcut } from '@/components/shortcut'
import { Kbd } from '@/components/ui/kbd'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PEOPLE } from '../data'
import { Panel, Section } from './shared'
import { UserAvatar } from '@/components/person'

export default function ContentSection() {
  return (
    <Section id="content" title="Uploads, editor and ordering" description="A file dropzone, a writing editor and drag-to-reorder lists">
      <UploadPanel />
      <div className="grid min-w-0 grid-cols-1 content-start gap-3">
        <AvatarPanel />
        <ReorderPanel />
      </div>
      <EditorPanel />
    </Section>
  )
}

/* ---------- File upload ---------- */

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPT = '.png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf'

type Kind = 'image' | 'pdf' | 'other'
type Upload = { id: string; name: string; size: number; kind: Kind; url?: string; progress: number; error?: string }

const KIND_ICON: Record<Kind, IconSvgElement> = { image: Image01Icon, pdf: Pdf01Icon, other: File01Icon }

const SEED: Upload[] = [
  { id: 'seed-pdf', name: 'brand-guidelines.pdf', size: 2_516_582, kind: 'pdf', progress: 100 },
  { id: 'seed-jpg', name: 'team-offsite.jpg', size: 3_250_585, kind: 'image', progress: 25 },
  { id: 'seed-mov', name: 'launch-video.mov', size: 48_234_496, kind: 'other', progress: 0, error: 'Only PNG, JPG or PDF files' },
]

function kindOf(file: File): Kind {
  if (file.type === 'image/png' || file.type === 'image/jpeg' || /\.(png|jpe?g)$/i.test(file.name)) return 'image'
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf'
  return 'other'
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function UploadPanel() {
  const [files, setFiles] = useState(SEED)
  const [over, setOver] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(0)
  // Every object URL made here, so none outlives the panel.
  const urls = useRef(new Set<string>())

  const uploading = files.some((f) => !f.error && f.progress < 100)
  const done = files.filter((f) => !f.error && f.progress >= 100).length

  useEffect(() => {
    if (!uploading) return
    const timer = setInterval(() => {
      setFiles((list) => list.map((f) => (f.error || f.progress >= 100 ? f : { ...f, progress: Math.min(100, f.progress + 5 + Math.random() * 15) })))
    }, 300)
    return () => clearInterval(timer)
  }, [uploading])

  useEffect(() => {
    const made = urls.current
    return () => {
      made.forEach((u) => URL.revokeObjectURL(u))
      made.clear()
    }
  }, [])

  function addFiles(list: FileList | null) {
    if (!list?.length) return
    const added = Array.from(list).map((file): Upload => {
      const kind = kindOf(file)
      const error = kind === 'other' ? 'Only PNG, JPG or PDF files' : file.size > MAX_BYTES ? 'Larger than 10 MB' : undefined
      let url: string | undefined
      if (kind === 'image') {
        url = URL.createObjectURL(file)
        urls.current.add(url)
      }
      return { id: `file-${++nextId.current}`, name: file.name, size: file.size, kind, url, progress: 0, error }
    })
    setFiles((f) => [...f, ...added])
    const rejected = added.filter((f) => f.error).length
    setMessage(`${plural(added.length, 'file')} added${rejected ? `, ${rejected} not accepted` : ''}.`)
  }

  function revoke(file: Upload) {
    if (!file.url) return
    URL.revokeObjectURL(file.url)
    urls.current.delete(file.url)
  }

  function remove(file: Upload) {
    revoke(file)
    setFiles((list) => list.filter((f) => f.id !== file.id))
    setMessage(`${file.name} removed.`)
  }

  function clear() {
    files.forEach(revoke)
    setFiles([])
    setMessage('All files removed.')
  }

  const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes('Files')

  return (
    <Panel title="File upload" note="Nothing leaves your browser">
      <div className="grid grid-cols-1 gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          tabIndex={-1}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            if (!hasFiles(e)) return
            e.preventDefault()
            setOver(true)
          }}
          onDragOver={(e) => {
            if (!hasFiles(e)) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            addFiles(e.dataTransfer.files)
          }}
          data-over={over}
          className="border-input hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/30 data-[over=true]:border-brand data-[over=true]:bg-brand/5 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors outline-none focus-visible:ring-2"
        >
          <span
            data-over={over}
            className="bg-muted text-muted-foreground data-[over=true]:bg-brand/10 data-[over=true]:text-brand flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <HugeiconsIcon icon={CloudUploadIcon} strokeWidth={2} className="size-4.5" />
          </span>
          <span className="text-muted-foreground text-xs">
            {over ? (
              <span className="text-foreground font-medium">Drop to add the files</span>
            ) : (
              <>
                <span className="text-foreground font-medium">Click to upload</span> or drag and drop
              </>
            )}
          </span>
          <span className="text-muted-foreground text-[11px]">PNG, JPG or PDF, up to 10 MB</span>
        </button>

        {files.length > 0 && (
          <>
            <ul aria-label="Chosen files" className="grid grid-cols-1 gap-1.5">
              {files.map((f) => (
                <FileRow key={f.id} file={f} onRemove={() => remove(f)} />
              ))}
            </ul>
            <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="tabular-nums">{done} of {plural(files.length, 'file')} uploaded</span>
              <Button variant="ghost" size="xs" onClick={clear}>Clear all</Button>
            </div>
          </>
        )}
        <p aria-live="polite" className="sr-only">{message}</p>
      </div>
    </Panel>
  )
}

function FileRow({ file, onRemove }: { file: Upload; onRemove: () => void }) {
  const status = file.error ? 'error' : file.progress >= 100 ? 'done' : 'uploading'
  const pct = Math.round(file.progress)

  return (
    <li
      data-status={status}
      className="data-[status=error]:border-destructive/30 data-[status=error]:bg-destructive/5 flex min-w-0 items-center gap-2.5 rounded-md border px-2 py-1.5"
    >
      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {file.url ? (
          <img src={file.url} alt="" className="size-full object-cover" />
        ) : (
          <HugeiconsIcon icon={KIND_ICON[file.kind]} strokeWidth={2} className="size-4" />
        )}
      </span>
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-1">
        <span className="truncate text-xs font-medium">{file.name}</span>
        {status === 'uploading' ? (
          <div className="flex items-center gap-2">
            <Progress value={pct} aria-label={`Uploading ${file.name}`} className="flex-1" />
            <span className="text-muted-foreground w-8 shrink-0 text-right text-[11px] tabular-nums">{pct}%</span>
          </div>
        ) : (
          <span className="text-muted-foreground truncate text-[11px]">
            <span className="tabular-nums">{formatBytes(file.size)}</span>
            {' · '}
            {status === 'error' ? <span className="text-destructive">{file.error}</span> : 'Uploaded'}
          </span>
        )}
      </div>
      {status === 'done' && (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="text-status-done size-4 shrink-0" />
      )}
      {status === 'error' && (
        <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive size-4 shrink-0" />
      )}
      <Button variant="ghost" size="icon-xs" aria-label={`Remove ${file.name}`} onClick={onRemove} className="text-muted-foreground">
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
      </Button>
    </li>
  )
}

/* ---------- Avatar ---------- */

function AvatarPanel() {
  const [url, setUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const current = useRef<string | null>(null)

  useEffect(() => () => {
    if (current.current) URL.revokeObjectURL(current.current)
  }, [])

  function replace(next: string | null) {
    if (current.current) URL.revokeObjectURL(current.current)
    current.current = next
    setUrl(next)
  }

  function choose(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file', { description: 'PNG or JPG works best.' })
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('That image is larger than 10 MB')
      return
    }
    replace(URL.createObjectURL(file))
  }

  const pick = () => inputRef.current?.click()

  return (
    <Panel title="Avatar" note="Preview only, not uploaded">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          tabIndex={-1}
          className="hidden"
          onChange={(e) => {
            choose(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={pick}
          aria-label="Choose a profile photo"
          className="group/pick focus-visible:ring-ring/30 relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <Avatar className="size-14">
            {url && <AvatarImage src={url} alt="" />}
            <AvatarFallback className="text-base font-medium">AM</AvatarFallback>
          </Avatar>
          <span className="bg-background/70 text-foreground absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover/pick:opacity-100 group-focus-visible/pick:opacity-100">
            <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-4" />
          </span>
        </button>
        <div className="grid min-w-0 gap-1.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">Alex Morgan</p>
            <p className="text-muted-foreground text-[11px]">PNG or JPG, at least 256 × 256 px.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" onClick={pick}>{url ? 'Replace' : 'Upload'}</Button>
            <Button variant="ghost" size="sm" disabled={!url} onClick={() => replace(null)}>Remove</Button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* ---------- Drag to reorder ---------- */

type Item = { id: string; key: string; title: string; owner: string; points: number }
const BACKLOG: Item[] = [
  { id: 'b1', key: 'WEB-212', title: 'Fix the sign-in redirect loop', owner: PEOPLE[0], points: 2 },
  { id: 'b2', key: 'WEB-198', title: 'Add CSV export to reports', owner: PEOPLE[1], points: 3 },
  { id: 'b3', key: 'API-87', title: 'Rate-limit the public API', owner: PEOPLE[2], points: 5 },
  { id: 'b4', key: 'WEB-230', title: 'Onboarding checklist, version 2', owner: PEOPLE[3], points: 3 },
  { id: 'b5', key: 'MOB-41', title: 'Offline mode for the mobile app', owner: PEOPLE[4], points: 8 },
  { id: 'b6', key: 'WEB-244', title: 'Dark mode for email templates', owner: PEOPLE[0], points: 1 },
]

function ReorderPanel() {
  const [items, setItems] = useState(BACKLOG)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  // Index the dragged row would land before (items.length = after the last row).
  const [dropAt, setDropAt] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  // Read synchronously in dragover, before the state update has rendered.
  const dragRef = useRef<string | null>(null)
  const rows = useRef(new Map<string, HTMLLIElement>())
  const refocus = useRef<string | null>(null)
  const hintId = useId()

  // A moved row is re-inserted in the DOM, which can drop its focus.
  useLayoutEffect(() => {
    if (!refocus.current) return
    rows.current.get(refocus.current)?.focus()
    refocus.current = null
  }, [items])

  const changed = items.some((item, i) => item.id !== BACKLOG[i].id)
  const from = draggingId ? items.findIndex((i) => i.id === draggingId) : -1
  // Dropping just above or below the dragged row changes nothing, so no line.
  const line = dropAt !== null && dropAt !== from && dropAt !== from + 1 ? dropAt : null

  function move(fromIndex: number, toIndex: number) {
    const item = items[fromIndex]
    if (toIndex < 0 || toIndex >= items.length) {
      setMessage(`${item.title} is already ${toIndex < 0 ? 'first' : 'last'}.`)
      return
    }
    if (toIndex === fromIndex) return
    const next = [...items]
    next.splice(fromIndex, 1)
    next.splice(toIndex, 0, item)
    setItems(next)
    setMessage(`${item.title} moved to position ${toIndex + 1} of ${next.length}.`)
  }

  function endDrag() {
    dragRef.current = null
    setDraggingId(null)
    setDropAt(null)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    const id = dragRef.current
    const at = dropAt
    endDrag()
    if (!id || at === null) return
    const fromIndex = items.findIndex((i) => i.id === id)
    move(fromIndex, at > fromIndex ? at - 1 : at)
  }

  function onRowKey(e: KeyboardEvent<HTMLLIElement>, index: number) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const dir = e.key === 'ArrowUp' ? -1 : 1
    if (e.altKey) {
      refocus.current = items[index].id
      move(index, index + dir)
    } else {
      const target = items[index + dir]
      if (target) rows.current.get(target.id)?.focus()
    }
  }

  return (
    <Panel title="Drag to reorder" note="Native drag and drop, plus keyboard">
      <div className="grid grid-cols-1 gap-3">
        <ol
          aria-label="Backlog, in priority order"
          className="grid grid-cols-1 gap-1"
          onDragOver={(e) => {
            if (dragRef.current) e.preventDefault()
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropAt(null)
          }}
          onDrop={onDrop}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              ref={(el) => {
                if (el) rows.current.set(item.id, el)
                else rows.current.delete(item.id)
              }}
              tabIndex={0}
              draggable
              aria-label={`${item.title}, position ${index + 1} of ${items.length}`}
              aria-describedby={hintId}
              data-dragging={item.id === draggingId}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', item.id)
                dragRef.current = item.id
                // Deferred so the browser takes the drag image before the row fades.
                setTimeout(() => setDraggingId(item.id), 0)
              }}
              onDragEnd={endDrag}
              onDragOver={(e) => {
                if (!dragRef.current) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                const rect = e.currentTarget.getBoundingClientRect()
                setDropAt(e.clientY < rect.top + rect.height / 2 ? index : index + 1)
              }}
              onKeyDown={(e) => onRowKey(e, index)}
              className="group/row bg-card hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/30 relative flex h-9 min-w-0 cursor-grab items-center gap-2 rounded-md border pr-2 pl-1 text-xs transition-[opacity,background-color] outline-none focus-visible:ring-2 active:cursor-grabbing data-[dragging=true]:opacity-40"
            >
              {line === index && <DropLine edge="top" />}
              {line === items.length && index === items.length - 1 && <DropLine edge="bottom" />}
              <HugeiconsIcon
                icon={DragDropVerticalIcon}
                strokeWidth={2}
                className="text-muted-foreground size-3.5 shrink-0 opacity-60 group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
              />
              <span className="text-muted-foreground w-3 shrink-0 text-right text-[11px] tabular-nums">{index + 1}</span>
              <span className="text-muted-foreground hidden w-14 shrink-0 font-mono text-[11px] sm:inline">{item.key}</span>
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{item.points} pt</span>
              <UserAvatar name={item.owner} className="size-5" />
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id={hintId} className="text-muted-foreground flex flex-wrap items-center gap-1 text-[11px]">
            Drag a row, or focus it and press <Kbd>Alt</Kbd> <Kbd>↑</Kbd> <Kbd>↓</Kbd>
          </p>
          <Button
            variant="ghost"
            size="xs"
            disabled={!changed}
            onClick={() => {
              setItems(BACKLOG)
              setMessage('Order reset.')
            }}
          >
            Reset order
          </Button>
        </div>
        <p aria-live="polite" className="sr-only">{message}</p>
      </div>
    </Panel>
  )
}

function DropLine({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-brand pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded-full',
        'before:border-brand before:bg-card before:absolute before:-top-[3px] before:-left-1 before:size-2 before:rounded-full before:border-2',
        edge === 'top' ? '-top-[3px]' : '-bottom-[3px]',
      )}
    />
  )
}

/* ---------- Writing editor ---------- */

type Edit = { value: string; start: number; end: number }
type Apply = (value: string, start: number, end: number) => Edit

// Wraps the selection in markers, or removes them when it is already wrapped.
function wrap(before: string, after: string, placeholder: string): Apply {
  return (v, s, e) => {
    if (s >= before.length && v.slice(s - before.length, s) === before && v.slice(e, e + after.length) === after) {
      return {
        value: v.slice(0, s - before.length) + v.slice(s, e) + v.slice(e + after.length),
        start: s - before.length,
        end: e - before.length,
      }
    }
    const inner = v.slice(s, e) || placeholder
    return {
      value: v.slice(0, s) + before + inner + after + v.slice(e),
      start: s + before.length,
      end: s + before.length + inner.length,
    }
  }
}

// Adds a prefix to every line the selection touches, or removes it from all of them.
function prefixLines(make: (i: number) => string, has: RegExp): Apply {
  return (v, s, e) => {
    const lineStart = v.lastIndexOf('\n', s - 1) + 1
    const endAt = e > s && v[e - 1] === '\n' ? e - 1 : e
    const found = v.indexOf('\n', endAt)
    const lineEnd = found === -1 ? v.length : found
    const lines = v.slice(lineStart, lineEnd).split('\n')
    const on = lines.every((l) => has.test(l))
    const next = lines.map((l, i) => (on ? '' : make(i)) + l.replace(has, ''))
    const block = next.join('\n')
    const value = v.slice(0, lineStart) + block + v.slice(lineEnd)
    if (s === e) {
      const caret = Math.max(lineStart, s + next[0].length - lines[0].length)
      return { value, start: caret, end: caret }
    }
    return { value, start: lineStart, end: lineStart + block.length }
  }
}

const code: Apply = (v, s, e) => {
  if (!v.slice(s, e).includes('\n')) return wrap('`', '`', 'code')(v, s, e)
  const lead = s === 0 || v[s - 1] === '\n' ? '' : '\n'
  return wrap(`${lead}\`\`\`\n`, '\n```', '')(v, s, e)
}

const link: Apply = (v, s, e) => {
  const selected = v.slice(s, e)
  const isUrl = /^https?:\/\//i.test(selected)
  const text = isUrl ? 'link text' : selected || 'link text'
  const url = isUrl ? selected : 'https://'
  const value = `${v.slice(0, s)}[${text}](${url})${v.slice(e)}`
  // Select whatever still needs typing: the address after wrapping text, the text otherwise.
  if (selected && !isUrl) {
    const at = s + text.length + 3
    return { value, start: at, end: at + url.length }
  }
  return { value, start: s + 1, end: s + 1 + text.length }
}

type Tool = { id: string; label: string; icon: IconSvgElement; apply: Apply; key?: string }
const TOOL_GROUPS: Tool[][] = [
  [
    { id: 'bold', label: 'Bold', icon: TextBoldIcon, apply: wrap('**', '**', 'bold text'), key: 'b' },
    { id: 'italic', label: 'Italic', icon: TextItalicIcon, apply: wrap('_', '_', 'italic text'), key: 'i' },
    { id: 'strike', label: 'Strikethrough', icon: TextStrikethroughIcon, apply: wrap('~~', '~~', 'struck text') },
  ],
  [
    { id: 'heading', label: 'Heading', icon: Heading02Icon, apply: prefixLines(() => '## ', /^#{1,6}\s+/) },
    { id: 'bullets', label: 'Bulleted list', icon: LeftToRightListBulletIcon, apply: prefixLines(() => '- ', /^[-*+]\s+/) },
    { id: 'numbers', label: 'Numbered list', icon: LeftToRightListNumberIcon, apply: prefixLines((i) => `${i + 1}. `, /^\d+[.)]\s+/) },
    { id: 'quote', label: 'Quote', icon: QuoteDownIcon, apply: prefixLines(() => '> ', /^>\s?/) },
  ],
  [
    { id: 'code', label: 'Code', icon: SourceCodeIcon, apply: code },
    { id: 'link', label: 'Link', icon: Link01Icon, apply: link, key: 'k' },
  ],
]
const TOOLS = TOOL_GROUPS.flat()

const DRAFT = [
  '## Release notes: version 2.4',
  '',
  'This release makes **search faster** and adds _saved views_ to every list.',
  '',
  '- Filters remember your last choice',
  '- Press `Ctrl K` to open the command menu',
  '- ~~Legacy CSV export~~ is replaced by the new export dialog',
  '',
  '> Saved views are shared with everyone in the workspace.',
  '',
  '### Turn on webhooks',
  '',
  '1. Open **Settings**, then [Integrations](https://example.com/docs/webhooks)',
  '2. Choose the events to send',
  '3. Paste your endpoint and save',
  '',
  '```',
  'curl -X POST https://example.com/hooks/demo',
  '```',
].join('\n')

function EditorPanel() {
  const [value, setValue] = useState(DRAFT)
  const [tab, setTab] = useState('write')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const selection = useRef<[number, number] | null>(null)
  const saveTimer = useRef(0)

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  // Put the selection back after React has written the new value.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !selection.current) return
    el.focus()
    el.setSelectionRange(...selection.current)
    selection.current = null
  }, [value])

  function change(next: string) {
    setValue(next)
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => setSaving(false), 700)
  }

  function run(tool: Tool) {
    const el = ref.current
    if (!el) return
    const edit = tool.apply(el.value, el.selectionStart, el.selectionEnd)
    selection.current = [edit.start, edit.end]
    change(edit.value)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
    const tool = TOOLS.find((t) => t.key === e.key.toLowerCase())
    if (!tool) return
    e.preventDefault()
    // The page opens its command menu on Ctrl+K; inside the editor it makes a link.
    e.stopPropagation()
    run(tool)
  }

  const trimmed = value.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0

  return (
    <Panel title="Writing editor" note="Markdown with a hand-written preview" wide>
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-ring/30 bg-background min-w-0 overflow-hidden rounded-lg border transition-[border-color,box-shadow] has-[textarea:focus-visible]:ring-2">
          <div className="flex flex-wrap items-center gap-2 border-b px-2 py-1.5">
            <TabsList>
              <TabsTrigger value="write" className="px-2.5">Write</TabsTrigger>
              <TabsTrigger value="preview" className="px-2.5">Preview</TabsTrigger>
            </TabsList>
            {tab === 'write' && (
              <div role="toolbar" aria-label="Formatting" className="ml-auto flex flex-wrap items-center gap-0.5">
                {TOOL_GROUPS.map((group, g) => (
                  <div key={g} className="flex items-center gap-0.5">
                    {g > 0 && <span aria-hidden className="bg-border mx-1 h-4 w-px" />}
                    {group.map((tool) => (
                      <Tooltip key={tool.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={tool.label}
                            aria-keyshortcuts={tool.key ? `Control+${tool.key.toUpperCase()}` : undefined}
                            className="text-muted-foreground"
                            // Keeps the textarea focused, so its selection stays visible.
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => run(tool)}
                          >
                            <HugeiconsIcon icon={tool.icon} strokeWidth={2} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {tool.label}
                          {tool.key && <Shortcut keys={['mod', tool.key.toUpperCase()]} className="ml-1" />}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <TabsContent value="write">
            <Textarea
              ref={ref}
              value={value}
              onChange={(e) => change(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Release notes, in Markdown"
              spellCheck
              className="max-h-[28rem] min-h-72 rounded-none border-0 bg-transparent px-3.5 py-3 font-mono focus-visible:ring-0 dark:bg-transparent"
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="min-h-72 min-w-0 px-4 py-3 text-[13px] leading-relaxed break-words">
              {trimmed ? (
                <div className="grid grid-cols-1 gap-3">{renderMarkdown(value)}</div>
              ) : (
                <p className="text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          </TabsContent>

          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-3 py-1.5 text-[11px]">
            <span className="tabular-nums">
              {plural(words, 'word')} · {Math.max(1, Math.round(words / 200))} min read
            </span>
            {saving ? (
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-3 animate-spin motion-reduce:animate-none" /> Saving…
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-3" /> Saved
              </span>
            )}
          </div>
        </div>
      </Tabs>
    </Panel>
  )
}

/* ---------- A tiny Markdown renderer ---------- */

// Builds React elements, so nothing typed can become live HTML.
const INLINE = /`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|~~(.+?)~~|(?<![\w*])\*(?!\s)([^*\n]+?)\*(?![\w*])|(?<!\w)_(?!\s)(.+?)_(?!\w)/
const SAFE_HREF = /^(https?:\/\/|mailto:|#|\/)/i
const LIST = /^\s*[-*+]\s+/
const ORDERED = /^\s*(\d+)[.)]\s+/
const HEADING = /^(#{1,6})\s+(.*)$/
const BLOCK_START = /^(```|#{1,6}\s|>|\s*[-*+]\s+|\s*\d+[.)]\s+)/

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let n = 0
  while (rest) {
    const m = INLINE.exec(rest)
    if (!m) {
      out.push(rest)
      break
    }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const k = `${key}.${n++}`
    const [, codeText, linkText, href, bold, strike, star, under] = m
    if (codeText !== undefined) {
      out.push(<code key={k} className="bg-muted rounded px-1 py-0.5 font-mono text-[0.9em]">{codeText}</code>)
    } else if (linkText !== undefined) {
      out.push(
        SAFE_HREF.test(href) ? (
          <a key={k} href={href} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-2 hover:no-underline">
            {inline(linkText, k)}
          </a>
        ) : (
          <span key={k}>{inline(linkText, k)}</span>
        ),
      )
    } else if (bold !== undefined) {
      out.push(<strong key={k} className="font-semibold">{inline(bold, k)}</strong>)
    } else if (strike !== undefined) {
      out.push(<del key={k} className="text-muted-foreground">{inline(strike, k)}</del>)
    } else {
      out.push(<em key={k}>{inline(star ?? under, k)}</em>)
    }
    rest = rest.slice(m.index + m[0].length)
  }
  return out
}

const HEADING_STYLE = ['text-base font-semibold tracking-tight', 'text-sm font-semibold tracking-tight', 'text-[13px] font-semibold']
const HEADING_TAG = ['h4', 'h5', 'h6'] as const

function renderMarkdown(src: string): ReactNode[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const out: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const k = `b${out.length}`

    if (!line.trim()) {
      i++
      continue
    }

    if (line.startsWith('```')) {
      const body: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++])
      i++
      out.push(
        <pre key={k} className="bg-muted overflow-x-auto rounded-md px-3 py-2 font-mono text-xs leading-relaxed">
          <code>{body.join('\n')}</code>
        </pre>,
      )
      continue
    }

    const h = HEADING.exec(line)
    if (h) {
      const level = Math.min(h[1].length, 3) - 1
      const Tag = HEADING_TAG[level]
      out.push(<Tag key={k} className={HEADING_STYLE[level]}>{inline(h[2], k)}</Tag>)
      i++
      continue
    }

    if (line.startsWith('>')) {
      const quoted: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) quoted.push(lines[i++].replace(/^>\s?/, ''))
      out.push(
        <blockquote key={k} className="text-muted-foreground grid grid-cols-1 gap-2 border-l-2 pl-3">
          {renderMarkdown(quoted.join('\n'))}
        </blockquote>,
      )
      continue
    }

    if (LIST.test(line)) {
      const items: string[] = []
      while (i < lines.length && LIST.test(lines[i])) items.push(lines[i++].replace(LIST, ''))
      out.push(
        <ul key={k} className="marker:text-muted-foreground grid list-disc gap-0.5 pl-5">
          {items.map((t, j) => <li key={j}>{inline(t, `${k}.${j}`)}</li>)}
        </ul>,
      )
      continue
    }

    const o = ORDERED.exec(line)
    if (o) {
      const items: string[] = []
      while (i < lines.length && ORDERED.test(lines[i])) items.push(lines[i++].replace(ORDERED, ''))
      out.push(
        <ol key={k} start={Number(o[1])} className="marker:text-muted-foreground grid list-decimal gap-0.5 pl-5">
          {items.map((t, j) => <li key={j}>{inline(t, `${k}.${j}`)}</li>)}
        </ol>,
      )
      continue
    }

    const para = [line.trim()]
    i++
    while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) para.push(lines[i++].trim())
    out.push(<p key={k}>{inline(para.join(' '), k)}</p>)
  }
  return out
}
