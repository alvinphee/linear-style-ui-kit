import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Mail01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { FormDialog, type FormField, type FormValues } from '@/blocks/form-dialog'
import { RecordSheet, RecordSheetContent, type RecordActivity } from '@/blocks/record-sheet'
import { Button } from '@/components/ui/button'
import { TODAY, formatDate } from './format'
import { specFor } from './modules'
import { useErp } from './store'
import type { Field, ListSpec, Row, Value } from './types'
import { CellValue, StatusBadge } from './ui'

const title = (spec: ListSpec) => spec.singular[0].toUpperCase() + spec.singular.slice(1)

// "2026-10-01 14:05" → "1 Oct, 14:05".
function when(at: Value) {
  const [date, time] = String(at).split(' ')
  return time ? `${formatDate(date)}, ${time}` : formatDate(date)
}

// The side panel ("peek"): a record opened beside the list, from a row, the
// command palette or the launchpad. Previous / next step through all of
// that list's records in stored order, not the list's current filter or sort.
export function RecordPeek() {
  const { peek, closePeek, openPeek, data, update, remove, session } = useErp()
  const spec = peek ? specFor(peek.entity) : undefined
  const row = peek && spec ? data[spec.entity].find((r) => r.id === peek.id) : undefined
  // Notes stay with their record for this visit, so stepping away and back keeps them.
  const [notes, setNotes] = useState<Record<string, { id: number; text: string }[]>>({})

  return (
    <RecordSheet open={!!row} onOpenChange={(open) => !open && closePeek()}>
      {row && spec && (
        <RecordSheetContent
          key={row.id}
          {...peekProps(spec, row)}
          actions={spec.bulk?.length ? spec.bulk.map((b) => {
            const applied = Object.entries(b.patch).every(([k, v]) => row[k] === v)
            return (
              <Button
                key={b.label}
                variant="outline"
                size="sm"
                disabled={applied}
                onClick={() => {
                  update(spec.entity, [row.id], b.patch)
                  toast.success(`${b.label}: ${row.id}`)
                }}
              >
                {b.label}
              </Button>
            )
          }) : undefined}
          navigation={navigation(data[spec.entity], row.id, (id) => openPeek(spec.entity, id))}
          activity={[
            ...(notes[row.id] ?? []).map((n): RecordActivity => ({
              id: `note-${n.id}`, actor: session?.name ?? 'You', text: `added a note: “${n.text}”`, at: 'just now',
            })),
            ...data.audit.filter((e) => e.target === row.id).slice(0, 6).map((e): RecordActivity => ({
              // The audit trail names the record; here it is the record.
              id: e.id, actor: String(e.actor), text: String(e.action).replace(/ (on|of)$/, ''), at: when(e.at),
            })),
            { id: 'created', text: 'Record created', at: createdOn(row) },
          ]}
          onComment={(text) => setNotes((all) => ({ ...all, [row.id]: [{ id: Date.now(), text }, ...(all[row.id] ?? [])] }))}
          commentLabel="Add note"
          commentPlaceholder="Add a note for your team"
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(row.id).catch(() => {})
                toast(`Copied ${row.id}`)
              }}
            >
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
              Copy number
            </Button>
          }
          onDelete={() => {
            remove(spec.entity, [row.id])
            toast(`Deleted ${row.id}`)
          }}
          deleteTitle={`Delete ${row.id}?`}
          deleteDescription={`It is removed from ${spec.plural.toLowerCase()} for everyone in this company.`}
        />
      )}
    </RecordSheet>
  )
}

function peekProps(spec: ListSpec, row: Row) {
  const status = spec.columns.find((c) => c.kind === 'status')
  return {
    number: row.id,
    badge: status && row[status.key] ? <StatusBadge status={String(row[status.key])} /> : undefined,
    title: String(row[spec.primary] ?? row.id),
    description: `${title(spec)} ${row.id}: details and activity.`,
    noun: spec.singular,
    // Names the record's type here rather than beside the number, which must never be cut off.
    detailsTitle: `${title(spec)} details`,
    // The number and status are in the header already.
    details: spec.columns
      .filter((c) => c.key !== spec.primary && c.key !== 'id' && c.kind !== 'status')
      .map((c) => ({ label: c.label, value: <CellValue column={c} value={row[c.key]} /> })),
  }
}

