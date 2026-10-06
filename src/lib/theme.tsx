import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// A small stand-in for next-themes, plus a palette the viewer can mix.
// next-themes renders an inline <script> to avoid a flash on server-rendered
// pages; in a browser-only Vite app React 19 reports that script as an error,
// and there is no flash to avoid.

export type Theme = 'light' | 'dark' | 'system'

// Every colour in styles.css is built from these numbers, so any combination
// works: accent hue and strength, grey tint hue and strength, corner radius.
export type Palette = {
  accentHue: number
  accentChroma: number
  mono: boolean
  baseHue: number
  baseTint: number
  radius: number
}

export type Preset = { name: string; theme: Theme; palette: Palette }

export const DEFAULT_PALETTE: Palette = {
  accentHue: 276, accentChroma: 0.15, mono: false, baseHue: 286, baseTint: 1, radius: 8,
}

export const PRESETS: Preset[] = [
  { name: 'Indigo night', theme: 'dark', palette: DEFAULT_PALETTE },
  { name: 'Indigo day', theme: 'light', palette: DEFAULT_PALETTE },
  { name: 'Paper', theme: 'light', palette: { accentHue: 0, accentChroma: 0, mono: true, baseHue: 70, baseTint: 1.6, radius: 6 } },
  { name: 'Ink', theme: 'dark', palette: { accentHue: 0, accentChroma: 0, mono: true, baseHue: 0, baseTint: 0, radius: 4 } },
  { name: 'Ocean', theme: 'dark', palette: { accentHue: 238, accentChroma: 0.15, mono: false, baseHue: 245, baseTint: 2.4, radius: 8 } },
  { name: 'Sky', theme: 'light', palette: { accentHue: 232, accentChroma: 0.16, mono: false, baseHue: 230, baseTint: 1.2, radius: 10 } },
  { name: 'Forest', theme: 'light', palette: { accentHue: 152, accentChroma: 0.13, mono: false, baseHue: 110, baseTint: 1.6, radius: 10 } },
  { name: 'Moss', theme: 'dark', palette: { accentHue: 145, accentChroma: 0.14, mono: false, baseHue: 150, baseTint: 1.8, radius: 8 } },
  { name: 'Sunset', theme: 'dark', palette: { accentHue: 45, accentChroma: 0.17, mono: false, baseHue: 40, baseTint: 1.8, radius: 8 } },
  { name: 'Sand', theme: 'light', palette: { accentHue: 60, accentChroma: 0.14, mono: false, baseHue: 75, baseTint: 2.2, radius: 12 } },
  { name: 'Grape', theme: 'dark', palette: { accentHue: 305, accentChroma: 0.18, mono: false, baseHue: 300, baseTint: 2.6, radius: 12 } },
  { name: 'Rose', theme: 'light', palette: { accentHue: 8, accentChroma: 0.17, mono: false, baseHue: 350, baseTint: 1, radius: 8 } },
]

type ThemeState = {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  palette: Palette
  setPalette: (patch: Partial<Palette>) => void
  applyPreset: (preset: Preset) => void
  reset: () => void
}

const THEME_KEY = 'kitchen-sink-theme'
const PALETTE_KEY = 'kitchen-sink-palette'
const ThemeContext = createContext<ThemeState | null>(null)

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function readTheme(fallback: Theme): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' || value === 'system' ? value : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }
}

function systemPrefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function paletteCss(p: Palette) {
  return [
    `--brand-h: ${p.accentHue};`,
    `--brand-c: ${p.accentChroma};`,
    `--grey-h: ${p.baseHue};`,
    `--grey-t: ${p.baseTint};`,
    `--radius: ${p.radius / 16}rem;`,
  ]
}

export function ThemeProvider({ defaultTheme = 'system', children }: { defaultTheme?: Theme; children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readTheme(defaultTheme))
  const [palette, setPaletteState] = useState<Palette>(() => readJson(PALETTE_KEY, DEFAULT_PALETTE))
  const [systemDark, setSystemDark] = useState(systemPrefersDark)
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // Another tab or frame changed the theme (the theme comparison shows the
  // app in two frames): follow it, so every copy stays in the same mode.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === THEME_KEY) setThemeState(readTheme(defaultTheme))
      if (event.key === PALETTE_KEY) setPaletteState(readJson(PALETTE_KEY, DEFAULT_PALETTE))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [defaultTheme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand-h', String(palette.accentHue))
    root.style.setProperty('--brand-c', String(palette.accentChroma))
    root.style.setProperty('--grey-h', String(palette.baseHue))
    root.style.setProperty('--grey-t', String(palette.baseTint))
    root.style.setProperty('--radius', `${palette.radius / 16}rem`)
    root.toggleAttribute('data-mono', palette.mono)
    save(PALETTE_KEY, JSON.stringify(palette))
  }, [palette])

  function setTheme(next: Theme) {
    setThemeState(next)
    save(THEME_KEY, next)
  }

  function setPalette(patch: Partial<Palette>) {
    setPaletteState((current) => ({ ...current, ...patch }))
  }

  function applyPreset(preset: Preset) {
    setPaletteState(preset.palette)
    setTheme(preset.theme)
  }

  function reset() {
    applyPreset(PRESETS[0])
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, palette, setPalette, applyPreset, reset }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const state = useContext(ThemeContext)
  if (!state) throw new Error('useTheme must be used inside ThemeProvider')
  return state
}
