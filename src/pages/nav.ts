import type { IconSvgElement } from '@hugeicons/react'
import { navigate } from '@/lib/router'
import {
  AiBrain01Icon, AiChat02Icon, BotIcon, BubbleChatSparkIcon, AiInnovation01Icon, AiMagicIcon, Alert02Icon, AppWindowIcon, ArrowLeftRightIcon, ArrowRightDoubleIcon,
  Audit01Icon, Building06Icon, Calendar01Icon, Calendar03Icon, ChartAreaIcon, ChartGanttIcon,
  CheckmarkSquare02Icon, ClipboardCheckIcon, CommandIcon, Comment01Icon, Compass01Icon, CursorPointer02Icon, DashboardSquare01Icon, Database01Icon,
  DragDropVerticalIcon, DropdownFieldTypeIcon, FileEmpty02Icon, FileUploadIcon, Folder01Icon, Flag02Icon, FormIcon,
  GitCompareIcon, GridViewIcon, Heading01Icon, HorizontalResizeIcon, InboxIcon, InputTextIcon, KanbanIcon,
  KeyboardIcon, LayoutGridIcon, LayoutPanelTopIcon, LeftToRightListBulletIcon, ListCollapseIcon, Loading03Icon,
  Login01Icon, MenuSquareIcon, Money03Icon, NoteEditIcon, NotebookTabsIcon, PaintBoardIcon, PanelRightIcon,
  PencilEdit02Icon, Plug01Icon, ProgressIcon, PuzzleIcon, QrCodeIcon, Rocket01Icon, ScrollVerticalIcon, Search01Icon, Settings01Icon, Settings02Icon,
  SidebarLeftIcon, SlidersHorizontalIcon, SolidLine01Icon, SparklesIcon, Table01Icon, Tag01Icon, Task01Icon,
  TaskDone01Icon, TimelineIcon, UserGroupIcon, WarehouseIcon,
} from '@hugeicons/core-free-icons'

// `category` sorts a group's pages under small headings (Components, and
// the AI group's Components and Blocks).
export type NavItem = { id: string; label: string; icon: IconSvgElement; category?: string }

