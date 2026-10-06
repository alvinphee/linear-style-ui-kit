import { useState } from 'react'
import { toast } from 'sonner'
import {
  APPOINTMENT_STATUS_ORDER, DockAppointmentBar, DockSchedule, DockScheduleLegend, DockSlotPicker,
  type Dock, type DockAppointment, type DockClosure, type DockColourBy, type DockDensity, type DockDirection,
  type DockOrientation, type DockSlotMinutes,
} from '@/blocks/dock-schedule'
import { formatTimeOfDay } from '@/lib/format'
import {
  Demos, Gallery, Playground, Variants, bool, component, element, imports, pick, str, type Values,
} from './Playground'

// The dock schedule page's demos: the day view (DockSchedule) with its
// props, the appointment bar in every status, and the slot picker used to
// book. A small made-up yard: four docks, 08:00 to 14:00.

/* ---------- Sample yard ---------- */

const DAY = '2026-10-05'
const OPEN = 8 * 60
const CLOSE = 14 * 60
const NOW = 10 * 60 + 15

const DOCKS: Dock[] = [
  { id: 'd1', name: 'Dock 1', use: 'inbound', description: 'Leveller' },
  { id: 'd2', name: 'Dock 2', use: 'both', description: 'Reefer' },
  { id: 'd3', name: 'Dock 3', use: 'outbound', description: 'Side loading' },
  { id: 'd4', name: 'Dock 4', outOfService: 'Door repair' },
]

const CLOSURES: DockClosure[] = [{ id: 'c1', dockId: 'd1', start: 12 * 60 + 30, end: 13 * 60 + 30, label: 'Cleaning' }]

const at = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

const apt = (
  id: string, dockId: string, from: string, to: string, direction: DockDirection,
  status: DockAppointment['status'], title: string, subtitle: string,
): DockAppointment => ({ id, dockId, date: DAY, start: at(from), end: at(to), direction, status, title, subtitle })

const APPOINTMENTS: DockAppointment[] = [
  apt('a1', 'd1', '08:00', '09:00', 'inbound', 'completed', 'Northpeak Freight', 'PO-8101 · 18 pallets'),
  apt('a2', 'd1', '09:30', '10:45', 'inbound', 'at-door', 'Bluefin Haulage', 'PO-8104 · 22 pallets'),
  apt('a3', 'd1', '11:00', '12:00', 'inbound', 'scheduled', 'Kestrel Express', 'PO-8107 · 12 pallets'),
  apt('a4', 'd2', '08:30', '09:30', 'outbound', 'no-show', 'Meridian Cargo', 'DO-7031 · 9 pallets'),
  apt('a5', 'd2', '10:00', '11:00', 'inbound', 'late', 'Coldchain Couriers', 'PO-8105 · 16 pallets'),
  apt('a6', 'd2', '12:00', '13:30', 'outbound', 'scheduled', 'Redgum Logistics', 'DO-7036 · 24 pallets'),
  apt('a7', 'd3', '08:00', '09:30', 'outbound', 'completed', 'Ironbark Haulage', 'DO-7029 · 20 pallets'),
  apt('a8', 'd3', '10:30', '11:30', 'outbound', 'checked-in', 'Summitway Carriers', 'DO-7033 · 14 pallets'),
  apt('a9', 'd3', '12:30', '13:30', 'outbound', 'scheduled', 'Pinecrest Trucking', 'DO-7038 · 10 pallets'),
]

const STATUS_SAMPLE: Record<DockAppointment['status'], DockAppointment> = Object.fromEntries(
  APPOINTMENT_STATUS_ORDER.map((status) => [status, { ...APPOINTMENTS[2], id: status, status }]),
) as Record<DockAppointment['status'], DockAppointment>

/* ---------- DockSchedule playground ---------- */

type ScheduleOptions = {
  orientation: DockOrientation
  slotMinutes: DockSlotMinutes
  colourBy: DockColourBy
  density: DockDensity
  showCapacity: boolean
  now: boolean
  closures: boolean
  create: boolean
  move: boolean
}

