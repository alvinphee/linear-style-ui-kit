# Architecture

How the kit is put together, and where new code goes. The short version:
**build every screen from smaller kit parts, and keep each part in one
place.** Terms are defined in `docs/glossary.md`.

## Atomic design

The kit follows atomic design (Brad Frost): small parts combine into bigger
ones, level by level. Building something from smaller parts is called
composition. We use shadcn's names for the levels:

| Level | Atomic design name | Folder | Examples |
|---|---|---|---|
| 0. Tokens | (design tokens) | `src/styles.css` | colours, radius, type size, status colours |
| 1. Components | atoms | `src/components/ui/` | shadcn: button, badge, avatar, dropdown menu |
| 1. Components | molecules | `src/components/` | ours: user avatar, status badge, status icon, icon action |
| 2. Blocks | organisms | `src/blocks/` | kanban board, data table, prompt box, AI summary card |
| 3. Layouts | templates | the App shells page | sidebar and header frame |
| 4. Templates | pages | `src/templates/` | ERP app, ERP + AI app, AI chat app |

Each level is built only from the levels below it. A kanban board (block) is
made of buttons, dropdown menus and avatars (components); the ERP's pipeline
page (template) is made of the kanban board.

## The one rule: one home per part

A part used in more than one place has exactly one home, at its level, and
everything else imports it from there:

- **Small part** (one job, no data of its own): `src/components/<name>.tsx`.
  Shown on its kit page with a playground.
- **Bigger composition** (several parts working together): `src/blocks/`.
  Takes its data as props and holds no sample data, so any app can use it.
- **Plain function or hook** (formatting, clipboard, timers): `src/lib/`.

Never copy a part into a page or template, and never re-draw one by hand
(an initials circle, a status pill, keyboard keys). If the kit's part is
nearly right, extend it with a prop rather than writing a second one.

A part written inside a kit page (`src/pages/sections/…`) is a demo, not a
kit part: it can be seen in the kitchen sink but cannot be reused or
published. As soon as a second file needs it, move it to its level.

## What is not a level

These folders hold code that is not part of the design system:

- **Kit pages** (`src/pages/`): the kitchen sink, the documentation. They
  show the parts, and wire them to sample data. `sections/shared.tsx`
  (Section, Panel, Row) and `playground/` are the kitchen sink's own chrome.
- **Sample data and stores**: the kit's jobs (`src/pages/data.ts`,
  `jobs-store.tsx`, and `job-options.tsx` for the jobs' menu and filter
  options), the AI workspace's scripted engine
  (`src/pages/sections/ai/`), the ERP's records and answers
  (`src/templates/erp/`). They feed the parts made-up content. Domain wiring
  that only makes sense for that data (a job's context menu and row in
  `sections/JobActions.tsx`, its filter set-up in `sections/FilterBar.tsx`,
  the ERP's Ask AI answers) stays with the data, built from kit parts.

Sample data may use kit vocabulary (a job's status is the kit's
`WorkflowStatus`), never the other way round: components and blocks never
import from `src/pages/` or `src/templates/`.

## Templates and editions

A template is a whole app made from layouts, blocks and components. Two
templates can share one codebase as editions: the ERP + AI template is the
ERP with `edition: WITH_AI` (`src/templates/erp/edition.ts`). Switch
features on with `edition()`, never by copying the app.

## Before you add something

1. Is there a kit part for it? Check `src/components/`, `src/blocks/` and
   the kitchen sink. Use it, or add a prop to it.
2. If not, and it will be used in more than one place, build it at its level
   first: component or block, with a playground on its kit page. Then use it.
3. Use the industry term for its name, and add it to the glossary.
4. Keep data out of components and blocks: pass it in as props.

## Known exceptions

- The AI chat template (`src/templates/ai-chat/`) renders the AI workspace
  from `src/pages/sections/AiWorkspaceSection.tsx`, because the workspace
  runs on the kit's sample jobs. Its frame is planned as a layout.
- Single-use parts stay where they are used until a second user appears:
  Stepper (FormModalsSection), DiffText (ai-features/shared.tsx),
  GrowingTextarea (IssueSection).
- Compact money ("$48.0k" on the Dashboard, "$48K" in the ERP) is written
  two ways on purpose; the ERP keeps its own currency formatting.

## How it was checked
The October 2026 refactor (`docs/refactor/`) audited every page and
template, moved each copy to its home and removed the re-export layers.
To check again, look for: a part defined in `src/pages` or `src/templates`
and imported by another file, markup that re-draws a kit part, and a
function written twice.

## The shadcn registry (planned)

Components and blocks are what the registry will publish: each becomes a
registry item with its dependencies, so another project can install it with
`npx shadcn add`. This is why parts must live at their level, take data as
props and import only from the levels below.
