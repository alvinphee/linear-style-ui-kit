import { useId, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, LeftToRightListBulletIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  AddFieldMenu, FIELD_TYPES, FieldRow, FormBuilder, PasteChecksDialog, blankForm, newField, toStoredForm, type FieldTypeOption,
} from '@/blocks/form-builder'
import { FormControl, emptyValue, fieldError, type FormField, type FormValue } from '@/blocks/form-fields'
import { fieldsOf, type FormDefinition } from '@/blocks/form-renderer'
import { Panel } from '@/components/panel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { plural } from '@/lib/text'
import { CodeBlock } from '../playground/Playground'
import { Section } from './shared'
import { FORMS, FORM_ICONS } from './forms-catalogue/forms'

// The form builder on its own: start blank or from one of the sample forms,
// build, and see the definition it would save as plain JSON. Under it, the
// parts it is made of (the kinds menu, a field row, the paste dialog) and
// every field kind rendered live by the shared schema.

// A head start, so the builder has something to show.
function starter(): FormDefinition {
  const form = blankForm()
  return {
    ...form,
    name: 'Meeting room check',
    category: 'Facilities',
    icon: FORM_ICONS[11].icon,
    estimatedMinutes: 2,
    context: { label: 'Room', placeholder: 'Such as 3.02' },
    sections: [{ ...form.sections[0], title: 'Before the meeting', fields: [newField('check', 'Projector works'), newField('check', 'Whiteboard clean, markers present')] }],
  }
}

function BuilderPanel() {
  const [source, setSource] = useState('starter')
  const [saved, setSaved] = useState<FormDefinition | null>(null)
  const initial = useMemo(() => (source === 'starter' ? starter() : source === 'blank' ? blankForm() : FORMS.find((f) => f.id === source) ?? blankForm()), [source])
  const shown = saved ?? initial
  const json = useMemo(() => JSON.stringify(toStoredForm(shown, FORM_ICONS), (key, value) => (key === 'validate' ? undefined : value), 2), [shown])

  return (
    <>
      <Panel
        title="Form builder"
        note="FormBuilder: details, sections, fields, a live preview"
        action={
          <Label className="text-muted-foreground gap-2 text-[11px] font-normal">
            Start from
            <Select value={source} onValueChange={(v) => {
              setSource(v)
              setSaved(null)
            }}>
              <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="starter">A head start</SelectItem>
                <SelectItem value="blank">Blank</SelectItem>
                {FORMS.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Label>
        }
        className="lg:col-span-2"
      >
        <FormBuilder
          key={source}
          initial={initial}
          icons={FORM_ICONS}
          categories={[...new Set(FORMS.map((f) => f.category).filter((c): c is string => !!c))]}
          onSave={(form) => {
            setSaved(form)
            toast.success(`Saved ${form.name}`, { description: `${plural(fieldsOf(form).length, 'field')}. The definition is below; on the Forms catalogue page it would join the catalogue.` })
          }}
          saveLabel="Save"
        />
      </Panel>

      <Panel
        title="What it saves"
        note={saved ? `saved · ${plural(fieldsOf(saved).length, 'field')}` : 'the definition as plain JSON, icon by id'}
        bodyClassName="p-0"
        className="lg:col-span-2"
      >
        <CodeBlock code={json} className="max-h-96 overflow-auto rounded-none border-0" />
      </Panel>
    </>
  )
}

// The builder's parts, each on its own.
function PartsPanel() {
  const [picked, setPicked] = useState<FieldTypeOption | null>(null)
  const [field, setField] = useState<FormField>(() => ({ ...newField('check', 'Horn works'), description: 'Press twice with the engine on' }))
  const [expanded, setExpanded] = useState(true)
  const [pasting, setPasting] = useState(false)
  const [pasted, setPasted] = useState<string[]>([])

  return (
    <Panel title="The builder's parts" note="AddFieldMenu, FieldRow, PasteChecksDialog" className="lg:col-span-2">
      <div className="grid gap-6 @3xl:grid-cols-2">
        <div className="grid content-start gap-3">
          <p className="text-muted-foreground text-xs">The kinds menu, as a button of your own.</p>
          <div className="flex flex-wrap items-center gap-3">
            <AddFieldMenu onPick={(type) => setPicked(FIELD_TYPES.find((t) => t.type === type) ?? null)}>
              <Button>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> Add a field
              </Button>
            </AddFieldMenu>
            <span className="text-muted-foreground text-xs">{picked ? <>Picked <span className="text-foreground">{picked.label}</span></> : 'Nothing picked yet'}</span>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">A list of statements, one check each.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setPasting(true)}>
              <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} data-icon="inline-start" /> Paste checks
            </Button>
            <span className="text-muted-foreground text-xs">{pasted.length ? `${plural(pasted.length, 'check')} added: ${pasted.join(', ')}` : 'None added yet'}</span>
          </div>
          <PasteChecksDialog
            open={pasting}
            onOpenChange={setPasting}
            onAdd={(text) => {
              setPasted(text.split('\n').map((l) => l.trim()).filter(Boolean))
              setPasting(false)
            }}
          />
        </div>
        <div className="grid content-start gap-2">
          <p className="text-muted-foreground text-xs">One field's row, with its settings open. Change its kind and the settings follow.</p>
          <div className="bg-card @container rounded-lg border">
            <FieldRow
              field={field}
              index={0}
              count={1}
              expanded={expanded}
              onToggle={() => setExpanded((e) => !e)}
              onChange={(patch) => setField((f) => ({ ...f, ...patch }))}
              onType={(type) => setField((f) => ({ ...newField(type, f.label), description: f.description, required: f.required }))}
              onMove={() => undefined}
              onDuplicate={() => toast('Duplicate', { description: 'In the builder this adds a copy under the field.' })}
              onRemove={() => toast('Delete', { description: 'In the builder this removes the field.' })}
            />
          </div>
        </div>
      </div>
    </Panel>
  )
}

