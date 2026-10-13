import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useTheme } from '@/lib/theme'
import { usePath } from '@/lib/router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, ComputerIcon, KeyboardIcon, Moon02Icon, PaintBoardIcon,
  Search01Icon, Sun03Icon,
} from '@hugeicons/core-free-icons'
import { IconAction } from '@/components/icon-action'
import { PageHeader } from '@/components/page-header'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
  CommandSeparator, CommandShortcut,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { isTyping } from '@/lib/keyboard'
import { PRESETS } from '@/lib/theme'
import { GO_KEYS, NAV, NAV_GROUPS, TEMPLATES, byCategory, goTo } from './nav'
import ShortcutsDialog from './ShortcutsDialog'
import ShowcaseSidebar from './ShowcaseSidebar'
import AccordionSection from './sections/AccordionSection'
import AiAgentsSection from './sections/AiAgentsSection'
import AiComponentsSection from './sections/AiComponentsSection'
import AiConnectorsSection from './sections/AiConnectorsSection'
import AiFeaturesSection from './sections/AiFeaturesSection'
import AiKnowledgeSection from './sections/AiKnowledgeSection'
import AiOverviewSection from './sections/AiOverviewSection'
import AiProjectsSection from './sections/AiProjectsSection'
import AiSettingsSection from './sections/AiSettingsSection'
import AiSkillsSection from './sections/AiSkillsSection'
import AiWorkspaceSection from './sections/AiWorkspaceSection'
import AlertsSection from './sections/AlertsSection'
import AppShellSection from './sections/AppShellSection'
import AuditLogSection from './sections/AuditLogSection'
import BadgesSection from './sections/BadgesSection'
import BoardSection from './sections/BoardSection'
import BreadcrumbSection from './sections/BreadcrumbSection'
import ButtonsSection from './sections/ButtonsSection'
import CalendarSection from './sections/CalendarSection'
import CardsSection from './sections/CardsSection'
import CheckItemSection from './sections/CheckItemSection'
import ChartsSection from './sections/ChartsSection'
import CommandPaletteSection from './sections/CommandPaletteSection'
import DashboardSection from './sections/DashboardSection'
import DataTableSection from './sections/DataTableSection'
import DatePickerSection from './sections/DatePickerSection'
import DialogsSection from './sections/DialogsSection'
import DockScheduleSection from './sections/DockScheduleSection'
import EmptyStateSection from './sections/EmptyStateSection'
import FileUploadSection from './sections/FileUploadSection'
import FormBuilderSection from './sections/FormBuilderSection'
import FormsCatalogueSection from './sections/FormsCatalogueSection'
import FormsSection, { QuickCreateDialog } from './sections/FormsSection'
import GanttSection from './sections/GanttSection'
import IconsSection from './sections/IconsSection'
import InboxSection from './sections/InboxSection'
import IssueSection from './sections/IssueSection'
import JobListSection from './sections/JobListSection'
import KbdSection from './sections/KbdSection'
import LoadingSection from './sections/LoadingSection'
import MarkdownSection from './sections/MarkdownSection'
import MenusSection from './sections/MenusSection'
import NavMenusSection from './sections/NavMenusSection'
import OnboardingSection from './sections/OnboardingSection'
import PageHeaderSection from './sections/PageHeaderSection'
import PaginationSection from './sections/PaginationSection'
import PeopleSection from './sections/PeopleSection'
import PopoversSection from './sections/PopoversSection'
import PricingSection from './sections/PricingSection'
import ProgressSection from './sections/ProgressSection'
import QrCodeSection from './sections/QrCodeSection'
import ResizableSection from './sections/ResizableSection'
import RoadmapSection from './sections/RoadmapSection'
import ScrollAreaSection from './sections/ScrollAreaSection'
import SelectSection from './sections/SelectSection'
import SelectionControlsSection from './sections/SelectionControlsSection'
import SeparatorSection from './sections/SeparatorSection'
import SettingsSection from './sections/SettingsSection'
import { InOverview, PageDemos } from './sections/shared'
import SheetsSection from './sections/SheetsSection'
import SignInSection from './sections/SignInSection'
import SliderSection from './sections/SliderSection'
import SortableListSection from './sections/SortableListSection'
import StatusIconsSection from './sections/StatusIconsSection'
import TabsSection from './sections/TabsSection'
import TextFieldsSection from './sections/TextFieldsSection'
import ThemeSection, { ThemeControls } from './sections/ThemeSection'

