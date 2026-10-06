import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { DoorIcon, Login02Icon, RepeatIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Panel } from '../shared'
import { freeDocks, timeRange, type DockAppointmentStatus, type DockSlot } from '@/blocks/dock-schedule'
import { Button } from '@/components/ui/button'
import { formatMinutes, formatTimeOfDay } from '@/lib/format'
import { CLOSE, CLOSURES, DOCKS, NOW, OPEN, TODAY, type YardAppointment } from './data'
import { AppointmentStatusBadge, CarrierMark } from './parts'

// The yard office's two worklists for today: trailers checked in and waiting
// for a door (the yard queue), and appointments that went wrong (late, no-show).

// Waiting longer than this is called out: the carrier may charge detention.
const LONG_WAIT = 30

const dockName = (id: string) => DOCKS.find((d) => d.id === id)?.name ?? id

function Row({ a, line, children, onOpen }: { a: YardAppointment; line: string; children: ReactNode; onOpen: () => void }) {
  return (
    <li className="flex items-center gap-2.5 py-2">
      <CarrierMark carrier={a.carrier} />
      <div className="grid min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className="focus-visible:ring-ring/50 w-fit max-w-full truncate rounded-sm text-left text-xs font-medium outline-none hover:underline focus-visible:ring-2"
        >
          {a.carrier} <span className="text-muted-foreground font-normal tabular-nums">· {a.number}</span>
        </button>
        <span className="text-muted-foreground truncate text-[11px] tabular-nums">{line}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  )
}

export function YardQueuePanel({ appointments, onOpen, onToDoor }: {
  appointments: YardAppointment[]
  onOpen: (id: string) => void
  // Docks the trailer now: at its booked dock if that is free, or another that takes it.
  onToDoor: (id: string, to: DockSlot) => void
}) {
  const queue = appointments
    .filter((a) => a.date === TODAY && a.status === 'checked-in')
    .sort((a, b) => (a.arrivedAt ?? 0) - (b.arrivedAt ?? 0))

  return (
    <Panel title="Yard queue" note={`Checked in, waiting for a door · ${formatTimeOfDay(NOW)}`}>
      {queue.length ? (
        <ul className="-my-2 divide-y">
          {queue.map((a) => {
            const waited = Math.max(0, NOW - (a.arrivedAt ?? NOW))
            // Docking now takes the dock from now for the booking's length. The
            // booked dock comes first; any other that takes the direction will do.
            const docks = [...DOCKS].sort((x, y) => Number(y.id === a.dockId) - Number(x.id === a.dockId))
            const door = freeDocks(docks, {
              date: TODAY, start: NOW, end: NOW + (a.end - a.start), direction: a.direction, appointments,
              closures: CLOSURES, open: OPEN, close: CLOSE, ignoreId: a.id,
            })[0]
            return (
              <Row key={a.id} a={a} line={`${a.trailer} · booked ${timeRange(a)}, ${dockName(a.dockId)}`} onOpen={() => onOpen(a.id)}>
                <span
                  className={cn(
                    'text-[11px] tabular-nums',
                    waited > LONG_WAIT ? 'font-medium text-[color-mix(in_oklch,var(--status-progress),var(--foreground)_25%)]' : 'text-muted-foreground',
                  )}
                  title="Time since check-in"
                >
                  {formatMinutes(waited)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!door}
                  aria-label={door ? `Move ${a.carrier} to ${door.name}` : 'No door free'}
                  onClick={() => door && onToDoor(a.id, { dockId: door.id, start: NOW })}
                >
                  <HugeiconsIcon icon={DoorIcon} strokeWidth={2} data-icon="inline-start" />
                  {door ? `To ${door.name}` : 'No door free'}
                </Button>
              </Row>
            )
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground py-6 text-center text-xs">No trailers waiting. Checked-in trailers show here.</p>
      )}
    </Panel>
  )
}

export function ExceptionsPanel({ appointments, onOpen, onStatus, onRebook }: {
  appointments: YardAppointment[]
  onOpen: (id: string) => void
  onStatus: (id: string, status: DockAppointmentStatus) => void
  onRebook: (a: YardAppointment) => void
}) {
  const items = appointments
    .filter((a) => a.date === TODAY && (a.status === 'late' || a.status === 'no-show'))
    .sort((a, b) => a.start - b.start)

  return (
    <Panel title="Late and no-shows" note="Today">
      {items.length ? (
        <ul className="-my-2 divide-y">
          {items.map((a) => (
            <Row
              key={a.id}
              a={a}
              line={a.status === 'late'
                ? `Due ${formatTimeOfDay(a.start)}, ${dockName(a.dockId)} · ${formatMinutes(NOW - a.start)} late`
                : `Was due ${formatTimeOfDay(a.start)}, ${dockName(a.dockId)}`}
              onOpen={() => onOpen(a.id)}
            >
              <AppointmentStatusBadge status={a.status} />
              {a.status === 'late' ? (
                <Button size="sm" variant="outline" onClick={() => onStatus(a.id, 'checked-in')}>
                  <HugeiconsIcon icon={Login02Icon} strokeWidth={2} data-icon="inline-start" />
                  Check in
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onRebook(a)}>
                  <HugeiconsIcon icon={RepeatIcon} strokeWidth={2} data-icon="inline-start" />
                  Rebook
                </Button>
              )}
            </Row>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-6 text-center text-xs">Everyone is on time today.</p>
      )}
    </Panel>
  )
}
