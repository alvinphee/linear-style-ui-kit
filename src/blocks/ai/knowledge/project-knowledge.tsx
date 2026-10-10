import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, AlertCircleIcon, ArrowDown01Icon, Cancel01Icon, CheckmarkCircle02Icon, Clock01Icon, FileSearchIcon, Files01Icon,
  Globe02Icon, LibraryIcon, TextAlignLeftIcon, Unlink02Icon, Upload04Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { ContextMeter, ContextModeBadge, type ContextMode } from '@/components/ai/context-meter'
import { FILE_KIND_ICONS, type FileKind } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatFileSize, formatNumber } from '@/lib/format'
import { estimateTokens, formatTokens } from '@/lib/token-estimate'
import type { IndexStatus, KnowledgeBaseSummary } from './knowledge-types'

// A project's knowledge: the files, pasted text and web pages the assistant
// draws on in every chat in the project, and the knowledge bases it links.
//
// While the knowledge fits in the project's context, every file is read in
// full in each chat (full context). Once it outgrows the threshold, the app
// switches by itself to searching it and reading only the parts that match
// (search mode). Nobody picks the mode: the meter at the top shows which one
// is in use, and why. A file can be left out (its Included switch) so it no
// longer counts. Linked knowledge bases are always searched, whatever their
// size, and do not count towards the meter.
//
// The app keeps the knowledge; the block reports each change. A web page
// arrives as a URL: the app reads it and moves its status from Queued to
// Indexed. The block measures its own box (@container), one column narrow.

export type ProjectKnowledgeFile = {
  id: string
  name: string
  // Bytes, and the estimated tokens of its text (estimateFileTokens).
  size: number
  kind: FileKind
  tokens: number
  // Off: kept in the project, but not read and not counted.
  included: boolean
}

// Text pasted in, such as notes or a style guide. Its tokens are estimated.
export type ProjectKnowledgeText = { id: string; title: string; text: string }

// A web page the assistant reads once and keeps. Counted once indexed.
export type ProjectKnowledgeLink = {
  id: string
  url: string
  title?: string
  status: IndexStatus
  // The page's text, in tokens, once read.
  tokens?: number
  error?: string
}

export const DEFAULT_SEARCH_THRESHOLD = 0.8

// Full context while the knowledge stays under `threshold` (a share of
// `limit`), search mode from there up.
export function knowledgeMode(used: number, limit: number, threshold = DEFAULT_SEARCH_THRESHOLD): ContextMode {
  return limit > 0 && used >= limit * threshold ? 'search' : 'full'
}

// The tokens that count towards the project's context: included files,
// pasted text and indexed web pages. Knowledge bases do not count.
export function knowledgeTokens(files: ProjectKnowledgeFile[], texts: ProjectKnowledgeText[], links: ProjectKnowledgeLink[]) {
  return (
    files.reduce((sum, f) => sum + (f.included ? f.tokens : 0), 0) +
    texts.reduce((sum, t) => sum + estimateTokens(t.text), 0) +
    links.reduce((sum, l) => sum + (l.status === 'indexed' ? l.tokens ?? 0 : 0), 0)
  )
}

const EXPLAIN: Record<ContextMode, string> = {
  full: 'Every file is read in full in each chat.',
  search: 'Too much to read in full, so the assistant searches these and reads the parts that match.',
}

const KIND_LABEL: Record<FileKind, string> = {
  pdf: 'PDF', sheet: 'Spreadsheet', doc: 'Document', csv: 'CSV', text: 'Text', image: 'Image', code: 'Code', other: 'File',
}

