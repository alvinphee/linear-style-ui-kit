import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, ComputerIcon, CursorPointer02Icon, GridViewIcon, InputTextIcon, Layers01Icon,
  LeftToRightListBulletIcon, Moon02Icon, PaintBoardIcon, Search01Icon, Settings02Icon, Sun03Icon,
  Tag01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
  CommandSeparator, CommandShortcut,
} from '@/components/ui/command'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PRESETS } from '@/lib/theme'
import ButtonsSection from './sections/ButtonsSection'
import FormsSection from './sections/FormsSection'
import IconsSection from './sections/IconsSection'
import JobListSection from './sections/JobListSection'
import OverlaysSection from './sections/OverlaysSection'
import StatusSection from './sections/StatusSection'
import ThemeSection, { ThemeControls } from './sections/ThemeSection'

const NAV: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: 'theme', label: 'Theme', icon: PaintBoardIcon },
  { id: 'buttons', label: 'Buttons', icon: CursorPointer02Icon },
  { id: 'forms', label: 'Forms', icon: InputTextIcon },
  { id: 'status', label: 'Status', icon: Tag01Icon },
  { id: 'overlays', label: 'Menus and overlays', icon: Layers01Icon },
  { id: 'list', label: 'Job list', icon: LeftToRightListBulletIcon },
  { id: 'icons', label: 'Icons', icon: GridViewIcon },
  { id: 'props', label: 'Icon props', icon: Settings02Icon },
  { id: 'all-icons', label: 'All free icons', icon: Search01Icon },
]

function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function useActiveSection() {
  const [active, setActive] = useState(NAV[0].id)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -75% 0px' },
    )
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])
  return active
}

export default function KitchenSink() {
  const [commandOpen, setCommandOpen] = useState(false)
  const { resolvedTheme, setTheme, applyPreset } = useTheme()
  const active = useActiveSection()
  const dark = resolvedTheme === 'dark'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function run(action: () => void) {
    setCommandOpen(false)
    action()
  }

  return (
    <div className="flex min-h-svh">
      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r md:flex">
        <div className="flex h-11 items-center gap-2 px-3">
          <span className="bg-primary text-primary-foreground grid size-5 place-items-center rounded text-[9px] font-semibold">KS</span>
          <span className="text-foreground text-[13px] font-medium">Kitchen Sink</span>
        </div>

        <div className="px-2">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="text-muted-foreground hover:bg-sidebar-accent flex h-7 w-full items-center gap-2 rounded-md border px-2 text-xs"
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-3.5" />
            Search…
            <KbdGroup className="ml-auto">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </button>
        </div>

        <nav className="mt-4 grid gap-px px-2">
          <p className="text-muted-foreground px-2 pb-1 text-[11px] font-medium">Showcase</p>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              data-active={active === item.id}
              className="hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex h-7 items-center gap-2 rounded-md px-2 text-left text-xs"
            >
              <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5 opacity-80" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="text-muted-foreground mt-auto border-t p-3 text-[11px] leading-4">
          shadcn/ui Mira · Hugeicons free · Inter
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="bg-background/85 sticky top-0 z-20 flex h-11 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
          <span className="text-muted-foreground hidden text-xs sm:inline">Kitchen Sink</span>
          <span className="text-muted-foreground/50 hidden text-xs sm:inline">/</span>
          <span className="truncate text-xs font-medium">{NAV.find((n) => n.id === active)?.label}</span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setCommandOpen(true)}>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Theme">
                  <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} data-icon="inline-start" />
                  <span className="hidden sm:inline">Theme</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)]">
                <ThemeControls compact />
              </PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(dark ? 'light' : 'dark')}>
                  <HugeiconsIcon icon={Sun03Icon} altIcon={Moon02Icon} showAlt={dark} strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dark ? 'Light mode' : 'Dark mode'}</TooltipContent>
            </Tooltip>
            <Button size="sm" aria-label="New job" onClick={() => toast('New job', { description: 'Demo only. Try the form under Forms.' })}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              <span className="hidden sm:inline">New job</span>
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Button key={item.id} variant={active === item.id ? 'secondary' : 'ghost'} size="sm" onClick={() => goTo(item.id)}>
              {item.label}
            </Button>
          ))}
        </nav>

        <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-6 pb-24 md:px-6">
          <ThemeSection />
          <ButtonsSection />
          <FormsSection />
          <StatusSection />
          <OverlaysSection onOpenCommand={() => setCommandOpen(true)} />
          <JobListSection />
          <IconsSection />
        </main>
      </div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => run(() => toast('New job', { description: 'Demo only.' }))}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Create job
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => setTheme('light'))}>
                <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} /> Light theme
              </CommandItem>
              <CommandItem onSelect={() => run(() => setTheme('dark'))}>
                <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} /> Dark theme
              </CommandItem>
              <CommandItem onSelect={() => run(() => setTheme('system'))}>
                <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} /> System theme
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Theme presets">
              {PRESETS.map((preset) => (
                <CommandItem key={preset.name} onSelect={() => run(() => applyPreset(preset))}>
                  <HugeiconsIcon icon={preset.theme === 'dark' ? Moon02Icon : Sun03Icon} strokeWidth={2} /> {preset.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Go to">
              {NAV.map((item) => (
                <CommandItem key={item.id} onSelect={() => run(() => goTo(item.id))}>
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} /> {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
