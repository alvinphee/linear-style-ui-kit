import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, Building03Icon, BulbIcon, Delete02Icon, LibraryIcon,
  Link01Icon, LockIcon, Settings02Icon, Upload04Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from 'cn'
import { FileChip } from '@/components/file-chip'
import { IconColourPicker, type ColourOption, type IconOption } from '@/components/icon-colour-picker'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Field, FieldDescription, FieldError, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber } from '@/lib/format'
import { plural } from '@/lib/text'
import { SettingsGroup } from '@/blocks/settings-page'
import type { PromptModel } from '@/blocks/ai/chat/prompt-box'
import {
  ConnectorMark, ConnectorStatusLabel, type Connector, type ConnectorTool,
} from '@/blocks/ai/connectors/connector-card'
import { ToolPermissionControl, ToolPermissionSetAll } from '@/blocks/ai/connectors/connector-dialog'
import type { KnowledgeBaseSummary } from '@/blocks/ai/knowledge/knowledge-types'
import { SkillMark, type Skill } from '@/blocks/ai/skills/skill-card'
import type { AgentAccess, AgentDraft, ToolPermission } from './agent-types'
import { agentTriggerError, TriggerEditor, type AgentEventOption } from './trigger-editor'

// The agent builder's Configure tab: the whole agent as one form, a titled
// card per section like the settings page's.
//   Basics                 icon and colour, name, a one-line description
//   Instructions           what it does and how, in Markdown, with tips
//   Conversation starters  up to six prompts shown before a chat
//   Knowledge              its own files, and knowledge bases it searches
//   Tools                  connected apps it may use, with a tool permission
//                          per tool, and skills that are on in Settings
//   Model                  a model, or the person's default
//   Triggers               manual, schedules and event triggers
//   Access                 who can find and use it
// On a wide box (48rem and up) a small list of the sections sits on the
// left and stays put while the form scrolls; it jumps to a section. Narrow,
// the sections simply follow each other.
// The form holds no agent of its own: every edit comes back as a patch.
// validateAgentDraft says what stops it being saved, and the form shows
// what it is given in `errors`.

export type AgentConfigSection =
  | 'basics' | 'instructions' | 'starters' | 'knowledge' | 'tools' | 'model' | 'triggers' | 'access'

export const AGENT_CONFIG_SECTIONS: { id: AgentConfigSection; label: string; hint: string }[] = [
  { id: 'basics', label: 'Basics', hint: 'What it is called and what it is for.' },
  { id: 'instructions', label: 'Instructions', hint: 'What it does and how. It reads these before every chat and run.' },
  { id: 'starters', label: 'Conversation starters', hint: 'Prompts shown before a chat. One click sends one.' },
  { id: 'knowledge', label: 'Knowledge', hint: 'What it reads for answers: its own files and knowledge bases.' },
  { id: 'tools', label: 'Tools', hint: 'The apps and skills it may use, and what it may do without asking.' },
  { id: 'model', label: 'Model', hint: 'The model it answers with.' },
  { id: 'triggers', label: 'Triggers', hint: 'What starts a run: someone asking, a schedule or an event.' },
  { id: 'access', label: 'Access', hint: 'Who can find it and use it.' },
]

export const AGENT_ACCESS_OPTIONS: { value: AgentAccess; label: string; hint: string; icon: IconSvgElement }[] = [
  { value: 'private', label: 'Only me', hint: 'Nobody else sees it.', icon: LockIcon },
  { value: 'people', label: 'People I choose', hint: 'Shared with people you invite.', icon: UserGroupIcon },
  { value: 'organisation', label: 'Everyone at the organisation', hint: 'Listed in the organisation’s agents.', icon: Building03Icon },
  { value: 'link', label: 'Anyone with the link', hint: 'Not listed; the link opens it.', icon: Link01Icon },
]

export const AGENT_NAME_MAX = 60
export const AGENT_DESCRIPTION_MAX = 140
export const AGENT_INSTRUCTIONS_MAX = 8000
export const AGENT_STARTERS_MAX = 6

