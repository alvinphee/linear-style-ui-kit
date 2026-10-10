import { useMemo } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Agreement01Icon, ChartLineData01Icon, CustomerSupportIcon, DeliveryTruck01Icon, Invoice01Icon, Mail01Icon,
  Note01Icon, PaintBoardIcon, PresentationBarChart01Icon, PuzzleIcon, SourceCodeIcon, TranslateIcon, Xls01Icon,
} from '@hugeicons/core-free-icons'
import type { Skill } from '@/blocks/ai/skills/skill-card'
import { useStoredState } from './prefs'

// The AI chat app's made-up skills. They are kept in the browser
// (useStoredState), so the icon is stored by name and looked up here.

export const SKILLS_KEY = 'linear-kit:ai-skills:v1'

export const SKILL_ICONS: Record<string, IconSvgElement> = {
  puzzle: PuzzleIcon,
  brand: PaintBoardIcon,
  sheet: Xls01Icon,
  minutes: Note01Icon,
  mail: Mail01Icon,
  slides: PresentationBarChart01Icon,
  code: SourceCodeIcon,
  invoice: Invoice01Icon,
  chart: ChartLineData01Icon,
  translate: TranslateIcon,
  contract: Agreement01Icon,
  support: CustomerSupportIcon,
  shipping: DeliveryTruck01Icon,
}

// A skill as it is kept: the icon by its key in SKILL_ICONS.
export type StoredSkill = Omit<Skill, 'icon'> & { icon?: string }

export const toSkill = ({ icon, ...rest }: StoredSkill): Skill => ({ ...rest, icon: SKILL_ICONS[icon ?? 'puzzle'] ?? PuzzleIcon })

// The skills kept in this browser, shared by every component that asks
// (Settings, and later a project's skills): as kept, and with their icons.
export function useSkills() {
  const [stored, setStored] = useStoredState<StoredSkill[]>(SKILLS_KEY, SAMPLE_SKILLS)
  const skills = useMemo(() => stored.map(toSkill), [stored])
  return { stored, skills, setStored }
}

const day = (iso: string) => new Date(`${iso}T09:00:00`).getTime()

