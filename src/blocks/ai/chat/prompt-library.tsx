import { useId, useMemo, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, BookOpen01Icon, BracesIcon, Cancel01Icon, Delete02Icon, MoreHorizontalIcon,
  PencilEdit02Icon, StarIcon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconAction } from '@/components/icon-action'
import { SearchField } from '@/components/search-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from '@/components/ui/empty'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { plural } from '@/lib/text'

// The prompt library: saved prompts and prompt templates to reuse in an AI
// chat. Search, three tabs (Favourites, Yours, Team), a card per prompt with
// its first line, tags and how many variables it has, and Use. A prompt can
// hold variables written {{customer}}: Use then asks for each one, with the
// prompt filled in as you type, before it is handed back to onUse.
//
// PromptLibrary is the dialog; PromptLibraryView is the same thing inline.
// SavePromptDialog creates or edits one (title, text, tags, share with the
// team), and PromptVariablesForm is the fill-in step on its own. The library
// holds no prompts: pass them in and store what the callbacks hand back.

export type PromptScope = 'yours' | 'team'

export type SavedPrompt = {
  id: string
  title: string
  // The prompt itself. {{name}} marks a variable.
  text: string
  tags: string[]
  favourite?: boolean
  // Yours alone, or shared with the team.
  scope: PromptScope
  // Who wrote it, shown on team prompts.
  author?: string
  // When it last changed (ms).
  updatedAt: number
}

// What the save dialog edits: a prompt without its id, author and dates.
export type PromptDraft = { title: string; text: string; tags: string[]; scope: PromptScope }

export const EMPTY_PROMPT_DRAFT: PromptDraft = { title: '', text: '', tags: [], scope: 'yours' }

export const PROMPT_TITLE_MAX = 80
const TAGS_MAX = 6

const VARIABLE = /\{\{\s*([A-Za-z][\w -]*?)\s*\}\}/g

// The variables in a prompt, in the order they first appear, each once.
export function promptVariables(text: string): string[] {
  return [...new Set(Array.from(text.matchAll(VARIABLE), (m) => m[1]))]
}

// The prompt with each variable replaced by its value. A variable left empty
// stays as {{name}}, so nothing is lost silently.
export function fillPrompt(template: string, values: Record<string, string>): string {
  return template.replace(VARIABLE, (whole, name: string) => values[name]?.trim() || whole)
}

