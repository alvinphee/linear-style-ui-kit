import { useId, useState, type ComponentProps } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Building06Icon, Folder01Icon, LockIcon, UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SettingsGroup, SettingsRow } from '@/blocks/settings-page'
import { ShareSummary, type ShareMember } from '@/blocks/share-dialog'
import { UserAvatar } from '@/components/person'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { formatMinutes, formatNumber } from '@/lib/format'
import { plural } from '@/lib/text'
import type { KnowledgeAccess, KnowledgeBase, RetrievalSettings } from './knowledge-types'

// A knowledge base's settings tabs: how it is split and searched (retrieval
// settings), and who can use it (access).
//
// RetrievalSettingsForm edits a draft of the settings and saves it with
// Save, because changing the chunking or the embedding model re-indexes
// every document: the form warns before that, and reports it on save.
// KnowledgeAccessForm sets who can search it and lists the projects that do,
// each with Unlink.

// An embedding model to choose from. The hint is a few words on what it suits.
export type EmbeddingModelOption = { id: string; label: string; hint?: string }

// The settings most knowledge bases should keep: mid-sized chunks with a
// little overlap, hybrid search and reranking on, eight chunks per question.
export function recommendedRetrievalSettings(embeddingModel: string): RetrievalSettings {
  return { chunkSize: 512, chunkOverlap: 51, embeddingModel, hybrid: true, rerank: true, topK: 8, minScore: 0.35 }
}

const CHUNK_SIZES = [256, 512, 1024, 2048]

const overlapPercent = (s: RetrievalSettings) => (s.chunkSize ? Math.round((s.chunkOverlap / s.chunkSize) * 100) : 0)
const overlapTokens = (chunkSize: number, percent: number) => Math.round((chunkSize * percent) / 100)
const sameSettings = (a: RetrievalSettings, b: RetrievalSettings) =>
  (Object.keys(a) as (keyof RetrievalSettings)[]).every((k) => a[k] === b[k])
// What changes the index, so every document must be chunked and embedded again.
const needsReindex = (a: RetrievalSettings, b: RetrievalSettings) =>
  a.chunkSize !== b.chunkSize || a.chunkOverlap !== b.chunkOverlap || a.embeddingModel !== b.embeddingModel

// A slider whose thumb, what a screen reader lands on, is named from
// `label`; `valueText` reads the value in words ("15%, 77 tokens").
function NamedSlider({ label, valueText, ...props }: ComponentProps<typeof Slider> & { label: string; valueText?: string }) {
  return <Slider thumbLabel={label} thumbValueText={valueText} {...props} />
}

export type RetrievalSettingsFormProps = {
  // The saved settings. The form starts again from them whenever they change.
  value: RetrievalSettings
  // Saves the settings (Save).
  onChange: (value: RetrievalSettings) => void
  embeddingModels: EmbeddingModelOption[]
  // Called on save as well, when the chunking or the model changed.
  onReindexNeeded?: (value: RetrievalSettings) => void
  // About how long re-indexing every document takes, for the warning.
  reindexMinutes?: number
  // What Reset to recommended sets. recommendedRetrievalSettings with the
  // first model when left out.
  recommended?: RetrievalSettings
  disabled?: boolean
  className?: string
}

