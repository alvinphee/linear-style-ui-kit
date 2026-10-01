# Linear-style UI Kit

## What this folder is
A standalone showcase app: how to use **Hugeicons** with **shadcn/ui** to
build a sleek, Linear-style SaaS interface. It is its own project and is
not tied to any other app. Keep its content generic SaaS. Nothing here ships.

## Stack
- React + Vite + TypeScript
- Tailwind v4 + shadcn/ui, style **radix-mira** (the compact "Mira" preset)
- Icons: `@hugeicons/react` + `@hugeicons/core-free-icons` (free set only).
  `components.json` has `"iconLibrary": "hugeicons"`, so every component
  shadcn adds already uses `HugeiconsIcon`. Lucide is not installed.
- Font: Inter (`@fontsource-variable/inter`)
- Toasts: sonner. Command menu: cmdk.

## Run
```bash
npm install
npm run dev
```
It opens on http://localhost:5180. That is not Vite's default 5173, so it
never clashes with another Vite app.

Add a shadcn component (it arrives with Hugeicons already):
```bash
npx shadcn@latest add <name>
```

## Layout
```
linear-style-ui-kit/
├── .claude/
│   ├── launch.json            dev server config for the Claude app's preview
│   ├── settings.json          turns on the MCP server without asking
│   └── skills/
│       └── hugeicons/         the Hugeicons skill (see below)
├── .mcp.json                  the Hugeicons MCP server
├── CLAUDE.md
├── components.json            shadcn settings (style, icon library, paths)
├── docs/
│   ├── agent-brief.md         the rules given to each helper
│   └── findings.md            what we have learned so far
└── src/
    ├── main.tsx
    ├── App.tsx                theme, tooltip and toast providers
    ├── styles.css             Tailwind + the Linear-style colour tokens
    ├── blocks/                reusable blocks: props in, no sample data
    │   ├── ai/                prompt box, chat history, artifact panel, thinking
    │   │                      trail, chat message, markdown (the AI workspace,
    │   │                      AI in the product and the ERP copilot share them)
    │   ├── data-table/        TanStack table: toolbar, facets, views, bulk bar, CSV
    │   ├── filter-bar/        filter menu, filter chips, saved views, search
    │   ├── folding-breadcrumb.tsx  breadcrumb that folds to fit
    │   ├── form-dialog.tsx    field-driven dialog, quick create, property pills
    │   ├── kanban-board.tsx   columns, drag and drop, "Move to…" menu
    │   ├── kpi-card.tsx       KPI card, delta badge, sparkline, grid
    │   ├── notifications-menu.tsx  the bell's popover
    │   ├── period-picker.tsx  period switch, compare, date range picker
    │   └── record-sheet.tsx   side panel (peek) for one record
    ├── components/
    │   ├── ui/                shadcn components (ours to edit)
    │   ├── person.tsx         UserAvatar (initials), Person (avatar and name)
    │   ├── status-badge.tsx   status pill with a tone and a dot
    │   ├── mark.tsx           LetterMark, IconMark
    │   ├── delta-badge.tsx    the change on the period before
    │   ├── sparkline.tsx      tiny line chart
    │   ├── page-header.tsx    title, description, actions
    │   ├── panel.tsx          the kit's titled card
    │   ├── nav-item.tsx       sidebar row, NavHeading
    │   ├── search-trigger.tsx button that looks like search and opens the palette
    │   ├── shortcut.tsx       keyboard keys, ⌘ or Ctrl by platform
    │   ├── ai-label.tsx       "AI" tag for AI-made content
    │   ├── thinking-indicator.tsx  Thinking…, shimmer, typing dots, caret, timer
    │   ├── icon-action.tsx    icon button with a tooltip (copy, retry, close…)
    │   └── file-chip.tsx      attached file: icon, name, size, remove
    ├── lib/
    │   ├── router.ts          hash routes: #/buttons, #/templates/erp
    │   ├── theme.tsx          light / dark / system switch
    │   └── utils.ts
    ├── templates/             whole apps built from the kit (level 5)
    │   ├── ai-chat/AiChatApp.tsx   the AI workspace filling the window
    │   └── erp/               the ERP app (see "The ERP template")
    └── pages/
        ├── KitchenSink.tsx      page shell, one section per page, header, shortcuts, Ctrl+K menu
        ├── playground/          a page's live demos, one file per page id
        │   ├── Playground.tsx   Playground, Variants, Gallery, CodeBlock, jsx()
        │   └── buttons.tsx …    the reference page; others follow its shape
        ├── ShowcaseSidebar.tsx  workspace switcher, folding nav groups
        ├── ShortcutsSheet.tsx   the "?" keyboard shortcuts sheet
        ├── nav.ts               nav groups, section ids, G-then shortcuts
        ├── data.ts              icon groups, statuses, labels, sample jobs
        ├── jobs-store.tsx       shared job state (list, board, issue page)
        └── sections/
            ├── shared.tsx            Section and Panel wrappers
            ├── ThemeSection.tsx      presets and the theme mixer
            ├── ButtonsSection.tsx
            ├── FormsSection.tsx
            ├── FormModalsSection.tsx quick create, validated dialogs, wizard
            ├── InputsSection.tsx     button groups, OTP, dates, combobox, tags
            ├── StatusSection.tsx     also exports StatusIcon, PriorityIcon, Initials
            ├── DisplaySection.tsx    spinners, empty states, alerts, accordion
            ├── ChartsSection.tsx     area, bars, rings, cycle burn-down
            ├── OverlaysSection.tsx
            ├── OverlaysMoreSection.tsx  context menu, sheets, drawer, hover card
            ├── NavigationSection.tsx    breadcrumb, pagination, menus, panes
            ├── ContentSection.tsx    file upload, Markdown editor, reorder list
            ├── DataTableSection.tsx  TanStack table: sort, filter, paginate, export
            ├── AppShellSection.tsx   sidebar and header variations, mixed live
            ├── app-shell/             its grouped list and board, Display and notifications menus
            ├── JobListSection.tsx    grouped list with bulk select
            ├── FilterBar.tsx         filter chips, saved views, display options
            ├── BoardSection.tsx      Kanban with drag and drop
            ├── IssueSection.tsx      issue detail and properties panel
            ├── InboxSection.tsx
            ├── DashboardSection.tsx  KPI cards, sparklines, range switch
            ├── CalendarSection.tsx   month and week views
            ├── RoadmapSection.tsx
            ├── SettingsSection.tsx
            ├── AuditLogSection.tsx   filterable event log
            ├── PricingSection.tsx    plans, yearly switch, comparison table
            ├── OnboardingSection.tsx
            ├── SignInSection.tsx
            ├── AiWorkspaceSection.tsx AI chat workspace: projects, history, agent, artifacts
            ├── ai/                    its engine, scripted scenarios, parts and SettingsDialog
            ├── AiFeaturesSection.tsx  inline AI, summary, triage, AI search and more
            ├── ai-features/           its panels and scripted helpers
            └── IconsSection.tsx
```

