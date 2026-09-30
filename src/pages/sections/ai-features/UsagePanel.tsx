import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Cancel01Icon, Rocket01Icon, SentIcon, Timer02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Panel } from '../shared'
import { IconAction } from './shared'

const LIMIT = 5000
const SLOW_MODE_S = 30
const BURST = { count: 3, windowMs: 4000 }
const COST = 10

const FEATURES = [
  { id: 'chat', name: 'Chat', colour: 'var(--chart-1)' },
  { id: 'rewrite', name: 'Inline rewrite', colour: 'var(--chart-2)' },
  { id: 'summaries', name: 'Summaries', colour: 'var(--chart-3)' },
  { id: 'triage', name: 'Triage', colour: 'var(--chart-4)' },
  { id: 'agents', name: 'Agent runs', colour: 'var(--chart-5)' },
] as const

type FeatureId = (typeof FEATURES)[number]['id']

const START: Record<FeatureId, number> = { chat: 1480, rewrite: 820, summaries: 610, triage: 310, agents: 200 }

const fmt = (n: number) => n.toLocaleString('en-US')

export function UsagePanel() {
  const [used, setUsed] = useState(START)
  const [slowUntil, setSlowUntil] = useState<number | null>(null)
  const [bannerHidden, setBannerHidden] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const sends = useRef<number[]>([])

  const total = Object.values(used).reduce((a, b) => a + b, 0)
  const pct = Math.min(100, (total / LIMIT) * 100)
  const left = slowUntil ? Math.max(0, Math.ceil((slowUntil - now) / 1000)) : 0
  const level = pct >= 90 ? 'danger' : pct >= 75 ? 'warning' : 'ok'

  useEffect(() => {
    if (!slowUntil) return
    const timer = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= slowUntil) {
        setSlowUntil(null)
        setBannerHidden(false)
      }
    }, 250)
    return () => clearInterval(timer)
  }, [slowUntil])

  function startSlowMode() {
    const t = Date.now()
    sends.current = []
    setNow(t)
    setSlowUntil(t + SLOW_MODE_S * 1000)
    setBannerHidden(false)
  }

  function send() {
    if (slowUntil || total + COST > LIMIT) return
    const t = Date.now()
    sends.current = [...sends.current.filter((s) => t - s < BURST.windowMs), t]
    setUsed((u) => ({ ...u, chat: u.chat + COST }))
    if (sends.current.length >= BURST.count) startSlowMode()
  }

  return (
    <Panel title="Usage and limits" note="Resets monthly">
      <div className="grid min-w-0 gap-4">
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="text-xs font-medium">AI credits</span>
            <span className="text-xs tabular-nums" aria-live="polite">
              <span className="font-medium">{fmt(total)}</span>
              <span className="text-muted-foreground"> of {fmt(LIMIT)} credits</span>
            </span>
          </div>
          <Progress
            value={pct}
            aria-label="AI credits used this month"
            className={cn(
              'h-1.5',
              level === 'warning' && '[&>[data-slot=progress-indicator]]:bg-status-progress',
              level === 'danger' && '[&>[data-slot=progress-indicator]]:bg-destructive',
            )}
          />
          <div className="text-muted-foreground flex flex-wrap justify-between gap-x-3 text-[11px] tabular-nums">
            <span className={cn(level === 'danger' && 'text-destructive')}>
              {Math.round(pct)}% used · {fmt(LIMIT - total)} left
            </span>
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" />
              Resets 1 Oct, in 1 day
            </span>
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-muted-foreground text-[11px]">By feature</span>
          <div
            role="img"
            aria-label={`Credits by feature: ${FEATURES.map((f) => `${f.name} ${fmt(used[f.id])}`).join(', ')}`}
            className="bg-muted flex h-2 overflow-hidden rounded-full"
          >
            {FEATURES.map((f) => (
              <span
                key={f.id}
                className="border-card h-full transition-[width] duration-300 not-first:border-l-2"
                style={{ width: `${(used[f.id] / LIMIT) * 100}%`, backgroundColor: f.colour }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1 min-[420px]:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.id} className="flex min-w-0 items-center gap-2 text-xs">
                <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: f.colour }} />
                <span className="truncate">{f.name}</span>
                <span className="text-muted-foreground ml-auto tabular-nums">{fmt(used[f.id])}</span>
              </li>
            ))}
          </ul>
        </div>

        {slowUntil && !bannerHidden && (
          <div className="border-status-progress/30 bg-status-progress/10 flex items-start gap-2 rounded-lg border py-2 pr-1.5 pl-2.5 text-xs">
            <HugeiconsIcon icon={Timer02Icon} strokeWidth={2} className="text-status-progress mt-0.5 size-3.5 shrink-0" />
            <div className="grid min-w-0 flex-1 gap-1">
              <p role="status" className="font-medium">
                You’re sending messages quickly — slow mode for {SLOW_MODE_S} s
              </p>
              <p className="text-muted-foreground tabular-nums">
                You can send again in {left} s. Nothing was lost.
              </p>
              <Progress
                value={(left / SLOW_MODE_S) * 100}
                aria-hidden
                className="bg-status-progress/15 h-0.5 [&>[data-slot=progress-indicator]]:bg-status-progress"
              />
            </div>
            <IconAction label="Hide notice" onClick={() => setBannerHidden(true)} className="-mt-0.5">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </IconAction>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button variant="outline" size="sm" disabled={!!slowUntil} onClick={send}>
            <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" />
            {slowUntil ? `Wait ${left} s` : 'Send a message'}
          </Button>
          <span className="text-muted-foreground min-w-0 flex-1 text-[11px]">
            {COST} credits each. Send {BURST.count} within {BURST.windowMs / 1000} s to hit the rate limit.
          </span>
          {!slowUntil && (
            <Button variant="link" size="xs" className="text-muted-foreground px-0" onClick={startSlowMode}>
              Show the limit
            </Button>
          )}
        </div>

        <div className="bg-subtle flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Team plan</p>
            <p className="text-muted-foreground text-[11px]">{fmt(LIMIT)} credits a month for the whole workspace</p>
          </div>
          <Button
            size="sm"
            onClick={() => toast('Upgrade to Business', { description: 'Demo only. No plan was changed.' })}
          >
            <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} data-icon="inline-start" />
            Upgrade
          </Button>
        </div>
      </div>
    </Panel>
  )
}
