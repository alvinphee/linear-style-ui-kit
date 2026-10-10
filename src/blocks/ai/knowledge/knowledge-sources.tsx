import { useId, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, Alert02Icon, ArrowLeft01Icon, ArrowRight01Icon, CloudUploadIcon, Delete02Icon, GlobalIcon,
  MoreHorizontalIcon, Plug01Icon, RefreshIcon, RepeatIcon, TextAlignLeftIcon,
} from '@hugeicons/core-free-icons'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from 'cn'
import { ConnectorMark, type Connector } from '@/blocks/ai/connectors/connector-card'
import { DeleteConfirm } from '@/components/delete-confirm'
import { FileChip } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import {
  RecurrencePicker, describeRecurrence, localTimeZone, type Recurrence, type TimeZoneOption,
} from '@/components/recurrence-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldError, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatNumber, formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { estimateTokens, formatTokens } from '@/lib/token-estimate'
import type { KnowledgeSource, KnowledgeSourceKind } from './knowledge-types'

// Where a knowledge base gets its documents: uploaded files, a crawled
// website, a folder in a connected app, or text pasted in. Each source shows
// how many documents it brought, and the synced ones (website, connected
// app) how they stay current: their schedule, when they last synced and
// whether it worked, with Sync now and a menu to edit the schedule or remove
// the source. AddSourceDialog adds one: pick the kind, then fill in its form.
// The app does the syncing; this block only reports what the person asks for.

export const SOURCE_KINDS: Record<KnowledgeSourceKind, { label: string; icon: IconSvgElement; description: string }> = {
  upload: { label: 'Upload files', icon: CloudUploadIcon, description: 'PDFs, documents, sheets and text files from your computer.' },
  website: { label: 'Website', icon: GlobalIcon, description: 'Crawl pages from a site, and sync them on a schedule.' },
  connector: { label: 'Connected app', icon: Plug01Icon, description: 'A folder or space in an app you have connected.' },
  text: { label: 'Paste text', icon: TextAlignLeftIcon, description: 'Notes or answers you want the assistant to know.' },
}

const KIND_ORDER: KnowledgeSourceKind[] = ['upload', 'website', 'connector', 'text']

// A source's icon: its own, or the one for its kind.
export const sourceIcon = (source: Pick<KnowledgeSource, 'kind' | 'icon'>) => source.icon ?? SOURCE_KINDS[source.kind].icon

// What AddSourceDialog hands back. The app turns it into a source and its
// documents; `schedule` becomes the sync label (describeRecurrence).
export type KnowledgeSourceDraft =
  | { kind: 'upload'; files: File[] }
  | {
    kind: 'website'
    // Starts with https://.
    url: string
    // How many links deep to follow from the start page, 1 to 3.
    depth: 1 | 2 | 3
    // Path patterns such as /docs/*. Empty include: every page under the start.
    include: string[]
    exclude: string[]
    schedule: Recurrence
  }
  | { kind: 'connector'; connectorId: string; folder: string; schedule: Recurrence }
  | { kind: 'text'; title: string; text: string }

// Every day at 02:00 in the viewer's zone: when syncs usually run.
export const defaultSyncSchedule = (): Recurrence => ({ kind: 'daily', time: '02:00', timeZone: localTimeZone() })