## The kitchen sink
One page per section, like Storybook. The sidebar follows the kit's five
levels, smallest first (definitions in `docs/glossary.md`):
- **Get started:** All components (every component on one long page, the
  quick look) and Theme (the design tokens)
- **Components:** single building blocks (button, input, badge…), restyled,
  each with its playground and variants
- **Blocks:** whole screens built from components, as shadcn calls them
  (list, board, issue detail, inbox, roadmap, settings, onboarding, sign-in,
  the AI workspace, AI in the product…)
- **Layouts:** the frame pages sit in (App shells)
- **Icons:** the Hugeicons test
- **Templates:** whole apps, outside the kit's shell (see below)

Use the industry term for everything (see `docs/glossary.md`), and add a
new term there before using it.

Each nav item is a route: `#/buttons`, `#/board`…
(`src/lib/router.ts`, no router package). The job list, board and issue
page share one store (`jobs-store.tsx`), so an edit in one shows in all.

A component page shows, in order: its **playgrounds** (live preview, a props
pane and the generated code to copy), **variant grids** (every value of a
prop, crossed with another), **states**, then the hand-made **examples**.
The demos live in `src/pages/playground/<page id>.tsx` and are picked up by
file name; `Section` renders them between its header and the examples.

**Templates** are whole apps made from the kit's layouts and blocks, shown
full page outside the kit's shell. They import the same components and
share the same stores, so a chat started in the kit shows up in the AI chat
template. List them in `TEMPLATES` (`nav.ts`) and route them in `App.tsx`.
- `#/templates/ai-chat`: the AI workspace filling the window, with Settings.
- `#/templates/erp`: the ERP app, below.

## The ERP template
A multi-module ERP front end with made-up data, in `src/templates/erp/`.
No back end: records live in memory (`store.tsx`) and reset on reload; the
session, company and starred modules are kept in the browser.
- Flow: sign in (any email and password; demo accounts per role) → choose
  a company (multi-company) → the launchpad → module pages.
- Layout: one sidebar (company switcher, module switcher, the module's
  pages, recent records; notifications and the account at the foot) and the
  page in an inset card. The header holds the folding breadcrumb (company ›
  module › section › page), a search box and Ask AI; the account menu's
  Header option can drop the search box, which moves search to the sidebar. With the sidebar hidden (`[`), the module
  in the breadcrumb becomes the switcher. On a phone the sidebar is a sheet.
- Modules (`modules.tsx`): CRM, Sales, Inventory, Purchasing, Accounting,
  Human resources, Administration. Each lists its pages; a list page is a
  `ListSpec` (columns, saved views, create form, bulk actions) rendered by
  `ListPage.tsx`. Roles decide which modules a user sees.
- Every record opens in a side panel (`Overlays.tsx`) and every list with a
  create spec gets the same create dialog.
