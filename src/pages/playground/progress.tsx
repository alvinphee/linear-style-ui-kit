import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { ProgressRing } from '@/components/progress-ring'
import { UsageMeter } from '@/components/usage-meter'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Demos, Gallery, Playground, Variants, bool, element, imports, jsx, str, unless, type Values, COLOUR_NAMES,
  colourOf,
} from './Playground'

const PROGRESS_VALUES = ['0', '25', '50', '75', '100'] as const

const PROGRESS_TONES = ['default', 'success', 'warning', 'danger'] as const

type ProgressTone = (typeof PROGRESS_TONES)[number]

// --- UsageMeter ----------------------------------------------------------

const USAGE_VALUES = ['20', '62', '80', '95', '100'] as const

const USAGE_SIZES = ['sm', 'md'] as const

type UsageSize = (typeof USAGE_SIZES)[number]

function usageMeterCode(v: Values) {
  const thresholds = bool(v, 'thresholds')
  const upgrade = bool(v, 'upgrade')
  const head = imports({
    '@/components/usage-meter': ['UsageMeter'],
    '@/components/ui/button': upgrade ? ['Button'] : [],
  })
  const props = [
    `value={${Number(str(v, 'value'))}}`,
    str(v, 'label') && `label="${str(v, 'label')}"`,
    str(v, 'count') && `count="${str(v, 'count')}"`,
    str(v, 'note') && `note="${str(v, 'note')}"`,
    thresholds && 'warnAt={75}',
    thresholds && 'dangerAt={90}',
    unless(str(v, 'size'), 'sm') && `size="${str(v, 'size')}"`,
    'className="w-64"',
  ]
  const button = '<Button variant="outline" size="sm" className="mt-1">Upgrade</Button>'
  return `${head}\n\n${element('UsageMeter', props, upgrade ? button : undefined)}`
}

// --- Progress ------------------------------------------------------------

// Progress has no tone prop: these recolour its indicator from the root.
const PROGRESS_TONE: Record<ProgressTone, string> = {
  default: '',
  success: '*:data-[slot=progress-indicator]:bg-chart-4',
  warning: '*:data-[slot=progress-indicator]:bg-status-progress',
  danger: '*:data-[slot=progress-indicator]:bg-destructive',
}

function LiveProgress() {
  const [value, setValue] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => setValue((p) => (p >= 100 ? 10 : p + 15)), 900)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid w-40 gap-1.5">
      <span className="text-muted-foreground text-[11px] tabular-nums">Syncing… {value}%</span>
      <Progress value={value} aria-label="Syncing" />
    </div>
  )
}

/* ---------- Progress ring ---------- */

// Drawn without a chart library. All figures are made up.

const RING_VALUES = ['0', '25', '60', '92', '100'] as const

const RING_SIZES = ['32', '40', '56', '80'] as const

const RING_STROKES = ['2', '3', '5', '7'] as const

const RING_CENTRES = ['none', 'percent', 'fraction'] as const

type RingSize = (typeof RING_SIZES)[number]

type RingCentre = (typeof RING_CENTRES)[number]

// The number in the middle scales with the ring.
const RING_TEXT: Record<RingSize, string> = {
  32: 'text-[9px] font-medium',
  40: 'text-[10px] font-medium',
  56: 'text-xs font-semibold',
  80: 'text-base font-semibold',
}

// A matching thickness for each size, for the variant grid.
const RING_STROKE_FOR: Record<RingSize, number> = { 32: 3, 40: 3, 56: 5, 80: 7 }

function ringCentre(centre: RingCentre, value: number) {
  if (centre === 'percent') return `${value}%`
  if (centre === 'fraction') return `${Math.round((value / 100) * 5)}/5`
  return undefined
}

function ringCode(v: Values) {
  const value = Number(str(v, 'value'))
  const size = str(v, 'size') as RingSize
  const centre = ringCentre(str(v, 'centre') as RingCentre, value)
  const body = jsx('ProgressRing', {
    value,
    size: size === '40' ? undefined : Number(size),
    strokeWidth: str(v, 'strokeWidth') === '3' ? undefined : Number(str(v, 'strokeWidth')),
    colour: str(v, 'colour') === 'brand' ? undefined : colourOf(v),
    label: bool(v, 'label') ? `Onboarding: ${value}% done` : undefined,
    animateIn: bool(v, 'animateIn'),
    className: centre ? RING_TEXT[size] : undefined,
  }, centre)
  return `${imports({ '@/components/progress-ring': ['ProgressRing'] })}\n\n${body}`
}

