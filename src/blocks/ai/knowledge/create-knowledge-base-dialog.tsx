import { useId, useState, type FormEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { CloudUploadIcon, Database01Icon, Globe02Icon, PlugSocketIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { IconColourPicker, type ColourOption, type IconOption } from '@/components/icon-colour-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { knowledgeAccessOptions } from './knowledge-base-settings'
import type { KnowledgeAccess } from './knowledge-types'

// The dialog that creates a knowledge base: its name, a description of what
// is in it (the assistant reads it to decide when to search), an icon and
// colour, who can use it, and what to start with. The start choice comes
// back in the draft, so the app can open the matching Add source dialog
// (upload, website, connected app) straight after; Empty adds sources later.
// The form starts afresh each time it opens.

// What the new knowledge base starts with.
export type KnowledgeStart = 'upload' | 'website' | 'connector' | 'empty'

// What the dialog hands back. Icon and colour by id, so it can be saved as JSON.
export type KnowledgeBaseDraft = {
  name: string
  description: string
  icon: string
  colour: string
  access: KnowledgeAccess
  start: KnowledgeStart
}

const STARTS: { value: KnowledgeStart; icon: IconSvgElement; title: string; hint: string; submit: string }[] = [
  { value: 'upload', icon: CloudUploadIcon, title: 'Upload files', hint: 'PDFs, documents, sheets and text', submit: 'Create and upload files' },
  { value: 'website', icon: Globe02Icon, title: 'Website', hint: 'Crawl a site’s pages and keep them current', submit: 'Create and add a website' },
  { value: 'connector', icon: PlugSocketIcon, title: 'Connected app', hint: 'Sync a folder from a connected app', submit: 'Create and connect an app' },
  { value: 'empty', icon: Database01Icon, title: 'Empty', hint: 'Add sources later', submit: 'Create knowledge base' },
]

export type CreateKnowledgeBaseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  icons: IconOption[]
  colours: ColourOption[]
  onCreate: (draft: KnowledgeBaseDraft) => void
  organisation?: string
  // What the form starts with each time it opens.
  initial?: Partial<KnowledgeBaseDraft>
}

export function CreateKnowledgeBaseDialog({
  open, onOpenChange, icons, colours, onCreate, organisation, initial,
}: CreateKnowledgeBaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {open && (
          <CreateForm icons={icons} colours={colours} onCreate={onCreate} organisation={organisation} initial={initial} />
        )}
      </DialogContent>
    </Dialog>
  )
}

const MAX_DESCRIPTION = 300

function CreateForm({ icons, colours, onCreate, organisation, initial }: {
  icons: IconOption[]
  colours: ColourOption[]
  onCreate: (draft: KnowledgeBaseDraft) => void
  organisation?: string
  initial?: Partial<KnowledgeBaseDraft>
}) {
  const id = useId()
  const [draft, setDraft] = useState<KnowledgeBaseDraft>(() => ({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    icon: initial?.icon ?? icons[0]?.id ?? '',
    colour: initial?.colour ?? colours[0]?.id ?? '',
    access: initial?.access ?? 'private',
    start: initial?.start ?? 'upload',
  }))
  const [tried, setTried] = useState(false)
  const set = (patch: Partial<KnowledgeBaseDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const nameError = !draft.name.trim() ? 'Give the knowledge base a name.' : undefined
  const access = knowledgeAccessOptions(organisation)
  const start = STARTS.find((s) => s.value === draft.start) ?? STARTS[0]

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (nameError) return document.getElementById(`${id}-name`)?.focus()
    onCreate({ ...draft, name: draft.name.trim(), description: draft.description.trim() })
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="shrink-0 border-b px-4 py-3 pr-10">
        <DialogTitle>New knowledge base</DialogTitle>
        <DialogDescription>
          A library the assistant searches for the passages each question needs. Add documents to it, then link it
          to projects.
        </DialogDescription>
      </DialogHeader>

      <div className="@container min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-w-0 gap-5 p-4">
          <Field data-invalid={tried && !!nameError}>
            <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
            <div className="flex min-w-0 items-center gap-2">
              <IconColourPicker
                icons={icons}
                colours={colours}
                icon={draft.icon}
                colour={draft.colour}
                label="Knowledge base icon"
                onChange={set}
              />
              <Input
                id={`${id}-name`}
                autoFocus
                value={draft.name}
                maxLength={80}
                placeholder="For example: HR policies"
                aria-invalid={tried && !!nameError}
                aria-describedby={tried && nameError ? `${id}-name-error` : undefined}
                onChange={(e) => set({ name: e.target.value })}
                className="min-w-0 flex-1"
              />
            </div>
            {tried && nameError && <FieldError id={`${id}-name-error`}>{nameError}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor={`${id}-description`}>
              What is in it <span className="text-muted-foreground font-normal">(recommended)</span>
            </FieldLabel>
            <Textarea
              id={`${id}-description`}
              aria-describedby={`${id}-description-hint`}
              value={draft.description}
              maxLength={MAX_DESCRIPTION}
              placeholder="For example: Leave, expenses and remote work policies for all staff, from 2024."
              onChange={(e) => set({ description: e.target.value })}
              className="min-h-20 text-[13px]"
            />
            <div className="flex min-w-0 justify-between gap-3">
              <FieldDescription id={`${id}-description-hint`} className="text-[11px] leading-4">
                The assistant reads this to decide when to search it, so name the topics it covers.
              </FieldDescription>
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                {draft.description.length} / {MAX_DESCRIPTION}
              </span>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${id}-access`}>Who can use it</FieldLabel>
            <Select value={draft.access} onValueChange={(v) => set({ access: v as KnowledgeAccess })}>
              <SelectTrigger id={`${id}-access`} aria-describedby={`${id}-access-hint`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {access.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <HugeiconsIcon icon={o.icon} strokeWidth={2} className="text-muted-foreground" />
                    {o.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription id={`${id}-access-hint`} className="text-[11px] leading-4">
              {access.find((o) => o.value === draft.access)?.hint}
              {draft.access === 'people' && ' Add them once it is created.'}
            </FieldDescription>
          </Field>

          <section className="grid min-w-0 gap-2" aria-labelledby={`${id}-start`}>
            <h3 id={`${id}-start`} className="text-xs font-medium">Start with</h3>
            <RadioGroupPrimitive.Root
              aria-labelledby={`${id}-start`}
              value={draft.start}
              onValueChange={(v) => set({ start: v as KnowledgeStart })}
              className="grid grid-cols-1 gap-2 @sm:grid-cols-2"
            >
              {STARTS.map((s) => (
                <RadioGroupPrimitive.Item
                  key={s.value}
                  value={s.value}
                  className={cn(
                    'flex min-w-0 items-start gap-2.5 rounded-lg border p-2.5 text-left outline-none transition-colors',
                    'hover:bg-accent/50 focus-visible:ring-ring/50 focus-visible:ring-2',
                    'data-[state=checked]:border-brand/60 data-[state=checked]:bg-accent/40',
                  )}
                >
                  <span className="bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-md">
                    <HugeiconsIcon icon={s.icon} strokeWidth={2} className="size-4" />
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate text-xs font-medium">{s.title}</span>
                    <span className="text-muted-foreground text-[11px] leading-snug">{s.hint}</span>
                  </span>
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroupPrimitive.Root>
          </section>
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t px-4 py-3">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">{start.submit}</Button>
      </DialogFooter>
    </form>
  )
}