// What stops a draft being saved, field by field. `triggers` is by trigger id.
export type AgentDraftErrors = {
  name?: string
  description?: string
  instructions?: string
  triggers?: Record<string, string>
}

export function validateAgentDraft(draft: AgentDraft, now = Date.now()): AgentDraftErrors {
  const errors: AgentDraftErrors = {}
  if (!draft.name.trim()) errors.name = 'Give the agent a name.'
  else if (draft.name.trim().length > AGENT_NAME_MAX) errors.name = `Keep the name to ${AGENT_NAME_MAX} characters.`
  if (draft.description.length > AGENT_DESCRIPTION_MAX) errors.description = `Keep the description to ${AGENT_DESCRIPTION_MAX} characters.`
  if (!draft.instructions.trim()) errors.instructions = 'Say what the agent should do.'
  else if (draft.instructions.length > AGENT_INSTRUCTIONS_MAX) {
    errors.instructions = `Instructions can be at most ${formatNumber(AGENT_INSTRUCTIONS_MAX)} characters.`
  }
  const triggers: Record<string, string> = {}
  for (const t of draft.triggers) {
    const why = agentTriggerError(t, now)
    if (why) triggers[t.id] = why
  }
  if (Object.keys(triggers).length) errors.triggers = triggers
  return errors
}

export const hasAgentDraftErrors = (errors: AgentDraftErrors) =>
  !!(errors.name || errors.description || errors.instructions || (errors.triggers && Object.keys(errors.triggers).length))

// Which section each error belongs to, for the section list's marks.
function sectionsWithErrors(errors?: AgentDraftErrors) {
  const out = new Set<AgentConfigSection>()
  if (!errors) return out
  if (errors.name || errors.description) out.add('basics')
  if (errors.instructions) out.add('instructions')
  if (errors.triggers && Object.keys(errors.triggers).length) out.add('triggers')
  return out
}

const INSTRUCTION_TIPS = [
  { title: 'Start with its job', text: 'One sentence on who it helps and with what.' },
  { title: 'List the steps', text: 'What it does first, next and last, as a numbered list.' },
  { title: 'Show the result', text: 'The format, length and tone you want, with a short example.' },
  { title: 'Set the limits', text: 'What it must never do, and when to ask before acting.' },
]

const DEFAULT_MODEL = '__default'

export type AgentConfigFormProps = {
  draft: AgentDraft
  onChange: (patch: Partial<AgentDraft>) => void
  icons: IconOption[]
  colours: ColourOption[]
  models: PromptModel[]
  // The person's default model, by id: what "Default" uses.
  defaultModel?: string
  // Every connector, in any status. Connected ones can be switched on.
  connectors: Connector[]
  // What each connector can start a run on, for event triggers.
  events: AgentEventOption[]
  // Every skill; only ones on in Settings can be switched on.
  skills: Skill[]
  // Knowledge bases it may search.
  bases: KnowledgeBaseSummary[]
  // Upload files of its own. Without it, there is no upload button.
  onAddFiles?: (files: File[]) => void
  // Removing a file; defaults to taking it out of the draft.
  onRemoveFile?: (id: string) => void
  // The way to Settings, for apps not connected and skills turned off.
  onOpenSettings?: (section: 'connectors' | 'skills', id?: string) => void
  // The sections to show, in order. Defaults to all of them.
  sections?: AgentConfigSection[]
  errors?: AgentDraftErrors
  // For the triggers' next runs. Defaults to the browser's clock.
  now?: number
  className?: string
}

