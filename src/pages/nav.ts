import type { IconSvgElement } from '@hugeicons/react'
import {
  ChartAreaIcon, Compass01Icon, CursorPointer02Icon, FileUploadIcon, GridViewIcon, InboxIcon,
  InformationCircleIcon, Money03Icon, DashboardSquare01Icon, Calendar03Icon, FormIcon, Table01Icon,
  Audit01Icon, SparklesIcon, AiChat02Icon,
  InputTextIcon, KanbanIcon, Layers01Icon, LayersIcon, LeftToRightListBulletIcon, Login01Icon,
  PaintBoardIcon, Rocket01Icon, Search01Icon, Settings01Icon, Settings02Icon, SlidersHorizontalIcon,
  Tag01Icon, Task01Icon, TimelineIcon,
} from '@hugeicons/core-free-icons'

export type NavItem = { id: string; label: string; icon: IconSvgElement }

// Each item is a section id on the page, in page order.
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Get started',
    items: [{ id: 'theme', label: 'Theme', icon: PaintBoardIcon }],
  },
  {
    title: 'Components',
    items: [
      { id: 'buttons', label: 'Buttons', icon: CursorPointer02Icon },
      { id: 'forms', label: 'Forms', icon: InputTextIcon },
      { id: 'form-modals', label: 'Form modals', icon: FormIcon },
      { id: 'inputs', label: 'More inputs', icon: SlidersHorizontalIcon },
      { id: 'status', label: 'Status', icon: Tag01Icon },
      { id: 'display', label: 'Feedback and display', icon: InformationCircleIcon },
      { id: 'charts', label: 'Charts', icon: ChartAreaIcon },
      { id: 'overlays', label: 'Menus and overlays', icon: Layers01Icon },
      { id: 'overlays-more', label: 'More overlays', icon: LayersIcon },
      { id: 'navigation', label: 'Navigation', icon: Compass01Icon },
      { id: 'content', label: 'Uploads and editor', icon: FileUploadIcon },
      { id: 'data-table', label: 'Data table', icon: Table01Icon },
    ],
  },
  {
    title: 'Patterns',
    items: [
      { id: 'list', label: 'Job list', icon: LeftToRightListBulletIcon },
      { id: 'board', label: 'Board', icon: KanbanIcon },
      { id: 'issue', label: 'Issue detail', icon: Task01Icon },
      { id: 'inbox', label: 'Inbox', icon: InboxIcon },
      { id: 'dashboard', label: 'Dashboard', icon: DashboardSquare01Icon },
      { id: 'calendar', label: 'Calendar', icon: Calendar03Icon },
      { id: 'roadmap', label: 'Roadmap', icon: TimelineIcon },
      { id: 'settings', label: 'Settings', icon: Settings01Icon },
      { id: 'audit-log', label: 'Audit log', icon: Audit01Icon },
      { id: 'pricing', label: 'Pricing', icon: Money03Icon },
      { id: 'onboarding', label: 'Onboarding', icon: Rocket01Icon },
      { id: 'sign-in', label: 'Sign-in page', icon: Login01Icon },
    ],
  },
  {
    title: 'AI',
    items: [
      { id: 'ai-workspace', label: 'AI workspace', icon: AiChat02Icon },
      { id: 'ai-features', label: 'AI in the product', icon: SparklesIcon },
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

export function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