// Playgrounds and variant grids, one file per page: playground/buttons.tsx
// belongs to the "buttons" page. Picked up by file name, so adding a file is
// all it takes.
const DEMO_FILES = import.meta.glob<{ default: ComponentType }>('./playground/*.tsx', { eager: true })
const DEMOS: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(DEMO_FILES)
    .map(([file, mod]) => [file.replace(/^.*\/(.+)\.tsx$/, '$1'), mod.default] as const)
    .filter(([, component]) => typeof component === 'function'),
)

export default function KitchenSink() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { setTheme, applyPreset } = useTheme()
  const path = usePath()
  // A page may carry more after its id (#/forms-catalogue/vehicle-check): the page reads it itself.
  const pageId = path.split('?')[0].split('/')[1]
  const page = NAV.find((n) => n.id === pageId) ?? NAV[0]
  const group = NAV_GROUPS.find((g) => g.items.some((i) => i.id === page.id))
  const pressedG = useRef(0)

  // One section per page, so each is rendered only when it is open.
  const PAGES: Record<string, () => ReactNode> = {
    overview,
    theme: () => <ThemeSection />,
    buttons: () => <ButtonsSection />,
    'check-item': () => <CheckItemSection />,
    'selection-controls': () => <SelectionControlsSection />,
    'date-picker': () => <DatePickerSection />,
    'file-upload': () => <FileUploadSection />,
    forms: () => <FormsSection />,
    select: () => <SelectSection />,
    slider: () => <SliderSection />,
    'text-fields': () => <TextFieldsSection />,
    accordion: () => <AccordionSection />,
    people: () => <PeopleSection />,
    badges: () => <BadgesSection />,
    'data-table': () => <DataTableSection />,
    kbd: () => <KbdSection />,
    markdown: () => <MarkdownSection />,
    'qr-code': () => <QrCodeSection />,
    'sortable-list': () => <SortableListSection />,
    'status-icons': () => <StatusIconsSection />,
    alerts: () => <AlertsSection />,
    'empty-state': () => <EmptyStateSection />,
    loading: () => <LoadingSection />,
    progress: () => <ProgressSection />,
    'command-palette': () => <CommandPaletteSection onOpenCommand={() => setCommandOpen(true)} />,
    dialogs: () => <DialogsSection />,
    menus: () => <MenusSection />,
    sheets: () => <SheetsSection />,
    popovers: () => <PopoversSection />,
    breadcrumb: () => <BreadcrumbSection />,
    'nav-menus': () => <NavMenusSection />,
    pagination: () => <PaginationSection />,
    tabs: () => <TabsSection />,
    cards: () => <CardsSection />,
    'page-header': () => <PageHeaderSection />,
    resizable: () => <ResizableSection />,
    'scroll-area': () => <ScrollAreaSection />,
    separator: () => <SeparatorSection />,
    charts: () => <ChartsSection />,
    gantt: () => <GanttSection />,
    'ai-components': () => <AiComponentsSection />,
    'app-shell': () => <AppShellSection />,
    list: () => <JobListSection />,
    board: () => <BoardSection />,
    issue: () => <IssueSection />,
    inbox: () => <InboxSection />,
    dashboard: () => <DashboardSection />,
    calendar: () => <CalendarSection />,
    roadmap: () => <RoadmapSection />,
    'dock-schedule': () => <DockScheduleSection />,
    settings: () => <SettingsSection />,
    'audit-log': () => <AuditLogSection />,
    'forms-catalogue': () => <FormsCatalogueSection />,
    'form-builder': () => <FormBuilderSection />,
    pricing: () => <PricingSection />,
    onboarding: () => <OnboardingSection />,
    'sign-in': () => <SignInSection />,
    'ai-overview': () => <AiOverviewSection />,
    'ai-workspace': () => <AiWorkspaceSection />,
    'ai-features': () => <AiFeaturesSection />,
    'ai-agents': () => <AiAgentsSection />,
    'ai-connectors': () => <AiConnectorsSection />,
    'ai-projects': () => <AiProjectsSection />,
    'ai-knowledge': () => <AiKnowledgeSection />,
    'ai-settings': () => <AiSettingsSection />,
    'ai-skills': () => <AiSkillsSection />,
    icons: () => <IconsSection part="icons" />,
    props: () => <IconsSection part="props" />,
    'all-icons': () => <IconsSection part="all-icons" />,
  }
  const Demos = DEMOS[page.id]
  // The AI group's component pages count as components here too.
  const components = [
    ...(NAV_GROUPS.find((g) => g.title === 'Components')?.items ?? []),
    ...(NAV_GROUPS.find((g) => g.title === 'AI')?.items.filter((i) => i.category === 'Components') ?? []),
  ]

  // Every component on one long page, as the kit was before it had one page
  // per section. Each section links to its own page for the playground; a
  // page with no examples shows its demos here instead.
  // A render function, not a component, so it never remounts its sections.
  function overview() {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-12">
        <PageHeader
          size="lg"
          title="All components"
          description="Every component at a glance. Open a section for its playground, variants and code."
        />
        <InOverview.Provider value>
          {components.map((c) => {
            const PageDemo = DEMOS[c.id]
            return (
              <PageDemos.Provider key={c.id} value={PageDemo ? <PageDemo /> : null}>
                {PAGES[c.id]?.()}
              </PageDemos.Provider>
            )
          })}
        </InOverview.Provider>
      </div>
    )
  }

  useEffect(() => {
    document.title = `${page.label} · UI Kit`
  }, [page.label])

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
      else if (key === 'C') {
        e.preventDefault()
        setCreateOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function run(action: () => void) {
    setCommandOpen(false)
    action()
  }

  const index = NAV.findIndex((n) => n.id === page.id)
  const prev = NAV[index - 1]
  const next = NAV[index + 1]

  return (
    <div className="flex min-h-svh">
      <ShowcaseSidebar active={page.id} onSearch={() => setCommandOpen(true)} onShortcuts={() => setShortcutsOpen(true)} />

      <div className="min-w-0 flex-1">
        <header className="bg-background/85 sticky top-0 z-20 flex h-11 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
          <span className="text-muted-foreground hidden text-xs sm:inline">{group?.title}</span>
          <span className="text-muted-foreground/50 hidden text-xs sm:inline">/</span>
          <span className="truncate text-xs font-medium">{page.label}</span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setCommandOpen(true)}>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </Button>
            <IconAction
              label="Keyboard shortcuts"
              icon={KeyboardIcon}
              shortcut={['?']}
              size="icon"
              className="text-foreground hidden md:inline-flex"
              onClick={() => setShortcutsOpen(true)}
            />
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
            <ThemeToggle />
            <Button size="sm" aria-label="New job" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              <span className="hidden sm:inline">New job</span>
            </Button>
          </div>
        </header>

        <nav aria-label="Pages" className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Button
              key={item.id}
              variant={page.id === item.id ? 'secondary' : 'ghost'}
              size="sm"
              aria-current={page.id === item.id ? 'page' : undefined}
              ref={page.id === item.id ? (el) => el?.scrollIntoView({ inline: 'center', block: 'nearest' }) : undefined}
              onClick={() => goTo(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <main key={page.id} className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-6 pb-16 md:px-6">
          <PageDemos.Provider value={Demos ? <Demos /> : null}>
            {PAGES[page.id]?.()}
          </PageDemos.Provider>

          <nav aria-label="Previous and next page" className="grid grid-cols-2 gap-3 border-t pt-6">
            {prev ? (
              <button
                type="button"
                onClick={() => goTo(prev.id)}
                className="hover:bg-accent/60 focus-visible:ring-ring/40 grid justify-items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left outline-none focus-visible:ring-2"
              >
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3" /> Previous
                </span>
                <span className="text-xs font-medium">{prev.label}</span>
              </button>
            ) : <span />}
            {next && (
              <button
                type="button"
                onClick={() => goTo(next.id)}
                className="hover:bg-accent/60 focus-visible:ring-ring/40 grid justify-items-end gap-0.5 rounded-lg border px-3 py-2.5 text-right outline-none focus-visible:ring-2"
              >
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  Next <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3" />
                </span>
                <span className="text-xs font-medium">{next.label}</span>
              </button>
            )}
          </nav>
        </main>
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <QuickCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => run(() => setCreateOpen(true))}>
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
            {NAV_GROUPS.flatMap((g) => byCategory(g.items).map((part) => (
              <CommandGroup key={`${g.title}-${part.category}`} heading={`Go to · ${g.title}${part.category ? ` · ${part.category}` : ''}`}>
                {part.items.map((item) => {
                  const go = GO_KEYS.find((k) => k.id === item.id)
                  return (
                    <CommandItem key={item.id} onSelect={() => run(() => goTo(item.id))}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} /> {item.label}
                      {go && <CommandShortcut>G {go.key}</CommandShortcut>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )))}
            <CommandGroup heading="Templates">
              {TEMPLATES.map((m) => (
                <CommandItem key={m.path} onSelect={() => run(() => { window.location.hash = m.path })}>
                  <HugeiconsIcon icon={m.icon} strokeWidth={2} /> {m.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
