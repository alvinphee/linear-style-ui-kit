import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Demos, Gallery, Playground, bool, imports, jsx, str, type Values } from './Playground'

// jsx() only writes strings and numbers. This puts raw props (arrays,
// expressions) first in the snippet's opening tag.
const withAttrs = (snippet: string, attrs: (string | false)[]) =>
  snippet.replace(/^<[\w.]+/, (tag) => [tag, ...attrs.filter(Boolean)].join(' '))

/* Slider */

const SLIDER_MIN = ['0', '20'] as const

const SLIDER_MAX = ['50', '100', '200'] as const

const SLIDER_STEP = ['1', '5', '10', '25'] as const

type SliderOptions = { min: number; max: number; step: number; range: boolean; disabled: boolean }

const sliderOptions = (v: Values): SliderOptions => ({
  min: Number(str(v, 'min')),
  max: Number(str(v, 'max')),
  step: Number(str(v, 'step')),
  range: str(v, 'thumbs') === 'two',
  disabled: bool(v, 'disabled'),
})

// Starting values that sit on the step grid: the middle, or the quarters for a range.
function sliderStart({ min, max, step, range }: SliderOptions) {
  const snap = (n: number) => Math.min(max, min + Math.round((n - min) / step) * step)
  const span = max - min
  return range ? [snap(min + span * 0.25), snap(min + span * 0.75)] : [snap(min + span / 2)]
}

function SliderPreview(o: SliderOptions) {
  const [value, setValue] = useState(() => sliderStart(o))
  return (
    <div className="grid w-full max-w-64 gap-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium">{o.range ? 'Price range' : 'Seats'}</span>
        <span className="text-muted-foreground tabular-nums">{value.join(' – ')}</span>
      </div>
      <Slider value={value} onValueChange={setValue} min={o.min} max={o.max} step={o.step} disabled={o.disabled} />
    </div>
  )
}

function sliderCode(o: SliderOptions) {
  const body = withAttrs(
    jsx('Slider', {
      min: o.min === 0 ? undefined : o.min,
      max: o.max === 100 ? undefined : o.max,
      step: o.step === 1 ? undefined : o.step,
      disabled: o.disabled,
    }),
    [`defaultValue={[${sliderStart(o).join(', ')}]}`],
  )
  return `${imports({ '@/components/ui/slider': ['Slider'] })}\n\n${body}`
}

const MARKS = [0, 25, 50, 75, 100]

export default function SliderDemos() {
  return (
    <Demos>
      <Playground
        title="Slider"
        description="min, max, step and thumbs"
        controls={[
          { kind: 'select', name: 'min', label: 'Min', options: SLIDER_MIN, initial: '0' },
          { kind: 'select', name: 'max', label: 'Max', options: SLIDER_MAX, initial: '100' },
          { kind: 'select', name: 'step', label: 'Step', options: SLIDER_STEP, initial: '1' },
          { kind: 'select', name: 'thumbs', label: 'Thumbs', options: ['one', 'two'], initial: 'one' },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => {
          const o = sliderOptions(v)
          // Remount when the range or step changes, so the value starts on the new grid.
          return <SliderPreview key={`${o.min}-${o.max}-${o.step}-${o.range}`} {...o} />
        }}
        code={(v) => sliderCode(sliderOptions(v))}
      />

      <Gallery
        title="Slider states"
        items={[
          { label: 'single', node: <Slider defaultValue={[40]} className="w-48" /> },
          { label: 'range', node: <Slider defaultValue={[20, 70]} className="w-48" /> },
          {
            label: 'step 25 with marks',
            node: (
              <div className="grid w-48 gap-2">
                <Slider defaultValue={[50]} step={25} />
                <div className="text-muted-foreground flex justify-between text-[11px] tabular-nums">
                  {MARKS.map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>
            ),
          },
          {
            label: 'vertical',
            node: (
              <div className="flex h-40 gap-6">
                <Slider orientation="vertical" defaultValue={[60]} />
                <Slider orientation="vertical" defaultValue={[30, 80]} />
              </div>
            ),
          },
          { label: 'disabled', node: <Slider defaultValue={[40]} disabled className="w-48" /> },
        ]}
      />
    </Demos>
  )
}