function RingDemos() {
  return (
    <>
      <Playground
        title="ProgressRing"
        description="Fills clockwise from the top. With label it speaks; without, it is decoration."
        controls={[
          { kind: 'select', name: 'value', label: 'Value (%)', options: RING_VALUES, initial: '60' },
          { kind: 'select', name: 'size', label: 'Size (px)', options: RING_SIZES, initial: '56' },
          { kind: 'select', name: 'strokeWidth', label: 'Stroke width (px)', options: RING_STROKES, initial: '5' },
          { kind: 'select', name: 'colour', label: 'Colour', options: COLOUR_NAMES, initial: 'brand' },
          { kind: 'select', name: 'centre', label: 'In the middle (children)', options: RING_CENTRES, initial: 'percent' },
          { kind: 'switch', name: 'label', label: 'Spoken label', initial: true },
          { kind: 'switch', name: 'animateIn', label: 'Animate in', initial: true },
        ]}
        render={(v) => {
          const value = Number(str(v, 'value'))
          const size = str(v, 'size') as RingSize
          const centre = ringCentre(str(v, 'centre') as RingCentre, value)
          return (
            <ProgressRing
              // Animate in runs on mount, so turning it on mounts a fresh ring.
              key={String(bool(v, 'animateIn'))}
              value={value}
              size={Number(size)}
              strokeWidth={Number(str(v, 'strokeWidth'))}
              colour={colourOf(v)}
              label={bool(v, 'label') ? `Onboarding: ${value}% done` : undefined}
              animateIn={bool(v, 'animateIn')}
              className={centre ? RING_TEXT[size] : undefined}
            >
              {centre}
            </ProgressRing>
          )
        }}
        code={ringCode}
      />

      <Variants
        title="ProgressRing sizes"
        note="size × value, each with a matching stroke width"
        rows={{ name: 'size', values: RING_SIZES }}
        cols={{ name: 'value', values: ['25', '60', '100'] as const }}
        render={(size, value = '60') => (
          <ProgressRing value={Number(value)} size={Number(size)} strokeWidth={RING_STROKE_FOR[size]} className={RING_TEXT[size]}>
            {value}%
          </ProgressRing>
        )}
      />

      <Gallery
        title="ProgressRing in use"
        items={[
          {
            label: 'a checklist',
            node: (
              <div className="flex items-center gap-2.5">
                <ProgressRing value={60} className="text-[10px] font-medium">3/5</ProgressRing>
                <div className="grid text-xs leading-tight">
                  <span className="font-medium">Set up your workspace</span>
                  <span className="text-muted-foreground text-[11px]">3 of 5 steps done</span>
                </div>
              </div>
            ),
          },
          {
            label: 'a target, in a card',
            node: (
              <div className="bg-card flex w-52 items-center justify-between gap-3 rounded-lg border p-3">
                <div className="grid gap-0.5">
                  <span className="text-muted-foreground text-[11px]">Replies within SLA</span>
                  <span className="text-base font-semibold tabular-nums">92%</span>
                  <span className="text-muted-foreground text-[11px]">Target 90%</span>
                </div>
                <ProgressRing value={92} size={44} strokeWidth={4} colour="var(--status-done)" />
              </div>
            ),
          },
          {
            label: 'small, beside its text',
            node: (
              <span className="flex items-center gap-1.5 text-xs">
                <ProgressRing value={40} size={16} strokeWidth={2} />
                Q4 launch · 40%
              </span>
            ),
          },
          { label: 'empty: no dot at 0%', node: <ProgressRing value={0} label="Not started" /> },
        ]}
      />
    </>
  )
}

