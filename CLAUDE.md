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
- Toasts: sonner. Command menu: cmdk. QR codes: uqr (encoding only; the kit
  draws the code).

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

Check the kit's rules (also run by `npm run build`):
```bash
npm run check
```

The dev server rebuilds the shadcn registry by itself when a part changes.
To rebuild it without the dev server (see "The registry"):
```bash
npm run registry
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
├── registry.json              the shadcn registry: one item per part (made by the script below)
├── public/
│   └── r/                     the built registry, one JSON per item (not in git; built by the dev server)
├── scripts/
│   ├── check-rules.mjs        npm run check: the rules below, checked on every file
│   └── build-registry.mjs     npm run registry: writes registry.json from each part's imports
├── docs/
│   ├── architecture.md        atomic design: the levels, where each part goes
│   ├── agent-brief.md         the rules given to each helper
│   ├── refactor/              notes from the one-home-per-part refactor
│   ├── findings.md            what we have learned so far
│   ├── ui-comparison.md  why this kit's UI is polished and the another app app's is not
│   ├── brief-vs-setup-study/  test: what the brief, the setup and the model each add
│   │                          (paper.md and figures/); the same folder is kept with the
│   │                          test materials in Desktop\ui-brief-test\docs
│   └── glossary.md            the industry terms we use
└── src/
    ├── main.tsx
    ├── App.tsx                theme, tooltip and toast providers
    ├── styles.css             Tailwind + the Linear-style colour tokens
    ├── shadcn-default.css     shadcn's default theme, used only by the theme comparison
    ├── blocks/                reusable blocks: props in, no sample data
    │   ├── ai/                prompt box, chat history (projects, pinned, chats by
    │   │                      date or as one list), chat library (All chats:
    │   │                      search, filter by type), artifact panel, thinking
    │   │                      trail, chat message, markdown, chat thread (with
    │   │                      the welcome screen and prompt starters), AI
    │   │                      summary card (the AI workspace, AI in the product
    │   │                      and both ERP templates share them)
    │   ├── account-menu.tsx   who is signed in, with their menu: a row at a sidebar's foot, or the avatar in a header
    │   ├── data-table/        TanStack table: toolbar, facets, views, bulk bar, CSV
    │   ├── display-menu.tsx   Display options: layout, grouping, ordering, properties
    │   ├── docked-panel.tsx   side panel beside the page that narrows it (Ask AI): slides, resizes from its edge, a sheet on narrow screens
    │   ├── dock-schedule/     yard dock schedule: day by dock and time slot, docks
    │   │                      as rows or as columns (drag, book a free slot), week
    │   │                      heatmap, slot picker
    │   ├── filter-bar/        filter menu, filter chips, saved views
    │   ├── folding-breadcrumb.tsx  breadcrumb that folds to fit
    │   ├── form-fields.tsx    the field schema and renderer shared by the form dialog and the
    │   │                      form renderer: text, select, radio… and check, yes-no, rating,
    │   │                      photo, signature
    │   ├── form-renderer.tsx  a whole form on a page from its definition: sections, progress,
    │   │                      review step, a draft in the browser, the submission read back
    │   ├── forms-catalogue.tsx  the forms to pick from: search, by category, a QR code per form
    │   │                      (deep link, print), a scanner. Generic: checklists, claims and
    │   │                      surveys are only the sample definitions
    │   ├── global-header.tsx  the top row: start, search in the middle, end (Two rows, the ERP)
    │   ├── form-dialog.tsx    field-driven dialog, quick create, property pills
    │   ├── gantt-chart.tsx    Gantt chart: timescale, bars, milestones, today line, Weeks / Months
    │   ├── grouped-list.tsx   list in folding groups, row shell, selection
    │   ├── kanban-board.tsx   columns, drag and drop, "Move to…" menu, card shell
    │   ├── kpi-card.tsx       KPI card, delta badge, sparkline, grid
    │   ├── markdown.tsx       Markdown renderer (chat replies, artifacts, previews)
    │   ├── notifications-menu.tsx  the bell's popover
    │   ├── period-picker.tsx  period switch, compare, date range picker
    │   ├── record-sheet.tsx   record peek: one record in a centred modal (center peek) or a panel from the right (side peek)
    │   ├── sign-in.tsx        sign-in page parts: form, SSO, aside, footer
    │   └── workspace-switcher.tsx  workspace or company switcher
    ├── components/
    │   ├── ui/                shadcn components (ours to edit)
    │   ├── person.tsx         UserAvatar (initials), Person (avatar and name), NoAssignee
    │   ├── status-badge.tsx   status pill with a tone and a dot
    │   ├── status-icon.tsx    workflow status icon (backlog, todo, in progress, done…)
    │   ├── priority-icon.tsx  priority icon (no priority, low… urgent)
    │   ├── label-dot.tsx      a label's colour dot
    │   ├── mark.tsx           LetterMark, IconMark
    │   ├── delta-badge.tsx    the change on the period before
    │   ├── sparkline.tsx      tiny line chart
    │   ├── page-header.tsx    title, description, actions
    │   ├── panel.tsx          the kit's titled card
    │   ├── nav-item.tsx       sidebar row (also rail), NavHeading, NavGroup
    │   ├── search-trigger.tsx button that looks like search and opens the palette
    │   ├── shortcut.tsx       keyboard keys, ⌘ or Ctrl by platform
    │   ├── ai-label.tsx       "AI" tag for AI-made content
    │   ├── check-item.tsx     one line of a checklist: a statement and its outcome (Pass / Fail / N/A, Yes / No)
    │   ├── rating.tsx         star rating
    │   ├── signature-pad.tsx  sign by hand on a canvas, kept as a picture
    │   ├── qr-scanner.tsx     reads a QR code with the camera (BarcodeDetector), or takes it typed
    │   ├── thinking-indicator.tsx  Thinking…, shimmer, typing dots, caret, timer
    │   ├── icon-action.tsx    icon button with a tooltip and shortcut (copy, retry…)
    │   ├── theme-toggle.tsx   light / dark button for a header
    │   ├── incognito-toggle.tsx  incognito (temporary) chat switch for an AI chat
    │   ├── file-chip.tsx      attached file: icon, name, size, remove
    │   ├── label-dot.tsx      LabelDot, LabelChip
    │   ├── mention.tsx        @mention pill
    │   ├── progress-ring.tsx  circular progress
    │   ├── qr-code.tsx        QR code for a link, with the company's name, a caption and a mark in the middle
    │   ├── chart-legend.tsx   LegendLine, LegendRow
    │   ├── bar-list.tsx       ranked bars (top customers, spend)
    │   ├── gantt-bar.tsx      one item's bar on a Gantt chart: progress, name, %
    │   ├── milestone-marker.tsx  the milestone diamond
    │   ├── time-marker.tsx    today or now on a timeline: a line and its label, down or across
    │   ├── view-switch.tsx    list / board toggle
    │   ├── search-field.tsx   search box with clear and a shortcut hint
    │   ├── delete-confirm.tsx confirm before deleting
    │   ├── comment-box.tsx    write a comment, Ctrl/⌘ Enter to send
    │   ├── usage-meter.tsx    allowance used, with warning colours
    │   └── menu-kit.tsx       one menu's items as dropdown or context menu
    ├── lib/                   plain functions and hooks, no UI
    │   ├── router.ts          hash routes: #/buttons, #/templates/erp
    │   ├── theme.tsx          light / dark / system switch
    │   ├── clipboard.ts       copyText, useCopied
    │   ├── download.ts        downloadText
    │   ├── format.ts          numbers, money, dates, times, sizes, durations
    │   ├── text.ts            plural, slug, initials, greeting
    │   ├── keyboard.ts        isTyping (when single-key shortcuts must not fire)
    │   ├── random.ts          seededRandom for sample data
    │   ├── use-timers.ts, use-svg-id.ts, use-media-query.ts
    │   └── utils.ts
    ├── templates/             whole apps built from the kit (level 5)
    │   ├── ai-chat/AiChatApp.tsx   the AI workspace filling the window
    │   ├── erp/               the ERP app (see "The ERP template")
    │   │   ├── assistant/     Ask AI: answers, shared chats, the Assistant page
    │   │   └── forms/         the Forms module: form definitions, catalogue and fill pages, sample submissions
    │   └── erp-ai/ErpAiApp.tsx     the ERP + AI edition of the same app
    └── pages/
        ├── KitchenSink.tsx      page shell, one section per page, header, shortcuts, Ctrl+K menu
        ├── playground/          a page's live demos, one file per page id
        │   ├── Playground.tsx   Playground, Variants, Gallery, CodeBlock, jsx(), colour options
        │   └── buttons.tsx …    the reference page; others follow its shape
        ├── ShowcaseSidebar.tsx  workspace switcher, folding nav groups, category headings
        ├── ShortcutsDialog.tsx  the "?" keyboard shortcuts, in a modal
        ├── ThemeCompare.tsx     theme comparison: kit theme beside shadcn's default
        ├── nav.ts               nav groups, Components categories, section ids, G-then shortcuts
        ├── data.ts              icon groups, statuses, labels, sample jobs, job constants
        ├── jobs-store.tsx       shared job state (list, board, issue page)
        ├── job-options.tsx      the jobs' status, priority, assignee and label options
        └── sections/
            ├── shared.tsx            Section and Panel wrappers
            ├── ThemeSection.tsx      presets and the theme mixer
            ├── <Page>Section.tsx     one per Components page, named after its id: ButtonsSection,
            │                         TextFieldsSection, QrCodeSection… (39, listed in nav.ts)
            ├── FormsSection.tsx      whole forms, inline and in dialogs, sheets and a wizard;
            │                         exports QuickCreateDialog (the C shortcut)
            ├── DataTableSection.tsx  TanStack table: sort, filter, paginate, export
            ├── AppShellSection.tsx   sidebar and header variations, mixed live (Two rows: a global
            │                         header over the page or the whole app, the breadcrumb under it)
            ├── app-shell/             its grouped list and board, Display and notifications menus
            ├── JobListSection.tsx    grouped list with bulk select
            ├── FilterBar.tsx         filter chips, saved views, display options
            ├── BoardSection.tsx      Kanban with drag and drop
            ├── IssueSection.tsx      issue detail and properties panel
            ├── InboxSection.tsx
            ├── DashboardSection.tsx  KPI cards, sparklines, range switch
            ├── CalendarSection.tsx   month and week views
            ├── RoadmapSection.tsx
            ├── DockScheduleSection.tsx  yard: KPIs, day / week schedule, yard queue, exceptions
            ├── dock-schedule/         its made-up yard, side panel and booking dialog
            ├── FormsCatalogueSection.tsx  forms catalogue, a form filled in (phone width too), submissions
            ├── forms-catalogue/       its sample forms and past submissions
            ├── SettingsSection.tsx
            ├── AuditLogSection.tsx   filterable event log
            ├── PricingSection.tsx    plans, yearly switch, comparison table
            ├── OnboardingSection.tsx
            ├── SignInSection.tsx
            ├── AiWorkspaceSection.tsx AI chat workspace: projects, history, agent, artifacts
            ├── ai/                    its engine, scripted scenarios, parts, All chats and SettingsDialog
            ├── AiFeaturesSection.tsx  inline AI, summary, triage, AI search and more
            ├── ai-features/           its panels and scripted helpers
            └── IconsSection.tsx
```