export function RetrievalSettingsForm({
  value, onChange, embeddingModels, onReindexNeeded, reindexMinutes, recommended, disabled, className,
}: RetrievalSettingsFormProps) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [base, setBase] = useState(value)
  // Compared by content, so a caller that builds `value` afresh on each render
  // does not throw away the draft.
  if (!sameSettings(base, value)) {
    setBase(value)
    setDraft(value)
  }
  const set = (patch: Partial<RetrievalSettings>) => setDraft((d) => ({ ...d, ...patch }))
  const preset = recommended ?? recommendedRetrievalSettings(embeddingModels[0]?.id ?? value.embeddingModel)
  const dirty = !sameSettings(draft, value)
  const reindex = needsReindex(draft, value)
  const percent = overlapPercent(draft)
  const model = embeddingModels.find((m) => m.id === draft.embeddingModel)

  const save = () => {
    onChange(draft)
    if (reindex) onReindexNeeded?.(draft)
  }

  return (
    <div className={cn('@container grid min-w-0 gap-5', className)}>
      <SettingsGroup title="Chunking" description="How documents are split into pieces and indexed for search.">
        <SettingsRow
          label="Chunk size"
          htmlFor={`${id}-size`}
          hint="How much text each searchable piece holds. Smaller finds exact facts; larger keeps more around them."
        >
          <Select
            value={String(draft.chunkSize)}
            disabled={disabled}
            onValueChange={(v) => {
              const chunkSize = Number(v)
              set({ chunkSize, chunkOverlap: overlapTokens(chunkSize, percent) })
            }}
          >
            <SelectTrigger id={`${id}-size`} className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([...CHUNK_SIZES, draft.chunkSize])].sort((a, b) => a - b).map((n) => (
                <SelectItem key={n} value={String(n)}>{formatNumber(n)} tokens</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Overlap"
          hint="Text each chunk shares with the next, so a sentence cut in two is still found."
        >
          <SliderControl
            label="Overlap"
            value={percent}
            min={0}
            max={25}
            step={1}
            shown={`${percent}% · ${formatNumber(draft.chunkOverlap)} tokens`}
            valueText={`${percent}%, ${plural(draft.chunkOverlap, 'token')}`}
            disabled={disabled}
            onChange={(p) => set({ chunkOverlap: overlapTokens(draft.chunkSize, p) })}
          />
        </SettingsRow>

        <SettingsRow
          label="Embedding model"
          htmlFor={`${id}-model`}
          hint={model?.hint
            ? `Turns text into vectors, to search by meaning. ${model.hint}`
            : 'Turns text into vectors, to search by meaning.'}
        >
          <Select value={draft.embeddingModel} disabled={disabled} onValueChange={(embeddingModel) => set({ embeddingModel })}>
            <SelectTrigger id={`${id}-model`} className="w-48 max-w-full">
              <SelectValue placeholder="Choose a model" />
            </SelectTrigger>
            <SelectContent>
              {embeddingModels.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingsRow>

        {reindex && (
          <div role="status" className="flex min-w-0 items-start gap-2 px-3 py-2.5">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-status-progress mt-0.5 size-3.5 shrink-0" />
            <p className="text-xs leading-5">
              Changing this re-indexes every document
              {reindexMinutes !== undefined && ` (about ${formatMinutes(Math.max(1, Math.round(reindexMinutes)))})`}.
              <span className="text-muted-foreground"> Search keeps using the current index until it finishes.</span>
            </p>
          </div>
        )}
      </SettingsGroup>

      <SettingsGroup title="Search" description="How chunks are found and chosen for each question.">
        <SettingsRow
          label="Hybrid search"
          htmlFor={`${id}-hybrid`}
          hint="Also matches exact words, such as codes, names and part numbers, alongside meaning."
        >
          <Switch id={`${id}-hybrid`} checked={draft.hybrid} disabled={disabled} onCheckedChange={(hybrid) => set({ hybrid })} />
        </SettingsRow>

        <SettingsRow
          label="Reranking"
          htmlFor={`${id}-rerank`}
          hint="A second model reorders the best matches. More accurate, a little slower."
        >
          <Switch id={`${id}-rerank`} checked={draft.rerank} disabled={disabled} onCheckedChange={(rerank) => set({ rerank })} />
        </SettingsRow>

        <SettingsRow label="Top-K" hint="How many chunks go to the model with each question.">
          <SliderControl
            label="Top-K"
            value={draft.topK}
            min={1}
            max={20}
            step={1}
            shown={plural(draft.topK, 'chunk')}
            disabled={disabled}
            onChange={(topK) => set({ topK })}
          />
        </SettingsRow>

        <SettingsRow
          label="Minimum score"
          hint="Matches scoring below this cut-off are left out, even when fewer than top-K are found."
        >
          <SliderControl
            label="Minimum score"
            value={draft.minScore}
            min={0}
            max={1}
            step={0.05}
            shown={draft.minScore.toFixed(2)}
            disabled={disabled}
            onChange={(v) => set({ minScore: Math.round(v * 100) / 100 })}
          />
        </SettingsRow>
      </SettingsGroup>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={disabled || sameSettings(draft, preset)}
          onClick={() => setDraft(preset)}
        >
          Reset to recommended
        </Button>
        <span className="flex-1" />
        {dirty && <span className="text-muted-foreground text-xs">Unsaved changes</span>}
        {dirty && (
          <Button type="button" variant="outline" disabled={disabled} onClick={() => setDraft(value)}>Discard</Button>
        )}
        <Button type="button" disabled={disabled || !dirty} onClick={save}>
          {reindex ? 'Save and re-index' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

function SliderControl({ label, value, min, max, step, shown, valueText, disabled, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  // The value as shown beside the slider.
  shown: string
  valueText?: string
  disabled?: boolean
  onChange: (value: number) => void
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3 @md:w-64">
      <NamedSlider
        label={label}
        valueText={valueText ?? shown}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        className="min-w-0 flex-1"
      />
      <span className="text-muted-foreground w-28 shrink-0 text-right text-xs tabular-nums">{shown}</span>
    </div>
  )
}

export type KnowledgeMember = NonNullable<KnowledgeBase['members']>[number]

export type KnowledgeAccessFormProps = {
  access: KnowledgeAccess
  onAccessChange: (access: KnowledgeAccess) => void
  // The people it is shared with, used when access is 'people'.
  members: KnowledgeMember[]
  // Opens the share dialog to add or remove people. Left out: no button.
  onManageMembers?: () => void
  linkedProjects: { id: string; name: string }[]
  // Left out: no Unlink buttons.
  onUnlinkProject?: (id: string) => void
  organisation?: string
  // How many people are listed before "and N more".
  max?: number
  disabled?: boolean
  className?: string
}

// The three access choices, worded for an organisation.
export function knowledgeAccessOptions(organisation = 'your organisation') {
  return [
    { value: 'private' as const, icon: LockIcon, title: 'Only me', hint: 'Only you can search it, in your own chats and projects.' },
    { value: 'people' as const, icon: UserGroupIcon, title: 'People I choose', hint: 'The people you add can search it and link it to their projects.' },
    {
      value: 'organisation' as const, icon: Building06Icon, title: `Everyone at ${organisation}`,
      hint: `Anyone at ${organisation} can search it and link it to a project.`,
    },
  ]
}

export function KnowledgeAccessForm({
  access, onAccessChange, members, onManageMembers, linkedProjects, onUnlinkProject, organisation = 'your organisation',
  max = 5, disabled, className,
}: KnowledgeAccessFormProps) {
  const id = useId()
  const options = knowledgeAccessOptions(organisation)
  // The share summary speaks in the share dialog's terms.
  const shareMembers: ShareMember[] = access === 'people'
    ? members.map((m) => ({ ...m, role: 'use', status: 'active' }))
    : []
  const shown = members.slice(0, max)

  return (
    <div className={cn('@container grid min-w-0 gap-5', className)}>
      <SettingsGroup
        title="Who can use it"
        description="Everyone with access can search it in chats. Only you change its sources and settings."
        action={<ShareSummary members={shareMembers} access={access === 'organisation' ? 'organisation' : 'restricted'} organisation={organisation} />}
        className="border-0 bg-transparent"
      >
        <RadioGroup
          aria-label="Who can use it"
          value={access}
          disabled={disabled}
          onValueChange={(v) => onAccessChange(v as KnowledgeAccess)}
          className="grid-cols-1 gap-1.5"
        >
          {options.map((o) => (
            <FieldLabel key={o.value} htmlFor={`${id}-${o.value}`}>
              <Field orientation="horizontal" data-disabled={disabled || undefined}>
                <RadioGroupItem value={o.value} id={`${id}-${o.value}`} />
                <HugeiconsIcon icon={o.icon} strokeWidth={2} aria-hidden className="text-muted-foreground mt-px size-3.5 shrink-0" />
                <FieldContent>
                  <FieldTitle className="text-xs">{o.title}</FieldTitle>
                  <FieldDescription className="text-[11px] leading-4">{o.hint}</FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </SettingsGroup>

      {access === 'people' && (
        <SettingsGroup
          title="People"
          description={members.length ? plural(members.length, 'person', 'people') : 'No one yet: add the people who should use it.'}
          action={onManageMembers && (
            <Button variant="outline" size="sm" disabled={disabled} onClick={onManageMembers}>
              <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
              {members.length ? 'Manage people' : 'Add people'}
            </Button>
          )}
        >
          {members.length ? (
            <ul className="divide-y">
              {shown.map((m) => (
                <li key={m.id} className="flex min-w-0 items-center gap-2 px-3 py-2">
                  <UserAvatar name={m.name || m.email} />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-xs">{m.name || m.email}</span>
                    {m.name && <span className="text-muted-foreground truncate text-[11px]">{m.email}</span>}
                  </span>
                </li>
              ))}
              {members.length > max && (
                <li className="text-muted-foreground px-3 py-2 text-[11px]">and {members.length - max} more</li>
              )}
            </ul>
          ) : (
            <p className="text-muted-foreground px-3 py-4 text-center text-xs">Until you add people, only you can use it.</p>
          )}
        </SettingsGroup>
      )}

      <SettingsGroup
        title="Projects that search it"
        description="Chats in these projects search this knowledge base when a question needs it."
      >
        {linkedProjects.length ? (
          <ul className="divide-y">
            {linkedProjects.map((p) => (
              <li key={p.id} className="flex min-w-0 items-center gap-2 px-3 py-1.5">
                <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-xs">{p.name}</span>
                {onUnlinkProject && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    aria-label={`Unlink ${p.name}`}
                    onClick={() => onUnlinkProject(p.id)}
                  >
                    Unlink
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground px-3 py-4 text-center text-xs">
            No project searches it yet. Link it from a project’s knowledge.
          </p>
        )}
      </SettingsGroup>
    </div>
  )
}
