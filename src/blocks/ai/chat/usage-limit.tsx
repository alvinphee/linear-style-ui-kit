import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Cancel01Icon, HourglassIcon, RefreshIcon, SparklesIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { formatTime } from '@/lib/format'
import { plural } from '@/lib/text'

// When an AI chat runs into its limits. Three parts:
// - UsageLimitBanner: a slim line above the prompt box. "near" counts the
//   messages left until the usage limit resets, and can be dismissed;
//   "reached" says when it resets and offers a smaller model or an upgrade.
// - UsageLimitNotice: the same news for an empty chat, in the welcome
//   screen's place.
// - RateLimitError: a reply that failed because too many requests went out
//   too fast (HTTP 429). It counts down and enables Retry at 0.
// Plans, models and times come in as props; nothing here knows the plan.

export type UsageLimitState = 'near' | 'reached'

// A Date or a timestamp reads as a time of day ("15:00"); a string is shown
// as written ("Monday", "1 Oct").
type When = Date | number | string

const when = (value: When) => (typeof value === 'string' ? value : formatTime(value))

export function UsageLimitBanner({
  state, remaining, resetsAt, fallbackModel, onUpgrade, onSwitchModel, onDismiss, className,
}: {
  state: UsageLimitState
  // Messages left before the limit, for "near".
  remaining?: number
  resetsAt: When
  // A smaller model that still works at the limit, such as "Swift".
  fallbackModel?: string
  onUpgrade?: () => void
  onSwitchModel?: () => void
  onDismiss?: () => void
  className?: string
}) {
  const reached = state === 'reached'
  const at = when(resetsAt)
  const switchTo = fallbackModel && onSwitchModel

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-1.5 text-xs',
        reached ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/50',
        className,
      )}
    >
      <HugeiconsIcon
        icon={reached ? Alert02Icon : HourglassIcon}
        strokeWidth={2}
        className={cn('size-3.5 shrink-0', reached ? 'text-destructive' : 'text-status-progress')}
      />
      <p className="min-w-0 flex-1">
        {reached ? (
          <>
            <span className="font-medium">You've reached your usage limit until {at}.</span>{' '}
            <span className="text-muted-foreground">
              {switchTo ? `Switch to ${fallbackModel}, or upgrade for more.` : 'Upgrade for more, or come back then.'}
            </span>
          </>
        ) : remaining !== undefined ? (
          <>
            <span className="font-medium">{plural(remaining, 'message')} left</span>
            <span className="text-muted-foreground"> until {at}</span>
          </>
        ) : (
          <>
            <span className="font-medium">You're close to your usage limit.</span>
            <span className="text-muted-foreground"> It resets at {at}.</span>
          </>
        )}
      </p>
      <div className="-my-0.5 flex shrink-0 items-center gap-1">
        {reached && switchTo && (
          <Button variant="outline" size="xs" onClick={onSwitchModel}>
            Use {fallbackModel}
          </Button>
        )}
        {onUpgrade && (
          <Button variant={reached ? 'default' : 'ghost'} size="xs" onClick={onUpgrade} className={cn(!reached && 'text-brand')}>
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />
            Upgrade
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="icon-xs" onClick={onDismiss} aria-label="Dismiss" className="-mr-1.5">
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        )}
      </div>
    </div>
  )
}

export function UsageLimitNotice({
  resetsAt, plan, fallbackModel, onUpgrade, onSwitchModel, className,
}: {
  resetsAt: When
  // The plan's name, such as "Pro": "You've used your Pro plan's messages…"
  plan?: string
  fallbackModel?: string
  onUpgrade?: () => void
  onSwitchModel?: () => void
  className?: string
}) {
  const at = when(resetsAt)
  return (
    <Empty role="status" className={cn('border-0 p-6', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={HourglassIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>You've reached your usage limit</EmptyTitle>
        <EmptyDescription>
          {plan ? `You've used your ${plan} plan's messages for now.` : `You've used your messages for now.`}{' '}
          They come back at {at}.
          {fallbackModel && onSwitchModel && ` Until then, ${fallbackModel} still works.`}
        </EmptyDescription>
      </EmptyHeader>
      {(onUpgrade || (fallbackModel && onSwitchModel)) && (
        <EmptyContent className="flex-row flex-wrap justify-center gap-2">
          {fallbackModel && onSwitchModel && (
            <Button variant="outline" size="sm" onClick={onSwitchModel}>
              Use {fallbackModel}
            </Button>
          )}
          {onUpgrade && (
            <Button size="sm" onClick={onUpgrade}>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />
              Upgrade plan
            </Button>
          )}
        </EmptyContent>
      )}
    </Empty>
  )
}

export function RateLimitError({
  retryIn, onRetry, message = 'Too many requests', detail, className,
}: {
  // Seconds until a retry is allowed (the server's Retry-After). To start
  // the countdown again with the same number, change the element's key.
  retryIn: number
  onRetry: () => void
  message?: string
  detail?: string
  className?: string
}) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil(retryIn)))
  const [from, setFrom] = useState(retryIn)
  if (from !== retryIn) {
    setFrom(retryIn)
    setLeft(Math.max(0, Math.ceil(retryIn)))
  }

  useEffect(() => {
    if (left <= 0) return
    const timer = window.setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [left])

  const total = Math.max(1, Math.ceil(retryIn))

  return (
    <div className={cn('border-destructive/30 bg-destructive/5 relative grid min-w-0 gap-2.5 overflow-hidden rounded-lg border p-3', className)}>
      <div className="flex min-w-0 flex-wrap items-start gap-2.5">
        <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive mt-0.5 size-4 shrink-0" />
        <div role="alert" className="grid min-w-0 flex-1 gap-0.5 text-xs">
          <p className="font-medium">{message}</p>
          <p className="text-muted-foreground">
            {detail ?? 'Messages went out faster than the rate limit allows. Wait a moment, then try again.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={left > 0} className="tabular-nums">
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
          {left > 0 ? `Retry in ${left}s` : 'Retry'}
        </Button>
      </div>
      {/* How much of the wait is left, as a line that drains along the bottom. */}
      <div aria-hidden className="bg-destructive/10 absolute inset-x-0 bottom-0 h-0.5">
        <div
          className="bg-destructive/60 h-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${(left / total) * 100}%` }}
        />
      </div>
      <span aria-live="polite" className="sr-only">{left === 0 ? 'You can retry now.' : ''}</span>
    </div>
  )
}