function scheduleOptions(v: Values): ScheduleOptions {
  return {
    orientation: str(v, 'orientation') as DockOrientation,
    slotMinutes: Number(str(v, 'slotMinutes')) as DockSlotMinutes,
    colourBy: str(v, 'colourBy') as DockColourBy,
    density: str(v, 'density') as DockDensity,
    showCapacity: bool(v, 'showCapacity'),
    now: bool(v, 'now'),
    closures: bool(v, 'closures'),
    create: bool(v, 'create'),
    move: bool(v, 'move'),
  }
}

function SchedulePreview(o: ScheduleOptions) {
  const [appointments, setAppointments] = useState(APPOINTMENTS)
  const [selected, setSelected] = useState<string | null>('a5')
  return (
    <div className="bg-card w-full max-w-3xl min-w-0 overflow-hidden rounded-lg border">
      <DockSchedule
        docks={DOCKS}
        appointments={appointments}
        date={DAY}
        closures={o.closures ? CLOSURES : []}
        open={OPEN}
        close={CLOSE}
        orientation={o.orientation}
        slotMinutes={o.slotMinutes}
        viewportClassName={o.orientation === 'vertical' ? 'max-h-[24rem]' : undefined}
        now={o.now ? NOW : undefined}
        colourBy={o.colourBy}
        density={o.density}
        showCapacity={o.showCapacity}
        selectedId={selected}
        onOpen={(a) => setSelected(a.id)}
        onMove={o.move
          ? (id, to) => setAppointments((all) => all.map((a) => (a.id === id ? { ...a, dockId: to.dockId, start: to.start, end: to.start + a.end - a.start } : a)))
          : undefined}
        canMove={(a) => a.status !== 'completed'}
        onCreate={o.create
          ? (slot) => toast(`Book ${DOCKS.find((d) => d.id === slot.dockId)?.name} at ${formatTimeOfDay(slot.start)}`, { description: 'Demo only.' })
          : undefined}
      />
      <div className="border-t px-3 py-2">
        <DockScheduleLegend colourBy={o.colourBy} now={o.now} closed={o.closures} />
      </div>
    </div>
  )
}

function scheduleCode(v: Values) {
  const o = scheduleOptions(v)
  const head = imports({
    react: o.move ? ['useState'] : [],
    '@/blocks/dock-schedule': pick('DockSchedule', 'DockScheduleLegend', 'type Dock', 'type DockAppointment', o.closures && 'type DockClosure'),
  })
  const data = [
    '// docks: { id, name, use?: \'inbound\' | \'outbound\' | \'both\', description?, outOfService? }[]',
    '// appointments: { id, dockId, date, start, end, direction, status, title, subtitle? }[]',
    '// Times are minutes after midnight: 600 is 10:00.',
    o.closures && '// closures: { id, dockId?, date?, start, end, label }[]',
  ].filter(Boolean).join('\n')
  const body = element('DockSchedule', [
    'docks={docks}',
    o.move ? 'appointments={appointments}' : 'appointments={initialAppointments}',
    `date="${DAY}"`,
    o.closures && 'closures={closures}',
    `open={${OPEN}}`,
    `close={${CLOSE}}`,
    o.slotMinutes !== 30 && `slotMinutes={${o.slotMinutes}}`,
    o.orientation !== 'horizontal' && 'orientation="vertical"',
    o.orientation === 'vertical' && 'viewportClassName="max-h-[32rem]"',
    o.now && 'now={minutesSinceMidnight}',
    o.colourBy !== 'status' && `colourBy="${o.colourBy}"`,
    o.density !== 'default' && `density="${o.density}"`,
    !o.showCapacity && 'showCapacity={false}',
    'onOpen={(a) => openAppointment(a.id)}',
    o.move && [
      'onMove={(id, to) =>',
      '  setAppointments((all) => all.map((a) =>',
      '    a.id === id ? { ...a, dockId: to.dockId, start: to.start, end: to.start + a.end - a.start } : a,',
      '  ))',
      '}',
    ].join('\n'),
    o.move && "canMove={(a) => a.status !== 'completed'}",
    o.create && 'onCreate={(slot) => openBooking(slot)}',
  ])
  const withLegend = `<div className="bg-card rounded-lg border">\n${body.replace(/^/gm, '  ')}\n  <DockScheduleLegend${o.colourBy !== 'status' ? ` colourBy="${o.colourBy}"` : ''} className="border-t px-3 py-2" />\n</div>`
  return [head, data, component('YardDay', o.move ? ['const [appointments, setAppointments] = useState(initialAppointments)'] : [], withLegend)].join('\n\n')
}

