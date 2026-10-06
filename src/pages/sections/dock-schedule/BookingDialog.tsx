import { useId, useState } from 'react'
import { format } from 'date-fns'
import { FormDialog } from '@/blocks/form-dialog'
import type { FormField, FormValues } from '@/blocks/form-fields'
import {
  DockSlotPicker, bookingConflict, dockTakes, freeDocks, parseDayKey, timeRange,
  type DockDirection, type DockSlot,
} from '@/blocks/dock-schedule'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatMinutes } from '@/lib/format'
import { CARRIERS, CLOSE, CLOSURES, DOCKS, NOW, OPEN, TODAY, type LoadType, type YardAppointment } from './data'

// Books a dock appointment: the carrier and what they bring, then a time
// slot from the free ones and a dock (any free one, or a chosen one). Opened
// from "New appointment", from a free slot on the schedule (which picks that
// dock and time), or from "Rebook" on a no-show (which copies its details).

export type BookingPreset = Partial<DockSlot> & {
  carrier?: string
  reference?: string
  direction?: DockDirection
  pallets?: number
}

export type BookingDraft = Pick<YardAppointment, 'dockId' | 'date' | 'start' | 'end' | 'direction' | 'carrier' | 'reference' | 'pallets' | 'loadType'>

const LENGTHS = [30, 45, 60, 90, 120]

const FIELDS: FormField[] = [
  { key: 'carrier', label: 'Carrier', type: 'select', required: true, options: CARRIERS.map((c) => ({ value: c, label: c })) },
  {
    key: 'direction', label: 'Direction', type: 'radio', required: true, optionsClassName: 'grid-cols-2 sm:grid-cols-2',
    options: [{ value: 'inbound', label: 'Inbound' }, { value: 'outbound', label: 'Outbound' }],
  },
  {
    key: 'reference', label: 'Reference', type: 'text', required: true, placeholder: 'PO-8123',
    description: 'The purchase order coming in, or the delivery order going out.',
  },
  { key: 'length', label: 'Length', type: 'select', required: true, options: LENGTHS.map((m) => ({ value: String(m), label: formatMinutes(m) })) },
  {
    key: 'loadType', label: 'Load type', type: 'radio', required: true, optionsClassName: 'grid-cols-2 sm:grid-cols-2',
    options: [{ value: 'live', label: 'Live' }, { value: 'drop', label: 'Drop trailer' }],
  },
  {
    key: 'pallets', label: 'Pallets', type: 'number', hint: 'Optional', placeholder: '20',
    validate: (v) => (Number(v) > 0 && Number(v) <= 60 ? undefined : 'Enter 1 to 60 pallets.'),
  },
]

export function BookingDialog({ open, onOpenChange, date, preset, appointments, onBook }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // yyyy-MM-dd: the day being booked.
  date: string
  preset?: BookingPreset
  appointments: YardAppointment[]
  onBook: (draft: BookingDraft) => void
}) {
  const id = useId()
  const [slot, setSlot] = useState<number | null>(preset?.start ?? null)
  const [dockChoice, setDockChoice] = useState(preset?.dockId ?? 'auto')
  const [missingSlot, setMissingSlot] = useState(false)
  const presetDock = DOCKS.find((d) => d.id === preset?.dockId)
  const direction: DockDirection = preset?.direction ?? (presetDock?.use === 'outbound' ? 'outbound' : 'inbound')
  const check = { date, appointments, closures: CLOSURES, open: OPEN, close: CLOSE }
  // A clicked slot gets an hour if its dock is free that long, half an hour if not.
  const fitsHour = !presetDock || preset?.start === undefined
    || !bookingConflict({ ...check, dock: presetDock, start: preset.start, end: preset.start + 60, direction })

  // The docks this booking could go to, and the slot only while one of them is free then.
  function placing(values: FormValues) {
    const way = (values.direction || 'inbound') as DockDirection
    const length = Number(values.length) || 60
    const taking = DOCKS.filter((d) => !d.outOfService && dockTakes(d, way))
    const chosen = taking.find((d) => d.id === dockChoice)
    const docks = chosen ? [chosen] : taking
    const free = slot === null ? [] : freeDocks(docks, { ...check, start: slot, end: slot + length, direction: way })
    return { way, length, taking, chosen, docks, free, start: free.length ? slot : null }
  }

  function submit(values: FormValues) {
    const p = placing(values)
    if (p.start === null) {
      setMissingSlot(true)
      return false
    }
    onBook({
      dockId: p.free[0].id,
      date,
      start: p.start,
      end: p.start + p.length,
      direction: p.way,
      carrier: String(values.carrier),
      reference: String(values.reference).toUpperCase(),
      pallets: Number(values.pallets) || 20,
      loadType: values.loadType as LoadType,
    })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New dock appointment"
      description={`${format(parseDayKey(date), 'EEEE d MMMM')}. Pick a slot with a free dock.`}
      fields={FIELDS}
      initialValues={{
        carrier: preset?.carrier ?? '',
        reference: preset?.reference ?? '',
        direction,
        length: fitsHour ? '60' : '30',
        loadType: 'live',
        pallets: preset?.pallets ? String(preset.pallets) : '',
      }}
      onSubmit={submit}
      submitLabel="Book appointment"
      className="sm:max-w-lg"
    >
      {(values) => {
        const p = placing(values)
        return (
          <>
            <Field data-invalid={missingSlot && p.start === null}>
              <FieldLabel id={`${id}-slot`}>Time slot</FieldLabel>
              <DockSlotPicker
                docks={p.docks}
                appointments={appointments}
                closures={CLOSURES}
                date={date}
                direction={p.way}
                length={p.length}
                open={OPEN}
                close={CLOSE}
                notBefore={date === TODAY ? NOW : undefined}
                value={p.start}
                onChange={(start) => {
                  setSlot(start)
                  setMissingSlot(false)
                }}
                aria-labelledby={`${id}-slot`}
                className="sm:grid-cols-6"
              />
              {missingSlot && p.start === null && <FieldError>Choose a time slot.</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-dock`}>Dock</FieldLabel>
              <Select value={p.chosen ? p.chosen.id : 'auto'} onValueChange={setDockChoice}>
                <SelectTrigger id={`${id}-dock`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Any free dock</SelectItem>
                  {p.taking.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                      {d.description && <span className="text-muted-foreground">{d.description}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {p.start !== null
                  ? `Books ${p.free[0].name}, ${timeRange({ start: p.start, end: p.start + p.length })}.`
                  : p.chosen ? `Only ${p.chosen.name}'s free slots are shown.` : 'The first free dock that takes this direction.'}
              </FieldDescription>
            </Field>
          </>
        )
      }}
    </FormDialog>
  )
}