// The address is checked in the form; this is the same check for the app.
export function checkSourceUrl(value: string): string | undefined {
  const url = value.trim()
  if (!url) return 'Enter the address to start from.'
  if (!/^https:\/\//i.test(url)) return 'Use an address that starts with https://.'
  try {
    const { hostname } = new URL(url)
    if (!hostname.includes('.')) return 'That address is not complete.'
  } catch {
    return 'That address is not valid.'
  }
  return undefined
}

// A source's mark: the connector's own for a connected app, else its kind's icon.
export function SourceMark({ source, connectors = [], size = 'md', className }: {
  source: Pick<KnowledgeSource, 'kind' | 'icon' | 'connectorId' | 'name'>
  connectors?: Pick<Connector, 'id' | 'name' | 'icon' | 'colour'>[]
  size?: 'sm' | 'md'
  className?: string
}) {
  const connector = source.kind === 'connector' ? connectors.find((c) => c.id === source.connectorId) : undefined
  if (connector) return <ConnectorMark connector={connector} size={size} className={className} />
  return (
    <span
      className={cn(
        'bg-muted text-muted-foreground grid shrink-0 place-items-center rounded-md',
        size === 'sm' ? 'size-5 [&_svg]:size-3' : 'size-7 [&_svg]:size-4',
        className,
      )}
    >
      <HugeiconsIcon icon={sourceIcon(source)} strokeWidth={2} />
    </span>
  )
}

// The sync line: "Every day at 02:00 · Synced Today, 02:00", "Syncing…", or the error.
function SyncLine({ sync, now }: { sync: NonNullable<KnowledgeSource['sync']>; now: number }) {
  return (
    <>
      <span className="inline-flex min-w-0 items-center gap-1">
        <HugeiconsIcon icon={RepeatIcon} strokeWidth={2} className="size-3 shrink-0" />
        <span className="truncate">{sync.label}</span>
      </span>
      {sync.status === 'syncing' ? (
        <span className="text-status-progress inline-flex items-center gap-1">
          <Spinner className="size-3" aria-hidden="true" /> Syncing…
        </span>
      ) : sync.status === 'error' ? (
        <span className="text-destructive inline-flex min-w-0 items-center gap-1">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3 shrink-0" />
          <span className="min-w-0">{sync.error ?? 'The last sync failed.'}</span>
        </span>
      ) : sync.lastSyncedAt !== undefined ? (
        <span>Synced {formatRelativeDate(sync.lastSyncedAt, { now, time: true })}</span>
      ) : (
        <span>Not synced yet</span>
      )}
    </>
  )
}

export function KnowledgeSources({
  sources, connectors = [], onAdd, onSync, onRemove, onEditSync, scheduleOf, defaultSchedule, timeZones, now,
  accept, title = 'Sources', hint = 'Where this knowledge base gets its documents. Synced sources stay current on their schedule.',
  className,
}: {
  sources: KnowledgeSource[]
  // For the connected-app marks and AddSourceDialog's list.
  connectors?: Connector[]
  // Left out: no Add source.
  onAdd?: (draft: KnowledgeSourceDraft) => void
  onSync: (id: string) => void
  // Called once the person has confirmed.
  onRemove: (id: string) => void
  onEditSync: (id: string, recurrence: Recurrence) => void
  // A source's schedule, so Edit schedule starts from it. Defaults to every day at 02:00.
  scheduleOf?: (id: string) => Recurrence | undefined
  defaultSchedule?: Recurrence
  timeZones?: TimeZoneOption[]
  // The clock the sync times are relative to (a demo clock). Now when left out.
  now?: number | (() => number)
  // File types the upload picker offers, as for <input accept>.
  accept?: string
  title?: string
  hint?: string
  className?: string
}) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<KnowledgeSource | null>(null)
  const [removing, setRemoving] = useState<KnowledgeSource | null>(null)
  const triggers = useRef(new Map<string, HTMLButtonElement>())
  const addRef = useRef<HTMLButtonElement>(null)
  const time = typeof now === 'function' ? now() : now ?? Date.now()

  const addButton = onAdd && (
    <Button ref={addRef} variant="outline" size="sm" onClick={() => setAdding(true)}>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
      Add source
    </Button>
  )

  return (
    <section className={cn('grid min-w-0 gap-2', className)}>
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h4 className="text-xs font-medium">{title}</h4>
          {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
        </div>
        {sources.length > 0 && addButton}
      </div>

      {sources.length ? (
        <ul className="divide-y rounded-lg border">
          {sources.map((source) => {
            const syncing = source.sync?.status === 'syncing'
            return (
              <li key={source.id} className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5">
                <SourceMark source={source} connectors={connectors} className="mt-0.5" />
                <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="min-w-0 truncate text-[13px] font-medium">{source.name}</span>
                    <span className="text-muted-foreground shrink-0 text-[11px]">{SOURCE_KINDS[source.kind].label}</span>
                  </span>
                  {source.detail && <span className="text-muted-foreground truncate text-xs">{source.detail}</span>}
                  <span className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                    <span className="tabular-nums">{plural(source.documentCount, 'document')}</span>
                    {source.sync && <SyncLine sync={source.sync} now={time} />}
                  </span>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  {source.sync && (
                    <Button variant="outline" size="sm" disabled={syncing} onClick={() => onSync(source.id)}>
                      {syncing
                        ? <Spinner data-icon="inline-start" aria-hidden="true" />
                        : <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />}
                      {syncing ? 'Syncing' : 'Sync now'}
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconAction
                        ref={(el: HTMLButtonElement | null) => {
                          if (el) triggers.current.set(source.id, el)
                          else triggers.current.delete(source.id)
                        }}
                        label={`Options for ${source.name}`}
                        icon={MoreHorizontalIcon}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {source.sync && (
                        <>
                          <DropdownMenuItem onSelect={() => setEditing(source)}>
                            <HugeiconsIcon icon={RepeatIcon} strokeWidth={2} /> Edit schedule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(source)}>
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Remove source
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty className="gap-2 rounded-lg border px-3 py-6">
          <EmptyMedia variant="icon"><HugeiconsIcon icon={Plug01Icon} strokeWidth={2} /></EmptyMedia>
          <EmptyTitle>No sources yet</EmptyTitle>
          <EmptyDescription>Upload files, crawl a website or sync a folder from a connected app.</EmptyDescription>
          {addButton && <EmptyContent>{addButton}</EmptyContent>}
        </Empty>
      )}

      {onAdd && (
        <AddSourceDialog
          open={adding}
          onOpenChange={setAdding}
          connectors={connectors}
          defaultSchedule={defaultSchedule}
          timeZones={timeZones}
          now={time}
          accept={accept}
          onAdd={(draft) => {
            onAdd(draft)
            setAdding(false)
          }}
        />
      )}

      <SourceScheduleDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        sourceName={editing?.name ?? ''}
        value={(editing && scheduleOf?.(editing.id)) ?? defaultSchedule ?? defaultSyncSchedule()}
        timeZones={timeZones}
        now={time}
        onSave={(recurrence) => {
          if (editing) onEditSync(editing.id, recurrence)
          setEditing(null)
        }}
        returnFocusTo={() => (editing ? triggers.current.get(editing.id) : undefined)}
      />

      <DeleteConfirm
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        size="sm"
        title={`Remove “${removing?.name ?? ''}”?`}
        description={
          removing?.documentCount
            ? `Its ${plural(removing.documentCount, 'document')} and their chunks leave the index. The assistant stops finding them.`
            : 'It leaves the knowledge base.'
        }
        confirmLabel="Remove"
        returnFocusRef={{ current: removing ? triggers.current.get(removing.id) ?? null : null }}
        afterConfirm={() => addRef.current?.focus()}
        onConfirm={() => removing && onRemove(removing.id)}
      />
    </section>
  )
}

// Changes how often a synced source syncs.
export function SourceScheduleDialog({ open, onOpenChange, sourceName, value, onSave, timeZones, now, returnFocusTo }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceName: string
  value: Recurrence
  onSave: (recurrence: Recurrence) => void
  timeZones?: TimeZoneOption[]
  now?: number
  // The element to focus once it closes, such as the menu's button.
  returnFocusTo?: () => HTMLElement | undefined
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(e) => {
          const el = returnFocusTo?.()
          if (!el) return
          e.preventDefault()
          el.focus()
        }}
      >
        {open && <ScheduleForm sourceName={sourceName} value={value} onSave={onSave} timeZones={timeZones} now={now} />}
      </DialogContent>
    </Dialog>
  )
}

function ScheduleForm({ sourceName, value, onSave, timeZones, now }: {
  sourceName: string
  value: Recurrence
  onSave: (recurrence: Recurrence) => void
  timeZones?: TimeZoneOption[]
  now?: number
}) {
  const [schedule, setSchedule] = useState(value)
  const invalid = schedule.kind === 'weekly' && !schedule.days?.length
  return (
    <form
      className="grid min-w-0 gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!invalid) onSave(schedule)
      }}
    >
      <DialogHeader className="pr-8">
        <DialogTitle>Sync schedule</DialogTitle>
        <DialogDescription>How often “{sourceName}” checks for new and changed documents.</DialogDescription>
      </DialogHeader>
      <RecurrencePicker value={schedule} onChange={setSchedule} timeZones={timeZones} now={now} invalid={invalid} />
      <p className={cn('text-[11px]', invalid ? 'text-destructive' : 'text-muted-foreground')}>
        {invalid ? 'Pick at least one day.' : describeRecurrence(schedule, timeZones)}
      </p>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={invalid}>Save schedule</Button>
      </DialogFooter>
    </form>
  )
}

/* ---------- Add source ---------- */

export function AddSourceDialog({
  open, onOpenChange, connectors = [], onAdd, kind, defaultSchedule, timeZones, now, accept,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Only connected ones can be picked; the rest show, disabled.
  connectors?: Connector[]
  // The caller stores the source and closes the dialog.
  onAdd: (draft: KnowledgeSourceDraft) => void
  // Opens straight on this kind's form, with no Back.
  kind?: KnowledgeSourceKind
  // Where a website's or connected app's schedule starts. Every day at 02:00 when left out.
  defaultSchedule?: Recurrence
  timeZones?: TimeZoneOption[]
  now?: number
  accept?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {open && (
          <SourceForm
            connectors={connectors}
            onAdd={onAdd}
            fixedKind={kind}
            schedule={defaultSchedule ?? defaultSyncSchedule()}
            timeZones={timeZones}
            now={now}
            accept={accept}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

const TITLES: Record<KnowledgeSourceKind, { title: string; description: string }> = {
  upload: { title: 'Upload files', description: 'Each file becomes a document. It is split into chunks and indexed once it is added.' },
  website: { title: 'Add a website', description: 'Pages are crawled from the start address, then synced on the schedule you pick.' },
  connector: { title: 'Add from a connected app', description: 'Documents in the folder are synced on the schedule you pick, as you can see them.' },
  text: { title: 'Paste text', description: 'The text is kept as one document and indexed like a file.' },
}

const DEPTHS = [
  { value: 1, label: '1', hint: 'The start page and the pages it links to' },
  { value: 2, label: '2', hint: 'Two links deep from the start page' },
  { value: 3, label: '3', hint: 'Three links deep: large sites take a while' },
] as const

const lines = (text: string) => text.split(/[\n,]/).map((l) => l.trim()).filter(Boolean)

function SourceForm({ connectors, onAdd, fixedKind, schedule: startSchedule, timeZones, now, accept }: {
  connectors: Connector[]
  onAdd: (draft: KnowledgeSourceDraft) => void
  fixedKind?: KnowledgeSourceKind
  schedule: Recurrence
  timeZones?: TimeZoneOption[]
  now?: number
  accept?: string
}) {
  const id = useId()
  const connected = connectors.filter((c) => c.status === 'connected')
  const [kind, setKind] = useState<KnowledgeSourceKind | null>(fixedKind ?? null)
  const [tried, setTried] = useState(false)
  const [url, setUrl] = useState('')
  const [depth, setDepth] = useState<1 | 2 | 3>(2)
  const [include, setInclude] = useState('')
  const [exclude, setExclude] = useState('')
  const [schedule, setSchedule] = useState(startSchedule)
  const [connectorId, setConnectorId] = useState(connected[0]?.id ?? '')
  const [folder, setFolder] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const scheduleInvalid = schedule.kind === 'weekly' && !schedule.days?.length
  const errors = {
    url: kind === 'website' ? checkSourceUrl(url) : undefined,
    connector: kind === 'connector' && !connected.some((c) => c.id === connectorId)
      ? (connected.length ? 'Pick an app.' : 'Connect an app in Settings first.')
      : undefined,
    title: kind === 'text' && !title.trim() ? 'Give the text a title.' : undefined,
    text: kind === 'text' && !text.trim() ? 'Paste or type the text.' : undefined,
    files: kind === 'upload' && !files.length ? 'Choose at least one file.' : undefined,
    schedule: (kind === 'website' || kind === 'connector') && scheduleInvalid ? 'Pick at least one day.' : undefined,
  }
  const show = (key: keyof typeof errors) => (tried ? errors[key] : undefined)

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    const picked = Array.from(list)
    setFiles((prev) => [...prev, ...picked.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))])
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!kind) return
    setTried(true)
    const first = (Object.keys(errors) as (keyof typeof errors)[]).find((k) => errors[k])
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    if (kind === 'upload') onAdd({ kind, files })
    if (kind === 'website') {
      onAdd({ kind, url: url.trim(), depth, include: lines(include), exclude: lines(exclude), schedule })
    }
    if (kind === 'connector') onAdd({ kind, connectorId, folder: folder.trim() || '/', schedule })
    if (kind === 'text') onAdd({ kind, title: title.trim(), text: text.trim() })
  }

  const scheduleField = (
    <Field data-invalid={!!show('schedule') || undefined} aria-labelledby={`${id}-schedule-title`}>
      <FieldTitle id={`${id}-schedule-title`}>Sync schedule</FieldTitle>
      <RecurrencePicker value={schedule} onChange={setSchedule} timeZones={timeZones} now={now} invalid={!!show('schedule')} />
      {show('schedule')
        ? <FieldError>{show('schedule')}</FieldError>
        : <FieldDescription>{describeRecurrence(schedule, timeZones)}</FieldDescription>}
    </Field>
  )

  const heading = kind ? TITLES[kind] : { title: 'Add a source', description: 'Pick where the documents come from.' }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="shrink-0 border-b px-4 py-3 pr-10">
        <DialogTitle>{heading.title}</DialogTitle>
        <DialogDescription>{heading.description}</DialogDescription>
      </DialogHeader>

      <div className="@container min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-w-0 gap-4 p-4">
          {!kind && (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 @sm:grid-cols-2">
              {KIND_ORDER.map((k) => (
                <li key={k} className="min-w-0">
                  <button
                    type="button"
                    autoFocus={k === KIND_ORDER[0]}
                    onClick={() => {
                      setKind(k)
                      setTried(false)
                    }}
                    className="hover:bg-accent/50 focus-visible:ring-ring/50 grid h-full w-full min-w-0 content-start gap-1.5 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-md">
                        <HugeiconsIcon icon={SOURCE_KINDS[k].icon} strokeWidth={2} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{SOURCE_KINDS[k].label}</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                    </span>
                    <span className="text-muted-foreground text-[11px] leading-snug">{SOURCE_KINDS[k].description}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {kind === 'upload' && (
            <Field data-invalid={!!show('files') || undefined}>
              <FieldTitle>Files</FieldTitle>
              <div
                onDragOver={(e: DragEvent) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e: DragEvent) => {
                  e.preventDefault()
                  setDragging(false)
                  addFiles(e.dataTransfer.files)
                }}
                className={cn(
                  'grid justify-items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
                  dragging && 'border-brand bg-brand/5',
                  show('files') && 'border-destructive',
                )}
              >
                <HugeiconsIcon icon={CloudUploadIcon} strokeWidth={2} className="text-muted-foreground size-5" />
                <p className="text-muted-foreground text-xs">Drop files here, or</p>
                <Button id={`${id}-files`} type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  Choose files
                </Button>
                <p className="text-muted-foreground text-[11px]">PDF, Word, sheets, CSV, Markdown and text.</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept={accept}
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              {files.length > 0 && (
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {files.map((f) => (
                    <FileChip key={`${f.name}-${f.size}`} name={f.name} size={f.size} onRemove={() => setFiles((prev) => prev.filter((p) => p !== f))} />
                  ))}
                </div>
              )}
              {show('files') && <FieldError>{show('files')}</FieldError>}
            </Field>
          )}

          {kind === 'website' && (
            <>
              <Field data-invalid={!!show('url') || undefined}>
                <FieldLabel htmlFor={`${id}-url`}>Start address</FieldLabel>
                <Input
                  id={`${id}-url`}
                  type="url"
                  inputMode="url"
                  autoFocus
                  value={url}
                  placeholder="https://docs.example.com/guide"
                  aria-invalid={!!show('url') || undefined}
                  aria-describedby={`${id}-url-note`}
                  onChange={(e) => setUrl(e.target.value)}
                />
                {show('url')
                  ? <FieldError id={`${id}-url-note`}>{show('url')}</FieldError>
                  : <FieldDescription id={`${id}-url-note`}>Only pages on the same site are crawled.</FieldDescription>}
              </Field>
              <Field>
                <FieldTitle id={`${id}-depth`}>Crawl depth</FieldTitle>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  spacing={0}
                  value={String(depth)}
                  onValueChange={(v) => v && setDepth(Number(v) as 1 | 2 | 3)}
                  aria-labelledby={`${id}-depth`}
                >
                  {DEPTHS.map((d) => (
                    <ToggleGroupItem key={d.value} value={String(d.value)} aria-label={`${d.label}: ${d.hint}`} className="min-w-10 tabular-nums">
                      {d.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>{DEPTHS.find((d) => d.value === depth)?.hint}.</FieldDescription>
              </Field>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 @md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${id}-include`}>
                    Only paths like <span className="text-muted-foreground font-normal">(optional)</span>
                  </FieldLabel>
                  <Textarea
                    id={`${id}-include`}
                    value={include}
                    placeholder={'/docs/*\n/help/*'}
                    onChange={(e) => setInclude(e.target.value)}
                    className="min-h-16 font-mono text-xs"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${id}-exclude`}>
                    Skip paths like <span className="text-muted-foreground font-normal">(optional)</span>
                  </FieldLabel>
                  <Textarea
                    id={`${id}-exclude`}
                    value={exclude}
                    placeholder={'/blog/*\n*/archive/*'}
                    onChange={(e) => setExclude(e.target.value)}
                    className="min-h-16 font-mono text-xs"
                  />
                </Field>
              </div>
              <p className="text-muted-foreground -mt-2 text-[11px]">One pattern per line. * matches any part of a path.</p>
              {scheduleField}
            </>
          )}

          {kind === 'connector' && (
            <>
              <Field data-invalid={!!show('connector') || undefined}>
                <FieldTitle id={`${id}-apps`}>App</FieldTitle>
                {connectors.length ? (
                  <RadioGroupPrimitive.Root
                    id={`${id}-connector`}
                    aria-labelledby={`${id}-apps`}
                    value={connectorId}
                    onValueChange={setConnectorId}
                    className="divide-y rounded-lg border"
                  >
                    {connectors.map((c) => {
                      const usable = c.status === 'connected'
                      return (
                        <RadioGroupPrimitive.Item
                          key={c.id}
                          value={c.id}
                          disabled={!usable}
                          className={cn(
                            'flex w-full min-w-0 items-center gap-2.5 px-3 py-2 text-left outline-none first:rounded-t-lg last:rounded-b-lg',
                            'focus-visible:bg-accent hover:bg-accent/50 data-[state=checked]:bg-accent/60 disabled:hover:bg-transparent',
                          )}
                        >
                          <ConnectorMark connector={c} size="sm" className={cn(!usable && 'opacity-50')} />
                          <span className="grid min-w-0 flex-1">
                            <span className={cn('truncate text-xs font-medium', !usable && 'text-muted-foreground')}>{c.name}</span>
                            <span className="text-muted-foreground truncate text-[11px]">
                              {usable ? (c.account ? `Connected as ${c.account}` : 'Connected') : 'Connect it in Settings'}
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              'grid size-4 shrink-0 place-items-center rounded-full border',
                              connectorId === c.id && usable && 'border-primary bg-primary',
                              !usable && 'opacity-40',
                            )}
                          >
                            {connectorId === c.id && usable && <span className="bg-primary-foreground size-1.5 rounded-full" />}
                          </span>
                        </RadioGroupPrimitive.Item>
                      )
                    })}
                  </RadioGroupPrimitive.Root>
                ) : (
                  <p className="text-muted-foreground rounded-lg border px-3 py-4 text-center text-xs">
                    No apps yet. Connect one in Settings › Connectors.
                  </p>
                )}
                {show('connector') && <FieldError>{show('connector')}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-folder`}>
                  Folder or space <span className="text-muted-foreground font-normal">(optional)</span>
                </FieldLabel>
                <Input
                  id={`${id}-folder`}
                  value={folder}
                  placeholder="/Shared/Support"
                  onChange={(e) => setFolder(e.target.value)}
                  className="font-mono text-xs"
                />
                <FieldDescription>Leave it empty to sync everything you can see in the app.</FieldDescription>
              </Field>
              {scheduleField}
            </>
          )}

          {kind === 'text' && (
            <>
              <Field data-invalid={!!show('title') || undefined}>
                <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
                <Input
                  id={`${id}-title`}
                  autoFocus
                  value={title}
                  maxLength={120}
                  placeholder="For example: Holiday cover rules"
                  aria-invalid={!!show('title') || undefined}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {show('title') && <FieldError>{show('title')}</FieldError>}
              </Field>
              <Field data-invalid={!!show('text') || undefined}>
                <FieldLabel htmlFor={`${id}-text`}>Text</FieldLabel>
                <Textarea
                  id={`${id}-text`}
                  value={text}
                  placeholder="Paste or type what the assistant should know."
                  aria-invalid={!!show('text') || undefined}
                  onChange={(e) => setText(e.target.value)}
                  className="max-h-72 min-h-36 text-[13px]"
                />
                <div className="flex min-w-0 justify-between gap-3">
                  {show('text') ? <FieldError>{show('text')}</FieldError> : <span />}
                  <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{formatNumber(text.length)} characters · about {formatTokens(estimateTokens(text))} tokens</span>
                </div>
              </Field>
            </>
          )}
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t px-4 py-3">
        {kind && !fixedKind && (
          <Button type="button" variant="ghost" className="sm:mr-auto" onClick={() => setKind(null)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
            Back
          </Button>
        )}
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        {kind && (
          <Button type="submit">
            {kind === 'upload' && files.length ? `Add ${plural(files.length, 'file')}` : 'Add source'}
          </Button>
        )}
      </DialogFooter>
    </form>
  )
}