function navigation(rows: Row[], id: string, open: (id: string) => void) {
  const index = rows.findIndex((r) => r.id === id)
  const prev = index > 0 ? rows[index - 1].id : undefined
  const next = index >= 0 && index < rows.length - 1 ? rows[index + 1].id : undefined
  return {
    index,
    total: rows.length,
    onPrevious: prev ? () => open(prev) : undefined,
    onNext: next ? () => open(next) : undefined,
  }
}

function createdOn(row: Row) {
  const date = row.created || row.issued || row.ordered || row.date
  return date ? formatDate(String(date), true) : undefined
}

// The next number for a new record: INV-2026-0430 → INV-2026-0431.
function nextId(rows: Row[], prefix: string) {
  const numbers = rows.filter((r) => r.id.startsWith(prefix)).map((r) => r.id.slice(prefix.length))
  const width = numbers[0]?.length ?? 4
  const valid = numbers.map(Number).filter((n) => !Number.isNaN(n))
  const highest = valid.length ? Math.max(...valid) : 1000
  return `${prefix}${String(highest + 1).padStart(width, '0')}`
}

// A blank optional field falls back to the spec's default, else today for a
// date or the first option. The form starts with that filled in, so what you
// see is what gets saved.
function fallback(spec: ListSpec, f: Field): Value {
  return spec.create?.defaults?.[f.key] ?? (f.type === 'date' ? TODAY : f.options?.[0] ?? '')
}

function toFormField(f: Field): FormField {
  return {
    key: f.key,
    label: f.label,
    type: f.type,
    required: f.required,
    placeholder: f.placeholder,
    options: f.options?.map((o) => ({ value: o, label: o })),
    icon: f.type === 'email' ? Mail01Icon : undefined,
    hint: !f.required && f.type !== 'select' && f.type !== 'date' ? 'Optional' : undefined,
  }
}

// Quick create, for any list with a `create` spec. Opened from the list's
// New button, the command palette or the launchpad.
export function CreateDialog() {
  const { creating, endCreate, data, add, openPeek } = useErp()
  // The last request stays on screen while the dialog fades out.
  const [shown, setShown] = useState(creating)
  if (creating && creating !== shown) setShown(creating)
  const spec = shown ? specFor(shown.entity) : undefined
  if (!shown || !spec?.create) return null
  const { fields } = spec.create

  const initialValues: FormValues = Object.fromEntries(fields.map((f) => {
    const given = shown.values?.[f.key]
    if (given !== undefined) return [f.key, String(given)]
    return [f.key, f.required ? '' : String(fallback(spec, f))]
  }))

  function submit(values: FormValues) {
    if (!spec?.create) return
    const rows = data[spec.entity]
    const row: Row = {
      id: spec.prefix ? nextId(rows, spec.prefix) : `${spec.entity}-${rows.length + 1}`,
      ...spec.create.defaults,
      ...Object.fromEntries(fields.map((f) => {
        const raw = String(values[f.key] ?? '')
        const value: Value = f.type === 'number' ? Number(raw || fallback(spec, f) || 0) : raw || fallback(spec, f)
        return [f.key, value]
      })),
    }
    // An unpaid invoice owes its total.
    if (spec.entity === 'invoices') row.balance = row.amount
    add(spec.entity, row)
    toast.success(`Created ${row.id}`, {
      description: String(row[spec.primary] ?? ''),
      action: {
        label: 'Open',
        onClick: () => {
          endCreate()
          openPeek(spec.entity, row.id)
        },
      },
    })
  }

  return (
    <FormDialog
      key={shown.entity}
      open={!!creating}
      onOpenChange={(open) => !open && endCreate()}
      title={`New ${spec.singular}`}
      description="It is saved as a draft where the record has one. You can edit it afterwards."
      fields={fields.map(toFormField)}
      initialValues={initialValues}
      submitLabel={`Create ${spec.singular}`}
      createMore
      onSubmit={submit}
    />
  )
}
