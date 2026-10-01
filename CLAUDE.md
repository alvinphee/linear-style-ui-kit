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
    ├── components/
    │   └── ui/                shadcn components (ours to edit)
    ├── lib/
    │   ├── theme.tsx          light / dark / system switch
    │   └── utils.ts
    └── pages/
        ├── KitchenSink.tsx      page shell, header, shortcuts, Ctrl+K menu
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
            ├── ai/                    its engine, scripted scenarios and parts
            ├── AiFeaturesSection.tsx  inline AI, summary, triage, AI search and more
            ├── ai-features/           its panels and scripted helpers
            └── IconsSection.tsx
```

## The kitchen sink page
One long page in four sidebar groups: **Get started** (theme), **Components**
(every shadcn component, restyled), **Patterns** (Linear-style screens built
from them: list, board, issue detail, inbox, roadmap, settings, onboarding,
sign-in) and **Icons** (the Hugeicons test). The job list, board and issue
page share one store (`jobs-store.tsx`), so an edit in one shows in all.

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
  menu opens.
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
