import { useEffect, useRef, useState, type DragEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon, Camera01Icon, Cancel01Icon, CheckmarkCircle02Icon, CloudUploadIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/format'
import { plural } from '@/lib/text'
import { fileIcon, FileChip } from '@/components/file-chip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Panel, Section, Row } from './shared'

/* ---------- File upload ---------- */

const MAX_BYTES = 10 * 1024 * 1024

const ACCEPT = '.png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf'

type Kind = 'image' | 'pdf' | 'other'

type Upload = { id: string; name: string; size: number; kind: Kind; url?: string; progress: number; error?: string }

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
          <HugeiconsIcon icon={fileIcon(file.name)} strokeWidth={2} className="size-4" />
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
            <span className="tabular-nums">{formatFileSize(file.size)}</span>
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

/* ---------- File chips ---------- */

const FILES = [
  { name: 'aging-report.pdf', size: 248_000 },
  { name: 'q3-invoices.xlsx', size: 61_400 },
  { name: 'customer-notes.md', size: 3_200 },
]

export default function FileUploadSection() {
  return (
    <Section id="file-upload" title="File upload" description="A dropzone, a profile photo, and attached files as chips">
      <UploadPanel />

      <AvatarPanel />

      <Panel title="File chips" note="Attached to a message">
        <Row className="gap-1.5">
          {FILES.map((f) => <FileChip key={f.name} name={f.name} size={f.size} />)}
        </Row>
      </Panel>
    </Section>
  )
}