// The kit in five levels, smallest first: tokens (Theme), components,
// blocks (screens built from components), layouts (the frame pages sit in)
// and templates (whole apps, listed in TEMPLATES below). Each item is a page.
// Components get one page per family (a component and its close relatives,
// such as Badge, StatusBadge and DeltaBadge), A to Z within each category.
// AI is a domain across the levels, not a level: its pages have one group of
// their own, after Layouts, with the level as the heading.
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Get started',
    items: [
      { id: 'overview', label: 'All components', icon: LayoutGridIcon },
      { id: 'theme', label: 'Theme', icon: PaintBoardIcon },
      // Full page, outside the kit's shell (ThemeCompare.tsx, routed in App.tsx).
      { id: 'compare', label: 'Theme comparison', icon: GitCompareIcon },
    ],
  },
  {
    title: 'Components',
    items: [
      { id: 'buttons', label: 'Buttons and toggles', icon: CursorPointer02Icon, category: 'Actions' },

      { id: 'check-item', label: 'Check, rating and signature', icon: TaskDone01Icon, category: 'Inputs' },
      { id: 'selection-controls', label: 'Checkbox, radio and switch', icon: CheckmarkSquare02Icon, category: 'Inputs' },
      { id: 'date-picker', label: 'Date picker', icon: Calendar01Icon, category: 'Inputs' },
      { id: 'file-upload', label: 'File upload', icon: FileUploadIcon, category: 'Inputs' },
      { id: 'forms', label: 'Forms', icon: FormIcon, category: 'Inputs' },
      { id: 'select', label: 'Select and combobox', icon: DropdownFieldTypeIcon, category: 'Inputs' },
      { id: 'slider', label: 'Slider', icon: SlidersHorizontalIcon, category: 'Inputs' },
      { id: 'text-fields', label: 'Text fields', icon: InputTextIcon, category: 'Inputs' },

      { id: 'accordion', label: 'Accordion and collapsible', icon: ListCollapseIcon, category: 'Data display' },
      { id: 'people', label: 'Avatars and people', icon: UserGroupIcon, category: 'Data display' },
      { id: 'badges', label: 'Badges and labels', icon: Tag01Icon, category: 'Data display' },
      { id: 'data-table', label: 'Data table', icon: Table01Icon, category: 'Data display' },
      { id: 'kbd', label: 'Keyboard keys', icon: KeyboardIcon, category: 'Data display' },
      { id: 'markdown', label: 'Markdown and editor', icon: NoteEditIcon, category: 'Data display' },
      { id: 'qr-code', label: 'QR code', icon: QrCodeIcon, category: 'Data display' },
      { id: 'sortable-list', label: 'Sortable list', icon: DragDropVerticalIcon, category: 'Data display' },
      { id: 'status-icons', label: 'Status and priority', icon: Flag02Icon, category: 'Data display' },

      { id: 'alerts', label: 'Alerts and toasts', icon: Alert02Icon, category: 'Feedback' },
      { id: 'empty-state', label: 'Empty state', icon: FileEmpty02Icon, category: 'Feedback' },
      { id: 'loading', label: 'Loading', icon: Loading03Icon, category: 'Feedback' },
      { id: 'progress', label: 'Progress', icon: ProgressIcon, category: 'Feedback' },

      { id: 'command-palette', label: 'Command palette', icon: CommandIcon, category: 'Overlays' },
      { id: 'dialogs', label: 'Dialogs', icon: AppWindowIcon, category: 'Overlays' },
      { id: 'menus', label: 'Menus', icon: MenuSquareIcon, category: 'Overlays' },
      { id: 'sheets', label: 'Sheets and drawers', icon: PanelRightIcon, category: 'Overlays' },
      { id: 'popovers', label: 'Tooltips and popovers', icon: Comment01Icon, category: 'Overlays' },

      { id: 'breadcrumb', label: 'Breadcrumb', icon: ArrowRightDoubleIcon, category: 'Navigation' },
      { id: 'nav-menus', label: 'Navigation menus', icon: Compass01Icon, category: 'Navigation' },
      { id: 'pagination', label: 'Pagination', icon: ArrowLeftRightIcon, category: 'Navigation' },
      { id: 'tabs', label: 'Tabs', icon: NotebookTabsIcon, category: 'Navigation' },

      { id: 'cards', label: 'Cards and panels', icon: LayoutPanelTopIcon, category: 'Layout' },
      { id: 'page-header', label: 'Page header', icon: Heading01Icon, category: 'Layout' },
      { id: 'resizable', label: 'Resizable panes', icon: HorizontalResizeIcon, category: 'Layout' },
      { id: 'scroll-area', label: 'Scroll area', icon: ScrollVerticalIcon, category: 'Layout' },
      { id: 'separator', label: 'Separator', icon: SolidLine01Icon, category: 'Layout' },

      { id: 'charts', label: 'Charts', icon: ChartAreaIcon, category: 'Charts' },
      { id: 'gantt', label: 'Gantt parts', icon: ChartGanttIcon, category: 'Charts' },
    ],
  },
  {
    title: 'Blocks',
    items: [
      { id: 'list', label: 'Job list', icon: LeftToRightListBulletIcon },
      { id: 'board', label: 'Board', icon: KanbanIcon },
      { id: 'issue', label: 'Issue detail', icon: Task01Icon },
      { id: 'inbox', label: 'Inbox', icon: InboxIcon },
      { id: 'dashboard', label: 'Dashboard', icon: DashboardSquare01Icon },
      { id: 'calendar', label: 'Calendar', icon: Calendar03Icon },
      { id: 'roadmap', label: 'Roadmap', icon: TimelineIcon },
      { id: 'dock-schedule', label: 'Dock schedule', icon: WarehouseIcon },
      { id: 'settings', label: 'Settings', icon: Settings01Icon },
      { id: 'audit-log', label: 'Audit log', icon: Audit01Icon },
      { id: 'forms-catalogue', label: 'Forms catalogue', icon: ClipboardCheckIcon },
      { id: 'form-builder', label: 'Form builder', icon: PencilEdit02Icon },
      { id: 'pricing', label: 'Pricing', icon: Money03Icon },
      { id: 'onboarding', label: 'Onboarding', icon: Rocket01Icon },
      { id: 'sign-in', label: 'Sign-in page', icon: Login01Icon },
    ],
  },
  {
    title: 'Layouts',
    items: [{ id: 'app-shell', label: 'App shells', icon: SidebarLeftIcon }],
  },
  {
    title: 'AI',
    items: [
      { id: 'ai-overview', label: 'Overview', icon: AiInnovation01Icon },
      { id: 'ai-components', label: 'AI components', icon: AiMagicIcon, category: 'Components' },
      { id: 'ai-workspace', label: 'AI workspace', icon: AiChat02Icon, category: 'Blocks' },
      { id: 'ai-features', label: 'AI in the product', icon: SparklesIcon, category: 'Blocks' },
      { id: 'ai-agents', label: 'Agents', icon: BotIcon, category: 'Blocks' },
      { id: 'ai-chat-features', label: 'Chat features', icon: BubbleChatSparkIcon, category: 'Blocks' },
      { id: 'ai-connectors', label: 'Connectors', icon: Plug01Icon, category: 'Blocks' },
      { id: 'ai-knowledge', label: 'Knowledge', icon: Database01Icon, category: 'Blocks' },
      { id: 'ai-projects', label: 'Projects', icon: Folder01Icon, category: 'Blocks' },
      { id: 'ai-settings', label: 'Settings page', icon: Settings01Icon, category: 'Blocks' },
      { id: 'ai-skills', label: 'Skills and memory', icon: PuzzleIcon, category: 'Blocks' },
    ],
  },
  {
    title: 'Icons',
    items: [
      { id: 'icons', label: 'Icons', icon: GridViewIcon },
      { id: 'props', label: 'Icon props', icon: Settings02Icon },
      { id: 'all-icons', label: 'All free icons', icon: Search01Icon },
    ],
  },
]

