import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon, WifiDisconnected01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { plural } from '@/lib/text'

// Says when the app has lost its connection: "You're offline. Messages will
// send when you're back.", with how many are waiting and a Try now button.
// When the connection returns it reads "Back online" for a moment, then
// goes. Pass `online` from useOnline() (src/lib/use-online.ts), or your own
// state to simulate it. The live region is always there, empty while
// online, so screen readers hear each change once.

export function OfflineBanner({
  online, pendingCount = 0, onRetry, backOnlineFor = 3000, noun = 'message', className,
}: {
  online: boolean
  // Changes waiting to go out, such as unsent messages.
  pendingCount?: number
  // Try to reconnect or send now; shown while offline.
  onRetry?: () => void
  // How long "Back online" shows, in milliseconds. 0 skips it.
  backOnlineFor?: number
  // What is waiting, in the singular: "message", "change".
  noun?: string
  className?: string
}) {
  const [previous, setPrevious] = useState(online)
  const [back, setBack] = useState(false)

  // A change of `online` since the last render: going online shows the
  // "Back online" state; going offline cancels it.
  if (previous !== online) {
    setPrevious(online)
    setBack(online && backOnlineFor > 0)
  }

  useEffect(() => {
    if (!back) return
    const timer = window.setTimeout(() => setBack(false), backOnlineFor)
    return () => window.clearTimeout(timer)
  }, [back, backOnlineFor])

  const shown = !online || back

  return (
    <div role="status" aria-live="polite" className={cn(!shown && 'sr-only', className)}>
      {!online ? (
        <div className="bg-popover text-popover-foreground animate-in fade-in-0 slide-in-from-top-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-1.5 text-xs shadow-sm">
          <HugeiconsIcon icon={WifiDisconnected01Icon} strokeWidth={2} className="text-status-progress size-4 shrink-0" />
          <p className="min-w-0 flex-1">
            <span className="font-medium">You're offline.</span>{' '}
            <span className="text-muted-foreground">
              {pendingCount > 0
                ? `${plural(pendingCount, noun)} will send when you're back.`
                : `${noun.charAt(0).toUpperCase()}${noun.slice(1)}s will send when you're back.`}
            </span>
          </p>
          {onRetry && (
            <Button variant="ghost" size="xs" onClick={onRetry} className="-my-0.5 -mr-1.5">
              Try now
            </Button>
          )}
        </div>
      ) : back ? (
        <div className="bg-popover text-popover-foreground animate-in fade-in-0 flex min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs shadow-sm">
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-4 shrink-0" />
          <p className="min-w-0">
            <span className="font-medium">Back online.</span>
            {pendingCount > 0 && <span className="text-muted-foreground"> Sending {plural(pendingCount, noun)}…</span>}
          </p>
        </div>
      ) : null}
    </div>
  )
}