export default function ProgressDemos() {
  return (
    <Demos>
      <Playground
        title="Progress"
        description="value, tone and label"
        controls={[
          { kind: 'select', name: 'value', label: 'Value', options: PROGRESS_VALUES, initial: '50' },
          { kind: 'select', name: 'tone', label: 'Tone (className)', options: PROGRESS_TONES, initial: 'default' },
          { kind: 'switch', name: 'showLabel', label: 'Show label', initial: true },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Uploading files' },
        ]}
        render={(v) => {
          const value = Number(str(v, 'value'))
          const label = str(v, 'label') || 'Progress'
          return (
            <div className="grid w-full max-w-xs gap-1.5">
              {bool(v, 'showLabel') && (
                <div className="flex justify-between gap-3 text-xs">
                  <span className="truncate">{label}</span>
                  <span className="text-muted-foreground tabular-nums">{value}%</span>
                </div>
              )}
              <Progress value={value} aria-label={label} className={PROGRESS_TONE[str(v, 'tone') as ProgressTone]} />
            </div>
          )
        }}
        code={(v) => {
          const value = Number(str(v, 'value'))
          const label = str(v, 'label') || 'Progress'
          const bar = jsx('Progress', { value, 'aria-label': label, className: PROGRESS_TONE[str(v, 'tone') as ProgressTone] })
          const body = bool(v, 'showLabel')
            ? jsx('div', { className: 'grid gap-1.5' }, [
              jsx('div', { className: 'flex justify-between text-xs' }, [
                `<span>${label}</span>`,
                `<span className="text-muted-foreground tabular-nums">${value}%</span>`,
              ]),
              bar,
            ])
            : bar
          return `${imports({ '@/components/ui/progress': ['Progress'] })}\n\n${body}`
        }}
      />

      <Variants
        title="Progress values"
        rows={{ name: 'value', values: PROGRESS_VALUES }}
        cols={{ name: 'tone', values: PROGRESS_TONES }}
        render={(value, tone = 'default') => (
          <Progress value={Number(value)} aria-label={`${tone} ${value}%`} className={cn('w-28', PROGRESS_TONE[tone])} />
        )}
      />

      <Gallery
        title="Progress in use"
        note="Height comes from a class, h-1 by default"
        items={[
          { label: 'h-0.5', node: <Progress value={60} aria-label="Thin" className="h-0.5 w-40" /> },
          { label: 'h-1', node: <Progress value={60} aria-label="Default" className="w-40" /> },
          { label: 'h-2', node: <Progress value={60} aria-label="Thick" className="h-2 w-40" /> },
          {
            label: 'steps',
            node: (
              <div className="flex w-40 gap-1">
                {[100, 100, 40, 0].map((value, i) => (
                  <Progress key={i} value={value} aria-label={`Step ${i + 1} of 4`} className="flex-1" />
                ))}
              </div>
            ),
          },
          { label: 'live', node: <LiveProgress /> },
        ]}
      />

      <RingDemos />

      <Playground
        title="UsageMeter"
        description="How much of an allowance is used. Past the thresholds it turns amber, then red."
        controls={[
          { kind: 'select', name: 'value', label: 'Value (%)', options: USAGE_VALUES, initial: '62' },
          { kind: 'select', name: 'size', label: 'Size', options: USAGE_SIZES, initial: 'sm' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Storage' },
          { kind: 'text', name: 'count', label: 'Count', initial: '6.2 of 10 GB' },
          { kind: 'text', name: 'note', label: 'Note', initial: 'Files and attachments' },
          { kind: 'switch', name: 'thresholds', label: 'warnAt 75, dangerAt 90', initial: true },
          { kind: 'switch', name: 'upgrade', label: 'Upgrade button (children)', initial: false },
        ]}
        render={(v) => (
          <UsageMeter
            value={Number(str(v, 'value'))}
            label={str(v, 'label') || undefined}
            count={str(v, 'count') || undefined}
            note={str(v, 'note') || undefined}
            warnAt={bool(v, 'thresholds') ? 75 : undefined}
            dangerAt={bool(v, 'thresholds') ? 90 : undefined}
            size={str(v, 'size') as UsageSize}
            className="bg-card w-64 rounded-lg border p-3"
          >
            {bool(v, 'upgrade') && (
              <Button variant="outline" size="sm" className="mt-1" onClick={() => toast('Upgrade', { description: 'Demo only.' })}>
                Upgrade
              </Button>
            )}
          </UsageMeter>
        )}
        code={usageMeterCode}
      />

      <Variants
        title="UsageMeter levels"
        note="value × size, with warnAt={75} dangerAt={90}"
        rows={{ name: 'value', values: ['40', '80', '95'] as const }}
        cols={{ name: 'size', values: USAGE_SIZES }}
        render={(value, size) => (
          <UsageMeter
            value={Number(value)}
            label="Seats"
            count={`${Math.round(Number(value) / 4)} of 25`}
            note={Number(value) >= 90 ? 'Almost full' : undefined}
            warnAt={75}
            dangerAt={90}
            size={size}
            className="w-48"
          />
        )}
      />

      <Gallery
        title="UsageMeter in use"
        note="It sets no padding or border: className makes it a card"
        items={[
          {
            label: 'credits in a sidebar foot',
            node: (
              <div className="bg-sidebar w-56 rounded-lg border p-2">
                <UsageMeter value={62} label="62% of monthly credits" count="Resets 1 Nov" className="px-1.5 pt-1" />
              </div>
            ),
          },
          {
            label: 'amount and note end',
            node: (
              <UsageMeter
                value={78}
                size="md"
                label="API calls"
                amount="78,240 / 100,000"
                note="21,760 left"
                noteEnd={(
                  <>
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" />
                    Resets 1 Nov
                  </>
                )}
                warnAt={75}
                dangerAt={90}
                className="w-64 rounded-lg border p-3"
              />
            ),
          },
          {
            label: 'at the limit',
            node: (
              <UsageMeter value={100} label="Projects" count="10 of 10" note="Upgrade to add more" warnAt={75} dangerAt={90} className="w-56 rounded-lg border p-3">
                <Button size="sm" className="mt-1" onClick={() => toast('Upgrade', { description: 'Demo only.' })}>Upgrade plan</Button>
              </UsageMeter>
            ),
          },
        ]}
      />
    </Demos>
  )
}