export const NAV = NAV_GROUPS.flatMap((g) => g.items)

// A group's items in runs of one category, for the headings inside a group.
// Items without a category make one run with no heading.
export function byCategory(items: NavItem[]) {
  const runs: { category?: string; items: NavItem[] }[] = []
  for (const item of items) {
    const last = runs[runs.length - 1]
    if (last && last.category === item.category) last.items.push(item)
    else runs.push({ category: item.category, items: [item] })
  }
  return runs
}

// Linear-style "G then …" jumps. The letter is the key pressed after G.
export const GO_KEYS: { key: string; id: string }[] = [
  { key: 'T', id: 'theme' },
  { key: 'L', id: 'list' },
  { key: 'B', id: 'board' },
  { key: 'D', id: 'issue' },
  { key: 'I', id: 'inbox' },
  { key: 'R', id: 'roadmap' },
  { key: 'S', id: 'settings' },
]

// Each nav item is its own page now (one section per page).
export function goTo(id: string) {
  navigate(`/${id}`)
}

// Templates: whole apps built from the kit's layouts and blocks, shown full
// page outside the kit's shell. Routed in App.tsx.
export const TEMPLATES: { path: string; label: string; icon: IconSvgElement; description: string }[] = [
  { path: '/templates/erp', label: 'ERP app', icon: Building06Icon, description: 'Multi-module ERP: sign-in, launchpad, modules, Cmd+K' },
  { path: '/templates/erp-ai', label: 'ERP + AI app', icon: AiBrain01Icon, description: 'The ERP with an AI assistant: a briefing and prompt on the launchpad, a full-page Assistant' },
  { path: '/templates/ai-chat', label: 'AI chat app', icon: AiChat02Icon, description: 'The AI workspace as a full-page app: projects, knowledge, agents and runs, settings' },
]