/* ---------- DockSlotPicker playground ---------- */

function PickerPreview({ direction, length, oneDock }: { direction: DockDirection; length: number; oneDock: boolean }) {
  const [value, setValue] = useState<number | null>(null)
  const docks = oneDock ? DOCKS.slice(1, 2) : DOCKS
  return (
    <div className="bg-card grid w-full max-w-md gap-2 rounded-lg border p-4">
      <span id="slot-picker-label" className="text-xs font-medium">Time slot</span>
      <DockSlotPicker
        docks={docks}
        appointments={APPOINTMENTS}
        closures={CLOSURES}
        date={DAY}
        direction={direction}
        length={length}
        open={OPEN}
        close={CLOSE}
        notBefore={NOW}
        value={value}
        onChange={setValue}
        aria-labelledby="slot-picker-label"
        className="sm:grid-cols-4"
      />
      <p className="text-muted-foreground text-[11px]">{value === null ? 'Nothing picked yet' : `Picked ${formatTimeOfDay(value)}`}</p>
    </div>
  )
}

function pickerCode(v: Values) {
  const length = Number(str(v, 'length'))
  return [
    imports({ react: ['useState'], '@/blocks/dock-schedule': ['DockSlotPicker'] }),
    component('BookingSlot', ['const [start, setStart] = useState<number | null>(null)'], element('DockSlotPicker', [
      bool(v, 'oneDock') ? 'docks={[chosenDock]}' : 'docks={docks}',
      'appointments={appointments}',
      'closures={closures}',
      `date="${DAY}"`,
      `direction="${str(v, 'direction')}"`,
      `length={${length}}`,
      'notBefore={minutesSinceMidnight}',
      'value={start}',
      'onChange={setStart}',
      'aria-label="Time slot"',
    ])),
  ].join('\n\n')
}

/* ---------- Page ---------- */

type BarProps = Partial<Parameters<typeof DockAppointmentBar>[0]>

const bar = (a: DockAppointment, props: BarProps = {}) => (
  <DockAppointmentBar appointment={a} className={props.density === 'compact' ? 'h-6 w-44' : 'h-9 w-48'} {...props} />
)

// A vertical bar at the sizes a column gives it: 96px an hour (30-minute
// slots), so 45 minutes is 70px tall, in a 9rem column.
const tall = (a: DockAppointment, props: BarProps = {}) => (
  <DockAppointmentBar appointment={a} orientation="vertical" className="h-[70px] w-36" {...props} />
)

