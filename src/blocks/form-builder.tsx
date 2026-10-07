import { useId, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, ArrowUp01Icon, Calendar03Icon, Camera01Icon, CheckmarkSquare02Icon, Copy01Icon, Delete02Icon,
  DropdownFieldTypeIcon, HashtagIcon, LeftToRightListBulletIcon, Mail01Icon, ParagraphIcon, PencilEdit02Icon, RadioButtonIcon,
  Settings02Icon, SignatureIcon, SmartPhone01Icon, StarIcon, TaskDone01Icon, TextIcon, ThumbsUpDownIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import type { FormField, FormFieldType } from '@/blocks/form-fields'
import { FormRenderer, fieldsOf, type FormDefinition, type FormSection } from '@/blocks/form-renderer'
import { IconAction } from '@/components/icon-action'
import { IconMark } from '@/components/mark'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { plural, slug } from '@/lib/text'

// Makes or edits a form definition: its name and icon, what it is about,
// its sections, and a field of any kind in each, with the settings that
// kind has. Fields move up and down, checks can be pasted in a batch, and
// the form is filled in live in a phone-sized preview as it is built. Save
// hands back the definition; where it goes (a list in memory, a database)
// is the app's business. Field keys are made from labels once, then kept,
// so old submissions still match.

/* ---------- The field kinds ---------- */

export type FieldTypeOption = { type: FormFieldType; label: string; icon: IconSvgElement; hint: string; group: 'Checks' | 'Answers' | 'More' }

export const FIELD_TYPES: FieldTypeOption[] = [
  { type: 'check', label: 'Check', icon: TaskDone01Icon, hint: 'Pass, fail or N/A', group: 'Checks' },
  { type: 'yes-no', label: 'Yes / No', icon: ThumbsUpDownIcon, hint: 'A question', group: 'Checks' },
  { type: 'text', label: 'Short text', icon: TextIcon, hint: 'A name, a plate', group: 'Answers' },
  { type: 'textarea', label: 'Long text', icon: ParagraphIcon, hint: 'Notes', group: 'Answers' },
  { type: 'number', label: 'Number', icon: HashtagIcon, hint: 'A reading, an amount', group: 'Answers' },
  { type: 'date', label: 'Date', icon: Calendar03Icon, hint: '', group: 'Answers' },
  { type: 'email', label: 'Email', icon: Mail01Icon, hint: '', group: 'Answers' },
  { type: 'select', label: 'Dropdown', icon: DropdownFieldTypeIcon, hint: 'One of a list', group: 'Answers' },
  { type: 'radio', label: 'Choice', icon: RadioButtonIcon, hint: 'One of a few, all shown', group: 'Answers' },
  { type: 'checkbox', label: 'Tick box', icon: CheckmarkSquare02Icon, hint: 'Agree, confirm', group: 'Answers' },
  { type: 'rating', label: 'Rating', icon: StarIcon, hint: 'Stars', group: 'More' },
  { type: 'photo', label: 'Photo', icon: Camera01Icon, hint: 'Camera or files', group: 'More' },
  { type: 'signature', label: 'Signature', icon: SignatureIcon, hint: 'Signed by hand', group: 'More' },
]

export const fieldTypeOf = (type: FormFieldType) => FIELD_TYPES.find((t) => t.type === type) ?? FIELD_TYPES[2]

// An icon the builder offers for a form.
export type FormIconOption = { id: string; label: string; icon: IconSvgElement }

const TEXTUAL: FormFieldType[] = ['text', 'textarea', 'number', 'email', 'date', 'select']
const WITH_OPTIONS: FormFieldType[] = ['select', 'radio']

let counter = 0
const fresh = (prefix: string) => `${prefix}-${(++counter).toString(36)}${Date.now().toString(36).slice(-3)}`

export function blankSection(title = 'Section 1'): FormSection {
  return { id: fresh('s'), title, fields: [] }
}

export function blankForm(): FormDefinition {
  return { id: fresh('form'), name: '', version: 1, sections: [blankSection()] }
}

export function newField(type: FormFieldType, label = ''): FormField {
  const field: FormField = { key: fresh('new'), label, type }
  if (type === 'check' || type === 'yes-no') field.required = true
  if (WITH_OPTIONS.includes(type)) field.options = ['Option 1', 'Option 2'].map((v) => ({ value: v, label: v }))
  return field
}

// Keys for fields that have none yet, from their labels, unique in the form.
// Keys already set stay as they are, so stored submissions still match.
export function finaliseKeys(form: FormDefinition): FormDefinition {
  const taken = new Set(fieldsOf(form).filter((f) => !f.key.startsWith('new-')).map((f) => f.key))
  return {
    ...form,
    sections: form.sections.map((s) => ({
      ...s,
      fields: s.fields.map((f) => {
        if (!f.key.startsWith('new-')) return f
        const base = slug(f.label, { maxLength: 40, fallback: f.type })
        let key = base
        for (let n = 2; taken.has(key); n++) key = `${base}-${n}`
        taken.add(key)
        return { ...f, key }
      }),
    })),
  }
}

// What stops the form being saved.
export function formProblems(form: FormDefinition): string[] {
  const problems: string[] = []
  if (!form.name.trim()) problems.push('Give the form a name.')
  if (!fieldsOf(form).length) problems.push('Add at least one field.')
  form.sections.forEach((s, i) => {
    if (!s.title.trim()) problems.push(`Section ${i + 1} needs a title.`)
    s.fields.forEach((f, j) => {
      if (!f.label.trim()) problems.push(`Field ${j + 1} in "${s.title || `section ${i + 1}`}" needs a label.`)
      if (WITH_OPTIONS.includes(f.type) && (f.options?.filter((o) => o.label.trim()).length ?? 0) < 2) problems.push(`"${f.label || 'A choice'}" needs at least two options.`)
    })
  })
  if (form.context && !form.context.label.trim()) problems.push('Say what the form is filled in for, or turn that off.')
  return problems
}

/* ---------- Storing a definition ---------- */

// A definition as plain data: the icon by its id from the builder's list,
// so it can go to localStorage or a database as JSON and come back.
export type StoredForm = Omit<FormDefinition, 'icon'> & { iconId?: string }

export function toStoredForm(form: FormDefinition, icons: FormIconOption[]): StoredForm {
  const { icon, ...rest } = form
  return { ...rest, iconId: icons.find((i) => i.icon === icon)?.id }
}

export function fromStoredForm(stored: StoredForm, icons: FormIconOption[]): FormDefinition {
  const { iconId, ...rest } = stored
  const icon = icons.find((i) => i.id === iconId)?.icon
  return icon ? { ...rest, icon } : rest
}

/* ---------- The builder ---------- */

const GHOST_INPUT = 'h-7 border-transparent bg-transparent px-1.5 shadow-none hover:border-input focus-visible:border-ring'

export function FormBuilder({ initial, icons = [], categories = [], onSave, onCancel, saveLabel = 'Save form', className }: {
  // A blank form (blankForm()) or one to edit.
  initial: FormDefinition
  // The icons a form can have.
  icons?: FormIconOption[]
  // Categories to suggest.
  categories?: string[]
  onSave: (form: FormDefinition) => void
  onCancel?: () => void
  saveLabel?: string
  className?: string
}) {
  const uid = useId()
  const [form, setForm] = useState<FormDefinition>(initial)
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [pasteInto, setPasteInto] = useState<string | null>(null)
  const problems = formProblems(form)
  const editing = !!initial.name

  const patch = (p: Partial<FormDefinition>) => setForm((f) => ({ ...f, ...p }))
  const setSection = (id: string, p: Partial<FormSection> | ((s: FormSection) => FormSection)) =>
    setForm((f) => ({ ...f, sections: f.sections.map((s) => (s.id === id ? (typeof p === 'function' ? p(s) : { ...s, ...p }) : s)) }))
  const setField = (sectionId: string, key: string, p: Partial<FormField>) =>
    setSection(sectionId, (s) => ({ ...s, fields: s.fields.map((f) => (f.key === key ? { ...f, ...p } : f)) }))
  const move = <T,>(list: T[], from: number, to: number) => {
    if (to < 0 || to >= list.length) return list
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
  }

  function addField(sectionId: string, type: FormFieldType) {
    const field = newField(type)
    setSection(sectionId, (s) => ({ ...s, fields: [...s.fields, field] }))
    setOpen((o) => ({ ...o, [field.key]: true }))
  }

  function addChecks(sectionId: string, text: string) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return
    setSection(sectionId, (s) => ({ ...s, fields: [...s.fields, ...lines.map((l) => newField('check', l))] }))
    toast.success(`${plural(lines.length, 'check')} added`)
  }

  function changeType(sectionId: string, key: string, type: FormFieldType) {
    setSection(sectionId, (s) => ({
      ...s,
      fields: s.fields.map((f) => {
        if (f.key !== key) return f
        const next: FormField = { key: f.key, label: f.label, type, required: f.required, description: f.description }
        if (WITH_OPTIONS.includes(type)) next.options = f.options?.length ? f.options : newField(type).options
        return next
      }),
    }))
  }

  // The preview fills in the form as it stands, with a stand-in name.
  const preview = useMemo(() => ({ ...finaliseKeys(form), name: form.name.trim() || 'Untitled form' }), [form])

  function save() {
    if (problems.length) {
      toast.error(problems[0])
      return
    }
    onSave(finaliseKeys({ ...form, name: form.name.trim(), description: form.description?.trim() || undefined, category: form.category?.trim() || undefined }))
  }

  return (
    <div className={cn('@container grid min-w-0 content-start gap-4', className)}>
      <div className="flex items-center justify-between gap-3 @3xl:hidden">
        <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={pane} onValueChange={(v) => v && setPane(v as 'edit' | 'preview')} aria-label="Pane">
          <ToggleGroupItem value="edit"><HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" /> Edit</ToggleGroupItem>
          <ToggleGroupItem value="preview"><HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} data-icon="inline-start" /> Preview</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid min-w-0 gap-4 @3xl:grid-cols-[minmax(0,1fr)_22rem] @3xl:items-start">
        {/* ---- Editor ---- */}
        <div className={cn('grid min-w-0 gap-4', pane !== 'edit' && 'hidden @3xl:grid')}>
          <section aria-labelledby={`${uid}-about`} className="bg-card min-w-0 rounded-lg border">
            <header className="border-b px-3.5 py-2.5">
              <h3 id={`${uid}-about`} className="text-xs font-medium">About the form</h3>
            </header>
            <FieldGroup className="p-3.5">
              <div className="grid gap-4 @md:grid-cols-[minmax(0,1fr)_auto] @md:items-start">
                <Field>
                  <FieldLabel htmlFor={`${uid}-name`}>Name</FieldLabel>
                  <Input id={`${uid}-name`} value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Vehicle check, Expense claim…" autoFocus={!editing} />
                </Field>
                {icons.length > 0 && (
                  <Field>
                    <FieldLabel>Icon</FieldLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      size="lg"
                      spacing={1}
                      value={icons.find((i) => i.icon === form.icon)?.id ?? ''}
                      onValueChange={(id) => {
                        const option = icons.find((i) => i.id === id)
                        if (option) patch({ icon: option.icon })
                      }}
                      aria-label="Icon"
                      className="flex-wrap"
                    >
                      {icons.map((i) => (
                        <ToggleGroupItem key={i.id} value={i.id} aria-label={i.label} className="data-[state=on]:bg-accent px-1.5">
                          <IconMark icon={i.icon} colour={form.colour ?? 'var(--brand)'} size="sm" />
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              </div>
              <Field>
                <FieldLabel htmlFor={`${uid}-description`}>Description <span className="text-muted-foreground font-normal">Optional</span></FieldLabel>
                <Input id={`${uid}-description`} value={form.description ?? ''} onChange={(e) => patch({ description: e.target.value })} placeholder="One line on when to fill it in" />
              </Field>
              <div className="grid gap-4 @md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${uid}-category`}>Category</FieldLabel>
                  <Input id={`${uid}-category`} list={`${uid}-categories`} value={form.category ?? ''} onChange={(e) => patch({ category: e.target.value })} placeholder="Safety, Finance, Facilities…" />
                  <datalist id={`${uid}-categories`}>
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${uid}-minutes`}>Takes about <span className="text-muted-foreground font-normal">minutes</span></FieldLabel>
                  <Input id={`${uid}-minutes`} inputMode="numeric" value={form.estimatedMinutes ?? ''} onChange={(e) => patch({ estimatedMinutes: Number(e.target.value) || undefined })} placeholder="5" />
                </Field>
              </div>
              <Field orientation="horizontal">
                <Switch id={`${uid}-context`} checked={!!form.context} onCheckedChange={(on) => patch({ context: on ? { label: '', placeholder: '' } : undefined })} />
                <div className="grid gap-0.5">
                  <FieldLabel htmlFor={`${uid}-context`}>Filled in for one thing</FieldLabel>
                  <FieldDescription>A vehicle, a room, a new starter. Its QR code can name the thing, so the form opens for it.</FieldDescription>
                </div>
              </Field>
              {form.context && (
                <div className="grid gap-4 pl-9 @md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`${uid}-ctx-label`}>What is it?</FieldLabel>
                    <Input id={`${uid}-ctx-label`} value={form.context.label} onChange={(e) => patch({ context: { ...form.context!, label: e.target.value } })} placeholder="Vehicle" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${uid}-ctx-ph`}>Example <span className="text-muted-foreground font-normal">Optional</span></FieldLabel>
                    <Input id={`${uid}-ctx-ph`} value={form.context.placeholder ?? ''} onChange={(e) => patch({ context: { ...form.context!, placeholder: e.target.value } })} placeholder="Registration, such as SGX 4821" />
                  </Field>
                </div>
              )}
            </FieldGroup>
          </section>

          {form.sections.map((section, i) => (
            <section key={section.id} aria-label={section.title || `Section ${i + 1}`} className="bg-card min-w-0 rounded-lg border">
              <header className="grid gap-1 border-b px-2.5 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground w-6 shrink-0 text-center font-mono text-[11px]">{i + 1}</span>
                  <Input
                    value={section.title}
                    onChange={(e) => setSection(section.id, { title: e.target.value })}
                    placeholder="Section title"
                    aria-label={`Section ${i + 1} title`}
                    className={cn(GHOST_INPUT, 'min-w-0 flex-1 font-medium')}
                  />
                  <IconAction label="Move section up" icon={ArrowUp01Icon} disabled={i === 0} onClick={() => patch({ sections: move(form.sections, i, i - 1) })} className="text-muted-foreground" />
                  <IconAction label="Move section down" icon={ArrowDown01Icon} disabled={i === form.sections.length - 1} onClick={() => patch({ sections: move(form.sections, i, i + 1) })} className="text-muted-foreground" />
                  <IconAction
                    label="Delete section"
                    icon={Delete02Icon}
                    disabled={form.sections.length === 1}
                    onClick={() => patch({ sections: form.sections.filter((s) => s.id !== section.id) })}
                    className="text-muted-foreground hover:text-destructive"
                  />
                </div>
                <Input
                  value={section.description ?? ''}
                  onChange={(e) => setSection(section.id, { description: e.target.value || undefined })}
                  placeholder="A line under the title (optional)"
                  aria-label={`Section ${i + 1} description`}
                  className={cn(GHOST_INPUT, 'text-muted-foreground ml-7 h-6 w-[calc(100%-1.75rem)] text-[11px]')}
                />
              </header>

              {section.fields.length ? (
                <div className="divide-y">
                  {section.fields.map((field, j) => (
                    <FieldRow
                      key={field.key}
                      field={field}
                      index={j}
                      count={section.fields.length}
                      expanded={!!open[field.key]}
                      onToggle={() => setOpen((o) => ({ ...o, [field.key]: !o[field.key] }))}
                      onChange={(p) => setField(section.id, field.key, p)}
                      onType={(type) => changeType(section.id, field.key, type)}
                      onMove={(to) => setSection(section.id, (s) => ({ ...s, fields: move(s.fields, j, to) }))}
                      onDuplicate={() => {
                        const copy = { ...field, key: fresh('new'), label: field.label ? `${field.label} (copy)` : '' }
                        setSection(section.id, (s) => ({ ...s, fields: [...s.fields.slice(0, j + 1), copy, ...s.fields.slice(j + 1)] }))
                      }}
                      onRemove={() => setSection(section.id, (s) => ({ ...s, fields: s.fields.filter((f) => f.key !== field.key) }))}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground px-3.5 py-4 text-center text-xs">No fields yet. Add one below, or paste a list of checks.</p>
              )}

              <footer className="flex flex-wrap items-center gap-1.5 border-t px-2.5 py-2">
                <AddFieldMenu onPick={(type) => addField(section.id, type)} />
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setPasteInto(section.id)}>
                  <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} data-icon="inline-start" /> Paste checks
                </Button>
                <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">{plural(section.fields.length, 'field')}</span>
              </footer>
            </section>
          ))}

          <Button variant="outline" className="justify-self-start" onClick={() => patch({ sections: [...form.sections, blankSection(`Section ${form.sections.length + 1}`)] })}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> Add section
          </Button>
        </div>

        {/* ---- Preview ---- */}
        <aside aria-label="Preview" className={cn('grid min-w-0 gap-2 @3xl:sticky @3xl:top-4', pane !== 'preview' && 'hidden @3xl:grid')}>
          <div className="flex items-center justify-between px-0.5">
            <span className="text-muted-foreground text-[11px] font-medium">Preview, as on a phone</span>
            <span className="text-muted-foreground text-[11px] tabular-nums">{plural(fieldsOf(form).length, 'field')}</span>
          </div>
          <div className="bg-background mx-auto h-[640px] w-full max-w-[375px] overflow-y-auto rounded-xl border shadow-sm @3xl:mx-0">
            <FormRenderer
              key={preview.id}
              form={preview}
              inset="px-3"
              submitLabel="Submit (preview)"
              onSubmit={() => {
                toast('Preview only', { description: 'Nothing is kept from here. Save the form, then fill it in from the catalogue.' })
              }}
            />
          </div>
        </aside>
      </div>

      <footer className="bg-background/90 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t py-3 backdrop-blur">
        <span className={cn('text-[11px]', problems.length ? 'text-muted-foreground' : 'text-status-done')}>
          {problems.length ? problems[0] : `Ready to save · ${plural(fieldsOf(form).length, 'field')} in ${plural(form.sections.length, 'section')}`}
        </span>
        <div className="flex gap-2">
          {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
          <Button onClick={save} disabled={problems.length > 0}>{saveLabel}</Button>
        </div>
      </footer>

      <PasteChecksDialog
        open={pasteInto !== null}
        onOpenChange={(o) => !o && setPasteInto(null)}
        onAdd={(text) => {
          if (pasteInto) addChecks(pasteInto, text)
          setPasteInto(null)
        }}
      />
    </div>
  )
}

/* ---------- One field ---------- */

// One field in the builder: its kind, label and Required switch in a row,
// with its settings under it when expanded.
export function FieldRow({ field, index, count, expanded, onToggle, onChange, onType, onMove, onDuplicate, onRemove }: {
  field: FormField
  index: number
  count: number
  expanded: boolean
  onToggle: () => void
  onChange: (patch: Partial<FormField>) => void
  onType: (type: FormFieldType) => void
  onMove: (to: number) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const uid = useId()
  const type = fieldTypeOf(field.type)
  return (
    <div className="grid gap-3 px-2.5 py-2">
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground grid w-6 shrink-0 place-items-center" title={type.label}>
          <HugeiconsIcon icon={type.icon} strokeWidth={2} className="size-4" />
          <span className="sr-only">{type.label}</span>
        </span>
        <Input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder={field.type === 'check' ? 'The statement to check' : field.type === 'yes-no' ? 'The question' : `${type.label} label`}
          aria-label={`Field ${index + 1} label`}
          className={cn(GHOST_INPUT, 'min-w-0 flex-1')}
        />
        <Label htmlFor={`${uid}-req`} className="text-muted-foreground hidden shrink-0 gap-1.5 text-[11px] font-normal @md:flex">
          <Switch id={`${uid}-req`} size="sm" checked={!!field.required} onCheckedChange={(on) => onChange({ required: on || undefined })} /> Required
        </Label>
        <IconAction label={expanded ? 'Hide settings' : 'Settings'} icon={Settings02Icon} pressed={expanded} onClick={onToggle} className="text-muted-foreground" />
        <IconAction label="Move up" icon={ArrowUp01Icon} disabled={index === 0} onClick={() => onMove(index - 1)} className="text-muted-foreground hidden @sm:inline-flex" />
        <IconAction label="Move down" icon={ArrowDown01Icon} disabled={index === count - 1} onClick={() => onMove(index + 1)} className="text-muted-foreground hidden @sm:inline-flex" />
        <IconAction label="Duplicate" icon={Copy01Icon} onClick={onDuplicate} className="text-muted-foreground hidden @sm:inline-flex" />
        <IconAction label="Delete field" icon={Delete02Icon} onClick={onRemove} className="text-muted-foreground hover:text-destructive" />
      </div>

      {expanded && (
        <div className="grid gap-3 pl-7 @md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${uid}-type`}>Kind</FieldLabel>
            <Select value={field.type} onValueChange={(v) => onType(v as FormFieldType)}>
              <SelectTrigger id={`${uid}-type`} className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.type} value={t.type}><HugeiconsIcon icon={t.icon} strokeWidth={2} /> {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${uid}-desc`}>Help text <span className="text-muted-foreground font-normal">Optional</span></FieldLabel>
            <Input id={`${uid}-desc`} value={typeof field.description === 'string' ? field.description : ''} onChange={(e) => onChange({ description: e.target.value || undefined })} placeholder="Shown under the field" />
          </Field>
          <Label htmlFor={`${uid}-req2`} className="gap-2 text-xs font-normal @md:hidden">
            <Switch id={`${uid}-req2`} size="sm" checked={!!field.required} onCheckedChange={(on) => onChange({ required: on || undefined })} /> Required
          </Label>

          {TEXTUAL.includes(field.type) && field.type !== 'date' && (
            <Field>
              <FieldLabel htmlFor={`${uid}-ph`}>Placeholder</FieldLabel>
              <Input id={`${uid}-ph`} value={field.placeholder ?? ''} onChange={(e) => onChange({ placeholder: e.target.value || undefined })} />
            </Field>
          )}
          {(field.type === 'number' || field.type === 'text') && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor={`${uid}-prefix`}>Prefix</FieldLabel>
                <Input id={`${uid}-prefix`} value={field.prefix ?? ''} onChange={(e) => onChange({ prefix: e.target.value || undefined })} placeholder="$" />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${uid}-hint`}>Unit</FieldLabel>
                <Input id={`${uid}-hint`} value={typeof field.hint === 'string' ? field.hint : ''} onChange={(e) => onChange({ hint: e.target.value || undefined })} placeholder="km, °C" />
              </Field>
            </div>
          )}
          {WITH_OPTIONS.includes(field.type) && (
            <Field className="@md:col-span-2">
              <FieldLabel htmlFor={`${uid}-options`}>Options <span className="text-muted-foreground font-normal">one per line</span></FieldLabel>
              <Textarea
                id={`${uid}-options`}
                rows={3}
                value={(field.options ?? []).map((o) => o.label).join('\n')}
                onChange={(e) => onChange({ options: e.target.value.split('\n').map((l) => ({ value: l.trim(), label: l.trim() })).filter((o) => o.value) })}
              />
            </Field>
          )}
          {field.type === 'textarea' && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor={`${uid}-max`}>Character limit</FieldLabel>
                <Input id={`${uid}-max`} inputMode="numeric" value={field.maxLength ?? ''} onChange={(e) => onChange({ maxLength: Number(e.target.value) || undefined })} placeholder="None" />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${uid}-rows`}>Rows</FieldLabel>
                <Input id={`${uid}-rows`} inputMode="numeric" value={field.rows ?? ''} onChange={(e) => onChange({ rows: Number(e.target.value) || undefined })} placeholder="3" />
              </Field>
            </div>
          )}
          {(field.type === 'check' || field.type === 'yes-no') && (
            <>
              <Label htmlFor={`${uid}-note`} className="gap-2 text-xs font-normal">
                <Switch id={`${uid}-note`} size="sm" checked={field.noteOnFail !== false} onCheckedChange={(on) => onChange({ noteOnFail: on ? undefined : false, noteRequired: on ? field.noteRequired : undefined })} />
                Ask for a note and photo on {field.type === 'check' ? 'a fail' : 'No'}
              </Label>
              {field.noteOnFail !== false && (
                <>
                  <Label htmlFor={`${uid}-notereq`} className="gap-2 text-xs font-normal">
                    <Switch id={`${uid}-notereq`} size="sm" checked={!!field.noteRequired} onCheckedChange={(on) => onChange({ noteRequired: on || undefined })} />
                    The note is required
                  </Label>
                  <Field className="@md:col-span-2">
                    <FieldLabel htmlFor={`${uid}-noteph`}>Note prompt</FieldLabel>
                    <Input id={`${uid}-noteph`} value={field.notePlaceholder ?? ''} onChange={(e) => onChange({ notePlaceholder: e.target.value || undefined })} placeholder="What is wrong, and what did you do about it?" />
                  </Field>
                </>
              )}
            </>
          )}
          {field.type === 'rating' && (
            <>
              <Field>
                <FieldLabel htmlFor={`${uid}-stars`}>Stars</FieldLabel>
                <Select value={String(field.max ?? 5)} onValueChange={(v) => onChange({ max: Number(v) === 5 ? undefined : Number(v) })}>
                  <SelectTrigger id={`${uid}-stars`} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['3', '5', '10'].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor={`${uid}-words`}>A word per star <span className="text-muted-foreground font-normal">comma-separated</span></FieldLabel>
                <Input id={`${uid}-words`} value={(field.ratingLabels ?? []).join(', ')} onChange={(e) => onChange({ ratingLabels: e.target.value ? e.target.value.split(',').map((w) => w.trim()) : undefined })} placeholder="Poor, Fair, Good, Very good, Excellent" />
              </Field>
            </>
          )}
          {field.type === 'photo' && (
            <Label htmlFor={`${uid}-multi`} className="gap-2 text-xs font-normal">
              <Switch id={`${uid}-multi`} size="sm" checked={!!field.multiple} onCheckedChange={(on) => onChange({ multiple: on || undefined })} />
              More than one photo
            </Label>
          )}
        </div>
      )}
    </div>
  )
}

// The Add field button and its menu of kinds, grouped.
export function AddFieldMenu({ onPick, children }: { onPick: (type: FormFieldType) => void; children?: ReactNode }) {
  const groups = ['Checks', 'Answers', 'More'] as const
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> Add field
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {groups.map((g, i) => (
          <div key={g}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{g}</DropdownMenuLabel>
            {FIELD_TYPES.filter((t) => t.group === g).map((t) => (
              <DropdownMenuItem key={t.type} onSelect={() => onPick(t.type)}>
                <HugeiconsIcon icon={t.icon} strokeWidth={2} />
                <span className="flex-1">{t.label}</span>
                {t.hint && <span className="text-muted-foreground text-[11px]">{t.hint}</span>}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// A list of statements, one per line, each becoming a required check.
export function PasteChecksDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (open: boolean) => void; onAdd: (text: string) => void }) {
  const [text, setText] = useState('')
  const lines = text.split('\n').filter((l) => l.trim()).length
  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o)
      if (!o) setText('')
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paste checks</DialogTitle>
          <DialogDescription>One statement per line. Each becomes a required Pass / Fail / N/A check.</DialogDescription>
        </DialogHeader>
        <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Tyres inflated, no visible damage\nAll lights and indicators work\nMirrors clean and set'} autoFocus />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!lines} onClick={() => onAdd(text)}>Add {lines ? plural(lines, 'check') : 'checks'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