export const SAMPLE_SKILLS: StoredSkill[] = [
  {
    id: 'sk-brand',
    name: 'Brand guidelines',
    description: 'Applies the company voice, colours and type to anything written or designed. Use for marketing copy, slides, documents and social posts.',
    source: 'organisation',
    author: 'Marketing team',
    enabled: true,
    icon: 'brand',
    updatedAt: day('2026-09-18'),
    usedIn: ['Launch campaign', 'Website refresh'],
    files: [{ name: 'brand-palette.pdf', size: 482_000 }, { name: 'logo-pack.zip', size: 2_400_000 }],
    instructions: `# Brand guidelines

## Voice
- Plain, warm and direct. Short sentences.
- Say **you** and **we**, never "the user" or "the company".
- No exclamation marks in headings.

## Colours
| Use | Colour | Hex |
|---|---|---|
| Primary | Indigo | #5E6AD2 |
| Text | Ink | #1B1D22 |
| Background | Paper | #F7F8FA |

## Type
Headings in Inter Semibold, body in Inter Regular at 15px. See \`brand-palette.pdf\` for the full guide.`,
  },
  {
    id: 'sk-sheets',
    name: 'Spreadsheet formulas',
    description: 'Writes and explains spreadsheet formulas (lookups, pivots, date maths). Use when someone asks how to calculate something in a sheet.',
    source: 'builtin',
    enabled: true,
    icon: 'sheet',
    updatedAt: day('2026-08-30'),
    instructions: `# Spreadsheet formulas

1. Ask which app the sheet is in if it changes the answer.
2. Give the formula first, in a code block, then explain each part.
3. Prefer \`XLOOKUP\` over \`VLOOKUP\`, and \`LET\` for anything repeated.

\`\`\`
=XLOOKUP(A2, Orders!A:A, Orders!F:F, "Not found")
\`\`\``,
  },
  {
    id: 'sk-minutes',
    name: 'Meeting minutes',
    description: 'Turns notes or a transcript into minutes with decisions and actions. Use when someone asks for minutes, a meeting summary or follow-ups.',
    source: 'yours',
    enabled: true,
    icon: 'minutes',
    updatedAt: day('2026-09-29'),
    usedIn: ['Weekly operations review'],
    files: [{ name: 'minutes-template.docx', size: 36_000 }],
    instructions: `# Meeting minutes

1. Start with the date, who attended and who sent apologies.
2. List each **decision** on its own line, with the owner.
3. End with actions as a table:

| Action | Owner | Due |
|---|---|---|
| … | … | … |

Keep it under one page. Use \`minutes-template.docx\` when a file is asked for.`,
  },
  {
    id: 'sk-email',
    name: 'Customer emails',
    description: 'Drafts replies to customers in a calm, helpful tone with a clear next step. Use for support replies, delays and apologies.',
    source: 'yours',
    enabled: true,
    icon: 'mail',
    updatedAt: day('2026-09-27'),
    instructions: `# Customer emails

- Open by naming their problem in their words.
- Say what happens next and **when**.
- Sign off with my first name only.
- Never promise a refund; offer to check instead.`,
  },
  {
    id: 'sk-slides',
    name: 'Slide decks',
    description: 'Plans and writes presentation slides: one idea per slide, speaker notes, a closing ask. Use when someone needs a deck or a talk outline.',
    source: 'builtin',
    enabled: true,
    icon: 'slides',
    updatedAt: day('2026-08-30'),
    instructions: `# Slide decks

1. Agree the audience and the one thing they should remember.
2. Draft a title for every slide before writing any of them.
3. One idea per slide, at most 25 words on it; the rest goes in speaker notes.
4. End with a clear ask.`,
  },
  {
    id: 'sk-review',
    name: 'Code review',
    description: 'Reviews a diff for bugs, risky changes and missing tests, in order of importance. Use when someone pastes code or a pull request.',
    source: 'builtin',
    enabled: false,
    icon: 'code',
    updatedAt: day('2026-08-30'),
    instructions: `# Code review

Report findings worst first:

1. **Bugs** that change behaviour
2. **Risks**: security, data loss, performance
3. **Tests** that are missing
4. Style, only if asked

Quote the lines you mean, and suggest the fix.`,
  },
  {
    id: 'sk-invoices',
    name: 'Invoice checks',
    description: 'Checks an invoice against its purchase order and delivery: quantities, prices, tax and terms. Use before approving a supplier invoice.',
    source: 'organisation',
    author: 'Finance',
    enabled: true,
    icon: 'invoice',
    updatedAt: day('2026-09-09'),
    files: [{ name: 'approval-limits.xlsx', size: 18_400 }],
    instructions: `# Invoice checks

Match three ways: **purchase order**, **delivery note**, **invoice**.

- Quantities and unit prices must agree within 1%.
- Tax at the supplier's registered rate.
- Payment terms as on the purchase order.

Flag anything over the limits in \`approval-limits.xlsx\` for a second approver.`,
  },
  {
    id: 'sk-analysis',
    name: 'Data analysis',
    description: 'Explores a table or CSV: shape, trends, outliers, and a chart that answers the question. Use when someone shares data and asks what it shows.',
    source: 'builtin',
    enabled: true,
    icon: 'chart',
    updatedAt: day('2026-08-30'),
    instructions: `# Data analysis

1. Describe the data: rows, columns, the date range, gaps.
2. Answer the question asked before anything else.
3. Show one chart, labelled, and say what it shows in a sentence.
4. Say how sure you are, and what would change the answer.`,
  },
  {
    id: 'sk-translate',
    name: 'Translation',
    description: 'Translates text while keeping its tone, names and formatting. Use when someone asks for a version in another language.',
    source: 'builtin',
    enabled: false,
    icon: 'translate',
    updatedAt: day('2026-08-30'),
    instructions: `# Translation

- Keep product names, code and numbers as they are.
- Match the register: formal stays formal.
- Note any phrase with no good equivalent, after the translation.`,
  },
  {
    id: 'sk-contracts',
    name: 'Contract review',
    description: 'Summarises a contract and flags unusual terms: liability, renewal, notice periods. Use when someone shares an agreement to sign.',
    source: 'organisation',
    author: 'Legal',
    enabled: false,
    icon: 'contract',
    updatedAt: day('2026-07-22'),
    instructions: `# Contract review

Summarise in five lines, then flag:

| Term | What to look for |
|---|---|
| Liability | Uncapped, or above 12 months' fees |
| Renewal | Automatic, with under 60 days' notice |
| Termination | No exit for convenience |

> This is not legal advice. Send anything flagged to Legal.`,
  },
  {
    id: 'sk-shipping',
    name: 'Shipment updates',
    description: 'Writes a short status update on a delayed shipment, with the new date and the reason. Use when a delivery slips.',
    source: 'yours',
    enabled: false,
    icon: 'shipping',
    updatedAt: day('2026-09-14'),
    instructions: `# Shipment updates

Three lines, no more:

1. What is late, and the new date.
2. Why, in plain words.
3. What we are doing about it.`,
  },
]