export default function DockScheduleDemos() {
  return (
    <Demos>
      <Playground
        title="DockSchedule"
        description="Drag a bar to another dock or time, or Shift + arrows. Click a free slot."
        controls={[
          { kind: 'select', name: 'orientation', label: 'Orientation', options: ['horizontal', 'vertical'], initial: 'horizontal' },
          { kind: 'select', name: 'slotMinutes', label: 'Time slots (minutes)', options: ['15', '30', '60'], initial: '30' },
          { kind: 'select', name: 'colourBy', label: 'Colour by', options: ['status', 'direction'], initial: 'status' },
          { kind: 'select', name: 'density', label: 'Density', options: ['default', 'compact'], initial: 'default' },
          { kind: 'switch', name: 'showCapacity', label: 'Free docks per slot', initial: true },
          { kind: 'switch', name: 'now', label: 'Now line (today)', initial: true },
          { kind: 'switch', name: 'closures', label: 'Closures', initial: true },
          { kind: 'switch', name: 'move', label: 'Drag to move (onMove)', initial: true },
          { kind: 'switch', name: 'create', label: 'Click to book (onCreate)', initial: true },
        ]}
        previewClassName="p-3 sm:p-6"
        render={(v) => <SchedulePreview {...scheduleOptions(v)} />}
        code={scheduleCode}
      />

      <Variants
        title="DockAppointmentBar"
        rows={{ name: 'status', values: APPOINTMENT_STATUS_ORDER }}
        cols={{ name: 'colourBy', values: ['status', 'direction'] as const }}
        render={(status, colourBy) => bar(STATUS_SAMPLE[status], { colourBy })}
      />

      <Gallery
        title="DockAppointmentBar states"
        note="A double booking also sits in a second lane of its dock's row"
        items={[
          { label: 'rest', node: bar(STATUS_SAMPLE.scheduled) },
          { label: 'selected', node: bar(STATUS_SAMPLE.scheduled, { selected: true }) },
          { label: 'at door, 40% through', node: bar(STATUS_SAMPLE['at-door'], { progress: 40 }) },
          { label: 'double booked', node: bar(STATUS_SAMPLE.scheduled, { conflict: true }) },
          { label: 'compact', node: bar(STATUS_SAMPLE.scheduled, { density: 'compact' }) },
          { label: 'narrow (30 min)', node: <DockAppointmentBar appointment={STATUS_SAMPLE.scheduled} className="h-9 w-14" /> },
        ]}
      />

      <Variants
        title="DockAppointmentBar, vertical"
        note='status × colourBy · orientation="vertical", a 45-minute booking'
        rows={{ name: 'status', values: APPOINTMENT_STATUS_ORDER }}
        cols={{ name: 'colourBy', values: ['status', 'direction'] as const }}
        render={(status, colourBy) => tall(STATUS_SAMPLE[status], { colourBy })}
      />

      <Gallery
        title="DockAppointmentBar, vertical sizes and states"
        note="A shorter bar drops whole lines from the bottom: the reference, then the time"
        items={[
          { label: '15 min', node: tall(STATUS_SAMPLE.scheduled, { className: 'h-[22px] w-36' }) },
          { label: '30 min', node: tall(STATUS_SAMPLE.scheduled, { className: 'h-[46px] w-36' }) },
          { label: '1 h', node: tall(STATUS_SAMPLE.scheduled, { className: 'h-[94px] w-36' }) },
          { label: 'selected', node: tall(STATUS_SAMPLE.scheduled, { selected: true }) },
          { label: 'at door, 40% through', node: tall(STATUS_SAMPLE['at-door'], { progress: 40, className: 'h-[94px] w-36' }) },
          { label: 'compact (no reference)', node: tall(STATUS_SAMPLE.scheduled, { density: 'compact', className: 'h-[70px] w-28' }) },
          {
            label: 'double booked, side by side',
            node: (
              <div className="flex w-36 gap-1.5">
                {tall(STATUS_SAMPLE.scheduled, { conflict: true, className: 'h-[94px] w-[69px]' })}
                {tall({ ...STATUS_SAMPLE.scheduled, title: 'Bluefin Haulage' }, { conflict: true, className: 'h-[70px] w-[69px]' })}
              </div>
            ),
          },
        ]}
      />

      <Playground
        title="DockSlotPicker"
        description="Free docks per start time, for a booking that long and that way round."
        controls={[
          { kind: 'select', name: 'direction', label: 'Direction', options: ['inbound', 'outbound'], initial: 'inbound' },
          { kind: 'select', name: 'length', label: 'Length (minutes)', options: ['30', '60', '90'], initial: '60' },
          { kind: 'switch', name: 'oneDock', label: 'One dock chosen', initial: false },
        ]}
        previewClassName="p-3 sm:p-6"
        render={(v) => (
          <PickerPreview
            key={`${str(v, 'direction')}-${str(v, 'length')}-${bool(v, 'oneDock')}`}
            direction={str(v, 'direction') as DockDirection}
            length={Number(str(v, 'length'))}
            oneDock={bool(v, 'oneDock')}
          />
        )}
        code={pickerCode}
      />
    </Demos>
  )
}