// Every kind of field the schema knows, rendered by the one FormControl.
function FieldKindDemo({ option }: { option: FieldTypeOption }) {
  const uid = useId()
  const field = useMemo((): FormField => {
    const base = newField(option.type, SAMPLE_LABEL[option.type] ?? option.label)
    if (option.type === 'number') return { ...base, prefix: '$', placeholder: '0.00' }
    if (option.type === 'rating') return { ...base, ratingLabels: ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'] }
    if (option.type === 'textarea') return { ...base, maxLength: 120, rows: 2 }
    if (option.type === 'select' || option.type === 'radio') return { ...base, options: ['Meeting', 'Delivery', 'Interview'].map((v) => ({ value: v, label: v })) }
    return base
  }, [option])
  const [value, setValue] = useState<FormValue>(() => emptyValue(field))
  const [touched, setTouched] = useState(false)
  const error = touched ? fieldError({ ...field, required: true }, value, {}) : undefined
  return (
    <div className="bg-card grid min-w-0 content-start gap-3 rounded-lg border p-3.5">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
        <HugeiconsIcon icon={option.icon} strokeWidth={2} className="size-3.5" />
        <span className="font-medium">{option.label}</span>
        <code className="ml-auto font-mono">{option.type}</code>
      </div>
      <FormControl
        field={field}
        id={`${uid}-${field.key}`}
        value={value}
        error={error}
        inputRef={() => undefined}
        onChange={(v) => {
          setValue(v)
          setTouched(true)
        }}
        onBlur={() => setTouched(true)}
      />
    </div>
  )
}

const SAMPLE_LABEL: Partial<Record<FormField['type'], string>> = {
  check: 'Tyres inflated, no visible damage', 'yes-no': 'Is the load secured?', text: 'Driver', textarea: 'Notes', number: 'Amount', date: 'Date',
  email: 'Email for a reply', select: 'Purpose of visit', radio: 'Purpose of visit', checkbox: 'I agree to the site rules', rating: 'Overall',
  photo: 'Photo of the receipt', signature: 'Signature',
}

export default function FormBuilderSection() {
  return (
    <Section id="form-builder" title="Form builder" description="Make or edit a form as data: details, sections and a field of any kind, with a live preview and the JSON it saves">
      <BuilderPanel />
      <PartsPanel />
      <Panel title="Every field kind" note="FormControl renders each from the shared schema; answers and errors are live" className="lg:col-span-2">
        <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {FIELD_TYPES.map((t) => <FieldKindDemo key={t.type} option={t} />)}
        </div>
      </Panel>
    </Section>
  )
}
