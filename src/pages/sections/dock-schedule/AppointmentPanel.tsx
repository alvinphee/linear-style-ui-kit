import { useId, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { CheckmarkCircle02Icon, DoorIcon, Login02Icon, UserRemove01Icon } from '@hugeicons/core-free-icons'
import { format } from 'date-fns'
import { RecordSheet, RecordSheetContent, type RecordActivity } from '@/blocks/record-sheet'
import {
  DockSlotPicker, bookingConflict, dockTakes, freeDocks, parseDayKey, timeRange,
  type DockAppointmentStatus, type DockSlot,
} from '@/blocks/dock-schedule'
import { Button } from '@/components/ui/button'
import { formatMinutes, formatTimeOfDay } from '@/lib/format'
import { CLOSE, CLOSURES, DOCKS, LOAD_TYPE, NOW, OPEN, TODAY, type YardAppointment } from './data'
import { AppointmentStatusBadge, CarrierMark, DirectionBadge } from './parts'

// One dock appointment in the side panel: its next step in the yard (check
// in, move to the door, complete), its details, a slot picker to reschedule
// it on the same day, and what has happened to it.

const NEXT: Partial<Record<DockAppointmentStatus, { label: string; to: DockAppointmentStatus; icon: IconSvgElement }>> = {
  scheduled: { label: 'Check in', to: 'checked-in', icon: Login02Icon },
  late: { label: 'Check in', to: 'checked-in', icon: Login02Icon },
  'checked-in': { label: 'Move to door', to: 'at-door', icon: DoorIcon },
  'at-door': { label: 'Complete', to: 'completed', icon: CheckmarkCircle02Icon },
}

const dockName = (id: string) => DOCKS.find((d) => d.id === id)?.name ?? id

// What happened before this session, worked out from the record. Newest first.
function history(a: YardAppointment): RecordActivity[] {
  const dock = dockName(a.dockId)
  const items: (RecordActivity | false)[] = [
    a.status === 'completed' && { id: 'out', text: `Departed from ${dock}`, at: formatTimeOfDay(a.end) },
    (a.status === 'completed' || a.status === 'at-door') && {
      id: 'door', text: `Docked at ${dock}`, at: formatTimeOfDay(Math.max(a.start, a.arrivedAt ?? a.start)),
    },
    a.arrivedAt !== undefined && { id: 'gate', text: `Checked in at the gate, trailer ${a.trailer}`, at: formatTimeOfDay(a.arrivedAt) },
    a.status === 'no-show' && { id: 'no-show', text: 'Marked as a no-show', at: formatTimeOfDay(a.start + 30) },
    { id: 'booked', actor: a.carrier, text: `booked ${timeRange(a)} at ${dock} through the carrier portal`, at: 'Last week' },
  ]
  return items.filter((i): i is RecordActivity => Boolean(i))
}

export function AppointmentPanel({ appointment, appointments, order, log, onNavigate, onClose, onStatus, onMove, onComment, onDelete }: {
  appointment: YardAppointment | undefined
  appointments: YardAppointment[]
  // The ids in the order the day lists them, for previous / next.
  order: string[]
  // Changes made in this session, newest first.
  log: RecordActivity[]
  onNavigate: (id: string) => void
  onClose: () => void
  onStatus: (id: string, status: DockAppointmentStatus) => void
  onMove: (id: string, to: DockSlot) => void
  onComment: (id: string, text: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <RecordSheet open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      {appointment && (
        <Content
          key={appointment.id}
          a={appointment}
          appointments={appointments}
          order={order}
          log={log}
          onNavigate={onNavigate}
          onStatus={onStatus}
          onMove={onMove}
          onComment={onComment}
          onDelete={onDelete}
        />
      )}
    </RecordSheet>
  )
}

function Content({ a, appointments, order, log, onNavigate, onStatus, onMove, onComment, onDelete }: {
  a: YardAppointment
  appointments: YardAppointment[]
  order: string[]
  log: RecordActivity[]
  onNavigate: (id: string) => void
  onStatus: (id: string, status: DockAppointmentStatus) => void
  onMove: (id: string, to: DockSlot) => void
  onComment: (id: string, text: string) => void
  onDelete: (id: string) => void
}) {
  const id = useId()
  const [slot, setSlot] = useState<number | null>(null)
  const dock = DOCKS.find((d) => d.id === a.dockId)
  const index = order.indexOf(a.id)
  const isToday = a.date === TODAY
  const next = isToday ? NEXT[a.status] : undefined
  const open = a.status !== 'completed' && a.status !== 'no-show' && a.date >= TODAY
  const length = a.end - a.start
  const candidates = DOCKS.filter((d) => dockTakes(d, a.direction))
  const check = { date: a.date, direction: a.direction, appointments, closures: CLOSURES, open: OPEN, close: CLOSE, ignoreId: a.id }
  // Stay on the same dock when it is free then, or take the first that is.
  const target = slot === null
    ? undefined
    : dock && !bookingConflict({ ...check, dock, start: slot, end: slot + length })
      ? dock
      : freeDocks(candidates, { ...check, start: slot, end: slot + length })[0]

  return (
    <RecordSheetContent
      number={`Dock appointment · ${a.number}`}
      badge={<AppointmentStatusBadge status={a.status} />}
      title={a.carrier}
      description={`${a.carrier}, ${timeRange(a)} at ${dock?.name}`}
      noun="appointment"
      navigation={{
        index,
        total: order.length,
        onPrevious: index > 0 ? () => onNavigate(order[index - 1]) : undefined,
        onNext: index >= 0 && index < order.length - 1 ? () => onNavigate(order[index + 1]) : undefined,
      }}
      properties={<DirectionBadge direction={a.direction} />}
      actions={
        <>
          {(a.status === 'scheduled' || a.status === 'late') && isToday && (
            <Button variant="ghost" size="sm" onClick={() => onStatus(a.id, 'no-show')}>
              <HugeiconsIcon icon={UserRemove01Icon} strokeWidth={2} data-icon="inline-start" />
              No-show
            </Button>
          )}
          {next && (
            <Button size="sm" onClick={() => onStatus(a.id, next.to)}>
              <HugeiconsIcon icon={next.icon} strokeWidth={2} data-icon="inline-start" />
              {next.label}
            </Button>
          )}
        </>
      }
      details={[
        { label: 'Carrier', value: <span className="flex min-w-0 items-center gap-2"><CarrierMark carrier={a.carrier} size="sm" /><span className="truncate">{a.carrier}</span></span> },
        { label: 'Dock', value: <span className="truncate">{dock?.name}{dock?.description && <span className="text-muted-foreground"> · {dock.description}</span>}</span> },
        { label: 'Date', value: format(parseDayKey(a.date), 'EEEE d MMMM') },
        { label: 'Time slot', value: <span className="tabular-nums">{timeRange(a)} <span className="text-muted-foreground">· {formatMinutes(length)}</span></span> },
        { label: a.direction === 'inbound' ? 'Purchase order' : 'Delivery order', value: <span className="tabular-nums">{a.reference}</span> },
        { label: 'Load', value: `${a.pallets} pallets · ${LOAD_TYPE[a.loadType][a.direction]}` },
        { label: 'Trailer', value: <span className="tabular-nums">{a.trailer}</span> },
        { label: 'Driver', value: a.driver },
        ...(a.arrivedAt !== undefined
          ? [{
              label: 'Checked in',
              value: (
                <span className="tabular-nums">
                  {formatTimeOfDay(a.arrivedAt)}
                  {a.status === 'checked-in' && <span className="text-muted-foreground"> · waiting {formatMinutes(Math.max(0, NOW - a.arrivedAt))}</span>}
                </span>
              ),
            }]
          : []),
      ]}
      activity={[...log, ...history(a)]}
      onComment={(text) => onComment(a.id, text)}
      commentPlaceholder="Leave a note for the yard team…"
      onDelete={() => onDelete(a.id)}
      deleteTitle="Cancel this appointment?"
      deleteDescription="The slot is freed for other carriers. The carrier isn't told in this demo."
    >
      {open && (
        <section aria-labelledby={`${id}-reschedule`} className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id={`${id}-reschedule`} className="font-medium">Reschedule</h3>
            <span className="text-muted-foreground text-[11px]">Same day · {formatMinutes(length)}</span>
          </div>
          <DockSlotPicker
            docks={candidates}
            appointments={appointments}
            closures={CLOSURES}
            date={a.date}
            direction={a.direction}
            length={length}
            open={OPEN}
            close={CLOSE}
            notBefore={isToday ? NOW : undefined}
            ignoreId={a.id}
            value={slot ?? a.start}
            onChange={setSlot}
            aria-labelledby={`${id}-reschedule`}
            className="sm:grid-cols-4"
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-muted-foreground text-[11px]">
              {target && slot !== null ? `Lands on ${target.name}, ${timeRange({ start: slot, end: slot + length })}` : 'Pick a new start time'}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={!target || slot === null || (slot === a.start && target.id === a.dockId)}
              onClick={() => {
                if (!target || slot === null) return
                onMove(a.id, { dockId: target.id, start: slot })
                setSlot(null)
              }}
            >
              Move appointment
            </Button>
          </div>
        </section>
      )}
    </RecordSheetContent>
  )
}
