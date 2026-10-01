import { useEffect, useId, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Delete02Icon, SentIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Initials } from '@/pages/sections/StatusSection'
import { TODAY, formatDate } from './format'
import { specFor } from './modules'
import { useErp } from './store'
import type { ListSpec, Row, Value } from './types'
import { CellValue, StatusBadge } from './ui'

const title = (spec: ListSpec) => spec.singular[0].toUpperCase() + spec.singular.slice(1)

// The side panel ("peek"): a record opened beside the list, from a row, the
// command palette or the launchpad.
export function RecordPeek() {
  const { peek, closePeek, data, update, remove, session } = useErp()
  const spec = peek ? specFor(peek.entity) : undefined
  const row = peek && spec ? data[spec.entity].find((r) => r.id === peek.id) : undefined
  const [notes, setNotes] = useState<{ id: number; text: string }[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setNotes([])
    setDraft('')
  }, [peek?.id])

  const statusColumn = spec?.columns.find((c) => c.kind === 'status')
  const events = row ? data.audit.filter((e) => e.target === row.id).slice(0, 6) : []

  function addNote(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setNotes((n) => [{ id: Date.now(), text: draft.trim() }, ...n])
    setDraft('')
  }

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && closePeek()}>
      <SheetContent side="right" className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {row && spec && (
          <>
            <SheetHeader className="gap-1 border-b pr-12">
              <span className="text-muted-foreground font-mono text-[11px]">{title(spec)} · {row.id}</span>
              <SheetTitle className="text-base">{String(row[spec.primary] ?? row.id)}</SheetTitle>
              <SheetDescription className="sr-only">Details and activity for {row.id}.</SheetDescription>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {statusColumn && <StatusBadge status={String(row[statusColumn.key])} />}
                <div className="ml-auto flex flex-wrap gap-1">
                  {spec.bulk?.map((b) => (
                    <Button key={b.label} variant="outline" size="sm" onClick={() => {
                      update(spec.entity, [row.id], b.patch)
                      toast.success(`${b.label}: ${row.id}`)
                    }}>
                      {b.label}
                    </Button>
                  ))}
                  <Button variant="ghost" size="icon-sm" aria-label="Copy number" onClick={() => {
                    navigator.clipboard?.writeText(row.id).catch(() => {})
                    toast(`Copied ${row.id}`)
                  }}>
                    <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={`Delete ${row.id}`} onClick={() => {
                    remove(spec.entity, [row.id])
                    toast(`Deleted ${row.id}`)
                  }}>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <section aria-label="Details" className="border-b p-4">
              <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-xs">
                {spec.columns.filter((c) => c.key !== spec.primary && c.kind !== 'status').map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-muted-foreground">{c.label}</dt>
                    <dd className="min-w-0 truncate"><CellValue column={c} value={row[c.key]} /></dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-label="Activity" className="grid gap-3 p-4">
              <h3 className="text-xs font-medium">Activity</h3>
              <form onSubmit={addNote} className="grid gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add a note for your team"
                  aria-label="Add a note"
                  rows={2}
                  className="field-sizing-fixed min-h-0"
                />
                <Button type="submit" size="sm" variant="outline" className="justify-self-end" disabled={!draft.trim()}>
                  <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" /> Add note
                </Button>
              </form>
              <ol className="grid gap-3">
                {notes.map((n) => (
                  <li key={n.id} className="flex gap-2.5 text-xs">
                    <Initials name={session?.name ?? 'You'} className="size-5" />
                    <div className="grid gap-0.5">
                      <span><span className="font-medium">{session?.name ?? 'You'}</span> <span className="text-muted-foreground">added a note · just now</span></span>
                      <p>{n.text}</p>
                    </div>
                  </li>
                ))}
                {events.map((e) => (
                  <li key={e.id} className="flex gap-2.5 text-xs">
                    <Initials name={String(e.actor)} className="size-5" />
                    <span>
                      <span className="font-medium">{String(e.actor)}</span> <span className="text-muted-foreground">{String(e.action)} · {String(e.at)}</span>
                    </span>
                  </li>
                ))}
                <li className="text-muted-foreground flex gap-2.5 text-xs">
                  <span className="bg-muted grid size-5 shrink-0 place-items-center rounded-full text-[9px]">•</span>
                  Record created{row.created || row.issued || row.ordered || row.date ? ` · ${formatDate(String(row.created || row.issued || row.ordered || row.date), true)}` : ''}
                </li>
              </ol>
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// The next number for a new record: INV-2026-0430 → INV-2026-0431.
function nextId(rows: Row[], prefix: string) {
  const numbers = rows.filter((r) => r.id.startsWith(prefix)).map((r) => r.id.slice(prefix.length))
  const width = numbers[0]?.length ?? 4
  const valid = numbers.map(Number).filter((n) => !Number.isNaN(n))
  const highest = valid.length ? Math.max(...valid) : 1000
  return `${prefix}${String(highest + 1).padStart(width, '0')}`
}

// Quick create, for any list with a `create` spec. Opened from the list's
// New button, the command palette or the launchpad.
export function CreateDialog() {
  const { creating, endCreate, data, add, openPeek } = useErp()
  const spec = creating ? specFor(creating.entity) : undefined
  const id = useId()
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!creating) return
    setValues(Object.fromEntries(Object.entries(creating.values ?? {}).map(([k, v]) => [k, String(v)])))
    setErrors({})
  }, [creating])

  if (!spec?.create) return null
  const fields = spec.create.fields

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!spec?.create) return
    const missing = Object.fromEntries(
      fields.filter((f) => f.required && !values[f.key]?.trim()).map((f) => [f.key, `Enter ${f.label.toLowerCase()}.`]),
    )
    for (const f of fields) {
      if (f.type === 'email' && values[f.key] && !/^\S+@\S+\.\S+$/.test(values[f.key])) missing[f.key] = 'Enter a valid email address.'
      if (f.type === 'number' && values[f.key] && Number.isNaN(Number(values[f.key]))) missing[f.key] = 'Enter a number.'
    }
    setErrors(missing)
    if (Object.keys(missing).length) {
      document.getElementById(`${id}-${Object.keys(missing)[0]}`)?.focus()
      return
    }
    const rows = data[spec.entity]
    const row: Row = {
      id: spec.prefix ? nextId(rows, spec.prefix) : `${spec.entity}-${rows.length + 1}`,
      ...spec.create.defaults,
      ...Object.fromEntries(fields.map((f) => {
        const raw = values[f.key] ?? ''
        // Left blank: the spec's default, else today for a date or the first option.
        const fallback = spec.create?.defaults?.[f.key] ?? (f.type === 'date' ? TODAY : f.options?.[0] ?? '')
        const value: Value = f.type === 'number' ? Number(raw || fallback || 0) : raw || fallback
        return [f.key, value]
      })),
    }
    // An unpaid invoice owes its total.
    if (spec.entity === 'invoices') row.balance = row.amount
    add(spec.entity, row)
    endCreate()
    toast.success(`Created ${row.id}`, {
      description: String(row[spec.primary] ?? ''),
      action: { label: 'Open', onClick: () => openPeek(spec.entity, row.id) },
    })
  }

  return (
    <Dialog open={!!creating} onOpenChange={(open) => !open && endCreate()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>New {spec.singular}</DialogTitle>
            <DialogDescription>It is saved as a draft where the record has one. You can edit it afterwards.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {fields.map((f) => {
              const field = `${id}-${f.key}`
              const error = errors[f.key]
              return (
                <div key={f.key} className="grid gap-1.5">
                  <Label htmlFor={field}>
                    {f.label}{f.required && <span className="text-muted-foreground font-normal"> (required)</span>}
                  </Label>
                  {f.type === 'select' ? (
                    <Select value={values[f.key] ?? ''} onValueChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}>
                      <SelectTrigger id={field} className="w-full" aria-invalid={!!error} aria-describedby={error ? `${field}-error` : undefined}>
                        <SelectValue placeholder={`Choose ${f.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field}
                      type={f.type === 'number' ? 'text' : f.type}
                      inputMode={f.type === 'number' ? 'decimal' : undefined}
                      value={values[f.key] ?? ''}
                      onChange={(e) => {
                        setValues((s) => ({ ...s, [f.key]: e.target.value }))
                        if (error) setErrors((s) => ({ ...s, [f.key]: '' }))
                      }}
                      placeholder={f.placeholder}
                      aria-invalid={!!error}
                      aria-describedby={error ? `${field}-error` : undefined}
                    />
                  )}
                  {error && <p id={`${field}-error`} className="text-destructive text-[11px]">{error}</p>}
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={endCreate}>Cancel</Button>
            <Button type="submit">Create {spec.singular}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
