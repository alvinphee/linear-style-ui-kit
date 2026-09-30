import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ComputerIcon, KeyboardIcon, Moon02Icon, PaintBoardIcon, Search01Icon, Sun03Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
  CommandSeparator, CommandShortcut,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PRESETS } from '@/lib/theme'
import { GO_KEYS, NAV, NAV_GROUPS, goTo } from './nav'
import ShortcutsSheet from './ShortcutsSheet'
import ShowcaseSidebar from './ShowcaseSidebar'
import BoardSection from './sections/BoardSection'
import ButtonsSection from './sections/ButtonsSection'
import ChartsSection from './sections/ChartsSection'
import DisplaySection from './sections/DisplaySection'
import FormsSection from './sections/FormsSection'
import InputsSection from './sections/InputsSection'
import NavigationSection from './sections/NavigationSection'
import IconsSection from './sections/IconsSection'
import InboxSection from './sections/InboxSection'
import IssueSection from './sections/IssueSection'
import OnboardingSection from './sections/OnboardingSection'
import OverlaysMoreSection from './sections/OverlaysMoreSection'
import RoadmapSection from './sections/RoadmapSection'
import SettingsSection from './sections/SettingsSection'
import SignInSection from './sections/SignInSection'
import JobListSection from './sections/JobListSection'
import OverlaysSection from './sections/OverlaysSection'
import StatusSection from './sections/StatusSection'
import ThemeSection, { ThemeControls } from './sections/ThemeSection'

const newJob = () => toast('New job', { description: 'Demo only. Try the form under Forms.' })

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement
    && !!target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]')
}

// The current section is the last one whose top has passed just below the
// header. Read from scroll position, so big jumps (G then …) stay correct.
function useActiveSection() {
  const [active, setActive] = useState(NAV[0].id)
  useEffect(() => {
    let timer = 0
    function update() {
      timer = 0
      let current = NAV[0].id
      for (const { id } of NAV) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) current = id
      }
      setActive(current)
    }
    function onScroll() {
      if (!timer) timer = window.setTimeout(update, 50)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [])
  return active
}

export default function KitchenSink() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { resolvedTheme, setTheme, applyPreset } = useTheme()
  const active = useActiveSection()
  const dark = resolvedTheme === 'dark'
  const pressedG = useRef(0)

  // Ctrl+K command menu, ? shortcuts, C new job, and Linear-style "G then …" jumps.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      const key = e.key.toUpperCase()
      if (pressedG.current && Date.now() - pressedG.current < 1200) {
        pressedG.current = 0
        const target = GO_KEYS.find((g) => g.key === key)
        if (target) {
          e.preventDefault()
          goTo(target.id)
        }
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen(true)
      } else if (key === 'G') pressedG.current = Date.now()
      else if (key === 'C') newJob()
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
      <ShowcaseSidebar active={active} onSearch={() => setCommandOpen(true)} onShortcuts={() => setShortcutsOpen(true)} />

      <div className="min-w-0 flex-1">
        <header className="bg-background/85 sticky top-0 z-20 flex h-11 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
          <span className="text-muted-foreground hidden text-xs sm:inline">Kitchen Sink</span>
          <span className="text-muted-foreground/50 hidden text-xs sm:inline">/</span>
          <span className="truncate text-xs font-medium">{NAV.find((n) => n.id === active)?.label}</span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setCommandOpen(true)}>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)}>
                  <HugeiconsIcon icon={KeyboardIcon} strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard shortcuts <span className="ml-1 opacity-70">?</span></TooltipContent>
            </Tooltip>
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
            <Button size="sm" aria-label="New job" onClick={newJob}>
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
          <InputsSection />
          <StatusSection />
          <DisplaySection />
          <ChartsSection />
          <OverlaysSection onOpenCommand={() => setCommandOpen(true)} />
          <OverlaysMoreSection />
          <NavigationSection />
          <JobListSection />
          <BoardSection />
          <IssueSection />
          <InboxSection />
          <RoadmapSection />
          <SettingsSection />
          <OnboardingSection />
          <SignInSection />
          <IconsSection />
        </main>
      </div>

      <ShortcutsSheet open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => run(newJob)}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Create job
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => setShortcutsOpen(true))}>
                <HugeiconsIcon icon={KeyboardIcon} strokeWidth={2} /> Keyboard shortcuts
                <CommandShortcut>?</CommandShortcut>
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
            {NAV_GROUPS.map((group) => (
              <CommandGroup key={group.title} heading={`Go to · ${group.title}`}>
                {group.items.map((item) => {
                  const go = GO_KEYS.find((g) => g.id === item.id)
                  return (
                    <CommandItem key={item.id} onSelect={() => run(() => goTo(item.id))}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} /> {item.label}
                      {go && <CommandShortcut>G {go.key}</CommandShortcut>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