// Why a web page address will not do, or null when it will.
export function pageUrlError(value: string) {
  const text = value.trim()
  if (!text) return "Enter the page's address."
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return 'This is not a valid address. It starts with https://'
  }
  if (url.protocol !== 'https:') return 'Use an https:// address.'
  if (!url.hostname.includes('.')) return 'Add the full site name, such as docs.example.com.'
  return null
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export type ProjectKnowledgeProps = {
  files: ProjectKnowledgeFile[]
  texts: ProjectKnowledgeText[]
  links: ProjectKnowledgeLink[]
  // Knowledge bases linked to the project, and those that could be.
  bases: KnowledgeBaseSummary[]
  availableBases?: KnowledgeBaseSummary[]
  // The project's context, in tokens, and the share of it (0 to 1) from which
  // the assistant searches instead of reading everything.
  limit: number
  threshold?: number
  // Each callback left out hides its action.
  onAddFiles?: (files: File[]) => void
  onRemoveFile?: (id: string) => void
  onToggleFile?: (id: string, included: boolean) => void
  onAddText?: (text: { title: string; text: string }) => void
  onRemoveText?: (id: string) => void
  // The address, checked as https. The app adds the page as Queued and
  // updates its status as it reads it.
  onAddLink?: (url: string) => void
  onRemoveLink?: (id: string) => void
  onLinkBase?: (ids: string[]) => void
  onUnlinkBase?: (id: string) => void
  // Makes a linked base's name a button, to open its page.
  onOpenBase?: (id: string) => void
  // Under the heading. Say what the knowledge is for.
  hint?: string
  className?: string
}