- Shortcuts: `Ctrl+K` / `⌘K` command palette (modules, pages, records by
  number or name, create, switch role or company), `Ctrl+J` / `⌘J` Ask AI,
  `G` then a letter for a module (`G C` CRM, `G S` Sales, `G I`
  Inventory, `G P` Purchasing, `G A` Accounting, `G H` HR, `G X`
  Administration, `G L` launchpad), `C` create on a list, `[` hide the
  sidebar.
- Routes: `#/templates/erp/<module>/<page>`, for example
  `#/templates/erp/accounting/invoices`.

Shortcuts: `Ctrl+K` command menu, `?` shortcut list, `C` new job, and
`G` then a letter to jump (`G B` board, `G I` inbox, `G S` settings…).
Section ids and shortcut letters live in `src/pages/nav.ts`.

## The Linear look, and where it lives
All of it is in `src/styles.css`, so it can be moved as one piece:
- Near-neutral greys with a faint cool tint, and one indigo accent (`--brand`)
- Borders drawn at 7–9% opacity instead of solid greys
- 13px Inter body text, 28px controls, 8px corner radius
- Dark by default. The switch in the header (or Ctrl+K) changes it.
- Status colours as tokens: `--status-todo`, `--status-progress`,
  `--status-done`, `--status-blocked`

## Themes
Every colour is worked out from five variables on `<html>`:

| Variable | Controls |
|---|---|
| `--brand-h`, `--brand-c` | accent hue and strength (buttons, focus, "done") |
| `--grey-h`, `--grey-t` | tint of all greys: hue, and strength (0 = pure grey) |
| `--radius` | corner rounding |

Plus `data-mono` on `<html>` for black/white buttons, and the `dark` class.
So any accent works with any greys, corners and mode. `src/lib/theme.tsx`
holds the 12 presets and saves the viewer's mix in their browser. The Theme
section (and the Theme button in the header) is the mixer. "Copy as CSS"
gives the five variables for the current mix.

Do not name `--brand-*` / `--grey-*` after shadcn's tokens: shadcn already
uses `--accent` for hover backgrounds.

This copies Linear's *style*, not its code or brand. Keep it that way: no
Linear name, logo or assets in the app.

## Tools in this folder
- **Hugeicons MCP server** (`.mcp.json`): search for an icon with
  `search_icons` before using it. Never guess an icon name.
- **Hugeicons skill** (`.claude/skills/hugeicons/`): follow it for
  imports and props.
- The skill's icon list is older than the package. It lists 5,471 icons
  (v4.2.1), and the installed v4.3.5 has 6,025. If the skill list lacks a
  name, check the package itself:
  ```bash
  node -e "import('@hugeicons/core-free-icons').then(m => console.log(Object.keys(m).filter(n => n.includes('Truck'))))"
  ```

## Rules
- Build each level only from the level below (atomic design, see the
  glossary). A small part used in more than one place is a component in
  `src/components/` (shown on its kit page with a playground); a bigger
  composition is a block.
- A block used in more than one place lives in `src/blocks/`, takes its
  data as props and holds no sample data. Kit pages and templates import it
  from there instead of keeping their own copy. These are what the shadcn
  registry will publish.
- Free icons only. Do not install `@hugeicons-pro/*`; we have no licence.
- Leave out props that match the defaults (`size` 24, `strokeWidth` 1.5,
  `color` currentColor). One exception: `absoluteStrokeWidth` does nothing
  unless `strokeWidth` is also passed, so pass both.
- Inside shadcn components, icons use `strokeWidth={2}` (shadcn's own
  choice for small 14–16px icons). Keep that so everything matches.
- Never install `lucide-react`. If a copied shadcn example imports Lucide,
  swap each icon for its Hugeicons name (see the table in findings).
- Import each icon by name so only the icons we use end up in the bundle.
  The one exception is the "All free icons" section, which loads the whole
  package on purpose. That is why this build is about 7 MB.
- `CommandDialog` does not wrap its children in `<Command>` in this shadcn
  version. Put `<Command>` inside it yourself, or the page crashes when the
  menu opens. Its hidden title has been moved inside the dialog panel: shadcn
  ships it outside, where it renders in the page and can stretch a
  full-height app with a blank scroll area. Keep that change if you re-add
  the component.
- This folder stands alone. Do not link it to, compare it with, merge it
  into or change any other project, unless the user names that project.
- Local only: no git branches, no deploys, no AWS.

## Reinstalling the skill on Windows
`npx skills add https://github.com/hugeicons/hugeicons --skill hugeicons`
fails on Windows. The repository has a file named `icons/re:.svg`, and
Windows does not allow `:` in file names. The skill was copied straight
from git instead:
```bash
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/hugeicons/hugeicons.git hi
cd hi
git show HEAD:skills/hugeicons/SKILL.md > SKILL.md
git show HEAD:skills/hugeicons/references/icon-list.md > icon-list.md
git show HEAD:skills/hugeicons/references/icon-list-flutter.md > icon-list-flutter.md
```
Put `SKILL.md` in `.claude/skills/hugeicons/`, and put the two lists in
`.claude/skills/hugeicons/references/`.

## Findings
Record what we learn in `docs/findings.md` as we go.