## The kitchen sink
One page per section, like Storybook. The sidebar follows the kit's five
levels, smallest first (definitions in `docs/glossary.md`):
- **Get started:** All components (every component on one long page, the
  quick look), Theme (the design tokens) and Theme comparison (full page,
  see "Themes")
- **Components:** single building blocks, restyled, each with its
  playground and variants. One page per component family: a component and
  its close relatives (Badges and labels: Badge, StatusBadge, DeltaBadge,
  LabelChip). 39 pages under category headings: Actions, Inputs, Data
  display, Feedback, Overlays, Navigation, Layout, Charts, AI. Every part a
  block uses has its own demo here. A new component joins its family's
  page; a new family gets its own page (see below).
- **Blocks:** whole screens built from components, as shadcn calls them
  (list, board, issue detail, inbox, roadmap, dock schedule, settings,
  onboarding, sign-in, the AI workspace, AI in the product…)
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

To add a Components page: an item with its `category` in `nav.ts` (A to Z
within the category), `sections/<Page>Section.tsx` with the page's
examples (or none: a `Section` without children), a line in `PAGES` in
`KitchenSink.tsx`, and `playground/<page id>.tsx` for its demos. A page
with no examples shows its demos on the All components page.

**Templates** are whole apps made from the kit's layouts and blocks, shown
full page outside the kit's shell. They import the same components and
share the same stores, so a chat started in the kit shows up in the AI chat
template. List them in `TEMPLATES` (`nav.ts`) and route them in `App.tsx`.
- `#/templates/ai-chat`: the AI workspace filling the window, with Settings.
  Its sidebar is laid out like the ERP + AI Assistant's: + New chat; Search
  chats and All chats (a page: search, filter chips by type); Projects (each
  with a menu: new chat in it, edit on its page, delete); Pinned; Chats (one
  list by default, or by date, kept in the browser; any type or one). A chat's type is
  the kind of work its first prompt asked for (`chatTypeOf` in
  `ai/engine.ts`: jobs, writing, research, invoices, code…), shown as an
  icon beside it. Incognito is the toggle at the top right of the chat, not
  in the sidebar: those chats are never saved and are deleted when you
  leave them; opening a kept chat, a project or All chats ends incognito.
