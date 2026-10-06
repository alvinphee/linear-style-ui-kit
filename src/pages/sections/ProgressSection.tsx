import { useEffect, useState } from 'react'
import { ProgressRing } from '@/components/progress-ring'
import { Progress } from '@/components/ui/progress'
import { Panel, Section } from './shared'

const RINGS = [
  { label: 'On time', value: 92, color: 'var(--brand)', delta: '+3 pts' },
  // status-done is the brand colour, so the success green (chart-4) keeps the rings apart.
  { label: 'Photos complete', value: 76, color: 'var(--chart-4)', delta: '+8 pts' },
  { label: 'Cycle', value: 58, color: 'var(--status-progress)', delta: 'Day 9 of 14' },
]

function Ring({ label, value, color, delta }: (typeof RINGS)[number]) {
  return (
    <figure className="flex min-w-0 flex-col items-center gap-2 text-center">
      <ProgressRing
        value={value}
        size={80}
        strokeWidth={7}
        colour={color}
        label={`${label}: ${value}%`}
        animateIn
        className="text-sm font-semibold"
      >
        {value}%
      </ProgressRing>
      <figcaption className="grid gap-0.5">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-muted-foreground text-[11px]">{delta}</span>
      </figcaption>
    </figure>
  )
}

function RingsPanel() {
  return (
    <Panel title="Progress rings" note="ProgressRing, pure SVG">
      <div className="grid grid-cols-3 gap-2 py-4">
        {RINGS.map((ring) => (
          <Ring key={ring.label} {...ring} />
        ))}
      </div>
      <p className="text-muted-foreground border-t pt-3 text-[11px]">Targets: on time 95%, photos 80%. Compared with last month.</p>
    </Panel>
  )
}

export default function ProgressSection() {
  const [progress, setProgress] = useState(20)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => (p >= 100 ? 10 : p + 15)), 900)
    return () => clearInterval(timer)
  }, [])

  return (
    <Section id="progress" title="Progress" description="Progress bars and rings, and usage against an allowance">
      <Panel title="Upload progress" note="Progress">
        <div className="grid gap-1.5">
          <div className="flex justify-between text-xs">
            <span>Uploading proof photos</span>
            <span className="text-muted-foreground tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </Panel>

      <RingsPanel />
    </Section>
  )
}
