import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon, DeliveryDelay01Icon, GridTableIcon,
  LayoutThreeColumnIcon, LayoutThreeRowIcon, ShippingTruck01Icon, TimelineIcon, WarehouseIcon,
} from '@hugeicons/core-free-icons'
import { addDays, addWeeks, format, startOfWeek } from 'date-fns'
import { toast } from 'sonner'
import { DisplayMenu, type DisplayLayout } from '@/blocks/display-menu'
import {
  DockSchedule, DockScheduleLegend, DockWeek, DockWeekLegend, dayKey, dockUtilisation, holdsDock, parseDayKey,
  timeRange, type DockAppointmentStatus, type DockColourBy, type DockDensity, type DockOrientation, type DockSlot,
  type DockSlotMinutes,
} from '@/blocks/dock-schedule'
import { KpiCard, KpiGrid } from '@/blocks/kpi-card'
import type { RecordActivity } from '@/blocks/record-sheet'
import { ViewSwitch, type ViewOption } from '@/components/view-switch'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { formatDateRange } from '@/lib/format'
import { plural } from '@/lib/text'
import { Section } from './shared'
import { AppointmentPanel } from './dock-schedule/AppointmentPanel'
import { BookingDialog, type BookingDraft, type BookingPreset } from './dock-schedule/BookingDialog'
import { APPOINTMENTS, CLOSE, CLOSURES, DAYS, DOCKS, NOW, OPEN, TODAY, type YardAppointment } from './dock-schedule/data'
import { ExceptionsPanel, YardQueuePanel } from './dock-schedule/YardPanels'

// A yard's dock schedule: today's numbers, every dock door by time slot (or
// the week as a heatmap), the yard queue and the day's exceptions. Bookings
// open in the side panel, drag to reschedule, and are made from free slots.

type View = 'day' | 'week'

const VIEWS: ViewOption<View>[] = [
  { value: 'day', label: 'Day', icon: TimelineIcon },
  { value: 'week', label: 'Week', icon: GridTableIcon },
]

// The day view's two layouts, as tiles in the Display menu.
const LAYOUTS: DisplayLayout[] = [
  { id: 'horizontal', label: 'Docks as rows', icon: LayoutThreeRowIcon },
  { id: 'vertical', label: 'Docks as columns', icon: LayoutThreeColumnIcon },
]

type Display = {
  orientation: DockOrientation
  colourBy: DockColourBy
  slotMinutes: DockSlotMinutes
  density: DockDensity
  showCapacity: boolean
}
const DEFAULT_DISPLAY: Display = { orientation: 'horizontal', colourBy: 'status', slotMinutes: 30, density: 'default', showCapacity: true }

const STATUS_NOTE: Partial<Record<DockAppointmentStatus, (dock: string) => string>> = {
  'checked-in': () => 'checked the trailer in at the gate',
  'at-door': (dock) => `moved it to ${dock}`,
  completed: () => 'completed it; the trailer has left',
  'no-show': () => 'marked it as a no-show',
}

const STATUS_TOAST: Partial<Record<DockAppointmentStatus, string>> = {
  'checked-in': 'Checked in',
  'at-door': 'At the door',
  completed: 'Completed',
  'no-show': 'Marked as a no-show',
}

