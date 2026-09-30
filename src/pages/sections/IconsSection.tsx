import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Sun03Icon, Moon02Icon, ViewIcon, ViewOffSlashIcon, SquareLock02Icon, SquareUnlock02Icon,
  Notification03Icon, NotificationOff01Icon, VolumeHighIcon, VolumeOffIcon, GridViewIcon,
  LeftToRightListBulletIcon, Search01Icon, Cancel01Icon, RefreshIcon, Location01Icon,
  Delete02Icon, DashboardSquare01Icon, Home01Icon, ArrowDown01Icon,
  // Lucide-style names (aliases shipped in the free package)
  Trash2, LayoutDashboard, House, ChevronDown,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ICON_GROUPS } from '../data'
import { Panel, Section } from './shared'

const DEFAULTS = { size: 20, strokeWidth: 1.5, color: 'currentColor', absoluteStrokeWidth: false }
type Look = typeof DEFAULTS

const COLOURS = [
  { label: 'Ink', value: 'currentColor', swatch: 'var(--foreground)' },
  { label: 'Indigo', value: 'var(--brand)', swatch: 'var(--brand)' },
  { label: 'Amber', value: 'var(--status-progress)', swatch: 'var(--status-progress)' },
  { label: 'Red', value: 'var(--status-blocked)', swatch: 'var(--status-blocked)' },
  { label: 'Muted', value: 'var(--muted-foreground)', swatch: 'var(--muted-foreground)' },
]

const SWAPS: { label: string; icon: IconSvgElement; altIcon: IconSvgElement }[] = [
  { label: 'Theme', icon: Sun03Icon, altIcon: Moon02Icon },
  { label: 'Password', icon: ViewIcon, altIcon: ViewOffSlashIcon },
  { label: 'Lock', icon: SquareLock02Icon, altIcon: SquareUnlock02Icon },
  { label: 'Alerts', icon: Notification03Icon, altIcon: NotificationOff01Icon },
  { label: 'Sound', icon: VolumeHighIcon, altIcon: VolumeOffIcon },
  { label: 'Layout', icon: GridViewIcon, altIcon: LeftToRightListBulletIcon },
]

const LUCIDE_NAMES = [
  { lucide: 'Trash2', icon: Trash2, huge: 'Delete02Icon', same: Trash2 === Delete02Icon },
  { lucide: 'LayoutDashboard', icon: LayoutDashboard, huge: 'DashboardSquare01Icon', same: LayoutDashboard === DashboardSquare01Icon },
  { lucide: 'House', icon: House, huge: 'Home01Icon', same: House === Home01Icon },
  { lucide: 'ChevronDown', icon: ChevronDown, huge: 'ArrowDown01Icon', same: ChevronDown === ArrowDown01Icon },
]

const PAGE = 360

type CatalogEntry = { name: string; aliases: string[]; icon: IconSvgElement }

