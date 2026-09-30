import type { IconSvgElement } from '@hugeicons/react'
import {
  ChartAreaIcon, Compass01Icon, CursorPointer02Icon, GridViewIcon, InboxIcon, InformationCircleIcon,
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
      { id: 'inputs', label: 'More inputs', icon: SlidersHorizontalIcon },
      { id: 'status', label: 'Status', icon: Tag01Icon },
      { id: 'display', label: 'Feedback and display', icon: InformationCircleIcon },
      { id: 'charts', label: 'Charts', icon: ChartAreaIcon },
      { id: 'overlays', label: 'Menus and overlays', icon: Layers01Icon },
      { id: 'overlays-more', label: 'More overlays', icon: LayersIcon },
      { id: 'navigation', label: 'Navigation', icon: Compass01Icon },
    ],
  },
  {
    title: 'Patterns',
    items: [
      { id: 'list', label: 'Job list', icon: LeftToRightListBulletIcon },
      { id: 'board', label: 'Board', icon: KanbanIcon },
      { id: 'issue', label: 'Issue detail', icon: Task01Icon },
      { id: 'inbox', label: 'Inbox', icon: InboxIcon },
      { id: 'roadmap', label: 'Roadmap', icon: TimelineIcon },
      { id: 'settings', label: 'Settings', icon: Settings01Icon },
      { id: 'onboarding', label: 'Onboarding', icon: Rocket01Icon },
      { id: 'sign-in', label: 'Sign-in page', icon: Login01Icon },
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