const dockName = (id: string) => DOCKS.find((d) => d.id === id)?.name ?? id
const weekOf = (key: string) => {
  const monday = startOfWeek(parseDayKey(key), { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => dayKey(addDays(monday, i)))
}

export default function DockScheduleSection() {
  const [appointments, setAppointments] = useState<YardAppointment[]>(APPOINTMENTS)
  const [date, setDate] = useState(TODAY)
  const [view, setView] = useState<View>('day')
  const [display, setDisplay] = useState(DEFAULT_DISPLAY)
  const [openId, setOpenId] = useState<string | null>(null)
  const [logs, setLogs] = useState<Record<string, RecordActivity[]>>({})
  const [booking, setBooking] = useState<{ open: boolean; key: number; preset?: BookingPreset }>({ open: false, key: 0 })
  const nextNumber = useRef(1001 + APPOINTMENTS.length)
  const nextLog = useRef(0)

  const week = weekOf(date)
  const onDay = appointments.filter((a) => a.date === date)
  const booked = onDay.filter(holdsDock)
  const inbound = booked.filter((a) => a.direction === 'inbound').length
  const isToday = date === TODAY
  const inYard = onDay.filter((a) => a.status === 'checked-in' || a.status === 'at-door')
  const exceptions = onDay.filter((a) => a.status === 'late' || a.status === 'no-show')
  const usage = DOCKS.filter((d) => !d.outOfService).map((dock) => ({ dock, value: dockUtilisation(dock, date, appointments, CLOSURES, OPEN, CLOSE) }))
  const average = Math.round(usage.reduce((sum, u) => sum + u.value, 0) / Math.max(1, usage.length))
  const busiest = usage.reduce((top, u) => (u.value > top.value ? u : top), usage[0])
  const order = [...onDay]
    .sort((a, b) => a.start - b.start || a.dockId.localeCompare(b.dockId))
    .map((a) => a.id)
  const open = appointments.find((a) => a.id === openId)

  const first = view === 'day' ? date : week[0]
  const last = view === 'day' ? date : week[6]
  const canPrev = first > DAYS[0]
  const canNext = last < DAYS[DAYS.length - 1]

  function step(dir: 1 | -1) {
    const d = parseDayKey(date)
    setDate(dayKey(view === 'day' ? addDays(d, dir) : addWeeks(d, dir)))
  }

  function log(id: string, text: string) {
    const entry = { id: `log-${nextLog.current++}`, actor: 'Yard office', text, at: 'Just now' }
    setLogs((all) => ({ ...all, [id]: [entry, ...(all[id] ?? [])] }))
  }

  function patch(id: string, changes: Partial<YardAppointment>) {
    setAppointments((all) => all.map((a) => (a.id === id ? { ...a, ...changes } : a)))
  }

  function setStatus(id: string, status: DockAppointmentStatus) {
    const a = appointments.find((x) => x.id === id)
    if (!a) return
    patch(id, { status, ...(status === 'checked-in' && { arrivedAt: NOW }) })
    log(id, STATUS_NOTE[status]?.(dockName(a.dockId)) ?? `set it to ${status}`)
    toast(`${STATUS_TOAST[status] ?? 'Updated'}: ${a.number}`, { description: `${a.carrier} · ${dockName(a.dockId)}` })
  }

  function move(id: string, to: DockSlot) {
    const a = appointments.find((x) => x.id === id)
    if (!a) return
    const before = { dockId: a.dockId, start: a.start, end: a.end }
    const after = { dockId: to.dockId, start: to.start, end: to.start + (a.end - a.start) }
    patch(id, after)
    log(id, `rescheduled it to ${timeRange(after)} at ${dockName(to.dockId)}`)
    toast(`Rescheduled ${a.number}`, {
      description: `${a.carrier} · ${dockName(to.dockId)}, ${timeRange(after)}`,
      action: { label: 'Undo', onClick: () => patch(id, before) },
    })
  }

  // A trailer from the yard queue docks now, so its bar starts now too.
  function toDoor(id: string, to: DockSlot) {
    const a = appointments.find((x) => x.id === id)
    if (!a) return
    patch(id, { status: 'at-door', dockId: to.dockId, start: to.start, end: to.start + (a.end - a.start) })
    log(id, `moved it to ${dockName(to.dockId)}${to.dockId === a.dockId ? '' : `, not the booked ${dockName(a.dockId)}`}`)
    toast(`At the door: ${a.number}`, { description: `${a.carrier} · ${dockName(to.dockId)}` })
  }

  function remove(id: string) {
    const a = appointments.find((x) => x.id === id)
    if (!a) return
    setAppointments((all) => all.filter((x) => x.id !== id))
    toast(`Cancelled ${a.number}`, {
      description: `${a.carrier} · ${timeRange(a)} is free again.`,
      action: { label: 'Undo', onClick: () => setAppointments((all) => [...all, a]) },
    })
  }

  function startBooking(preset?: BookingPreset) {
    setBooking((b) => ({ open: true, key: b.key + 1, preset }))
  }

  function book(draft: BookingDraft) {
    const n = nextNumber.current++
    const a: YardAppointment = {
      ...draft,
      id: `apt-${n}`,
      number: `APT-${n}`,
      status: 'scheduled',
      title: draft.carrier,
      subtitle: `${draft.reference} · ${draft.pallets} pallets`,
      trailer: 'Not yet known',
      driver: 'Not yet known',
    }
    setAppointments((all) => [...all, a])
    log(a.id, 'booked it')
    toast.success(`Booked ${a.number}`, {
      description: `${a.carrier} · ${dockName(a.dockId)}, ${timeRange(a)}`,
      action: { label: 'Open', onClick: () => setOpenId(a.id) },
    })
  }

  const unit = view === 'day' ? 'day' : 'week'
  const weekCount = appointments.filter((a) => week.includes(a.date) && holdsDock(a)).length
  const changed = (Object.keys(DEFAULT_DISPLAY) as (keyof Display)[]).some((k) => display[k] !== DEFAULT_DISPLAY[k])

  return (
    <Section
      id="dock-schedule"
      title="Dock schedule"
      description="Dock appointments for a yard: every dock door by time slot, the week as a heatmap, and booking from free slots"
    >
      <KpiGrid className="lg:col-span-2">
        <KpiCard
          label="Appointments"
          icon={Calendar03Icon}
          hint={isToday ? 'today' : format(parseDayKey(date), 'EEE d MMM')}
          value={booked.length}
          footnote={`${inbound} inbound · ${booked.length - inbound} outbound`}
        />
        <KpiCard
          label="In the yard"
          icon={ShippingTruck01Icon}
          hint="now"
          value={isToday ? inYard.length : '–'}
          footnote={isToday
            ? `${inYard.filter((a) => a.status === 'at-door').length} at a door · ${inYard.filter((a) => a.status === 'checked-in').length} waiting`
            : 'Shown for today only'}
        />
        <KpiCard
          label="Late or no-show"
          icon={DeliveryDelay01Icon}
          value={exceptions.length}
          footnote={exceptions.length
            ? `${exceptions.filter((a) => a.status === 'late').length} late · ${exceptions.filter((a) => a.status === 'no-show').length} no-show`
            : 'All on time'}
          footnoteTone={exceptions.length ? 'negative' : 'positive'}
        />
        <KpiCard
          label="Dock utilisation"
          icon={WarehouseIcon}
          value={`${average}%`}
          footnote={busiest ? `Busiest: ${busiest.dock.name} · ${busiest.value}%` : undefined}
        />
      </KpiGrid>

      <article aria-label="Dock schedule" className="bg-card min-w-0 overflow-hidden rounded-lg border lg:col-span-2">
        <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <div className="mr-auto flex min-w-0 flex-wrap items-baseline gap-x-2" aria-live="polite">
            <h3 className="text-sm font-semibold tracking-tight">
              {view === 'day' ? format(parseDayKey(date), 'EEEE d MMMM') : formatDateRange(parseDayKey(week[0]), parseDayKey(week[6]))}
            </h3>
            {/* The KPIs above say it too, so it gives way first when the toolbar is tight. */}
            <span className="text-muted-foreground hidden text-xs tabular-nums xl:inline">
              {view === 'day'
                ? `${isToday ? 'Today · ' : ''}${plural(booked.length, 'appointment')}`
                : plural(weekCount, 'appointment')}
            </span>
          </div>
          <ButtonGroup>
            <Button variant="outline" size="icon-sm" aria-label={`Previous ${unit}`} disabled={!canPrev} onClick={() => step(-1)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDate(TODAY)}>Today</Button>
            <Button variant="outline" size="icon-sm" aria-label={`Next ${unit}`} disabled={!canNext} onClick={() => step(1)}>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </ButtonGroup>
          <ViewSwitch views={VIEWS} value={view} onChange={setView} showLabels />
          <DisplayMenu
            layout={{
              value: display.orientation,
              options: LAYOUTS,
              onChange: (v) => setDisplay((d) => ({ ...d, orientation: v as DockOrientation })),
            }}
            selects={[
              {
                id: 'colour', label: 'Colour by', value: display.colourBy,
                options: [{ id: 'status', label: 'Status' }, { id: 'direction', label: 'Direction' }],
                onChange: (v) => setDisplay((d) => ({ ...d, colourBy: v as DockColourBy })),
              },
              {
                id: 'slot', label: 'Time slots', value: String(display.slotMinutes),
                options: [{ id: '15', label: '15 minutes' }, { id: '30', label: '30 minutes' }, { id: '60', label: '1 hour' }],
                onChange: (v) => setDisplay((d) => ({ ...d, slotMinutes: Number(v) as DockSlotMinutes })),
              },
              {
                id: 'density', label: 'Density', value: display.density,
                options: [{ id: 'default', label: 'Comfortable' }, { id: 'compact', label: 'Compact' }],
                onChange: (v) => setDisplay((d) => ({ ...d, density: v as DockDensity })),
              },
            ]}
            switches={[
              {
                id: 'capacity', label: 'Free docks per slot', checked: display.showCapacity,
                onChange: (on) => setDisplay((d) => ({ ...d, showCapacity: on })),
              },
            ]}
            changed={changed}
            onReset={() => setDisplay(DEFAULT_DISPLAY)}
          />
          <Button size="sm" disabled={date < TODAY} onClick={() => startBooking()}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            New appointment
          </Button>
        </header>

        {view === 'day' ? (
          <DockSchedule
            docks={DOCKS}
            appointments={appointments}
            date={date}
            closures={CLOSURES}
            open={OPEN}
            close={CLOSE}
            slotMinutes={display.slotMinutes}
            now={isToday ? NOW : undefined}
            colourBy={display.colourBy}
            orientation={display.orientation}
            density={display.density}
            showCapacity={display.showCapacity}
            selectedId={openId}
            onOpen={(a) => setOpenId(a.id)}
            onMove={date >= TODAY ? move : undefined}
            canMove={(a) => a.status !== 'completed' && a.status !== 'no-show' && a.status !== 'at-door'}
            onCreate={date >= TODAY ? (slot) => startBooking(slot) : undefined}
          />
        ) : (
          <DockWeek
            docks={DOCKS}
            appointments={appointments}
            days={week}
            closures={CLOSURES}
            open={OPEN}
            close={CLOSE}
            today={TODAY}
            selected={date}
            onOpenDay={(day) => {
              setDate(day)
              setView('day')
            }}
          />
        )}

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-3 py-2">
          {view === 'day' ? <DockScheduleLegend colourBy={display.colourBy} now={isToday} /> : <DockWeekLegend />}
          <span className="text-muted-foreground ml-auto hidden text-[11px] md:inline">
            {view === 'week'
              ? 'Click a day to open it'
              : date < TODAY ? 'A past day: read only' : 'Drag a bar to reschedule · click a free slot to book'}
          </span>
        </footer>
      </article>

      <YardQueuePanel appointments={appointments} onOpen={setOpenId} onToDoor={toDoor} />
      <ExceptionsPanel
        appointments={appointments}
        onOpen={setOpenId}
        onStatus={setStatus}
        onRebook={(a) => {
          setDate(TODAY)
          startBooking({ carrier: a.carrier, reference: a.reference, direction: a.direction, pallets: a.pallets })
        }}
      />

      <AppointmentPanel
        appointment={open}
        appointments={appointments}
        order={order}
        log={open ? logs[open.id] ?? [] : []}
        onNavigate={setOpenId}
        onClose={() => setOpenId(null)}
        onStatus={setStatus}
        onMove={move}
        onComment={(id, text) => log(id, `commented: “${text}”`)}
        onDelete={remove}
      />

      <BookingDialog
        key={booking.key}
        open={booking.open}
        onOpenChange={(o) => setBooking((b) => ({ ...b, open: o }))}
        date={date < TODAY ? TODAY : date}
        preset={booking.preset}
        appointments={appointments}
        onBook={book}
      />
    </Section>
  )
}
