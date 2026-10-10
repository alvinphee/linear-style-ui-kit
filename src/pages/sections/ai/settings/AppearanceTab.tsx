import { useId, type CSSProperties } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ComputerIcon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from 'cn'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PRESETS, useTheme, type Palette, type Preset, type Theme } from '@/lib/theme'
import { useAiPrefs, type ChatFont, type TextSize } from './prefs'

// How the app looks: light or dark, the accent, and the font and size of
// chat messages. Theme and accent are the kit's own (lib/theme), so the whole
// app follows them; font and size apply to messages only.

// System font stacks only, so nothing is downloaded. The dyslexia-friendly
// option is a wide, open sans with extra letter and word spacing.
export const CHAT_FONTS: Record<ChatFont, { label: string; hint: string; style: CSSProperties }> = {
  default: { label: 'Default', hint: 'The app’s font', style: {} },
  serif: { label: 'Serif', hint: 'For long reads', style: { fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" } },
  mono: { label: 'Mono', hint: 'Fixed width', style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace" } },
  dyslexic: {
    label: 'Dyslexia-friendly',
    hint: 'Wider letters and spacing',
    style: { fontFamily: "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif", letterSpacing: '0.04em', wordSpacing: '0.12em' },
  },
}

export const TEXT_SIZES: Record<TextSize, { label: string; px: number; leading: number }> = {
  sm: { label: 'Small', px: 12, leading: 1.6 },
  md: { label: 'Default', px: 13, leading: 1.65 },
  lg: { label: 'Large', px: 15, leading: 1.7 },
}

// The style for a chat message's text, from the two settings.
export function chatTextStyle(font: ChatFont, size: TextSize): CSSProperties {
  const s = TEXT_SIZES[size]
  return { fontSize: s.px, lineHeight: font === 'dyslexic' ? s.leading + 0.15 : s.leading, ...CHAT_FONTS[font].style }
}

const MODES: { id: Theme; label: string; icon: typeof Sun03Icon }[] = [
  { id: 'light', label: 'Light', icon: Sun03Icon },
  { id: 'dark', label: 'Dark', icon: Moon02Icon },
  { id: 'system', label: 'System', icon: ComputerIcon },
]

// The same formulas as styles.css, read from the live tokens (--grey-*,
// --brand-*), so a preview shows the real colours of either mode whichever
// mode the page is in.
function modeColours(mode: 'light' | 'dark', mono: boolean) {
  const grey = (l: number, k: number, alpha = '') => `oklch(${l} calc(var(--grey-c) * ${k}) var(--grey-h)${alpha})`
  const text = mode === 'dark' ? grey(0.96, 0.6) : grey(0.22, 1.7)
  return mode === 'dark'
    ? { side: grey(0.165, 1.15), page: grey(0.195, 1.15), card: grey(0.225, 1.4), text, line: 'oklch(1 0 0 / 12%)',
        accent: mono ? text : 'oklch(0.6 var(--brand-c) var(--brand-h))' }
    : { side: grey(0.975, 0.6), page: grey(0.992, 0.3), card: grey(1, 0.15), text, line: grey(0.22, 1.7, ' / 9%'),
        accent: mono ? text : 'oklch(0.56 var(--brand-c) var(--brand-h))' }
}

// A tiny chat app: a sidebar, a message bubble, a reply and the prompt box.
function ModeMock({ mode, mono, className, style }: { mode: 'light' | 'dark'; mono: boolean; className?: string; style?: CSSProperties }) {
  const c = modeColours(mode, mono)
  const bar = (width: string, opacity: number) => <span className="block h-1 rounded-full" style={{ width, background: c.text, opacity }} />
  return (
    <span aria-hidden className={cn('flex h-full w-full', className)} style={{ background: c.page, ...style }}>
      <span className="grid w-1/4 content-start gap-1 p-1.5" style={{ background: c.side, borderRight: `1px solid ${c.line}` }}>
        {bar('80%', 0.5)}
        {bar('60%', 0.25)}
        {bar('70%', 0.25)}
      </span>
      <span className="flex flex-1 flex-col gap-1 p-1.5">
        <span className="ml-auto grid w-1/2 gap-0.5 rounded-sm p-1" style={{ background: c.card, border: `1px solid ${c.line}` }}>
          {bar('90%', 0.45)}
        </span>
        <span className="grid gap-0.5">
          {bar('85%', 0.55)}
          {bar('65%', 0.3)}
        </span>
        <span className="mt-auto flex items-center justify-end rounded-sm p-0.5" style={{ background: c.card, border: `1px solid ${c.line}` }}>
          <span className="size-1.5 rounded-full" style={{ background: c.accent }} />
        </span>
      </span>
    </span>
  )
}

const samePalette = (a: Palette, b: Palette) =>
  a.mono === b.mono && a.radius === b.radius && Math.abs(a.baseTint - b.baseTint) < 0.01 && Math.abs(a.baseHue - b.baseHue) < 0.5
  && (a.mono || (Math.abs(a.accentHue - b.accentHue) < 0.5 && Math.abs(a.accentChroma - b.accentChroma) < 0.001))

// One swatch per palette: the presets come in light and dark pairs ("Indigo
// night", "Indigo day") that share one.
const ACCENTS = PRESETS.reduce<{ name: string; preset: Preset }[]>((list, preset) => {
  if (!list.some((a) => samePalette(a.preset.palette, preset.palette))) {
    list.push({ name: preset.name.replace(/ (night|day)$/, ''), preset })
  }
  return list
}, [])

function swatch({ palette: p, theme }: Preset) {
  if (!p.mono) return `oklch(0.6 ${p.accentChroma} ${p.accentHue})`
  const ink = theme === 'dark' ? 'oklch(0.2 0 0)' : `oklch(0.22 ${0.006 * p.baseTint} ${p.baseHue})`
  const paper = `oklch(0.97 ${0.0035 * p.baseTint} ${p.baseHue})`
  return `linear-gradient(135deg, ${ink} 50%, ${paper} 50%)`
}

export function AppearanceTab() {
  const id = useId()
  const { theme, setTheme, palette, setPalette } = useTheme()
  const { prefs, set } = useAiPrefs()
  const accent = ACCENTS.find((a) => samePalette(a.preset.palette, palette))

  return (
    <>
      <SettingsHeader title="Appearance" description="Changes apply straight away, and only in this browser." />

      <SettingsGroup title="Theme" className="p-3">
        <RadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)} aria-label="Theme" className="grid-cols-3 gap-2">
          {MODES.map((m) => (
            <FieldLabel key={m.id} htmlFor={`${id}-mode-${m.id}`} className="min-w-0">
              <Field className="gap-2">
                <span className="relative block h-14 overflow-hidden rounded-md border sm:h-16">
                  {m.id === 'system' ? (
                    <>
                      <ModeMock mode="light" mono={palette.mono} />
                      <ModeMock mode="dark" mono={palette.mono} className="absolute inset-0" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
                    </>
                  ) : (
                    <ModeMock mode={m.id} mono={palette.mono} />
                  )}
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <RadioGroupItem value={m.id} id={`${id}-mode-${m.id}`} />
                  <HugeiconsIcon icon={m.icon} strokeWidth={2} className="text-muted-foreground hidden size-3.5 shrink-0 sm:block" />
                  <FieldTitle className="truncate">{m.label}</FieldTitle>
                </span>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <p className="text-muted-foreground mt-2 text-[11px]">System follows your device’s setting.</p>
      </SettingsGroup>

      <SettingsGroup
        title="Accent colour"
        description="Each one comes with greys and corners to match."
        action={<span className="text-muted-foreground text-[11px]">{accent ? accent.name : 'Your own mix'}</span>}
        className="p-3"
      >
        <RadioGroupPrimitive.Root
          value={accent?.name ?? ''}
          onValueChange={(name) => {
            const a = ACCENTS.find((x) => x.name === name)
            if (a) setPalette(a.preset.palette)
          }}
          aria-label="Accent colour"
          className="flex flex-wrap gap-2.5"
        >
          {ACCENTS.map((a) => (
            <RadioGroupPrimitive.Item
              key={a.name}
              value={a.name}
              aria-label={a.name}
              title={a.name}
              className="ring-offset-card data-[state=checked]:ring-foreground/70 focus-visible:ring-ring/60 size-7 rounded-full border ring-offset-2 outline-none focus-visible:ring-2 data-[state=checked]:ring-2"
              style={{ background: swatch(a.preset) }}
            />
          ))}
        </RadioGroupPrimitive.Root>
      </SettingsGroup>

      <SettingsGroup title="Chat text" description="For messages in chats. The rest of the app keeps its own size.">
        <SettingsRow label="Font" stacked>
          <RadioGroup
            value={prefs.chatFont}
            onValueChange={(v) => set('chatFont', v as ChatFont)}
            aria-label="Chat font"
            className="grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {(Object.keys(CHAT_FONTS) as ChatFont[]).map((f) => (
              <FieldLabel key={f} htmlFor={`${id}-font-${f}`} className="min-w-0">
                <Field orientation="horizontal" className="items-start">
                  <FieldContent className="min-w-0">
                    <span aria-hidden className="text-lg leading-none" style={CHAT_FONTS[f].style}>Aa</span>
                    <FieldTitle className="mt-1.5">{CHAT_FONTS[f].label}</FieldTitle>
                    <FieldDescription className="text-[11px] leading-4">{CHAT_FONTS[f].hint}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={f} id={`${id}-font-${f}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </SettingsRow>
        <SettingsRow label="Text size">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={prefs.textSize}
            onValueChange={(v) => v && set('textSize', v as TextSize)}
            aria-label="Text size"
          >
            {(Object.keys(TEXT_SIZES) as TextSize[]).map((s) => (
              <ToggleGroupItem key={s} value={s}>{TEXT_SIZES[s].label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </SettingsRow>
        <div role="group" aria-label="Preview" className="bg-subtle grid gap-3 rounded-b-lg px-3 py-3">
          <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">Preview</p>
          <div className="bg-muted ml-auto max-w-[85%] rounded-lg px-3 py-2" style={chatTextStyle(prefs.chatFont, prefs.textSize)}>
            Can you summarise this week’s open jobs?
          </div>
          <div className="grid min-w-0 gap-1.5" style={chatTextStyle(prefs.chatFont, prefs.textSize)}>
            <p>Sure. There are 14 open jobs this week, and 3 are overdue.</p>
            <p className="text-muted-foreground">The overdue ones are all waiting on parts, so I’d chase the supplier first.</p>
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Chat behaviour">
        <SettingsRow label="Send with Enter" hint={prefs.enterToSend ? 'Shift+Enter adds a new line.' : 'Enter adds a new line; Ctrl+Enter sends.'} htmlFor={`${id}-enter`}>
          <Switch id={`${id}-enter`} checked={prefs.enterToSend} onCheckedChange={(on) => set('enterToSend', on)} />
        </SettingsRow>
        <SettingsRow label="Show thinking" hint="Open the steps the assistant took above each reply." htmlFor={`${id}-thinking`}>
          <Switch id={`${id}-thinking`} checked={prefs.showThinking} onCheckedChange={(on) => set('showThinking', on)} />
        </SettingsRow>
      </SettingsGroup>
    </>
  )
}
