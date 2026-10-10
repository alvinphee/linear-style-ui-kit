import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CloudUploadIcon, Delete02Icon, Files01Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { FILE_KIND_ICONS } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { SearchField } from '@/components/search-field'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatFileSize, formatNumber, formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { formatTokens } from '@/lib/token-estimate'
import { sourceIcon } from './knowledge-sources'
import type { IndexStatus, KnowledgeDocument, KnowledgeSource } from './knowledge-types'

// A knowledge base's documents: each file or page with its source, where it
// is in indexing (queued, processing with its progress, indexed, or failed
// with the reason in a tooltip), its chunks and tokens, and when it last
// changed. Search, filter chips by status, a source filter, row selection
// with a bulk bar (Re-index, Remove after a confirm), and Upload, which also
// takes files dropped anywhere on the block. A table when there is room;
// on a narrow width each document is a card, so the page never scrolls
// sideways. The app does the indexing and reports it in `documents`.

export const INDEX_STATUS: Record<IndexStatus, { label: string; tone: Tone }> = {
  queued: { label: 'Queued', tone: 'neutral' },
  processing: { label: 'Processing', tone: 'progress' },
  indexed: { label: 'Indexed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

// How indexing stands across documents. `processing` counts queued ones too.
export function indexHealth(documents: KnowledgeDocument[]) {
  let indexed = 0
  let processing = 0
  let failed = 0
  let tokens = 0
  let chunks = 0
  for (const d of documents) {
    if (d.status === 'indexed') indexed++
    else if (d.status === 'failed') failed++
    else processing++
    tokens += d.tokens
    chunks += d.chunks ?? 0
  }
  return { total: documents.length, indexed, processing, failed, tokens, chunks }
}

// How far indexing has got, 0 to 100, over every document that has not
// failed. Undefined when nothing is waiting or processing.
export function indexProgress(documents: KnowledgeDocument[]) {
  const live = documents.filter((d) => d.status !== 'failed')
  if (!live.some((d) => d.status === 'queued' || d.status === 'processing')) return undefined
  const done = live.reduce((sum, d) => sum + (d.status === 'indexed' ? 100 : d.status === 'processing' ? d.progress ?? 0 : 0), 0)
  return Math.round(done / live.length)
}

// A document's status as a pill: the progress while processing, and the
// reason a failed one failed in a tooltip (or written out, `inlineError`).
export function DocumentStatus({ document, inlineError = false, bar = false }: {
  document: Pick<KnowledgeDocument, 'name' | 'status' | 'progress' | 'error'>
  inlineError?: boolean
  // A small progress bar beside the pill while processing.
  bar?: boolean
}) {
  const { status, progress = 0, error } = document
  const meta = INDEX_STATUS[status]
  if (status === 'processing') {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        <StatusBadge tone={meta.tone}>
          {meta.label} <span className="tabular-nums">{Math.round(progress)}%</span>
        </StatusBadge>
        {bar && <Progress value={progress} aria-label={`${document.name} indexing`} className="w-10" />}
      </span>
    )
  }
  if (status === 'failed' && error && !inlineError) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Failed: ${error}`}
            className="focus-visible:ring-ring/50 rounded-md outline-none focus-visible:ring-2"
          >
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">{error}</TooltipContent>
      </Tooltip>
    )
  }
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
}

type StatusFilter = 'all' | 'indexed' | 'processing' | 'failed'

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'indexed', label: 'Indexed' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
]

const matchesStatus = (d: KnowledgeDocument, filter: StatusFilter) =>
  filter === 'all' || (filter === 'processing' ? d.status === 'processing' || d.status === 'queued' : d.status === filter)

// The checkbox's look when some, not all, rows are picked.
const MIXED =
  'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary dark:data-[state=indeterminate]:bg-primary ' +
  'data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:[&_svg]:hidden ' +
  'data-[state=indeterminate]:after:absolute data-[state=indeterminate]:after:inset-x-[3px] data-[state=indeterminate]:after:top-1/2 ' +
  'data-[state=indeterminate]:after:h-0.5 data-[state=indeterminate]:after:-translate-y-1/2 data-[state=indeterminate]:after:rounded-full ' +
  'data-[state=indeterminate]:after:bg-current'

const ALL_SOURCES = '__all'

export function KnowledgeDocuments({
  documents, sources, onUpload, onReindex, onRemove, onOpen, now, accept, className,
}: {
  documents: KnowledgeDocument[]
  // For each document's source name and icon, and the source filter.
  sources: KnowledgeSource[]
  // Files picked or dropped. Left out: no Upload and no drop zone.
  onUpload?: (files: File[]) => void
  onReindex: (ids: string[]) => void
  // Called once the person has confirmed.
  onRemove: (ids: string[]) => void
  // Makes each name a button that opens the document.
  onOpen?: (id: string) => void
  // The clock the update times are relative to (a demo clock). Now when left out.
  now?: number | (() => number)
  // File types the upload picker offers, as for <input accept>.
  accept?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [source, setSource] = useState(ALL_SOURCES)
  const [picked, setPicked] = useState<string[]>([])
  const [confirm, setConfirm] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragDepth = useRef(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const time = typeof now === 'function' ? now() : now ?? Date.now()

  const sourceOf = (id: string) => sources.find((s) => s.id === id)
  const q = query.trim().toLowerCase()
  const bySearch = documents.filter((d) =>
    (!q || d.name.toLowerCase().includes(q)) && (source === ALL_SOURCES || d.sourceId === source))
  const shown = bySearch.filter((d) => matchesStatus(d, status))
  // Picks of documents that have since gone are dropped.
  const selected = picked.filter((id) => documents.some((d) => d.id === id))
  const shownPicked = shown.filter((d) => selected.includes(d.id)).length
  const allState = shown.length > 0 && shownPicked === shown.length ? true : shownPicked > 0 ? 'indeterminate' : false
  const filtered = !!q || status !== 'all' || source !== ALL_SOURCES

  const toggle = (id: string, on: boolean) => setPicked((p) => (on ? [...p.filter((x) => x !== id), id] : p.filter((x) => x !== id)))
  const toggleAll = () => {
    const ids = shown.map((d) => d.id)
    setPicked((p) => (allState === true ? p.filter((x) => !ids.includes(x)) : [...new Set([...p, ...ids])]))
  }
  const clearFilters = () => {
    setQuery('')
    setStatus('all')
    setSource(ALL_SOURCES)
  }

  const isFileDrag = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files')
  const drop = onUpload && {
    onDragEnter: (e: DragEvent) => {
      if (!isFileDrag(e)) return
      dragDepth.current++
      setDragging(true)
    },
    onDragOver: (e: DragEvent) => {
      if (isFileDrag(e)) e.preventDefault()
    },
    onDragLeave: (e: DragEvent) => {
      if (!isFileDrag(e)) return
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (!dragDepth.current) setDragging(false)
    },
    onDrop: (e: DragEvent) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragDepth.current = 0
      setDragging(false)
      if (e.dataTransfer.files.length) onUpload(Array.from(e.dataTransfer.files))
    },
  }

  const uploadButton = (variant: 'default' | 'outline') => onUpload && (
    <Button size="sm" variant={variant} onClick={() => fileRef.current?.click()}>
      <HugeiconsIcon icon={CloudUploadIcon} strokeWidth={2} data-icon="inline-start" />
      Upload
    </Button>
  )

  const nameOf = (d: KnowledgeDocument, className?: string) => onOpen ? (
    <button
      type="button"
      onClick={() => onOpen(d.id)}
      className={cn('focus-visible:ring-ring/50 min-w-0 truncate rounded-sm text-left outline-none hover:underline focus-visible:ring-2', className)}
    >
      {d.name}
    </button>
  ) : <span className={cn('min-w-0 truncate', className)}>{d.name}</span>

  const sourceLabel = (d: KnowledgeDocument) => {
    const s = sourceOf(d.sourceId)
    return s ? (
      <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5">
        <HugeiconsIcon icon={sourceIcon(s)} strokeWidth={2} className="size-3 shrink-0" />
        <span className="truncate">{s.name}</span>
      </span>
    ) : <span className="text-muted-foreground">—</span>
  }

  const counts: Record<StatusFilter, number> = {
    all: bySearch.length,
    indexed: bySearch.filter((d) => matchesStatus(d, 'indexed')).length,
    processing: bySearch.filter((d) => matchesStatus(d, 'processing')).length,
    failed: bySearch.filter((d) => matchesStatus(d, 'failed')).length,
  }

  let body: ReactNode
  if (!documents.length) {
    body = (
      <Empty className="gap-2 rounded-lg border px-3 py-8">
        <EmptyMedia variant="icon"><HugeiconsIcon icon={Files01Icon} strokeWidth={2} /></EmptyMedia>
        <EmptyTitle>No documents yet</EmptyTitle>
        <EmptyDescription>
          {onUpload ? 'Drop files here or upload them, or add a source to sync documents from a site or an app.' : 'Add a source to bring documents in.'}
        </EmptyDescription>
        {onUpload && <EmptyContent>{uploadButton('outline')}</EmptyContent>}
      </Empty>
    )
  } else if (!shown.length) {
    body = (
      <Empty className="gap-2 rounded-lg border px-3 py-8">
        <EmptyDescription>{q ? `No documents match “${query.trim()}”.` : 'No documents match these filters.'}</EmptyDescription>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
        </EmptyContent>
      </Empty>
    )
  } else {
    body = (
      <>
        {/* Wide: a table. */}
        <div className="hidden overflow-hidden rounded-lg border @3xl:block">
          <table className="w-full table-fixed text-xs">
            <caption className="sr-only">Documents</caption>
            <thead className="text-muted-foreground border-b text-left text-[11px]">
              <tr className="[&>th]:h-8 [&>th]:px-2 [&>th]:font-medium [&>th:first-child]:pr-0 [&>th:first-child]:pl-3 [&>th:last-child]:pr-3">
                <th scope="col" className="w-9">
                  <Checkbox checked={allState} onCheckedChange={toggleAll} aria-label="Select all shown documents" className={MIXED} />
                </th>
                <th scope="col">Name</th>
                <th scope="col" className="w-32">Source</th>
                <th scope="col" className="w-36">Status</th>
                <th scope="col" className="w-16 text-right">Chunks</th>
                <th scope="col" className="w-16 text-right">Tokens</th>
                <th scope="col" className="w-24 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((d) => {
                const on = selected.includes(d.id)
                return (
                  <tr key={d.id} data-state={on ? 'selected' : undefined} className="hover:bg-accent/40 data-[state=selected]:bg-accent/60 [&>td]:h-10 [&>td]:px-2 [&>td:first-child]:pr-0 [&>td:first-child]:pl-3 [&>td:last-child]:pr-3">
                    <td>
                      <Checkbox checked={on} onCheckedChange={(v) => toggle(d.id, v === true)} aria-label={`Select ${d.name}`} />
                    </td>
                    <td>
                      <span className="flex min-w-0 items-center gap-2">
                        <HugeiconsIcon icon={FILE_KIND_ICONS[d.kind]} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                        {nameOf(d, 'font-medium')}
                        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                          {formatFileSize(d.size)}{d.pages ? ` · ${d.pages} pp` : ''}
                        </span>
                      </span>
                    </td>
                    <td className="overflow-hidden">{sourceLabel(d)}</td>
                    <td><DocumentStatus document={d} bar /></td>
                    <td className="text-muted-foreground text-right tabular-nums">{d.chunks !== undefined ? formatNumber(d.chunks) : '—'}</td>
                    <td className="text-muted-foreground text-right tabular-nums">{formatTokens(d.tokens)}</td>
                    <td className="text-muted-foreground text-right whitespace-nowrap">{formatRelativeDate(d.updatedAt, { now: time })}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Narrow: a card per document. */}
        <ul aria-label="Documents" className="divide-y rounded-lg border @3xl:hidden">
          {shown.map((d) => {
            const on = selected.includes(d.id)
            return (
              <li key={d.id} data-state={on ? 'selected' : undefined} className="data-[state=selected]:bg-accent/60 flex min-w-0 items-start gap-2.5 px-3 py-2.5">
                <Checkbox checked={on} onCheckedChange={(v) => toggle(d.id, v === true)} aria-label={`Select ${d.name}`} className="mt-0.5" />
                <HugeiconsIcon icon={FILE_KIND_ICONS[d.kind]} strokeWidth={2} className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                <div className="grid min-w-0 flex-1 gap-1">
                  <span className="flex min-w-0 items-center gap-2 text-xs">
                    {nameOf(d, 'flex-1 font-medium')}
                    <span className="shrink-0"><DocumentStatus document={d} inlineError /></span>
                  </span>
                  <span className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tabular-nums">
                    {sourceLabel(d)}
                    <span>{formatTokens(d.tokens)} tokens</span>
                    {d.chunks !== undefined && <span>{plural(d.chunks, 'chunk')}</span>}
                    <span>{formatRelativeDate(d.updatedAt, { now: time })}</span>
                  </span>
                  {d.status === 'processing' && <Progress value={d.progress ?? 0} aria-label={`${d.name} indexing`} className="mt-0.5" />}
                  {d.status === 'failed' && d.error && <span className="text-destructive text-[11px]">{d.error}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      </>
    )
  }

  return (
    <section {...drop} className={cn('@container relative grid min-w-0 gap-2', className)}>
      {documents.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search documents"
            className="h-7 min-w-0 flex-1 basis-40 @3xl:max-w-72"
          />
          {sources.length > 1 && (
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger aria-label="Filter by source" className="max-w-48 min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value={ALL_SOURCES}>All sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <HugeiconsIcon icon={sourceIcon(s)} strokeWidth={2} />
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="ml-auto">{uploadButton('default')}</span>
        </div>
      )}

      {documents.length > 0 && (selected.length > 0 ? (
        <div role="toolbar" aria-label="Selected documents" className="bg-muted/60 flex min-h-8 min-w-0 flex-wrap items-center gap-1 rounded-lg border py-0.5 pr-0.5 pl-3">
          <span className="mr-auto text-xs font-medium tabular-nums">{selected.length} selected</span>
          <Button variant="ghost" size="sm" onClick={() => onReindex(selected)}>
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
            Re-index
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(true)}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
            Remove
          </Button>
          <IconAction label="Clear selection" icon={Cancel01Icon} onClick={() => setPicked([])} />
        </div>
      ) : (
        <div role="group" aria-label="Filter by status" className="-mx-1 flex min-h-8 gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {STATUS_CHIPS.map((chip) => {
            const active = status === chip.value
            return (
              <Button
                key={chip.value}
                variant={active ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={active}
                onClick={() => setStatus(chip.value)}
                className={cn('shrink-0 rounded-full', !active && 'text-muted-foreground')}
              >
                {chip.label}
                <span className={cn('tabular-nums', chip.value === 'failed' && counts.failed ? 'text-destructive' : 'text-muted-foreground')}>
                  {counts[chip.value]}
                </span>
              </Button>
            )
          })}
          {filtered && (
            <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto shrink-0" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      ))}

      {body}

      {/* The cards have no header row, so select-all sits under them. */}
      {documents.length > 0 && shown.length > 0 && (
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] @3xl:hidden">
          <Button variant="ghost" size="xs" className="-ml-1.5" onClick={toggleAll}>
            {allState === true ? 'Clear selection' : `Select all ${shown.length}`}
          </Button>
        </div>
      )}

      {dragging && (
        <div className="border-brand bg-background/85 pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-lg border-2 border-dashed">
          <span className="text-brand flex items-center gap-2 text-xs font-medium">
            <HugeiconsIcon icon={CloudUploadIcon} strokeWidth={2} className="size-4" />
            Drop files to upload
          </span>
        </div>
      )}

      {onUpload && (
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={accept}
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onUpload(Array.from(e.target.files))
            e.target.value = ''
          }}
        />
      )}

      <DeleteConfirm
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        title={`Remove ${plural(selected.length, 'document')}?`}
        description="Their chunks leave the index and the assistant stops finding them. A document from a synced source comes back at the next sync unless it is removed there."
        confirmLabel="Remove"
        onConfirm={() => {
          onRemove(selected)
          setPicked([])
        }}
      />
    </section>
  )
}
