import { HugeiconsIcon } from '@hugeicons/react'
import { ComputerIcon, Copy01Icon, Moon02Icon, RefreshIcon, Sun03Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PRESETS, paletteCss, useTheme, type Palette, type Preset, type Theme } from '@/lib/theme'
import { Panel, Section } from './shared'

const ACCENTS = [
  { name: 'Indigo', h: 276, c: 0.15 },
  { name: 'Blue', h: 252, c: 0.16 },
  { name: 'Sky', h: 230, c: 0.13 },
  { name: 'Teal', h: 185, c: 0.11 },
  { name: 'Green', h: 150, c: 0.14 },
  { name: 'Lime', h: 128, c: 0.16 },
  { name: 'Amber', h: 75, c: 0.15 },
  { name: 'Orange', h: 48, c: 0.17 },
  { name: 'Red', h: 25, c: 0.19 },
  { name: 'Rose', h: 8, c: 0.17 },
  { name: 'Pink', h: 350, c: 0.16 },
  { name: 'Violet', h: 300, c: 0.17 },
]

const GREYS = [
  { name: 'Pure', h: 0, t: 0 },
  { name: 'Cool', h: 265, t: 1.4 },
  { name: 'Slate', h: 250, t: 2.6 },
  { name: 'Warm', h: 70, t: 1.6 },
  { name: 'Sand', h: 80, t: 2.8 },
]

const RADII = [0, 4, 6, 8, 12, 16]

const same = (a: number, b: number) => Math.abs(a - b) < 0.001

function matchesPreset(theme: Theme, palette: Palette, preset: Preset) {
  const p = preset.palette
  return theme === preset.theme && p.mono === palette.mono && same(p.accentHue, palette.accentHue)
    && same(p.accentChroma, palette.accentChroma) && same(p.baseHue, palette.baseHue)
    && same(p.baseTint, palette.baseTint) && p.radius === palette.radius
}

// The same formulas as styles.css, so a preset card shows the real colours.
function previewColours({ theme, palette: p }: Preset) {
  const dark = theme === 'dark'
  const c = 0.0035 * p.baseTint
  const grey = (l: number, k: number, alpha = '') => `oklch(${l} ${c * k} ${p.baseHue}${alpha})`
  const fg = dark ? grey(0.96, 0.6) : grey(0.22, 1.7)
  return {
    frame: dark ? grey(0.155, 1.15) : grey(0.975, 0.6),
    page: dark ? grey(0.17, 1.15) : grey(0.992, 0.3),
    line: dark ? 'oklch(1 0 0 / 10%)' : grey(0.22, 1.7, ' / 10%'),
    text: fg,
    accent: p.mono ? fg : `oklch(${dark ? 0.6 : 0.56} ${p.accentChroma} ${p.accentHue})`,
    radius: Math.min(p.radius, 10),
  }
}