// "customer_name" → "Customer name".
export function variableLabel(name: string) {
  const words = name.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim().toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// A title from the prompt's first line, cut at a word.
export function suggestPromptTitle(text: string, max = 48) {
  const line = text.split('\n').find((l) => l.trim())?.trim().replace(/\{\{\s*|\s*\}\}/g, '') ?? ''
  if (line.length <= max) return line.replace(/[.:]$/, '')
  const cut = line.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 20 ? cut.lastIndexOf(' ') : max).replace(/[,.;:]$/, '')}…`
}

const firstLine = (text: string) => text.split('\n').find((l) => l.trim())?.trim() ?? ''

// The prompt with its variables marked: filled ones as their value, empty ones
// as a muted {{name}}.
export function PromptPreview({ text, values = {}, className }: {
  text: string
  values?: Record<string, string>
  className?: string
}) {
  const pieces: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(VARIABLE)) {
    const at = m.index ?? 0
    if (at > last) pieces.push(text.slice(last, at))
    const value = values[m[1]]?.trim()
    pieces.push(value
      ? <mark key={at} className="bg-brand/10 text-foreground rounded-sm px-0.5">{value}</mark>
      : <span key={at} className="bg-muted text-muted-foreground rounded-sm px-1 font-mono text-[11px]">{`{{${m[1]}}}`}</span>)
    last = at + m[0].length
  }
  if (last < text.length) pieces.push(text.slice(last))
  return <div className={cn('text-xs/relaxed break-words whitespace-pre-wrap', className)}>{pieces}</div>
}

// One field per variable, and the prompt filled in as you type. Submit hands
// back the filled text once every variable has a value.
export function PromptVariablesForm({
  prompt, onSubmit, onCancel, submitLabel = 'Use prompt', cancelLabel = 'Cancel', className, bodyClassName, footerClassName,
}: {
  prompt: Pick<SavedPrompt, 'title' | 'text'>
  onSubmit: (text: string, values: Record<string, string>) => void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  className?: string
  bodyClassName?: string
  footerClassName?: string
}) {
  const variables = useMemo(() => promptVariables(prompt.text), [prompt.text])
  const [values, setValues] = useState<Record<string, string>>({})
  const [tried, setTried] = useState(false)
  const id = useId()
  const missing = variables.filter((v) => !values[v]?.trim())

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (missing.length) {
      document.getElementById(`${id}-${variables.indexOf(missing[0])}`)?.focus()
      return
    }
    onSubmit(fillPrompt(prompt.text, values), values)
  }

  return (
    <form onSubmit={submit} noValidate className={cn('@container flex min-h-0 min-w-0 flex-col', className)}>
      <div className={cn('grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-3 overflow-y-auto', bodyClassName)}>
        {variables.length > 0 ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 @md:grid-cols-2">
            {variables.map((v, i) => {
              const invalid = tried && !values[v]?.trim()
              return (
                <Field key={v} data-invalid={invalid} className="gap-1.5">
                  <FieldLabel htmlFor={`${id}-${i}`}>{variableLabel(v)}</FieldLabel>
                  <Input
                    id={`${id}-${i}`}
                    value={values[v] ?? ''}
                    autoFocus={i === 0}
                    placeholder={variableLabel(v)}
                    aria-invalid={invalid}
                    onChange={(e) => setValues((current) => ({ ...current, [v]: e.target.value }))}
                  />
                  {invalid && <FieldError>Fill this in.</FieldError>}
                </Field>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">This prompt has no variables to fill in.</p>
        )}
        <div className="grid gap-1.5">
          <p className="text-muted-foreground text-[11px] font-medium">Preview</p>
          <PromptPreview
            text={prompt.text}
            values={values}
            className="bg-muted/40 max-h-56 overflow-y-auto rounded-md border px-3 py-2"
          />
        </div>
      </div>
      <div className={cn('flex flex-wrap items-center justify-end gap-2 pt-3', footerClassName)}>
        <span className="text-muted-foreground mr-auto text-[11px] tabular-nums" aria-live="polite">
          {variables.length > 0 && `${variables.length - missing.length} of ${plural(variables.length, 'variable')} filled`}
        </span>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{cancelLabel}</Button>}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

// Tags as removable chips, with an input that adds one on Enter or a comma.
function TagInput({ id, tags, onChange }: { id: string; tags: string[]; onChange: (tags: string[]) => void }) {
  const [value, setValue] = useState('')
  const add = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '').toLowerCase()
    setValue('')
    if (!tag || tags.includes(tag) || tags.length >= TAGS_MAX) return
    onChange([...tags, tag])
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && value.trim()) {
      e.preventDefault()
      add(value)
    } else if (e.key === 'Backspace' && !value && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }
  return (
    <div className="border-input bg-input/20 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/30 flex min-h-7 min-w-0 flex-wrap items-center gap-1 rounded-md border px-1.5 py-1 focus-within:ring-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-0.5 pr-0.5">
          {tag}
          <button
            type="button"
            aria-label={`Remove the tag ${tag}`}
            className="hover:bg-foreground/10 focus-visible:ring-ring/40 rounded-sm outline-none focus-visible:ring-2"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        value={value}
        disabled={tags.length >= TAGS_MAX}
        placeholder={tags.length >= TAGS_MAX ? `Up to ${TAGS_MAX} tags` : tags.length ? 'Add a tag' : 'Add a tag, then Enter'}
        onChange={(e) => setValue(e.target.value.replace(',', ''))}
        onKeyDown={onKeyDown}
        onBlur={() => add(value)}
        className="placeholder:text-muted-foreground min-w-24 flex-1 bg-transparent px-0.5 text-xs/relaxed outline-none disabled:cursor-not-allowed"
      />
    </div>
  )
}

// Creates or edits a saved prompt. The form starts afresh from `prompt` each
// time it opens; Save hands back the draft and the caller stores it and
// closes the dialog.
export function SavePromptDialog({
  open, onOpenChange, prompt, editing = false, onSave, canShare = true, onCloseAutoFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // What the form starts with, such as the message box's text.
  prompt?: Partial<PromptDraft>
  // True when `prompt` is a saved one being changed.
  editing?: boolean
  onSave: (draft: PromptDraft) => void
  // Shows "Share with your team".
  canShare?: boolean
  // Where focus goes once it closes (preventDefault to choose).
  onCloseAutoFocus?: (event: Event) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={onCloseAutoFocus}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {open && <SavePromptForm prompt={prompt} editing={editing} onSave={onSave} canShare={canShare} />}
      </DialogContent>
    </Dialog>
  )
}

function SavePromptForm({ prompt, editing, onSave, canShare }: {
  prompt?: Partial<PromptDraft>
  editing: boolean
  onSave: (draft: PromptDraft) => void
  canShare: boolean
}) {
  const [draft, setDraft] = useState<PromptDraft>(() => ({
    ...EMPTY_PROMPT_DRAFT,
    ...prompt,
    title: prompt?.title ?? (prompt?.text ? suggestPromptTitle(prompt.text) : ''),
    tags: prompt?.tags ?? [],
  }))
  const [tried, setTried] = useState(false)
  const id = useId()
  const set = <K extends keyof PromptDraft>(key: K, value: PromptDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const variables = promptVariables(draft.text)

  const titleError = !draft.title.trim() ? 'Give the prompt a title.' : undefined
  const textError = !draft.text.trim() ? 'Write the prompt.' : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (titleError) return document.getElementById(`${id}-title`)?.focus()
    if (textError) return document.getElementById(`${id}-text`)?.focus()
    onSave({ ...draft, title: draft.title.trim(), text: draft.text.trim() })
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b p-4 pr-10">
        <DialogTitle>{editing ? 'Edit prompt' : 'Save as prompt'}</DialogTitle>
        <DialogDescription>
          Saved prompts wait in the prompt library, ready to use again in any chat.
        </DialogDescription>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-4 overflow-y-auto p-4">
        <Field data-invalid={tried && !!titleError}>
          <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
          <Input
            id={`${id}-title`}
            value={draft.title}
            maxLength={PROMPT_TITLE_MAX}
            placeholder="Weekly status update"
            autoFocus
            aria-invalid={tried && !!titleError}
            onChange={(e) => set('title', e.target.value)}
          />
          {tried && titleError && <FieldError>{titleError}</FieldError>}
        </Field>

        <Field data-invalid={tried && !!textError}>
          <FieldLabel htmlFor={`${id}-text`}>Prompt</FieldLabel>
          <Textarea
            id={`${id}-text`}
            value={draft.text}
            rows={5}
            placeholder="Draft a short email to {{customer}} about…"
            aria-invalid={tried && !!textError}
            aria-describedby={`${id}-text-hint`}
            className="max-h-64 min-h-28"
            onChange={(e) => set('text', e.target.value)}
          />
          {tried && textError && <FieldError>{textError}</FieldError>}
          <FieldDescription id={`${id}-text-hint`} className="text-[11px]">
            Write <code className="bg-muted rounded-sm px-1 font-mono">{'{{name}}'}</code> for a variable: a blank filled in each time the prompt is used.
          </FieldDescription>
          {variables.length > 0 && (
            <ul aria-label="Variables" className="flex min-w-0 flex-wrap items-center gap-1">
              <HugeiconsIcon icon={BracesIcon} strokeWidth={2} className="text-muted-foreground size-3.5" aria-hidden="true" />
              {variables.map((v) => (
                <li key={v}><Badge variant="outline" className="font-mono">{v}</Badge></li>
              ))}
            </ul>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor={`${id}-tags`}>Tags</FieldLabel>
          <TagInput id={`${id}-tags`} tags={draft.tags} onChange={(tags) => set('tags', tags)} />
        </Field>

        {canShare && (
          <Field orientation="horizontal" className="rounded-md border p-3">
            <FieldContent>
              <FieldLabel htmlFor={`${id}-share`}>Share with your team</FieldLabel>
              <FieldDescription className="text-[11px]">Everyone in the workspace can find and use it under Team.</FieldDescription>
            </FieldContent>
            <Switch
              id={`${id}-share`}
              checked={draft.scope === 'team'}
              onCheckedChange={(on) => set('scope', on ? 'team' : 'yours')}
            />
          </Field>
        )}
      </div>

      <DialogFooter className="border-t p-3">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">{editing ? 'Save changes' : 'Save prompt'}</Button>
      </DialogFooter>
    </form>
  )
}

type Tab = 'favourites' | 'yours' | 'team'

const TABS: { value: Tab; label: string }[] = [
  { value: 'favourites', label: 'Favourites' },
  { value: 'yours', label: 'Yours' },
  { value: 'team', label: 'Team' },
]

const inTab = (prompt: SavedPrompt, tab: Tab) => (tab === 'favourites' ? !!prompt.favourite : prompt.scope === tab)

const matches = (prompt: SavedPrompt, query: string) => {
  const q = query.trim().toLowerCase()
  return !q || prompt.title.toLowerCase().includes(q) || prompt.text.toLowerCase().includes(q) || prompt.tags.some((t) => t.includes(q))
}

const EMPTY_TEXT: Record<Tab, { title: string; description: string }> = {
  favourites: { title: 'No favourites yet', description: 'Star a prompt to keep it here.' },
  yours: { title: 'No prompts of your own yet', description: 'Save a prompt you use often, so it is one click away.' },
  team: { title: 'Nothing shared yet', description: 'Prompts your team shares show up here.' },
}

export type PromptLibraryProps = {
  prompts: SavedPrompt[]
  // The prompt, filled in when it has variables.
  onUse: (prompt: SavedPrompt, text: string) => void
  // Shows New prompt; hands back a new prompt to store.
  onSave?: (draft: PromptDraft) => void
  // Shows Edit on the prompts you may manage.
  onEdit?: (id: string, draft: PromptDraft) => void
  // Shows Delete on the prompts you may manage (after a confirm).
  onDelete?: (id: string) => void
  // Shows the star.
  onToggleFavourite?: (id: string, favourite: boolean) => void
  // Which prompts you may edit and delete. Defaults to your own (scope 'yours').
  canManage?: (prompt: SavedPrompt) => boolean
  // What New prompt starts with, such as the message box's text.
  draftText?: string
  // Shows "Share with your team" in the save dialog.
  canShare?: boolean
}

function PromptCard({ prompt, manage, onUse, onEdit, onDelete, onToggleFavourite }: {
  prompt: SavedPrompt
  manage: boolean
  onUse: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleFavourite?: () => void
}) {
  const variables = promptVariables(prompt.text).length
  const titleId = useId()
  return (
    <li aria-labelledby={titleId} className="bg-card hover:border-foreground/15 flex min-w-0 flex-col gap-2 rounded-lg border p-3 transition-colors">
      <div className="flex min-w-0 items-start gap-1">
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-[13px] font-medium">{prompt.title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-xs/relaxed">{firstLine(prompt.text)}</p>
        </div>
        {onToggleFavourite && (
          <IconAction
            label={prompt.favourite ? `Remove ${prompt.title} from favourites` : `Add ${prompt.title} to favourites`}
            pressed={!!prompt.favourite}
            size="icon-xs"
            onClick={onToggleFavourite}
            className="aria-pressed:text-status-progress aria-pressed:bg-transparent dark:aria-pressed:bg-transparent"
          >
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} className={cn(prompt.favourite && '[&_path]:fill-current')} />
          </IconAction>
        )}
        {manage && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconAction label={`More actions for ${prompt.title}`} icon={MoreHorizontalIcon} size="icon-xs" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {onEdit && (
                <DropdownMenuItem onSelect={onEdit}>
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                  Edit
                </DropdownMenuItem>
              )}
              {onEdit && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="mt-auto flex min-w-0 flex-wrap items-center gap-1.5">
        {prompt.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
        {variables > 0 && (
          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <HugeiconsIcon icon={BracesIcon} strokeWidth={2} className="size-3" aria-hidden="true" />
            {plural(variables, 'variable')}
          </span>
        )}
        {prompt.scope === 'team' && prompt.author && (
          <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-[11px]">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{prompt.author}</span>
          </span>
        )}
        <Button variant="outline" size="xs" className="ml-auto" onClick={onUse} aria-label={`Use ${prompt.title}`}>
          Use
        </Button>
      </div>
    </li>
  )
}

// Search, tabs and cards, or the fill-in step for the prompt being used.
// `heading` draws the title and description, which differ in a dialog.
function LibraryBody({
  prompts, onUse, onSave, onEdit, onDelete, onToggleFavourite, canManage = (p) => p.scope === 'yours', draftText, canShare = true,
  heading, onCancel, className, listClassName,
}: PromptLibraryProps & {
  heading: (title: string, description: string, back?: () => void) => ReactNode
  // Leaves the library (Close), shown in the footer when given.
  onCancel?: () => void
  className?: string
  listClassName?: string
}) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>(() => (prompts.some((p) => p.favourite) ? 'favourites' : prompts.some((p) => p.scope === 'yours') ? 'yours' : 'team'))
  const [using, setUsing] = useState<SavedPrompt | null>(null)
  const [editing, setEditing] = useState<SavedPrompt | 'new' | null>(null)
  const [deleting, setDeleting] = useState<SavedPrompt | null>(null)

  const found = prompts.filter((p) => matches(p, query))
  const shown = found.filter((p) => inTab(p, tab))
  const count = (t: Tab) => found.filter((p) => inTab(p, t)).length

  const use = (prompt: SavedPrompt) => {
    if (promptVariables(prompt.text).length) setUsing(prompt)
    else onUse(prompt, prompt.text)
  }

  const dialogs = (
    <>
      {(onSave || onEdit) && (
        <SavePromptDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          editing={editing !== 'new' && !!editing}
          canShare={canShare}
          prompt={editing === 'new' ? { text: draftText ?? '' } : editing ?? undefined}
          onSave={(draft) => {
            if (editing === 'new') onSave?.(draft)
            else if (editing) onEdit?.(editing.id, draft)
            setEditing(null)
          }}
        />
      )}
      {onDelete && (
        <DeleteConfirm
          size="sm"
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          title="Delete this prompt?"
          description={deleting ? `“${deleting.title}” leaves the prompt library${deleting.scope === 'team' ? ' for everyone on the team' : ''}.` : ''}
          onConfirm={() => deleting && onDelete(deleting.id)}
        />
      )}
    </>
  )

  if (using) {
    return (
      <div className={cn('flex min-h-0 min-w-0 flex-col', className)}>
        {heading(using.title, 'Fill in the variables. The prompt goes into the message box, ready to send.', () => setUsing(null))}
        <PromptVariablesForm
          prompt={using}
          submitLabel="Use prompt"
          cancelLabel="Back"
          onCancel={() => setUsing(null)}
          onSubmit={(text) => {
            onUse(using, text)
            setUsing(null)
          }}
          className="flex-1"
          bodyClassName="p-4"
          footerClassName="border-t p-3"
        />
      </div>
    )
  }

  return (
    <div className={cn('@container flex min-h-0 min-w-0 flex-col', className)}>
      {heading('Prompt library', 'Saved prompts and prompt templates. Use one to put it in the message box.')}
      <div className="grid min-w-0 gap-2 border-b px-4 pt-3 pb-3">
        <SearchField value={query} onChange={setQuery} placeholder="Search prompts" className="h-7 min-w-0" />
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="min-w-0">
          <TabsList className="h-7 max-w-full overflow-x-auto [scrollbar-width:none]">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 px-2.5">
                {t.label}
                <span className="text-muted-foreground text-[10px] tabular-nums">{count(t.value)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className={cn('min-h-0 flex-1 overflow-y-auto p-4', listClassName)}>
        {shown.length > 0 ? (
          <ul aria-label={`${TABS.find((t) => t.value === tab)?.label} prompts`} className="grid grid-cols-[minmax(0,1fr)] gap-2 @xl:grid-cols-2">
            {shown.map((p) => {
              const manage = canManage(p)
              return (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  manage={manage}
                  onUse={() => use(p)}
                  onEdit={onEdit && (() => setEditing(p))}
                  onDelete={onDelete && (() => setDeleting(p))}
                  onToggleFavourite={onToggleFavourite && (() => onToggleFavourite(p.id, !p.favourite))}
                />
              )
            })}
          </ul>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} /></EmptyMedia>
              <EmptyTitle>{query.trim() ? 'No prompts found' : EMPTY_TEXT[tab].title}</EmptyTitle>
              <EmptyDescription>
                {query.trim() ? `Nothing in ${TABS.find((t) => t.value === tab)?.label} matches “${query.trim()}”.` : EMPTY_TEXT[tab].description}
              </EmptyDescription>
            </EmptyHeader>
            {query.trim() && (
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
      {(onSave || onCancel) && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t p-3">
          <span className="text-muted-foreground mr-auto text-[11px] tabular-nums">{plural(prompts.length, 'prompt')}</span>
          {onCancel && <Button variant="outline" onClick={onCancel}>Close</Button>}
          {onSave && (
            <Button onClick={() => setEditing('new')}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              New prompt
            </Button>
          )}
        </div>
      )}
      {dialogs}
    </div>
  )
}

// The prompt library in a dialog, opened from the prompt box's toolbar or a
// "/prompts" command. Using a prompt closes it.
export function PromptLibrary({ open, onOpenChange, onUse, onCloseAutoFocus, ...props }: PromptLibraryProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Where focus goes once it closes, such as back into the message box.
  onCloseAutoFocus?: (event: Event) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={onCloseAutoFocus}
        className="flex h-[min(40rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        {open && (
          <LibraryBody
            {...props}
            onUse={(prompt, text) => {
              onUse(prompt, text)
              onOpenChange(false)
            }}
            className="flex-1"
            heading={(title, description, back) => (
              <DialogHeader className="flex-row items-start gap-2 border-b p-4 pr-10 text-left">
                {back && <IconAction label="Back to the library" icon={ArrowLeft01Icon} size="icon-xs" className="-ml-1" onClick={back} />}
                <div className="grid min-w-0 gap-1">
                  <DialogTitle className="truncate">{title}</DialogTitle>
                  <DialogDescription>{description}</DialogDescription>
                </div>
              </DialogHeader>
            )}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// The prompt library inline, in a page or a side panel. Size it with className.
export function PromptLibraryView({ title = 'Prompt library', className, ...props }: PromptLibraryProps & {
  // The heading; the fill-in step shows the prompt's title instead.
  title?: string
  className?: string
}) {
  return (
    <LibraryBody
      {...props}
      className={cn('bg-card rounded-lg border', className)}
      heading={(heading, description, back) => (
        <div className="flex items-start gap-2 border-b p-4">
          {back && <IconAction label="Back to the library" icon={ArrowLeft01Icon} size="icon-xs" className="-ml-1" onClick={back} />}
          <div className="grid min-w-0 gap-1">
            <h3 className="truncate text-sm font-semibold">{back ? heading : title}</h3>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
        </div>
      )}
    />
  )
}