- `#/templates/erp`: the ERP app, below.
- `#/templates/erp-ai`: the same ERP with the AI assistant built in, below.

## The ERP template
A multi-module ERP front end with made-up data, in `src/templates/erp/`.
No back end: records live in memory (`store.tsx`) and reset on reload; the
session, company and starred modules are kept in the browser.
- Flow: sign in (any email and password; demo accounts per role) → choose
  a company (multi-company) → the launchpad → module pages.
- Layout: the App shells page's Teams sidebar with the Two rows header (top
  row over the page, account at the sidebar's foot). A full-height sidebar
  (company switcher, module switcher, the module's pages, recent records;
  the account at the foot) beside the page, and two rows over the page: the
  global header (search, which opens the command palette, then Ask AI,
  notifications and the light / dark toggle) and the breadcrumb bar
  (company › module › section › page, folding to fit). With the sidebar
  hidden (`[`), the module switcher and the account move into the global
  header. On a phone the sidebar is a sheet. Ask AI docks under the global
  header, beside the breadcrumb and the page, which narrows to make room (the
  kit's docked panel): the Ask AI button opens and closes it, Escape closes
  it, its edge resizes it and the width is kept in the browser. Below 1024px
  wide it is a sheet over the page.
- Modules (`modules.tsx`): CRM, Sales, Inventory, Purchasing, Accounting,
  Human resources, Forms, Administration. Each lists its pages; a list page is a
  `ListSpec` (columns, saved views, create form, bulk actions) rendered by
  `ListPage.tsx`. Roles decide which modules a user sees.
- Every record opens in a centred modal (center peek, `Overlays.tsx`) and
  every list with a create spec gets the same create dialog.
- Shortcuts: `Ctrl+K` / `⌘K` command palette (modules, pages, records by
  number or name, create, switch role or company), `Ctrl+J` / `⌘J` Ask AI,
  `G` then a letter for a module (`G C` CRM, `G S` Sales, `G I`
  Inventory, `G P` Purchasing, `G A` Accounting, `G H` HR, `G X`
  Administration, `G L` launchpad), `C` create on a list, `[` hide the
  sidebar.
- Routes: `#/templates/erp/<module>/<page>`, for example
  `#/templates/erp/accounting/invoices`. A third segment names one thing on
  the page: `#/templates/erp/forms/catalogue/vehicle-check?context=SGX%204821`
  is that form, open for that vehicle (the link a QR code carries). Signed
  out, the link is kept and returned to after sign-in and the company pick.
- Forms (`forms/`): every form in one catalogue (Forms › All forms), and
  each module's own on its Forms page (Inventory, Sales, HR,
  Administration). The kit's `FormsCatalogue` lists them; `FormRenderer`
  fills one in; a submission is a record (Forms › Submissions, with Failed /
  Passed / Today views) whose peek shows every answer. Each form's QR button
  prints the code that opens it; the Scan button reads one. Ask AI answers
  "Which checks failed this week?" from the submissions.
