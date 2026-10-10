import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ComputerIcon, Logout01Icon, SmartPhone01Icon, Tablet01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/format'

// Signed-in devices (also called active sessions), as account security pages
// list them: each device with its browser, system, rough location and when it
// was last used, and a way to sign it out. The device you are on comes first,
// marked "This device", and can't be signed out from here. With other devices
// and `onSignOutOthers`, a footer offers to sign out of all of them at once.

export type SessionDevice = 'desktop' | 'phone' | 'tablet'

export type Session = {
  id: string
  device: SessionDevice
  // What the person would call it: "Work laptop", "Alex's phone".
  name: string
  browser: string
  os: string
  // Worked out from the IP address, so only roughly: "Singapore".
  location: string
  lastActive: Date | number
  // The session this page is open in.
  current?: boolean
}

const ICONS: Record<SessionDevice, IconSvgElement> = {
  desktop: ComputerIcon,
  phone: SmartPhone01Icon,
  tablet: Tablet01Icon,
}

const MINUTE = 60_000

// "Active now" within five minutes, then "12 min ago", "3 h ago", and after
// six hours the day: "Yesterday, 09:05", "5 Oct".
export function lastActiveLabel(value: Date | number, now: Date | number = Date.now()) {
  const minutes = Math.floor((+new Date(now) - +new Date(value)) / MINUTE)
  if (minutes < 5) return 'Active now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 6 * 60) return `${Math.floor(minutes / 60)} h ago`
  return formatRelativeDate(value, { now, time: true })
}

export function SessionList({ sessions, onSignOut, onSignOutOthers, now = Date.now(), emptyLabel = 'No signed-in devices.', className }: {
  sessions: Session[]
  onSignOut?: (session: Session) => void
  // Shown as a footer when there is more than the current device.
  onSignOutOthers?: () => void
  // The time "last active" is counted from. Pass a fixed one for demos.
  now?: Date | number
  emptyLabel?: string
  className?: string
}) {
  const sorted = [...sessions].sort((a, b) =>
    Number(!!b.current) - Number(!!a.current) || +new Date(b.lastActive) - +new Date(a.lastActive))
  const others = sessions.filter((s) => !s.current).length

  if (!sessions.length) {
    return <p className={cn('text-muted-foreground px-3 py-6 text-center text-xs', className)}>{emptyLabel}</p>
  }

  return (
    <div className={cn('min-w-0', className)}>
      <ul className="divide-y" aria-label="Signed-in devices">
        {sorted.map((s) => {
          const active = lastActiveLabel(s.lastActive, now)
          return (
            <li key={s.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
              <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-md">
                <HugeiconsIcon icon={ICONS[s.device]} strokeWidth={2} className="size-4" />
              </span>
              <div className="grid min-w-0 flex-1 basis-40 gap-0.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-xs font-medium">{s.name}</span>
                  {s.current && <Badge variant="secondary" className="shrink-0">This device</Badge>}
                </div>
                <p className="text-muted-foreground truncate text-[11px]">
                  {s.browser} on {s.os} · {s.location}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {s.current ? (
                    <span className="text-status-done">Active now</span>
                  ) : (
                    <time dateTime={new Date(s.lastActive).toISOString()}>
                      {active === 'Active now' ? active : `Last active ${active}`}
                    </time>
                  )}
                </p>
              </div>
              {!s.current && onSignOut && (
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => onSignOut(s)}>
                  Sign out<span className="sr-only"> of {s.name}</span>
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {onSignOutOthers && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5">
          <p className="text-muted-foreground min-w-0 text-[11px]">
            {others
              ? `Signed in on ${others} other ${others === 1 ? 'device' : 'devices'}.`
              : 'You are only signed in on this device.'}
          </p>
          {others > 0 && (
            <DeleteConfirm
              icon={Logout01Icon}
              title="Sign out of all other devices?"
              description={`${others === 1 ? 'The other device' : `All ${others} other devices`} will need to sign in again. This device stays signed in.`}
              confirmLabel="Sign out"
              size="sm"
              onConfirm={onSignOutOthers}
            >
              <Button variant="destructive" size="sm">
                <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} data-icon="inline-start" /> Sign out of all other devices
              </Button>
            </DeleteConfirm>
          )}
        </div>
      )}
    </div>
  )
}
