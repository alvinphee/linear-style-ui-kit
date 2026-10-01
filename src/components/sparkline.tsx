import { Line, LineChart, YAxis } from 'recharts'
import { cn } from 'cn'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { TONE_LINE, type KpiTone } from './delta-badge'

// A tiny line chart of a period, with the period before dashed behind it.
// Decorative (aria-hidden): put the numbers it shows in text nearby.

const sparkConfig = (tone: KpiTone) => ({
  value: { label: 'This period', color: TONE_LINE[tone] },
  previous: { label: 'Previous period', color: 'var(--muted-foreground)' },
}) satisfies ChartConfig

export function Sparkline({ data, previous, tone = 'positive', className }: {
  data: number[]
  // The period before, drawn dashed behind. Leave it out to hide it.
  previous?: number[]
  tone?: KpiTone
  className?: string
}) {
  const points = data.map((value, i) => ({ i, value, previous: previous?.[i] }))
  return (
    <ChartContainer config={sparkConfig(tone)} className={cn('aspect-auto h-9 w-24 shrink-0', className)} aria-hidden>
      <LineChart data={points} margin={{ top: 3, right: 2, bottom: 3, left: 2 }} accessibilityLayer={false}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        {previous && (
          <Line
            dataKey="previous"
            type="monotone"
            stroke="var(--color-previous)"
            strokeWidth={1}
            strokeDasharray="2 2"
            strokeOpacity={0.7}
            dot={false}
            isAnimationActive={false}
          />
        )}
        <Line
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