- Ask AI (`Copilot.tsx`, with its answers, chats and views in `assistant/`)
  answers from the live records: about 25 kinds of question, scripted, no
  model. Record numbers in answers open the record's peek, with Ask AI still
  open beside the page.

### Two editions, one codebase
The ERP + AI template (`#/templates/erp-ai`, `src/templates/erp-ai/`) is
the same app with `edition: WITH_AI` (`edition.ts`). Do not copy ERP code
into it: switch features on with `edition().assistant` instead. It adds:
- Launchpad: a prompt box (in place of the search box) with suggested
  questions, and the AI briefing (an AI summary card of what needs you
  today, marked stale when records change).
- Home › Assistant: the full-page chat. Its chat history fills the app
  sidebar under the Home pages (a page's `sidebar`), so there is still one
  sidebar, laid out like the big chat apps: + New chat; Search chats and All
  chats; Projects (folders of chats, each with
  instructions, set up in a dialog; a project's menu offers a new chat in
  it, edit and delete); Pinned; then Chats, one list by default, whose
  options button groups them by date (kept in the browser) and shows one type of
  chat. Every chat shows the icon of the module it is about. The
  breadcrumb ends with the chat's title.
- Home › All chats (reached from that sidebar, not listed under Home): every
  chat, with a search and filter chips by type (the module a chat is about,
  from `topicOf` in `answers.ts`).
- Incognito (the toggle at the top right of the Assistant; not in the
  sidebar): chats that stay out of the history and are deleted when
  you leave them. The scripted answers cannot follow a project's
  instructions; the views show them.
- One set of chats (`assistant/store.tsx`) for the Assistant, the Ask AI
  panel ("Open full page" moves the chat across) and the launchpad.
  A new session starts with a few chats asked of today's data.
- Ctrl+K: type a question and pick "Ask AI". Ctrl+J on the Assistant goes
  to its prompt box.
- Account menu › Start page: land on the launchpad or the Assistant.

Shortcuts: `Ctrl+K` command menu, `?` shortcut list, `C` new job, and
`G` then a letter to jump (`G B` board, `G I` inbox, `G S` settings…).
Section ids and shortcut letters live in `src/pages/nav.ts`.

## The Linear look, and where it lives
The colour scheme, text size and corners are in `src/styles.css`, so they
can be moved as one piece:
- Near-neutral greys with a faint cool tint, and one indigo accent (`--brand`)
- Borders drawn at 7–9% opacity instead of solid greys
- 13px Inter body text (with Inter's alternate letters), 8px corner radius
- Status colours as tokens: `--status-todo`, `--status-progress`,
  `--status-done`, `--status-blocked`

The rest of the look is not in `styles.css`, and it carries most of the
polish (the theme comparison shows this):
- 28px controls: shadcn's Mira preset, in `src/components/ui/`
- Layouts, spacing and details: the components and blocks
- Dark by default: `defaultTheme` in `App.tsx`. The switch in the header
  (or Ctrl+K) changes it.

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

The theme comparison (`#/compare/<page>`, `src/pages/ThemeCompare.tsx`)
shows any kit page or template twice, in two frames: the kit's theme on the
left, shadcn's default theme on the right. Same components, blocks and
data, so only the tokens differ. The right frame's address carries
`?shadcn-default=colours,text,radius,details`; `main.tsx` puts the words on
`<html>` as `data-shadcn-default`, and `src/shadcn-default.css` swaps each
named part for shadcn's stock value (Mira preset, neutral base colour).
Each part can be switched on its own, to see what it adds. The frames
follow each other's page, scroll and light/dark mode. Leave
`styles.css` alone for this: the comparison only adds to it.

Do not name `--brand-*` / `--grey-*` after shadcn's tokens: shadcn already
uses `--accent` for hover backgrounds.

This copies Linear's *style*, not its code or brand. Keep it that way: no
Linear name, logo or assets in the app.

## The registry
The kit is a shadcn registry: another project can install any part with
`npx shadcn add`, and gets the files, npm packages and other kit parts it
needs. 124 items: `tokens` (the whole theme from `styles.css`), 47 ui, 37
components, 30 blocks and 9 lib files. Which level becomes which item:
`docs/architecture.md`.
- `npm run registry` runs `scripts/build-registry.mjs` (writes
  `registry.json` from each part's imports), then `shadcn build` (writes
  `public/r/<name>.json`). The dev server serves them at
  http://localhost:5180/r/.
- It keeps itself current. While `npm run dev` runs, `vite.config.ts` runs
  both steps a moment after a part, `styles.css`, `CLAUDE.md` or
  `package.json` changes, and drops the JSON of a deleted part. The open
  page does not reload (`styles.css` tells Tailwind not to read
  `registry.json`). `npm run check`, and so `npm run build`, fails if
  `registry.json` is out of date: run `npm run registry` and commit it.
  `public/r/` is not in git.
- Another project names the registry once in its `components.json`:
  ```json
  "registries": { "@kit": "http://localhost:5180/r/{name}.json" }
  ```
  then installs parts, the theme first:
  ```bash
  npx shadcn add @kit/tokens @kit/kanban-board
  ```
  Kit items depend on each other as `@kit/<name>`, so this line is needed.
- Blocks install into `components/blocks/`; shadcn rewrites their
  `@/blocks/…` imports to match.
- Not published: pages, templates, sample data, and the kit-only lib files
  `utils`, `router` and `random`. The script stops if a part imports one.

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
- Read `docs/architecture.md` before adding or moving a part: it says which
  level and folder each part belongs to, and the one-home-per-part rule.
- Build each level only from the level below (atomic design, see the
  glossary). A small part used in more than one place is a component in
  `src/components/` (shown on its kit page with a playground); a bigger
  composition is a block.
- A block used in more than one place lives in `src/blocks/`, takes its
  data as props and holds no sample data. Kit pages and templates import it
  from there instead of keeping their own copy. These are what the shadcn
  registry publishes (see "The registry").
- Colours only through tokens: `bg-card`, `bg-muted`, `bg-accent`,
  `bg-subtle`, `text-muted-foreground`, `border`, `text-brand` / `bg-brand`,
  `text-status-todo|progress|done|blocked`, `text-destructive`,
  `var(--chart-1..5)`. Never a Tailwind palette class such as
  `text-amber-600`. One exception: the QR code's plate is white with black
  modules in both modes, so every scanner can read it.
- Before calling UI work done, check it in light and dark mode, and at
  375px wide with no sideways scrolling (`min-w-0`, `flex-wrap`, and
  `grid-cols-1` before any `sm:`/`lg:` columns).
- `npm run check` (`scripts/check-rules.mjs`, also run by `npm run build`)
  fails on: Lucide or paid Hugeicons imports, palette colour classes, a level
  importing from a level above it, and the Linear name on screen. Known
  exceptions are listed in the script, matching `docs/architecture.md`.
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