export function AgentConfigForm({
  draft, onChange, icons, colours, models, defaultModel, connectors, events, skills, bases, onAddFiles, onRemoveFile,
  onOpenSettings, sections, errors, now, className,
}: AgentConfigFormProps) {
  const id = useId()
  const shown = AGENT_CONFIG_SECTIONS.filter((s) => !sections || sections.includes(s.id))
  if (sections) shown.sort((a, b) => sections.indexOf(a.id) - sections.indexOf(b.id))
  const [active, setActive] = useState<AgentConfigSection | undefined>(shown[0]?.id)
  const withErrors = sectionsWithErrors(errors)
  const sectionId = (s: AgentConfigSection) => `${id}-${s}`
  const order = shown.map((s) => s.id).join()

  // The section list follows the scroll: the first section on screen is current.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const ids = order.split(',') as AgentConfigSection[]
    const seen = new Map<string, boolean>()
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target.id, e.isIntersecting)
      const first = ids.find((s) => seen.get(`${id}-${s}`))
      if (first) setActive(first)
    }, { rootMargin: '0px 0px -40% 0px' })
    for (const s of ids) {
      const el = document.getElementById(`${id}-${s}`)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [id, order])

  const jump = (s: AgentConfigSection) => {
    const el = document.getElementById(sectionId(s))
    if (!el) return
    setActive(s)
    el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    el.focus({ preventScroll: true })
  }

  const render: Record<AgentConfigSection, () => ReactNode> = {
    basics: () => <BasicsSection id={id} draft={draft} onChange={onChange} icons={icons} colours={colours} errors={errors} />,
    instructions: () => <InstructionsSection id={id} draft={draft} onChange={onChange} error={errors?.instructions} />,
    starters: () => <StartersSection id={id} draft={draft} onChange={onChange} />,
    knowledge: () => (
      <KnowledgeSection draft={draft} onChange={onChange} bases={bases} onAddFiles={onAddFiles} onRemoveFile={onRemoveFile} />
    ),
    tools: () => <ToolsSection draft={draft} onChange={onChange} connectors={connectors} skills={skills} onOpenSettings={onOpenSettings} />,
    model: () => <ModelSection id={id} draft={draft} onChange={onChange} models={models} defaultModel={defaultModel} />,
    triggers: () => (
      <TriggerEditor
        triggers={draft.triggers}
        onChange={(triggers) => onChange({ triggers })}
        connectors={connectors}
        events={events}
        now={now}
        errors={errors?.triggers}
        onOpenSettings={onOpenSettings && ((connectorId) => onOpenSettings('connectors', connectorId))}
      />
    ),
    access: () => <AccessSection id={id} draft={draft} onChange={onChange} />,
  }

  return (
    <div className={cn('@container min-w-0', className)}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 @3xl:grid-cols-[9.5rem_minmax(0,1fr)]">
        {shown.length > 1 && (
          <nav aria-label="Agent settings sections" className="hidden @3xl:block">
            <ul className="sticky top-0 grid gap-0.5">
              {shown.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-current={active === s.id ? 'location' : undefined}
                    onClick={() => jump(s.id)}
                    className={cn(
                      'text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-ring/50 flex h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2',
                      'aria-[current=location]:bg-accent aria-[current=location]:text-foreground aria-[current=location]:font-medium',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    {withErrors.has(s.id) && (
                      <span className="bg-destructive size-1.5 shrink-0 rounded-full" aria-label="Has errors" role="img" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="@container grid min-w-0 content-start gap-6">
          {shown.map((s) => (
            <div key={s.id} id={sectionId(s.id)} tabIndex={-1} className="min-w-0 scroll-mt-3 outline-none">
              <SettingsGroup title={s.label} description={s.hint}>
                {render[s.id]()}
              </SettingsGroup>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

type SectionProps = {
  id: string
  draft: AgentDraft
  onChange: (patch: Partial<AgentDraft>) => void
}

// A count against a limit: "112 / 140", red when over.
function Counter({ value, max, id }: { value: number; max: number; id?: string }) {
  return (
    <span id={id} className={cn('shrink-0 text-[11px] tabular-nums', value > max ? 'text-destructive' : 'text-muted-foreground')}>
      {formatNumber(value)} / {formatNumber(max)}
    </span>
  )
}

// A small heading inside a section's card, for sections in two parts.
function PartHeading({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
      <div className="grid min-w-0 gap-0.5">
        <h4 className="text-xs font-medium">{title}</h4>
        {hint && <p className="text-muted-foreground text-[11px] leading-4">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

function BasicsSection({ id, draft, onChange, icons, colours, errors }: SectionProps & {
  icons: IconOption[]
  colours: ColourOption[]
  errors?: AgentDraftErrors
}) {
  const iconId = icons.find((i) => i.icon === draft.icon)?.id ?? icons[0]?.id ?? ''
  const colourId = colours.find((c) => c.value === draft.colour)?.id ?? colours[0]?.id ?? ''

  return (
    <div className="grid min-w-0 gap-3 p-3">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <Field className="gap-2">
          <FieldTitle>Icon</FieldTitle>
          <IconColourPicker
            icons={icons}
            colours={colours}
            icon={iconId}
            colour={colourId}
            label="Agent icon"
            onChange={(change) => onChange({
              ...(change.icon !== undefined && { icon: icons.find((i) => i.id === change.icon)?.icon }),
              ...(change.colour !== undefined && { colour: colours.find((c) => c.id === change.colour)?.value }),
            })}
          />
        </Field>
        <Field data-invalid={!!errors?.name || undefined} className="min-w-0 gap-2">
          <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
          <Input
            id={`${id}-name`}
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Invoice assistant"
            maxLength={AGENT_NAME_MAX}
            required
            aria-invalid={!!errors?.name || undefined}
            aria-describedby={errors?.name ? `${id}-name-error` : undefined}
            autoComplete="off"
          />
          {errors?.name && <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>}
        </Field>
      </div>

      <Field data-invalid={!!errors?.description || undefined} className="gap-2">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
          <Counter id={`${id}-description-count`} value={draft.description.length} max={AGENT_DESCRIPTION_MAX} />
        </div>
        <Input
          id={`${id}-description`}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value.replace(/\s*\n\s*/g, ' ') })}
          placeholder="Reads supplier invoices from Mail and drafts them for approval."
          maxLength={AGENT_DESCRIPTION_MAX}
          aria-invalid={!!errors?.description || undefined}
          aria-describedby={`${id}-description-count${errors?.description ? ` ${id}-description-error` : ''}`}
          autoComplete="off"
        />
        {errors?.description
          ? <FieldError id={`${id}-description-error`}>{errors.description}</FieldError>
          : <FieldDescription className="text-[11px] leading-4">Shown on its card and before a chat with it.</FieldDescription>}
      </Field>
    </div>
  )
}

function InstructionsSection({ id, draft, onChange, error }: SectionProps & { error?: string }) {
  const [tipsOpen, setTipsOpen] = useState(false)
  return (
    <div className="grid min-w-0 gap-2 p-3">
      <Field data-invalid={!!error || undefined} className="gap-2">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <FieldLabel htmlFor={`${id}-instructions`}>Instructions</FieldLabel>
          <Counter id={`${id}-instructions-count`} value={draft.instructions.length} max={AGENT_INSTRUCTIONS_MAX} />
        </div>
        <Textarea
          id={`${id}-instructions`}
          value={draft.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          placeholder={'You help the finance team with supplier invoices.\n\n1. Read each new invoice.\n2. Check it against its purchase order.\n3. Draft it for approval, and say what does not match.\n\nNever approve or pay anything yourself.'}
          required
          aria-invalid={!!error || undefined}
          aria-describedby={`${id}-instructions-hint ${id}-instructions-count${error ? ` ${id}-instructions-error` : ''}`}
          className="max-h-[32rem] min-h-60 font-mono text-[11px] leading-5 md:text-[11px]/5"
        />
        {error && <FieldError id={`${id}-instructions-error`}>{error}</FieldError>}
        <FieldDescription id={`${id}-instructions-hint`} className="text-[11px] leading-4">
          Markdown works: headings, lists and **bold**.
        </FieldDescription>
      </Field>

      <Collapsible open={tipsOpen} onOpenChange={setTipsOpen} className="grid min-w-0 gap-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex w-fit items-center gap-1.5 rounded text-[11px] font-medium outline-none focus-visible:ring-2"
          >
            <HugeiconsIcon icon={tipsOpen ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="size-3" />
            <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="size-3.5" />
            How to write good instructions
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol className="bg-subtle grid grid-cols-1 gap-2 rounded-lg border p-3 @md:grid-cols-2">
            {INSTRUCTION_TIPS.map((tip, i) => (
              <li key={tip.title} className="flex min-w-0 items-start gap-2 text-[11px] leading-4">
                <span aria-hidden className="bg-muted text-muted-foreground grid size-4 shrink-0 place-items-center rounded-full text-[10px] tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0"><span className="font-medium">{tip.title}.</span>{' '}
                  <span className="text-muted-foreground">{tip.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function StartersSection({ id, draft, onChange }: SectionProps) {
  const starters = draft.starters
  const [focusAt, setFocusAt] = useState<number | null>(null)
  useEffect(() => {
    if (focusAt === null) return
    document.getElementById(`${id}-starter-${focusAt}`)?.focus()
    setFocusAt(null)
  }, [focusAt, id])

  const set = (next: string[]) => onChange({ starters: next })
  const move = (from: number, to: number) => {
    const next = [...starters]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    set(next)
  }
  const full = starters.length >= AGENT_STARTERS_MAX

  return (
    <>
      {starters.length > 0 ? (
        <ol aria-label="Conversation starters" className="divide-y">
          {starters.map((text, i) => (
            <li key={i} className="flex min-w-0 items-center gap-1 px-2 py-1.5">
              <span aria-hidden className="text-muted-foreground w-4 shrink-0 text-center text-[11px] tabular-nums">{i + 1}</span>
              <Input
                id={`${id}-starter-${i}`}
                value={text}
                onChange={(e) => set(starters.map((s, j) => (j === i ? e.target.value : s)))}
                placeholder="What should someone ask it?"
                aria-label={`Starter ${i + 1}`}
                maxLength={200}
                className="min-w-0 flex-1 border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
                autoComplete="off"
              />
              <Button
                variant="ghost" size="icon-xs" className="text-muted-foreground"
                aria-label={`Move starter ${i + 1} up`} disabled={i === 0}
                onClick={() => { move(i, i - 1); setFocusAt(i - 1) }}
              >
                <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="ghost" size="icon-xs" className="text-muted-foreground"
                aria-label={`Move starter ${i + 1} down`} disabled={i === starters.length - 1}
                onClick={() => { move(i, i + 1); setFocusAt(i + 1) }}
              >
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove starter ${i + 1}`}
                onClick={() => set(starters.filter((_, j) => j !== i))}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground px-3 py-3 text-xs">No starters yet. Add a few questions people often ask it.</p>
      )}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
        <span className="text-muted-foreground text-[11px] tabular-nums">{starters.length} of {AGENT_STARTERS_MAX}</span>
        <Button
          variant="outline" size="sm" disabled={full}
          onClick={() => { set([...starters, '']); setFocusAt(starters.length) }}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Add starter
        </Button>
      </div>
    </>
  )
}

function KnowledgeSection({ draft, onChange, bases, onAddFiles, onRemoveFile }: Omit<SectionProps, 'id'> & {
  bases: KnowledgeBaseSummary[]
  onAddFiles?: (files: File[]) => void
  onRemoveFile?: (id: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [picking, setPicking] = useState(false)
  const linked = draft.knowledgeBases
  const toggleBase = (baseId: string) =>
    onChange({ knowledgeBases: linked.includes(baseId) ? linked.filter((b) => b !== baseId) : [...linked, baseId] })
  const removeFile = (fileId: string) =>
    onRemoveFile ? onRemoveFile(fileId) : onChange({ files: draft.files.filter((f) => f.id !== fileId) })
  const sorted = [...bases].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div className="grid min-w-0 gap-2 pb-3">
        <PartHeading
          title="Files"
          hint="Read in full in every chat and run."
          action={onAddFiles && (
            <>
              <input
                ref={input}
                type="file"
                multiple
                tabIndex={-1}
                aria-hidden
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length) onAddFiles(files)
                  e.target.value = ''
                }}
              />
              <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
                <HugeiconsIcon icon={Upload04Icon} strokeWidth={2} data-icon="inline-start" />
                Upload files
              </Button>
            </>
          )}
        />
        {draft.files.length ? (
          <ul aria-label="Files" className="flex min-w-0 flex-wrap gap-1.5 px-3">
            {draft.files.map((f) => (
              <li key={f.id} className="min-w-0 max-w-full">
                <FileChip name={f.name} size={f.size} onRemove={() => removeFile(f.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground px-3 text-xs">No files yet.</p>
        )}
      </div>

      <div className="grid min-w-0 gap-2 pb-3">
        <PartHeading
          title="Knowledge bases"
          hint="Searched for the passages a question needs."
          action={(
            <Popover open={picking} onOpenChange={setPicking}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" disabled={bases.length === 0}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                  Add knowledge base
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 max-w-[calc(100vw-2rem)] p-0">
                <Command>
                  <CommandInput placeholder="Search knowledge bases…" aria-label="Search knowledge bases" />
                  <CommandList className="max-h-64">
                    <CommandEmpty>No knowledge base matches.</CommandEmpty>
                    <CommandGroup>
                      {sorted.map((b) => {
                        const on = linked.includes(b.id)
                        return (
                          <CommandItem key={b.id} value={`${b.name} ${b.id}`} data-checked={on} onSelect={() => toggleBase(b.id)}>
                            <HugeiconsIcon icon={b.icon ?? LibraryIcon} strokeWidth={2} style={b.colour ? { color: b.colour } : undefined} />
                            <span className="min-w-0 flex-1 truncate">{b.name}</span>
                            <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                              {plural(b.documentCount, 'doc')}
                            </span>
                            {on && <span className="sr-only">, added</span>}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        />
        {linked.length ? (
          <ul aria-label="Knowledge bases" className="flex min-w-0 flex-wrap gap-1.5 px-3">
            {linked.map((baseId) => {
              const b = bases.find((x) => x.id === baseId)
              return (
                <li key={baseId} className="min-w-0 max-w-full">
                  <FileChip name={b?.name ?? baseId} icon={b?.icon ?? LibraryIcon} onRemove={() => toggleBase(baseId)} />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground px-3 text-xs">No knowledge bases yet.</p>
        )}
      </div>
    </>
  )
}

const usableConnector = (c: Connector) => c.status === 'connected' || c.status === 'error'

function ToolsSection({ draft, onChange, connectors, skills, onOpenSettings }: Omit<SectionProps, 'id'> & {
  connectors: Connector[]
  skills: Skill[]
  onOpenSettings?: (section: 'connectors' | 'skills', id?: string) => void
}) {
  const [restOpen, setRestOpen] = useState(false)
  const usable = connectors.filter(usableConnector)
  const rest = connectors.filter((c) => !usableConnector(c))
  const onSkills = skills.filter((s) => s.enabled)
  const offSkills = skills.length - onSkills.length
  const perms = draft.connectors

  const setConnector = (c: Connector, on: boolean) => {
    const next = { ...perms }
    // Switched on, it starts from the permissions set in Settings.
    if (on) next[c.id] = Object.fromEntries(c.tools.map((t) => [t.name, t.permission]))
    else delete next[c.id]
    onChange({ connectors: next })
  }
  const setPermissions = (c: Connector, patch: Record<string, ToolPermission>) =>
    onChange({ connectors: { ...perms, [c.id]: { ...perms[c.id], ...patch } } })
  const toolsOf = (c: Connector): ConnectorTool[] =>
    c.tools.map((t) => ({ ...t, permission: perms[c.id]?.[t.name] ?? t.permission }))
  const setSkill = (skillId: string, on: boolean) =>
    onChange({ skills: on ? [...draft.skills, skillId] : draft.skills.filter((s) => s !== skillId) })
  const onCount = usable.filter((c) => perms[c.id]).length

  return (
    <>
      <PartHeading title="Connectors" hint={usable.length ? `${onCount} of ${usable.length} connected apps on.` : 'Apps it may use.'} />
      {usable.map((c) => {
        const on = !!perms[c.id]
        const tools = toolsOf(c)
        return (
          <div key={c.id} className="min-w-0">
            <div className="flex min-w-0 items-center gap-3 px-3 py-2.5">
              <ConnectorMark connector={c} />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-xs font-medium">{c.name}</span>
                <ConnectorStatusLabel connector={c} />
              </div>
              <Switch checked={on} onCheckedChange={(v) => setConnector(c, v)} aria-label={`Let the agent use ${c.name}`} className="mx-1" />
            </div>
            {on && (
              <div className="bg-muted/40 grid min-w-0 gap-1.5 border-t px-3 py-2.5 @sm:pl-13">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground text-[11px]">
                    {plural(tools.length, 'tool')} · {tools.filter((t) => t.permission === 'always').length} always allowed
                  </span>
                  <ToolPermissionSetAll
                    tools={tools}
                    onSetAll={(p) => setPermissions(c, Object.fromEntries(c.tools.map((t) => [t.name, p])))}
                  />
                </div>
                <ul aria-label={`${c.name} tools`} className="grid gap-2">
                  {tools.map((t) => (
                    <li key={t.name} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                      <span className={cn('grid min-w-0 flex-1 basis-40', t.permission === 'off' && 'opacity-60')}>
                        <code className="truncate font-mono text-[11px]">{t.name}</code>
                        <span className="text-muted-foreground text-[11px] leading-4">{t.description}</span>
                      </span>
                      <ToolPermissionControl
                        value={t.permission}
                        label={`${c.name} ${t.name}`}
                        onChange={(p) => setPermissions(c, { [t.name]: p })}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
      {usable.length === 0 && (
        <p className="text-muted-foreground px-3 py-2.5 text-xs">No apps connected yet. Connect one in Settings to use it here.</p>
      )}

      {rest.length > 0 && (
        <Collapsible open={restOpen} onOpenChange={setRestOpen} className="min-w-0">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex w-full items-center gap-1 px-3 py-2 text-left text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset"
            >
              <HugeiconsIcon icon={restOpen ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="size-3" />
              Not connected
              <span className="tabular-nums opacity-70">{rest.length}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="divide-y border-t">
              {rest.map((c) => (
                <li key={c.id} className={cn('flex min-w-0 items-center gap-3 px-3 py-2', c.status === 'disabled' && 'opacity-60')}>
                  <ConnectorMark connector={c} size="sm" />
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-xs">{c.name}</span>
                    <ConnectorStatusLabel connector={c} />
                  </div>
                  {c.status !== 'disabled' && onOpenSettings && (
                    <Button variant="outline" size="sm" aria-label={`Connect ${c.name} in Settings`} onClick={() => onOpenSettings('connectors', c.id)}>
                      Connect in Settings
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      <PartHeading
        title="Skills"
        hint={onSkills.length ? 'Loaded only when a task needs them.' : 'Turn a skill on in Settings to use it here.'}
      />
      {onSkills.map((s) => (
        <div key={s.id} className="flex min-w-0 items-center gap-3 px-3 py-2">
          <SkillMark skill={s} size="sm" />
          <div className="grid min-w-0 flex-1">
            <span className="truncate text-xs">{s.name}</span>
            <span className="text-muted-foreground truncate text-[11px]">{s.description}</span>
          </div>
          <Switch
            checked={draft.skills.includes(s.id)}
            onCheckedChange={(v) => setSkill(s.id, v)}
            aria-label={`Let the agent use the ${s.name} skill`}
            className="mx-1"
          />
        </div>
      ))}
      {offSkills > 0 && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
          <span className="text-muted-foreground text-[11px]">
            {offSkills === 1 ? '1 more skill is' : `${offSkills} more skills are`} off in your settings.
          </span>
          {onOpenSettings && (
            <Button variant="ghost" size="sm" className="text-muted-foreground -my-1" onClick={() => onOpenSettings('skills')}>
              <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} data-icon="inline-start" />
              Skills in Settings
            </Button>
          )}
        </div>
      )}
    </>
  )
}

function ModelSection({ id, draft, onChange, models, defaultModel }: SectionProps & { models: PromptModel[]; defaultModel?: string }) {
  const fallback = models.find((m) => m.id === defaultModel) ?? models[0]
  const chosen = models.find((m) => m.id === draft.model)
  const shown = chosen ?? fallback
  return (
    <div className="grid min-w-0 gap-2 p-3">
      <Field className="gap-2">
        <FieldLabel htmlFor={`${id}-model`}>Model</FieldLabel>
        <Select
          value={chosen ? chosen.id : DEFAULT_MODEL}
          onValueChange={(v) => onChange({ model: v === DEFAULT_MODEL ? undefined : v })}
        >
          <SelectTrigger id={`${id}-model`} aria-describedby={`${id}-model-hint`} className="w-full @sm:w-72">
            <SelectValue>
              {shown?.icon && <HugeiconsIcon icon={shown.icon} strokeWidth={2} />}
              <span className="truncate">{chosen ? chosen.name : `Default${fallback ? ` (${fallback.name})` : ''}`}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            <SelectItem value={DEFAULT_MODEL} textValue="Default" className="py-1.5">
              <span className="grid min-w-0">
                <span>Default{fallback ? ` (${fallback.name})` : ''}</span>
                <span className="text-muted-foreground text-[11px] leading-4 whitespace-normal">Follows the model chosen in Settings.</span>
              </span>
            </SelectItem>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id} textValue={m.name} className="py-1.5">
                <span className="grid min-w-0">
                  <span className="flex items-center gap-1.5">
                    {m.icon && <HugeiconsIcon icon={m.icon} strokeWidth={2} className="text-muted-foreground" />}
                    {m.name}
                    {m.badge && <span className="text-brand text-[10px] font-medium">{m.badge}</span>}
                  </span>
                  {m.description && <span className="text-muted-foreground text-[11px] leading-4 whitespace-normal">{m.description}</span>}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription id={`${id}-model-hint`} className="text-[11px] leading-4">
          {chosen ? chosen.description : 'Uses your default model, and follows it when you change it.'}
        </FieldDescription>
      </Field>
    </div>
  )
}

function AccessSection({ id, draft, onChange }: SectionProps) {
  return (
    <div className="min-w-0 p-3">
      <RadioGroupPrimitive.Root
        aria-label="Who can use it"
        value={draft.access}
        onValueChange={(v) => onChange({ access: v as AgentAccess })}
        className="grid grid-cols-1 gap-2 @sm:grid-cols-2"
      >
        {AGENT_ACCESS_OPTIONS.map((o) => (
          <RadioGroupPrimitive.Item
            key={o.value}
            id={`${id}-access-${o.value}`}
            value={o.value}
            className={cn(
              'flex min-w-0 items-start gap-2.5 rounded-lg border p-2.5 text-left outline-none transition-colors',
              'hover:bg-accent/50 focus-visible:ring-ring/50 focus-visible:ring-2',
              'data-[state=checked]:border-brand/60 data-[state=checked]:bg-accent/40',
            )}
          >
            <span className="bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-md">
              <HugeiconsIcon icon={o.icon} strokeWidth={2} className="size-4" />
            </span>
            <span className="grid min-w-0 gap-0.5">
              <span className="text-xs font-medium">{o.label}</span>
              <span className="text-muted-foreground text-[11px] leading-snug">{o.hint}</span>
            </span>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
    </div>
  )
}