// The package exports each icon under several names (Home01Icon, HomeIcon, House,
// Home01FreeIcons…). Group them by the icon object so every icon appears once.
function buildCatalog(mod: Record<string, unknown>): CatalogEntry[] {
  const namesByIcon = new Map<unknown, string[]>()
  for (const [name, value] of Object.entries(mod)) {
    if (!Array.isArray(value) || name.endsWith('FreeIcons')) continue
    const names = namesByIcon.get(value) ?? []
    names.push(name)
    namesByIcon.set(value, names)
  }
  return [...namesByIcon]
    .map(([icon, names]) => {
      const own = names
        .filter((n) => n.endsWith('Icon'))
        .sort((a, b) => Number(/\d/.test(b)) - Number(/\d/.test(a)) || a.length - b.length)
      return { name: own[0] ?? names[0], aliases: names, icon: icon as IconSvgElement }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function copyImport(name: string) {
  const line = `import { ${name} } from '@hugeicons/core-free-icons'`
  try {
    await navigator.clipboard.writeText(line)
    toast.success('Import copied', { description: line })
  } catch {
    toast(line)
  }
}

export default function IconsSection() {
  const [look, setLook] = useState<Look>(DEFAULTS)
  const [swapped, setSwapped] = useState<Record<string, boolean>>({})
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  useEffect(() => {
    import('@hugeicons/core-free-icons').then((mod) => setCatalog(buildCatalog(mod)))
  }, [])

  useEffect(() => setLimit(PAGE), [deferredQuery])

  const matches = useMemo(() => {
    if (!catalog) return []
    if (!deferredQuery) return catalog
    return catalog.filter((e) => e.aliases.some((n) => n.toLowerCase().includes(deferredQuery)))
  }, [catalog, deferredQuery])

  const update = (patch: Partial<Look>) => setLook((current) => ({ ...current, ...patch }))

  return (
    <>
      <Section id="icons" title="Icons" description="Hugeicons free set, grouped for another app modules">
        <Panel title="Controls" note="Apply to every icon tile below" wide>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="grid w-40 gap-2">
              <Label className="justify-between">Size <span className="text-muted-foreground tabular-nums">{look.size}px</span></Label>
              <Slider value={[look.size]} min={12} max={48} step={1} onValueChange={([size]) => update({ size })} />
            </div>
            <div className="grid w-40 gap-2">
              <Label className="justify-between">Stroke <span className="text-muted-foreground tabular-nums">{look.strokeWidth}</span></Label>
              <Slider value={[look.strokeWidth]} min={0.5} max={3} step={0.25} onValueChange={([strokeWidth]) => update({ strokeWidth })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Colour</Label>
              <ToggleGroup type="single" variant="outline" size="sm" value={look.color}
                onValueChange={(color) => color && update({ color })}>
                {COLOURS.map((c) => (
                  <ToggleGroupItem key={c.label} value={c.value} aria-label={c.label} title={c.label}>
                    <span className="size-3 rounded-full" style={{ background: c.swatch }} />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <Label className="gap-2 font-normal">
              <Switch checked={look.absoluteStrokeWidth} onCheckedChange={(absoluteStrokeWidth) => update({ absoluteStrokeWidth })} />
              absoluteStrokeWidth
            </Label>
            <Button variant="ghost" size="sm" onClick={() => setLook(DEFAULTS)}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" /> Reset
            </Button>
          </div>
        </Panel>

        {ICON_GROUPS.map((group) => (
          <Panel key={group.title} title={group.title} note={group.note}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1">
              {Object.entries(group.icons).map(([name, icon]) => (
                <IconTile key={name} name={name} icon={icon} look={look} />
              ))}
            </div>
          </Panel>
        ))}
      </Section>

      <Section id="props" title="Icon props" description="What HugeiconsIcon can do">
        <Panel title="altIcon + showAlt" note="Click to swap">
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {SWAPS.map((s) => (
              <Button key={s.label} variant="outline" aria-pressed={!!swapped[s.label]}
                className="aria-pressed:bg-accent aria-pressed:text-brand h-auto flex-col gap-1.5 py-2.5"
                onClick={() => setSwapped((cur) => ({ ...cur, [s.label]: !cur[s.label] }))}>
                <HugeiconsIcon icon={s.icon} altIcon={s.altIcon} showAlt={!!swapped[s.label]} className="size-5" />
                <span className="text-[11px] font-normal">{s.label}</span>
              </Button>
            ))}
          </div>
        </Panel>

        <Panel title="absoluteStrokeWidth" note="Off (top) vs on (bottom). Needs strokeWidth set.">
          {[false, true].map((absolute) => (
            <div key={String(absolute)} className="flex items-end gap-5 py-1">
              {[16, 24, 36, 48].map((size) => (
                <figure key={size} className="grid justify-items-center gap-1">
                  <HugeiconsIcon icon={Location01Icon} size={size} strokeWidth={1.5} absoluteStrokeWidth={absolute} />
                  <figcaption className="text-muted-foreground text-[10px] tabular-nums">{size}</figcaption>
                </figure>
              ))}
            </div>
          ))}
        </Panel>

        <Panel title="Lucide names work" note="Same icon, two names" wide>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LUCIDE_NAMES.map((a) => (
              <div key={a.lucide} className="flex flex-wrap items-center gap-2.5 text-xs">
                <HugeiconsIcon icon={a.icon} className="size-4" />
                <code className="bg-muted rounded px-1.5 py-0.5">{a.lucide}</code>
                <span className="text-muted-foreground">{a.same ? '=' : '≠'}</span>
                <code className="bg-muted rounded px-1.5 py-0.5">{a.huge}</code>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <section id="all-icons" className="scroll-mt-16">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold tracking-tight">All free icons</h2>
          <p className="text-muted-foreground text-xs">
            {catalog ? `${matches.length.toLocaleString()} of ${catalog.length.toLocaleString()} · click to copy the import` : 'Loading…'}
          </p>
        </div>
        <InputGroup className="max-w-md">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, including Lucide names like trash or house…" />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQuery('')}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {catalog && (
          <>
            <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-1">
              {matches.slice(0, limit).map((entry) => (
                <IconTile key={entry.name} name={entry.name} icon={entry.icon} look={look} aliases={entry.aliases} />
              ))}
            </div>
            {matches.length === 0 && (
              <p className="text-muted-foreground mt-4 text-xs">No icon matches “{query}”.</p>
            )}
            {matches.length > limit && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
                  Show more ({(matches.length - limit).toLocaleString()} left)
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}

function IconTile({ name, icon, look, aliases }: {
  name: string
  icon: IconSvgElement
  look: Look
  aliases?: string[]
}) {
  const others = aliases?.filter((n) => n !== name) ?? []
  return (
    <button
      type="button"
      title={others.length ? `${name}\nAlso: ${others.join(', ')}` : name}
      onClick={() => copyImport(name)}
      className="hover:bg-accent focus-visible:ring-ring/40 text-foreground grid min-h-[72px] content-center justify-items-center gap-1.5 rounded-md px-1 py-2 outline-none focus-visible:ring-2"
    >
      <HugeiconsIcon icon={icon} {...look} />
      <span className="text-muted-foreground w-full truncate text-center text-[10px]">
        {name.replace(/Icon$/, '')}
      </span>
    </button>
  )
}