export function ThemeControls({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, palette, setPalette, reset } = useTheme()

  async function copyCss() {
    const lines = [':root {', ...paletteCss(palette).map((l) => `  ${l}`), '}']
    if (palette.mono) lines.push('/* plus the data-mono attribute on <html> */')
    const css = `/* ${theme} mode */\n${lines.join('\n')}`
    try {
      await navigator.clipboard.writeText(css)
      toast.success('Theme copied as CSS', { description: 'Five variables. Paste them over the ones in styles.css.' })
    } catch {
      toast(css)
    }
  }

  return (
    <div className={cn('grid grid-cols-1 gap-4', !compact && 'lg:grid-cols-2 lg:gap-x-8')}>
      <div className="grid content-start gap-4">
        <div className="grid gap-1.5">
          <Label>Mode</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={theme}
            onValueChange={(v) => v && setTheme(v as Theme)}>
            <ToggleGroupItem value="light"><HugeiconsIcon icon={Sun03Icon} strokeWidth={2} /> Light</ToggleGroupItem>
            <ToggleGroupItem value="dark"><HugeiconsIcon icon={Moon02Icon} strokeWidth={2} /> Dark</ToggleGroupItem>
            <ToggleGroupItem value="system"><HugeiconsIcon icon={ComputerIcon} strokeWidth={2} /> System</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid gap-2">
          <Label>Accent</Label>
          <div className="flex flex-wrap gap-1.5">
            {ACCENTS.map((a) => {
              const on = !palette.mono && same(palette.accentHue, a.h) && same(palette.accentChroma, a.c)
              return (
                <button key={a.name} type="button" title={a.name} aria-label={a.name} aria-pressed={on}
                  onClick={() => setPalette({ accentHue: a.h, accentChroma: a.c, mono: false })}
                  className="ring-offset-background aria-pressed:ring-foreground/70 grid size-6 place-items-center rounded-full ring-offset-2 aria-pressed:ring-2"
                  style={{ background: `oklch(0.6 ${a.c} ${a.h})` }}>
                  {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3 text-white" />}
                </button>
              )
            })}
            <button type="button" title="Mono" aria-label="Mono" aria-pressed={palette.mono}
              onClick={() => setPalette({ mono: true })}
              className="ring-offset-background aria-pressed:ring-foreground/70 grid size-6 place-items-center rounded-full border ring-offset-2 aria-pressed:ring-2"
              style={{ background: 'linear-gradient(135deg, var(--foreground) 50%, var(--background) 50%)' }} />
          </div>
          <SliderRow label="Hue" value={palette.accentHue} min={0} max={360} step={1} disabled={palette.mono}
            onChange={(accentHue) => setPalette({ accentHue, mono: false })}
            track={`linear-gradient(90deg, ${Array.from({ length: 13 }, (_, i) => `oklch(0.62 0.15 ${i * 30})`).join(', ')})`} />
          <SliderRow label="Strength" value={palette.accentChroma} min={0.03} max={0.25} step={0.01} disabled={palette.mono}
            onChange={(accentChroma) => setPalette({ accentChroma, mono: false })}
            format={(v) => v.toFixed(2)} />
        </div>
      </div>

      <div className="grid content-start gap-4">
        <div className="grid gap-2">
          <Label>Greys</Label>
          <div className="flex flex-wrap gap-1.5">
            {GREYS.map((g) => (
              <Button key={g.name} size="xs" variant={same(palette.baseTint, g.t) && (g.t === 0 || same(palette.baseHue, g.h)) ? 'secondary' : 'outline'}
                onClick={() => setPalette({ baseHue: g.h, baseTint: g.t })}>
                <span className="size-2.5 rounded-full border" style={{ background: `oklch(0.7 ${0.0035 * g.t * 4} ${g.h})` }} />
                {g.name}
              </Button>
            ))}
            <Button size="xs" variant="outline" onClick={() => setPalette({ baseHue: palette.accentHue, baseTint: 2.2 })}>
              Match accent
            </Button>
          </div>
          <SliderRow label="Tint hue" value={palette.baseHue} min={0} max={360} step={1}
            onChange={(baseHue) => setPalette({ baseHue })}
            track={`linear-gradient(90deg, ${Array.from({ length: 13 }, (_, i) => `oklch(0.7 0.06 ${i * 30})`).join(', ')})`} />
          <SliderRow label="Tint strength" value={palette.baseTint} min={0} max={4} step={0.1}
            onChange={(baseTint) => setPalette({ baseTint })} format={(v) => v.toFixed(1)} />
        </div>

        <div className="grid gap-1.5">
          <Label>Corners</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={String(palette.radius)}
            onValueChange={(v) => v && setPalette({ radius: Number(v) })}>
            {RADII.map((r) => (
              <ToggleGroupItem key={r} value={String(r)} aria-label={`${r}px corners`} className="px-2.5 tabular-nums">
                {r}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyCss}>
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" /> Copy as CSS
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" /> Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, onChange, track, format = String, disabled }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  track?: string
  format?: (value: number) => string
  disabled?: boolean
}) {
  return (
    <div className={cn('grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3', disabled && 'opacity-50')}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="relative">
        {track && <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full" style={{ background: track }} />}
        <Slider value={[value]} min={min} max={max} step={step} disabled={disabled}
          onValueChange={([v]) => onChange(v)}
          className={track ? '[&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-track]]:bg-transparent' : undefined} />
      </div>
      <span className="text-muted-foreground text-right text-xs tabular-nums">{format(value)}</span>
    </div>
  )
}

export default function ThemeSection() {
  const { theme, palette, applyPreset } = useTheme()
  const active = PRESETS.find((p) => matchesPreset(theme, palette, p))

  return (
    <Section id="theme" title="Theme" description="Pick a preset, then change any part of it. Everything on the page follows.">
      <Panel title="Presets" note={active ? `Using: ${active.name}` : 'Custom mix'} wide>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PRESETS.map((preset) => {
            const c = previewColours(preset)
            const on = active?.name === preset.name
            return (
              <button key={preset.name} type="button" onClick={() => applyPreset(preset)} aria-pressed={on}
                className="hover:border-foreground/25 aria-pressed:border-brand aria-pressed:ring-brand/30 grid gap-1.5 rounded-lg border p-1.5 text-left outline-none aria-pressed:ring-2 focus-visible:ring-2">
                <span className="flex h-14 overflow-hidden border" style={{ background: c.frame, borderColor: c.line, borderRadius: c.radius }}>
                  <span className="grid w-1/4 content-start gap-1 p-1.5">
                    <span className="h-1 w-full rounded-full opacity-50" style={{ background: c.text }} />
                    <span className="h-1 w-3/4 rounded-full opacity-30" style={{ background: c.text }} />
                    <span className="h-1 w-4/5 rounded-full opacity-30" style={{ background: c.text }} />
                  </span>
                  <span className="m-1 ml-0 grid flex-1 content-start gap-1 border p-1.5" style={{ background: c.page, borderColor: c.line, borderRadius: Math.max(c.radius - 2, 0) }}>
                    <span className="h-1 w-2/3 rounded-full opacity-70" style={{ background: c.text }} />
                    <span className="h-1 w-1/2 rounded-full opacity-30" style={{ background: c.text }} />
                    <span className="mt-1 h-2.5 w-8 rounded-sm" style={{ background: c.accent }} />
                  </span>
                </span>
                <span className="flex items-center gap-1.5 px-0.5 text-xs">
                  <HugeiconsIcon icon={preset.theme === 'dark' ? Moon02Icon : Sun03Icon} strokeWidth={2} className="text-muted-foreground size-3" />
                  {preset.name}
                </span>
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel title="Mix your own" note="Accent × greys × corners × mode" wide>
        <ThemeControls />
      </Panel>
    </Section>
  )
}
