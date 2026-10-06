import { HugeiconsIcon } from '@hugeicons/react'
import { LetterMark } from '@/components/mark'
import { StatusBadge } from '@/components/status-badge'
import { APPOINTMENT_STATUS, DOCK_DIRECTION, type DockAppointmentStatus, type DockDirection } from '@/blocks/dock-schedule'

// Small pieces the dock schedule page uses in more than one of its panels.

// Fixed like label colours: a carrier's mark reads the same in every theme.
const MARK_COLOURS = [
  'oklch(0.55 0.13 250)', 'oklch(0.55 0.15 300)', 'oklch(0.58 0.13 160)', 'oklch(0.62 0.14 60)',
  'oklch(0.58 0.16 20)', 'oklch(0.55 0.1 210)',
]

export function CarrierMark({ carrier, size = 'md' }: { carrier: string; size?: 'sm' | 'md' }) {
  const words = carrier.split(' ')
  const text = words.slice(0, 2).map((w) => w[0]).join('')
  const hash = [...carrier].reduce((h, c) => h + c.charCodeAt(0), 0)
  return <LetterMark text={text} colour={MARK_COLOURS[hash % MARK_COLOURS.length]} size={size} />
}

export function AppointmentStatusBadge({ status }: { status: DockAppointmentStatus }) {
  const meta = APPOINTMENT_STATUS[status]
  return <StatusBadge tone={meta.tone} dotClassName={meta.dotClassName}>{meta.label}</StatusBadge>
}

export function DirectionBadge({ direction }: { direction: DockDirection }) {
  const meta = DOCK_DIRECTION[direction]
  return (
    <StatusBadge variant="outline" dot={false}>
      <span className="flex" style={{ color: meta.colour }}>
        <HugeiconsIcon icon={meta.icon} strokeWidth={2} className="size-3" />
      </span>
      {meta.label}
    </StatusBadge>
  )
}