export function ProjectKnowledge({
  files, texts, links, bases, availableBases = [], limit, threshold = DEFAULT_SEARCH_THRESHOLD,
  onAddFiles, onRemoveFile, onToggleFile, onAddText, onRemoveText, onAddLink, onRemoveLink, onLinkBase, onUnlinkBase,
  onOpenBase, hint = 'Files, text and pages the assistant draws on in every chat in this project.', className,
}: ProjectKnowledgeProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<'text' | 'link' | 'base' | null>(null)

  const used = knowledgeTokens(files, texts, links)
  const mode = knowledgeMode(used, limit, threshold)
  const empty = !files.length && !texts.length && !links.length && !bases.length
  const linkable = availableBases.filter((b) => !bases.some((l) => l.id === b.id))

  const actions: { id: string; label: string; icon: IconSvgElement; run: () => void }[] = [
    ...(onAddFiles ? [{ id: 'files', label: 'Upload files', icon: Upload04Icon, run: () => fileRef.current?.click() }] : []),
    ...(onAddText ? [{ id: 'text', label: 'Paste text', icon: TextAlignLeftIcon, run: () => setDialog('text') }] : []),
    ...(onAddLink ? [{ id: 'link', label: 'Add a web page', icon: Globe02Icon, run: () => setDialog('link') }] : []),
    ...(onLinkBase && availableBases.length
      ? [{ id: 'base', label: 'Link a knowledge base', icon: LibraryIcon, run: () => setDialog('base') }]
      : []),
  ]

  const addMenu = actions.length > 0 && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Add
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((a) => (
          <DropdownMenuItem key={a.id} onSelect={a.run}>
            <HugeiconsIcon icon={a.icon} strokeWidth={2} />
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <section className={cn('@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3', className)}>
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h4 className="text-xs font-medium">Project knowledge</h4>
          {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
        </div>
        {!empty && addMenu}
      </div>

      {empty ? (
        <Empty className="gap-3 rounded-lg border px-4 py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Files01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Give the assistant something to work from</EmptyTitle>
            <EmptyDescription>
              Add files, notes or web pages and the assistant uses them in every chat in this project. While they fit,
              it reads all of them; when there is too much, it searches them instead.
            </EmptyDescription>
          </EmptyHeader>
          {actions.length > 0 && (
            <EmptyContent className="flex-row flex-wrap justify-center">
              {actions.map((a) => (
                <Button key={a.id} variant="outline" size="sm" onClick={a.run}>
                  <HugeiconsIcon icon={a.icon} strokeWidth={2} data-icon="inline-start" />
                  {a.label}
                </Button>
              ))}
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          <div className="bg-card grid min-w-0 gap-2.5 rounded-lg border p-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <ContextModeBadge mode={mode} />
              <p className="text-muted-foreground min-w-0 text-xs" aria-live="polite">{EXPLAIN[mode]}</p>
            </div>
            <ContextMeter used={used} limit={limit} threshold={threshold} mode={mode} />
          </div>

          {(files.length > 0 || texts.length > 0 || links.length > 0) && (
            <ul className="divide-y rounded-lg border" aria-label="Project files, text and pages">
              {files.map((file) => (
                <Item
                  key={file.id}
                  icon={FILE_KIND_ICONS[file.kind]}
                  name={file.name}
                  muted={!file.included}
                  meta={
                    <>
                      <span>{KIND_LABEL[file.kind]}</span>
                      <Dot />
                      <span>{formatFileSize(file.size)}</span>
                      <Dot />
                      <span>{file.included ? `${formatTokens(file.tokens)} tokens` : 'Not included'}</span>
                    </>
                  }
                  end={
                    <>
                      {onToggleFile && (
                        <label className="flex items-center gap-1.5 px-1">
                          <span className="text-muted-foreground hidden text-[11px] @sm:inline">Included</span>
                          <Switch
                            size="sm"
                            checked={file.included}
                            onCheckedChange={(on) => onToggleFile(file.id, on)}
                            aria-label={`Include ${file.name}`}
                          />
                        </label>
                      )}
                      {onRemoveFile && (
                        <IconAction label={`Remove ${file.name}`} icon={Cancel01Icon} onClick={() => onRemoveFile(file.id)} />
                      )}
                    </>
                  }
                />
              ))}
              {texts.map((t) => (
                <Item
                  key={t.id}
                  icon={TextAlignLeftIcon}
                  name={t.title}
                  meta={
                    <>
                      <span>Pasted text</span>
                      <Dot />
                      <span>{formatTokens(estimateTokens(t.text))} tokens</span>
                    </>
                  }
                  end={onRemoveText && <IconAction label={`Remove ${t.title}`} icon={Cancel01Icon} onClick={() => onRemoveText(t.id)} />}
                />
              ))}
              {links.map((l) => (
                <Item
                  key={l.id}
                  icon={Globe02Icon}
                  name={l.title || hostOf(l.url)}
                  title={l.url}
                  meta={
                    <>
                      <span className="min-w-0 truncate">{hostOf(l.url)}</span>
                      <Dot />
                      <LinkStatus link={l} />
                    </>
                  }
                  end={onRemoveLink && (
                    <IconAction label={`Remove ${l.title || hostOf(l.url)}`} icon={Cancel01Icon} onClick={() => onRemoveLink(l.id)} />
                  )}
                />
              ))}
            </ul>
          )}

          {bases.length > 0 && (
            <div className="grid min-w-0 gap-1.5">
              <div className="min-w-0">
                <h5 className="text-xs font-medium">Linked knowledge bases</h5>
                <p className="text-muted-foreground text-[11px]">Always searched, whatever their size. They do not count towards the meter.</p>
              </div>
              <ul className="divide-y rounded-lg border" aria-label="Linked knowledge bases">
                {bases.map((b) => (
                  <Item
                    key={b.id}
                    icon={b.icon ?? LibraryIcon}
                    iconColour={b.colour}
                    name={b.name}
                    onOpen={onOpenBase && (() => onOpenBase(b.id))}
                    meta={
                      <>
                        <span>{formatNumber(b.documentCount)} {b.documentCount === 1 ? 'document' : 'documents'}</span>
                        <Dot />
                        <span>{formatTokens(b.tokens)} tokens</span>
                      </>
                    }
                    end={
                      <>
                        <span className="bg-brand/10 text-brand mr-1 inline-flex h-5 items-center gap-1 rounded-full pr-2 pl-1.5 text-[11px] font-medium">
                          <HugeiconsIcon icon={FileSearchIcon} strokeWidth={2} className="size-3" aria-hidden />
                          Searched
                        </span>
                        {onUnlinkBase && (
                          <IconAction label={`Unlink ${b.name}`} icon={Unlink02Icon} onClick={() => onUnlinkBase(b.id)} />
                        )}
                      </>
                    }
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {onAddFiles && (
        <input
          ref={fileRef}
          type="file"
          multiple
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onAddFiles(Array.from(e.target.files))
            e.target.value = ''
          }}
        />
      )}
      {onAddText && (
        <PasteTextDialog open={dialog === 'text'} onOpenChange={(o) => setDialog(o ? 'text' : null)} onAdd={onAddText} />
      )}
      {onAddLink && (
        <AddPageDialog
          open={dialog === 'link'}
          onOpenChange={(o) => setDialog(o ? 'link' : null)}
          onAdd={onAddLink}
          existing={links.map((l) => l.url)}
        />
      )}
      {onLinkBase && (
        <LinkBaseDialog
          open={dialog === 'base'}
          onOpenChange={(o) => setDialog(o ? 'base' : null)}
          bases={linkable}
          onLink={onLinkBase}
        />
      )}
    </section>
  )
}

const Dot = () => <span aria-hidden>·</span>

// One row: an icon, the name over a line of details, and its actions.
function Item({ icon, iconColour, name, title, meta, end, muted, onOpen }: {
  icon: IconSvgElement
  iconColour?: string
  name: string
  title?: string
  meta: ReactNode
  end?: ReactNode
  muted?: boolean
  onOpen?: () => void
}) {
  return (
    <li className="flex min-h-11 min-w-0 items-center gap-2.5 py-1.5 pr-1.5 pl-3 text-xs">
      <span className={cn('bg-muted grid size-7 shrink-0 place-items-center rounded-md', muted && 'opacity-60')}>
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" style={iconColour ? { color: iconColour } : undefined} />
      </span>
      <div className="grid min-w-0 flex-1">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            title={title}
            className="focus-visible:ring-ring/40 w-fit max-w-full truncate rounded-sm text-left font-medium outline-none hover:underline focus-visible:ring-2"
          >
            {name}
          </button>
        ) : (
          <span title={title} className={cn('truncate font-medium', muted && 'text-muted-foreground')}>{name}</span>
        )}
        <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-[11px] tabular-nums">
          {meta}
        </span>
      </div>
      {end && <div className="flex shrink-0 items-center gap-0.5">{end}</div>}
    </li>
  )
}

function LinkStatus({ link }: { link: ProjectKnowledgeLink }) {
  switch (link.status) {
    case 'queued':
      return (
        <span className="flex shrink-0 items-center gap-1">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3" aria-hidden />
          Queued
        </span>
      )
    case 'processing':
      return (
        <span className="flex shrink-0 items-center gap-1">
          <Spinner className="size-3" aria-hidden role={undefined} />
          Reading the page
        </span>
      )
    case 'indexed':
      return (
        <span className="flex shrink-0 items-center gap-1">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="text-status-done size-3" aria-hidden />
          {link.tokens !== undefined ? `${formatTokens(link.tokens)} tokens` : 'Indexed'}
        </span>
      )
    case 'failed':
      return (
        <span className="text-destructive flex min-w-0 items-center gap-1">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{link.error ?? 'Could not read the page'}</span>
        </span>
      )
  }
}

/* ---------- Dialogs ---------- */

function PasteTextDialog({ open, onOpenChange, onAdd }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (text: { title: string; text: string }) => void
}) {
  const id = useId()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [tried, setTried] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setText('')
    setTried(false)
  }, [open])

  const error = !text.trim() ? 'Paste or type some text.' : null
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (error) {
      document.getElementById(`${id}-text`)?.focus()
      return
    }
    onAdd({ title: title.trim() || 'Pasted text', text: text.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paste text</DialogTitle>
          <DialogDescription>Notes, a style guide or anything else the assistant should know in this project.</DialogDescription>
        </DialogHeader>
        <form id={`${id}-form`} noValidate onSubmit={submit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
              <Input id={`${id}-title`} value={title} maxLength={80} placeholder="Pasted text" autoComplete="off" onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field data-invalid={(tried && !!error) || undefined}>
              <FieldLabel htmlFor={`${id}-text`}>Text</FieldLabel>
              <Textarea
                id={`${id}-text`}
                value={text}
                rows={8}
                className="max-h-72 min-h-32"
                aria-invalid={(tried && !!error) || undefined}
                aria-describedby={`${id}-count${tried && error ? ` ${id}-error` : ''}`}
                onChange={(e) => setText(e.target.value)}
              />
              <FieldDescription id={`${id}-count`} className="text-[11px] tabular-nums">
                About {formatTokens(estimateTokens(text))} tokens
              </FieldDescription>
              {tried && error && <FieldError id={`${id}-error`} className="text-[11px]">{error}</FieldError>}
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form={`${id}-form`}>Add text</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddPageDialog({ open, onOpenChange, onAdd, existing }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (url: string) => void
  existing: string[]
}) {
  const id = useId()
  const [url, setUrl] = useState('')
  const [tried, setTried] = useState(false)

  useEffect(() => {
    if (!open) return
    setUrl('')
    setTried(false)
  }, [open])

  const error = pageUrlError(url) ?? (existing.includes(url.trim()) ? 'This page is already in the project.' : null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (error) {
      document.getElementById(`${id}-url`)?.focus()
      return
    }
    onAdd(url.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a web page</DialogTitle>
          <DialogDescription>The assistant reads the page once and keeps its text. It does not follow the links on it.</DialogDescription>
        </DialogHeader>
        <form id={`${id}-form`} noValidate onSubmit={submit}>
          <Field data-invalid={(tried && !!error) || undefined}>
            <FieldLabel htmlFor={`${id}-url`}>Address</FieldLabel>
            <Input
              id={`${id}-url`}
              type="url"
              inputMode="url"
              spellCheck={false}
              autoComplete="off"
              placeholder="https://docs.example.com/guide"
              value={url}
              aria-invalid={(tried && !!error) || undefined}
              aria-describedby={tried && error ? `${id}-error` : undefined}
              onChange={(e) => setUrl(e.target.value)}
            />
            {tried && error && <FieldError id={`${id}-error`} className="text-[11px]">{error}</FieldError>}
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form={`${id}-form`}>Add page</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LinkBaseDialog({ open, onOpenChange, bases, onLink }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // The bases not linked yet.
  bases: KnowledgeBaseSummary[]
  onLink: (ids: string[]) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  useEffect(() => {
    if (open) setPicked([])
  }, [open])

  const toggle = (baseId: string) =>
    setPicked((p) => (p.includes(baseId) ? p.filter((x) => x !== baseId) : [...p, baseId]))
  const sorted = useMemo(() => [...bases].sort((a, b) => a.name.localeCompare(b.name)), [bases])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b p-4 pr-10">
          <DialogTitle>Link a knowledge base</DialogTitle>
          <DialogDescription>The assistant searches linked knowledge bases in every chat in this project.</DialogDescription>
        </DialogHeader>
        <Command className="rounded-none bg-transparent">
          <CommandInput placeholder="Search knowledge bases…" />
          <CommandList className="max-h-64">
            <CommandEmpty>{bases.length ? 'No knowledge base matches.' : 'Every knowledge base is linked already.'}</CommandEmpty>
            <CommandGroup>
              {sorted.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`${b.name} ${b.id}`}
                  data-checked={picked.includes(b.id)}
                  onSelect={() => toggle(b.id)}
                >
                  <HugeiconsIcon icon={b.icon ?? LibraryIcon} strokeWidth={2} style={b.colour ? { color: b.colour } : undefined} />
                  <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                    {formatNumber(b.documentCount)} docs
                  </span>
                  {picked.includes(b.id) && <span className="sr-only">, picked</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter className="border-t p-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!picked.length}
            onClick={() => {
              onLink(picked)
              onOpenChange(false)
            }}
          >
            {picked.length > 1 ? `Link ${picked.length}` : 'Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
