import type { IconSvgElement } from '@hugeicons/react'
import {
  Airplane01Icon, Book02Icon, Briefcase01Icon, Building03Icon, Calendar03Icon, Camera01Icon, ChartLineData01Icon,
  CustomerSupportIcon, Database01Icon, DeliveryTruck01Icon, FavouriteIcon, Folder01Icon, Globe02Icon, Idea01Icon,
  Invoice01Icon, Leaf01Icon, Mail01Icon, Megaphone01Icon, Mortarboard01Icon, Note01Icon, PaintBoardIcon, Pen01Icon,
  Rocket01Icon, Search01Icon, Shield01Icon, ShoppingCart01Icon, SourceCodeIcon, Target02Icon, TestTube01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import type { ColourOption, IconOption } from '@/components/icon-colour-picker'
import type { ProjectTemplate } from '@/blocks/ai/projects/new-project-dialog'

// The icons, colours and templates a new project can start from. Projects
// are saved as JSON in the browser, so they keep an icon and a colour by id
// and look them up here.

export const PROJECT_ICONS: IconOption[] = [
  { id: 'folder', icon: Folder01Icon, label: 'Folder' },
  { id: 'rocket', icon: Rocket01Icon, label: 'Rocket' },
  { id: 'chart', icon: ChartLineData01Icon, label: 'Chart' },
  { id: 'book', icon: Book02Icon, label: 'Book' },
  { id: 'code', icon: SourceCodeIcon, label: 'Code' },
  { id: 'briefcase', icon: Briefcase01Icon, label: 'Briefcase' },
  { id: 'truck', icon: DeliveryTruck01Icon, label: 'Truck' },
  { id: 'megaphone', icon: Megaphone01Icon, label: 'Megaphone' },
  { id: 'search', icon: Search01Icon, label: 'Search' },
  { id: 'pen', icon: Pen01Icon, label: 'Pen' },
  { id: 'support', icon: CustomerSupportIcon, label: 'Headset' },
  { id: 'note', icon: Note01Icon, label: 'Note' },
  { id: 'idea', icon: Idea01Icon, label: 'Light bulb' },
  { id: 'target', icon: Target02Icon, label: 'Target' },
  { id: 'globe', icon: Globe02Icon, label: 'Globe' },
  { id: 'cart', icon: ShoppingCart01Icon, label: 'Cart' },
  { id: 'calendar', icon: Calendar03Icon, label: 'Calendar' },
  { id: 'mail', icon: Mail01Icon, label: 'Mail' },
  { id: 'invoice', icon: Invoice01Icon, label: 'Invoice' },
  { id: 'school', icon: Mortarboard01Icon, label: 'Graduation cap' },
  { id: 'lab', icon: TestTube01Icon, label: 'Test tube' },
  { id: 'database', icon: Database01Icon, label: 'Database' },
  { id: 'shield', icon: Shield01Icon, label: 'Shield' },
  { id: 'building', icon: Building03Icon, label: 'Building' },
  { id: 'team', icon: UserGroupIcon, label: 'Team' },
  { id: 'palette', icon: PaintBoardIcon, label: 'Palette' },
  { id: 'camera', icon: Camera01Icon, label: 'Camera' },
  { id: 'leaf', icon: Leaf01Icon, label: 'Leaf' },
  { id: 'heart', icon: FavouriteIcon, label: 'Heart' },
  { id: 'plane', icon: Airplane01Icon, label: 'Plane' },
]

// Theme tokens only, so every colour follows the theme and the mode.
export const PROJECT_COLOURS: ColourOption[] = [
  { id: 'accent', value: 'var(--chart-1)', label: 'Accent' },
  { id: 'teal', value: 'var(--chart-2)', label: 'Teal' },
  { id: 'amber', value: 'var(--chart-3)', label: 'Amber' },
  { id: 'green', value: 'var(--chart-4)', label: 'Green' },
  { id: 'red', value: 'var(--chart-5)', label: 'Red' },
  { id: 'grey', value: 'var(--status-todo)', label: 'Grey' },
  { id: 'ink', value: 'var(--foreground)', label: 'Ink' },
]

const ICONS_BY_ID = new Map(PROJECT_ICONS.map((i) => [i.id, i.icon]))
const COLOURS_BY_ID = new Map(PROJECT_COLOURS.map((c) => [c.id, c.value]))

// A saved icon id as an icon. The folder when the id is unknown or missing.
export function projectIcon(id?: string): IconSvgElement {
  return (id && ICONS_BY_ID.get(id)) || Folder01Icon
}

// A saved colour id as a CSS colour. Grey when the id is unknown or missing.
export function projectColour(id?: string): string {
  return (id && COLOURS_BY_ID.get(id)) || 'var(--status-todo)'
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from nothing and write your own instructions.',
    icon: 'folder',
    colour: 'grey',
    instructions: '',
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Gather sources, compare them and sum up what they agree on.',
    icon: 'search',
    colour: 'teal',
    examples: ['Cite a source for every claim', 'Flag where sources disagree', 'End with open questions'],
    instructions: [
      'You are a careful research assistant.',
      '- Cite a source for every claim, and say how recent it is.',
      '- When sources disagree, show both sides and which is stronger.',
      '- Separate what is known from what is likely.',
      '- End each answer with the open questions worth looking into next.',
    ].join('\n'),
  },
  {
    id: 'writing',
    name: 'Writing',
    description: 'Drafts and edits in one house style.',
    icon: 'pen',
    colour: 'accent',
    examples: ['Plain words, short sentences', 'British spelling', 'Offer two headline options'],
    instructions: [
      'Help me write and edit in our house style.',
      '- Plain words and short sentences. Active voice.',
      '- British spelling. No exclamation marks.',
      '- When you edit, keep my meaning and list what you changed.',
      '- For any headline or subject line, offer two options.',
    ].join('\n'),
  },
  {
    id: 'support',
    name: 'Customer support',
    description: 'Replies to customers that are kind, clear and on policy.',
    icon: 'support',
    colour: 'green',
    examples: ['Warm, never defensive', 'Quote the policy it follows', 'Say what happens next'],
    instructions: [
      'Draft replies to customer tickets.',
      '- Warm and direct, never defensive. Thank them once, not three times.',
      '- Follow the policies in the project knowledge, and name the one you used.',
      '- Say exactly what happens next and when.',
      '- If the answer is not in the policies, say so and suggest escalating.',
    ].join('\n'),
  },
  {
    id: 'code-review',
    name: 'Code review',
    description: 'Review changes for bugs first, then style.',
    icon: 'code',
    colour: 'red',
    examples: ['Bugs before style', 'Suggest the fix as a diff', 'Mark each point by severity'],
    instructions: [
      'Review code changes I paste or attach.',
      '- Look for bugs, security issues and missing tests before style.',
      '- Mark each point as Blocking, Should fix or Nit.',
      '- Suggest each fix as a short diff.',
      '- Follow the conventions in the project knowledge.',
    ].join('\n'),
  },
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    description: 'Turn transcripts into decisions and actions.',
    icon: 'note',
    colour: 'amber',
    examples: ['Decisions, then actions', 'An owner and a due date each', 'Under 200 words'],
    instructions: [
      'Turn meeting transcripts and rough notes into minutes.',
      '- Start with the date and who attended.',
      '- List the decisions, one per line.',
      '- End with actions as a table: action, owner, due date.',
      '- Keep it under 200 words unless I ask for more.',
    ].join('\n'),
  },
]
