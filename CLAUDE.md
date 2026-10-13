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
never clashes with another Vite app. A `PORT` variable overrides it, which
is how a second Claude session previews the kit while the first holds 5180
(`autoPort` in `.claude/launch.json`).

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
    │   ├── ai/                the AI kit's blocks (the AI domain, registry category "ai"; the
    │   │                      AI workspace, AI in the product and both ERP templates share them)
    │   │   ├── ai-summary-card.tsx  AI summary card
    │   │   ├── chat/          prompt box (with queued messages), chat message (branches, read
    │   │   │                  aloud, branch in new chat), chat thread (welcome screen, prompt
    │   │   │                  starters), chat history (projects, pinned, chats by date or as one
    │   │   │                  list), chat library (All chats: search, filter by type), and:
    │   │   │   ├── prompt-library.tsx  saved prompts: search, favourites, yours and team, {{variables}} filled in before use, save as prompt
    │   │   │   ├── share-chat-dialog.tsx  share a chat: snapshot or live link, who can open it, artifacts, copy, revoke
    │   │   │   └── usage-limit.tsx  usage limit banner and notice (near, reached), and the rate limit error with its countdown
    │   │   ├── onboarding/
    │   │   │   └── onboarding-dialog.tsx  the first-run welcome: name and role, reply style, apps to connect, a prompt to try
    │   │   ├── projects/      a project as a workspace:
    │   │   │   ├── project-page.tsx  project page: header (icon, star, share, menu), tabs, and its parts (overview header, start chat, stats, instructions, knowledge, chats)
    │   │   │   ├── new-project-dialog.tsx  new project from a template, or edit its details: name, icon and colour, description, instructions
    │   │   │   ├── project-sharing.tsx  a project's Sharing tab: who has access, general access, chat visibility, what members can do
    │   │   │   └── project-tools.tsx  a project's Tools tab: connectors and skills it may use, and project memory
    │   │   ├── schedules/     prompts the assistant runs on its own:
    │   │   │   ├── scheduled-task-list.tsx  scheduled tasks: schedule, next run, last run, pause, Run now
    │   │   │   ├── scheduled-task-dialog.tsx  create or edit a scheduled task: prompt, recurrence, next runs, model, delivery
    │   │   │   └── task-run-history.tsx  a scheduled task's runs, inline or in a sheet
    │   │   ├── agents/        saved assistants that also work on their own:
    │   │   │   ├── agent-types.ts  the shapes the agent blocks share: agent, draft, template, trigger, run, step, approval
    │   │   │   ├── agent-card.tsx  an agent: mark, description, trigger chips, what it uses, status, Chat and Run now; the template card
    │   │   │   ├── agent-gallery.tsx  agents to open: yours, shared with you, Explore (templates by category), search, Create agent
    │   │   │   ├── agent-page.tsx  one agent: header (Chat, Run now, Edit, menu), status, tabs
    │   │   │   ├── agent-overview.tsx  an agent's Overview: conversation starters, triggers, what it uses, recent runs
    │   │   │   ├── agent-builder.tsx  the builder's frame: Create and Configure beside a live Preview (tabs when narrow), save, unsaved changes
    │   │   │   ├── builder-chat.tsx  the Create tab: describe the agent, the builder asks follow-ups, chips for what it updated
    │   │   │   ├── agent-preview.tsx  try an agent: its welcome and starters, then a conversation, what it would use
    │   │   │   ├── agent-config-form.tsx  the Configure tab: basics, instructions, starters, knowledge, tools and permissions, model, triggers, access
    │   │   │   ├── trigger-editor.tsx  an agent's triggers: manual, schedule, event in a connected app (with a filter)
    │   │   │   ├── run-status.tsx  a run's status badge, trigger, timing and agent mark
    │   │   │   ├── run-card.tsx  one run: agent, title, progress or approval, Allow once and Deny, error
    │   │   │   ├── runs-inbox.tsx  every run: Needs you, Running, Done, All, by day
    │   │   │   └── run-detail.tsx  one run: steps, the approval (Allow once, Always allow, Deny), result, retry; RunSheet
    │   │   ├── artifacts/     artifact panel
    │   │   ├── citations/     where a reply's facts came from:
    │   │   │   └── source-panel.tsx  a reply's sources, the active one with its cited passage; SourceSheet on narrow screens
    │   │   ├── knowledge/     what the assistant reads: project knowledge and knowledge bases (RAG):
    │   │   │   ├── knowledge-types.ts  the shapes the knowledge blocks share: knowledge base, source, document, chunk, citation
    │   │   │   ├── project-knowledge.tsx  a project's knowledge: context meter and mode, files (in or out), pasted text, web pages, linked knowledge bases
    │   │   │   ├── knowledge-base-list.tsx  knowledge bases to open: search, grid or list, size, index health, sources, access
    │   │   │   ├── knowledge-base-page.tsx  one knowledge base: header, summary numbers, indexing progress, tabs
    │   │   │   ├── knowledge-documents.tsx  a knowledge base's documents: status (queued, processing, indexed, failed), filters, bulk re-index and remove, upload
    │   │   │   ├── knowledge-sources.tsx  where documents come from (upload, website, connected app, text), sync schedules, the add source dialog
    │   │   │   ├── retrieval-tester.tsx  test retrieval: a question, the chunks it would fetch with scores and highlights, what the model would see
    │   │   │   ├── knowledge-base-settings.tsx  retrieval settings (chunk size, overlap, embedding model, hybrid search, reranking, top-K, cut-off) and access
    │   │   │   └── create-knowledge-base-dialog.tsx  new knowledge base: name, what is in it, icon, access, what to start with
    │   │   ├── reasoning/     thinking trail
    │   │   ├── connectors/    let the assistant use other apps:
    │   │   │   ├── connector-card.tsx  an app the assistant can use: mark, status (connected, needs reconnecting, admin disabled), Connect or Manage
    │   │   │   ├── connector-catalogue.tsx  connectors to pick from: search, filter chips by category, grid or list, add custom
    │   │   │   ├── connector-dialog.tsx  connect (consent step, scopes) or manage a connector: account, tool permissions (Always allow, Ask first, Off), disconnect
    │   │   │   └── custom-connector-dialog.tsx  add a remote MCP server: name, URL, authentication (none, OAuth, API key header)
    │   │   ├── skills/        instructions the assistant loads when a task needs them:
    │   │   │   ├── skill-card.tsx  a skill: icon, source (built-in, yours, organisation), on/off, menu
    │   │   │   ├── skill-list.tsx  skills to manage: search, filter chips, cards, create and upload
    │   │   │   ├── skill-editor.tsx  create or edit a skill: name, when to use it, instructions (Markdown, preview), files
    │   │   │   ├── skill-detail.tsx  a skill's SKILL.md, files and where it is used, in a sheet
    │   │   │   └── skill-upload.tsx  upload a skill as a .zip or .md file
    │   │   ├── memory/        what the assistant remembers about you
    │   │   │   └── memory-manager.tsx  what the assistant remembers: search, edit in place, delete, clear all, off state
    │   │   └── voice/         voice mode
    │   │       ├── voice-picker.tsx  voices as radio cards with a sample to play and an equaliser
    │   │       └── voice-mode.tsx  voice mode: a full-screen spoken conversation with the orb, captions, mute, end; VoiceOrb
    │   ├── account-menu.tsx   who is signed in, with their menu: a row at a sidebar's foot, or the avatar in a header
    │   ├── data-table/        TanStack table: toolbar, facets, views, bulk bar, CSV
    │   ├── display-menu.tsx   Display options: layout, grouping, ordering, properties
    │   ├── docked-panel.tsx   side panel beside the page that narrows it (Ask AI): slides, resizes from its edge, a sheet on narrow screens
    │   ├── dock-schedule/     yard dock schedule: day by dock and time slot, docks
    │   │                      as rows or as columns (drag, book a free slot), week
    │   │                      heatmap, slot picker
    │   ├── filter-bar/        filter menu, filter chips, saved views
    │   ├── folding-breadcrumb.tsx  breadcrumb that folds to fit
    │   ├── form-builder.tsx   makes or edits a form definition: details, sections, a field of any
    │   │                      kind with its settings, paste checks, a live phone preview; its parts
    │   │                      (AddFieldMenu, FieldRow, PasteChecksDialog) and toStoredForm /
    │   │                      fromStoredForm, the definition as JSON with the icon by id
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
    │   ├── mobile-shell.tsx   the phone app's frame (PWA): MobileShell, top bar, tab bar, floating
    │   │                      button, bottom sheet and its options, chips, cards, grouped rows,
    │   │                      the menu screen (MobileMenu: "Menu" opens every destination
    │   │                      full screen in big type, as shadcn's site does on a phone), and
    │   │                      the floating tab bar (MobileFloatingTabBar: over the page, search
    │   │                      beside it, shrinking while you scroll down, as iOS 26's works)
    │   ├── notifications-menu.tsx  the bell's popover
    │   ├── period-picker.tsx  period switch, compare, date range picker
    │   ├── keyboard-shortcuts-dialog.tsx  every shortcut in groups, searchable
    │   ├── offline-banner.tsx  "You're offline", what will send when you're back, then "Back online"
    │   ├── share-dialog.tsx   share anything: invite people with a role, people with access, general access, copy link; ShareSummary, ShareButton
    │   ├── session-list.tsx   signed-in devices: device, browser, place, last active, sign out one or all others
    │   ├── settings-page.tsx  settings page: sections down the left (a list that drills in when narrow), SettingsHeader, SettingsGroup, SettingsRow
    │   ├── record-sheet.tsx   record peek: one record in a centred modal (center peek) or a panel from the right (side peek)
    │   ├── sign-in.tsx        sign-in page parts: form, SSO, aside, footer
    │   ├── submission-feed.tsx  submissions as cards by day (score bar, failed checks, who, when)
    │   │                      and the day's numbers; the modern alternative to the records table
    │   └── workspace-switcher.tsx  workspace or company switcher
    ├── components/
    │   ├── ui/                shadcn components (ours to edit)
    │   ├── ai/                the AI kit's components (registry category "ai")
    │   │   ├── context-meter.tsx  how much of a project's context its knowledge uses, and the Full context / Search mode badge
    │   │   ├── ai-label.tsx   "AI" tag for AI-made content
    │   │   ├── thinking-indicator.tsx  Thinking…, shimmer, typing dots, caret, timer
    │   │   └── incognito-toggle.tsx  incognito (temporary) chat switch for an AI chat
    │   ├── person.tsx         UserAvatar (initials), Person (avatar and name), NoAssignee
    │   ├── status-badge.tsx   status pill with a tone and a dot
    │   ├── status-icon.tsx    workflow status icon (backlog, todo, in progress, done…)
    │   ├── priority-icon.tsx  priority icon (no priority, low… urgent)
    │   ├── label-dot.tsx      a label's colour dot
    │   ├── mark.tsx           LetterMark, IconMark
    │   ├── icon-colour-picker.tsx  pick an icon and a colour (a project's look); IconColourSwatch
    │   ├── recurrence-picker.tsx  how often something repeats (once, daily, weekdays, weekly, monthly), at what time, in which time zone
    │   ├── delta-badge.tsx    the change on the period before
    │   ├── sparkline.tsx      tiny line chart
    │   ├── page-header.tsx    title, description, actions
    │   ├── panel.tsx          the kit's titled card
    │   ├── nav-item.tsx       sidebar row (also rail), NavHeading, NavGroup
    │   ├── search-trigger.tsx button that looks like search and opens the palette
    │   ├── shortcut.tsx       keyboard keys, ⌘ or Ctrl by platform
    │   ├── check-item.tsx     one line of a checklist: a statement and its outcome (Pass / Fail / N/A, Yes / No)
    │   ├── rating.tsx         star rating
    │   ├── signature-pad.tsx  sign by hand on a canvas, kept as a picture
    │   ├── qr-scanner.tsx     reads a QR code with the camera (BarcodeDetector), or takes it typed
    │   ├── icon-action.tsx    icon button with a tooltip and shortcut (copy, retry…)
    │   ├── theme-toggle.tsx   light / dark button for a header
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
    │   ├── token-estimate.ts  rough token counts for text and files, formatTokens
    │   ├── use-online.ts      whether the browser is online, following its events
    │   ├── use-timers.ts, use-svg-id.ts, use-media-query.ts
    │   └── utils.ts
    ├── templates/             whole apps built from the kit (level 5)
    │   ├── ai-chat/AiChatApp.tsx   the AI workspace filling the window
    │   ├── erp/               the ERP app (see "The ERP template")
    │   │   ├── assistant/     Ask AI: answers, shared chats, the Assistant page
    │   │   ├── forms/         the Forms module: form definitions, catalogue and fill pages, sample submissions
    │   │   └── wsh/           the Workplace safety (WSH) module: sample records, and the peek's version history and risk matrix
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
            │                         TextFieldsSection, QrCodeSection… (38, listed in nav.ts)
            ├── FormsSection.tsx      whole forms, inline and in dialogs, sheets and a wizard;
            │                         exports QuickCreateDialog (the C shortcut)
            ├── DataTableSection.tsx  TanStack table: sort, filter, paginate, export
            ├── AppShellSection.tsx   sidebar and header variations, mixed live (Two rows: a global
            │                         header over the page or the whole app, the breadcrumb under it),
            │                         then the phone app (PWA) layout
            ├── app-shell/             its grouped list and board, Display and notifications menus,
            │                         and PhoneShell (the mobile shell block on the kit's jobs, in a
            │                         phone frame: install prompt, offline queue)
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
            ├── FormBuilderSection.tsx  the builder on its own, its parts, every field kind live, the JSON it saves
            ├── SettingsSection.tsx
            ├── AuditLogSection.tsx   filterable event log
            ├── PricingSection.tsx    plans, yearly switch, comparison table
            ├── OnboardingSection.tsx
            ├── SignInSection.tsx
            ├── AiOverviewSection.tsx  the AI kit: install, every AI item from the registry, templates
            ├── AiWorkspaceSection.tsx AI chat workspace: projects, history, agent, artifacts, and in the
            │                         full-page app its addresses (chat, project, library, settings)
            ├── ai/                    its engine, scripted scenarios, parts, All chats, routes.ts,
            │                         ProjectView (a project's tabs, wired to the workspace),
            │                         KnowledgeView (knowledge bases), scenarios-knowledge.ts (cited answers),
            │                         AgentsView (gallery, an agent's page, the builder), RunsView (runs inbox),
            │                         ChatChrome (onboarding, shortcuts, command menu, offline and usage notices),
            │                         AppCommandMenu (Ctrl+K), VoiceSession (scripted voice mode),
            │                         prompts-data.ts (the prompt library), scenarios-research.ts (deep research)
            │   ├── agents/            sample agents, templates, events and runs, the scripted builder
            │                         (builder-script.ts), the made-up runner (runner.ts) and its provider
            │   ├── knowledge/         sample knowledge bases and retrieval, the made-up indexer
            │                         (library.ts, shared with the kit page) and its provider
            │   ├── projects/          sample templates, icons, people, tools, schedules, and the
            │                         defaults a saved project is filled in with (defaults.ts)
            │   └── settings/          the full-page Settings: SettingsScreen (its sections), one tab per
            │                         file, prefs.ts (useAiPrefs, useStoredState: kept in the browser)
            │                         and the connectors', skills' and memories' sample data
            ├── AiSettingsSection.tsx, AiConnectorsSection.tsx, AiSkillsSection.tsx, AiProjectsSection.tsx,
            │   AiKnowledgeSection.tsx, AiAgentsSection.tsx, AiChatFeaturesSection.tsx  kit pages
            ├── ai-chat-features/      the Chat features page's panels (composer, chat core, modes, states)
            ├── ai-agents/             the Agents page's panels (gallery, builder, configure, runs)
            ├── ai-knowledge/          the Knowledge page's panels (project knowledge, bases, retrieval, citations)
            ├── ai-settings/           those pages' panels (account, models and voice, connectors, skills)
            ├── ai-projects/           the Projects page's panels (workspace, tools, schedules, sharing)
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
  LabelChip). 38 pages under category headings: Actions, Inputs, Data
  display, Feedback, Overlays, Navigation, Layout, Charts. Every part a
  block uses has its own demo here. A new component joins its family's
  page; a new family gets its own page (see below).
- **Blocks:** whole screens built from components, as shadcn calls them
  (list, board, issue detail, inbox, roadmap, dock schedule, settings,
  onboarding, sign-in…)
- **Layouts:** the frame pages sit in (App shells): the desktop shells, mixed
  live, and the phone app (PWA) layout in a phone-sized frame. Its controls:
  opened in a browser tab or installed (standalone), navigation (tab bar,
  menu screen or both), the tab bar's style (classic or floating), where the
  main action sits (floating button, tab bar, top
  bar), and Offline, which keeps changes
  on the phone until you reconnect. It runs on the same jobs, so an edit in
  the phone shows in the desktop frame above it
- **AI:** the AI kit, a domain across the levels rather than a level (see
  "Domains" in `docs/architecture.md`): Overview (install the AI kit, every
  AI item read from the registry, the AI templates); Components: AI
  components; Blocks: AI workspace, AI in the product, Agents, Chat features,
  Connectors, Knowledge, Projects, Settings page, Skills and memory. An AI-only part goes in its level's `ai/` folder
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
  chats and All chats (a page: search, filter chips by type); Projects (named
  in place, then opened on the project page: description, custom
  instructions, project knowledge, its chats; each with a menu: new chat in
  it, edit on its page, delete); Pinned; Chats (one
  list by default, or by date, kept in the browser; any type or one). A chat's type is
  the kind of work its first prompt asked for (`chatTypeOf` in
  `ai/engine.ts`: jobs, writing, research, invoices, code…), shown as an
  icon beside it. Incognito is the toggle at the top right of the chat, not
  in the sidebar: those chats are never saved and are deleted when you
  leave them; opening a kept chat, a project or All chats ends incognito.
  Each view has its own address (`ai/routes.ts`): `/chat/<id>`,
  `/project/<id>[/<tab>]`, `/project/<id>/new`, `/library`, and the base for
  a new chat, so the back button and a reload work. A project is a workspace
  with tabs (`ai/ProjectView.tsx`): Overview (start a chat in it, stats,
  instructions, recent chats), Chats, Knowledge, Tools (which connected
  connectors and skills it may use, project memory), Schedules (scheduled
  tasks; Run now shows a run, and opening its result starts a chat with the
  task's prompt), Sharing (the share dialog: people, roles, general access)
  and Settings (details, duplicate, archive, delete). Projects can be
  starred (first in the sidebar) and archived (hidden); colleagues' projects
  are under Shared with me (demo only).
  Knowledge (in the sidebar, `/knowledge[/<id>[/<tab>]]`): knowledge bases,
  libraries searched with retrieval (RAG), each with Documents (indexing:
  queued, processing, indexed, failed), Sources (upload, website, connected
  app, text; synced on a schedule), Test retrieval, Settings and Access. A
  project's Knowledge tab shows how much of its context its own files use:
  under the threshold every file is read in full (Full context), over it the
  assistant searches them (Search mode); it also links knowledge bases, which
  are always searched. Answers from a project's files cite them: [1] shows
  the passage on hover and opens the source panel (try "What is our refund
  policy?" in Customer support).
  Agents (in the sidebar, `/agents`): saved assistants with instructions,
  knowledge, tools (each tool Always allow, Ask first or Off), a model and
  triggers (manual, a schedule, or an event in a connected app). The
  gallery has yours, shared with you and Explore (templates). Create agent
  opens the builder (`/agents/new`, or `/agents/<id>/edit`): describe it in
  Create and the builder fills it in and asks follow-ups (`builder-script.ts`),
  or use Configure; Preview tries it. An agent's page has Overview, Chat (a
  scripted chat in its voice), Runs and Triggers. Run now (or a trigger)
  starts a run: steps advance, and it stops at an approval (Allow once,
  Always allow, Deny) before sending or writing. Runs (`/runs[/<id>]`) is
  the inbox, with a count in the sidebar of what needs you; a toast says
  when a run needs you, finishes or fails.
  In a chat: `@` mentions agents, the project's files, projects, knowledge
  bases, connectors, people and jobs; the prompt library (book button or
  `/prompts`) fills `{{variables}}` before use; Enter while a reply runs
  queues the next message (it waits through an approval). Editing a message
  keeps the old one as a branch (‹ 1 / 2 ›); any message can start a new
  chat (Branch in new chat); replies can be read aloud; Share makes a
  snapshot or live link. Research (a mode, for one reply) plans, searches
  for half a minute and ends with a cited report artifact. Voice mode (the
  voice button) is a full-screen spoken conversation; ending it saves it as
  chat messages. Ctrl+K is the command menu, `?` the shortcuts; the first
  visit opens the welcome (onboarding). Near the monthly credit limit a
  banner offers a cheaper model or an upgrade. Settings is a full page at
  `/settings/<section>` (the account menu, or Upgrade plan for Billing):
  Profile, Appearance, Personalisation, Notifications, Security; Models and
  features, Memory, Connectors, Skills, Voice; Data controls, Billing and
  usage. Its choices are kept in the browser (`ai/settings/prefs.ts`). In the
  kit the workspace sits in a card and Settings opens inside it.
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
  header. Below 768px wide the sidebar is a sheet. Ask AI docks under the global
  header, beside the breadcrumb and the page, which narrows to make room (the
  kit's docked panel): the Ask AI button opens and closes it, Escape closes
  it, its edge resizes it and the width is kept in the browser. Below 1024px
  wide it is a sheet over the page.
- On a phone (under 768px, `phone.ts`) the frame is `PhoneShell.tsx`, the
  kit's mobile shell block, not the sidebar folded up. A tab bar: Home,
  Inbox (what needs you, the bell's alerts), Scan (in the middle: a form's QR
  code, or a link typed in), Ask AI (the Ask AI sheet; the Assistant page in
  ERP + AI) and More (modules, company, role, theme, start page, sign out).
  Home is a stack of screens made from the route: launchpad › a module's
  pages (`/<module>` with no page, a screen of its own on a phone) › a page ›
  one thing on it (a form being filled in, which covers the tab bar). Each
  has a back arrow named after the screen under it, and the page's own
  heading stands for the title until it scrolls away. List pages show their
  records as cards (`MobileListPage`: search, saved views and a status
  filter as chips), with New as the floating button. A record opens full
  width (the side peek). Inbox and More lie over the page, which stays
  mounted under them. A page with its own part of the sidebar (the
  Assistant's chats) opens it from the top bar. Both editions share it.
  More › Navigation (kept in the browser): Tab bar, Menu, or Both. Menu
  swaps the tab bar for the menu screen: "Menu" in the top bar (its two bars
  turn into a cross) opens, under the bar, Home, Ask AI or the Assistant,
  Inbox and Scan; the open module's pages with their counts; every module;
  and the account settings. Every page is then a first screen, so only a
  form being filled in keeps a back arrow. A choice, Escape or Menu again
  closes it. Both keeps a tab bar too (Home, Inbox, Scan, Ask AI; no More).
  Tab bar style: Classic (a strip along the bottom) or Floating, which works
  as iOS 26's does without its glass look: a solid capsule over the page,
  Scan among the tabs and search (the command palette) as a round button
  beside it; scrolling down shrinks it to the current tab, scrolling up or a
  tap brings it back.
- Modules (`modules.tsx`): CRM, Sales, Inventory, Purchasing, Accounting,
  Human resources, Forms, Workplace safety, Administration. Each lists its
  pages; a list page is a `ListSpec` (columns, saved views, create form, bulk
  actions) rendered by `ListPage.tsx`. Roles decide which modules a user sees.
- Every record opens in a centred modal (center peek, `Overlays.tsx`) and
  every list with a create spec gets the same create dialog.
- Shortcuts: `Ctrl+K` / `⌘K` command palette (modules, pages, records by
  number or name, create, switch role or company), `Ctrl+J` / `⌘J` Ask AI,
  `G` then a letter for a module (`G C` CRM, `G S` Sales, `G I`
  Inventory, `G P` Purchasing, `G A` Accounting, `G H` HR, `G W` Workplace
  safety, `G X` Administration, `G L` launchpad), `C` create on a list, `[`
  hide the sidebar.
- Routes: `#/templates/erp/<module>/<page>`, for example
  `#/templates/erp/accounting/invoices`. A third segment names one thing on
  the page: `#/templates/erp/forms/catalogue/vehicle-check?context=SGX%204821`
  is that form, open for that vehicle (the link a QR code carries). Signed
  out, the link is kept and returned to after sign-in and the company pick.
- Forms (`forms/`): every form in one catalogue (Forms › All forms), and
  each module's own on its Forms page (Inventory, Sales, HR,
  Administration). The kit's `FormsCatalogue` lists them; `FormRenderer`
  fills one in; a submission is a record whose peek shows every answer.
  Forms › Submissions shows them as cards (`SubmissionFeed`, with the day's
  numbers) or as the records table, switched in the header. Forms › New
  form is the `FormBuilder` (`/forms/builder`, or `/forms/builder/<id>` to
  edit one from the catalogue's pencil); saved forms live in the store for
  the visit, and an edit makes a new version. Each form's QR button prints
  the code that opens it; the Scan button reads one. Ask AI answers "Which
  checks failed this week?" from the submissions.
- Workplace safety (`wsh/`, module id `wsh`, for the operations, HR and
  admin roles): the WSH module, with sample records made up in
  `wsh/sample.ts`. Overview (days since the last incident report, inspection
  pass rate, certificates to renew, reviews due; inspections by week;
  training compliance by course; one worklist of everything due for renewal
  or review, with Book refresher and Start review). Toolbox meetings (held or
  scheduled, attendance in the peek). Checklists and inspections: an
  inspection is a filled-in checklist, like a paper form handed in. The
  Inspections page lists the submissions of checklists in the Inspections
  category (site safety, fire safety, racking), passed or failed from their
  checks, with every answer in the peek; New inspection picks a checklist
  and fills it in at `/wsh/inspections/<form>`, then comes back to the list.
  Checklists is the Forms catalogue filtered to this module (those three,
  the hot work permit and the incident report). A `ListSpec` may `filter`
  its entity's records, which is how Inspections shows only its own
  submissions. Documents and training: Safety documents
  with versioning (each record keeps its version history as JSON; the peek
  lists it and publishes the next minor or major version, which approves the
  document from today and sets the review a year out; a document past its
  review date reads Review due) and Training certificates (valid, expiring
  within 60 days, expired). Risk management: Risk assessments, each with its
  hazards (severity × likelihood on the 5 × 5 matrix, Low 1–4, Medium 5–12,
  High 15–25); the peek draws the matrix with the hazards counted in their
  cells and lists them worst first with their controls. Ask AI answers about
  certificates, inspections, toolbox meetings, risk assessments and safety
  documents; the launchpad lists expired certificates under Needs your
  attention.
- Ask AI (`Copilot.tsx`, with its answers, chats and views in `assistant/`)
  answers from the live records: about 30 kinds of question, scripted, no
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
  chats; Projects (folders of chats, named in place; a project's menu offers
  a new chat in it, edit and delete); Pinned; then Chats, one list by default, whose
  options button groups them by date (kept in the browser) and shows one type of
  chat. Every chat shows the icon of the module it is about. The
  breadcrumb ends with the chat's title.
- Home › All chats (reached from that sidebar, not listed under Home): every
  chat, with a search and filter chips by type (the module a chat is about,
  from `topicOf` in `answers.ts`).
- Home › Projects › a project (`/home/project/<id>`, reached from that
  sidebar: clicking a project, New project or its Edit): the kit's project
  page block, as the big chat apps open a project. Its description, custom
  instructions, project knowledge (files, kept for the visit) and chats;
  the breadcrumb ends with its name. The scripted answers follow neither the
  instructions nor the files; the views show them.
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
- Borders drawn at low opacity instead of solid greys: 9% in light mode,
  12% in dark (inputs 18%), so dark stays dark but every outline still reads,
  as in an IDE or Linear
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
needs. 185 items: `tokens` (the whole theme from `styles.css`), 47 ui, 40
components, 85 blocks, 11 lib files and the `ai-kit` bundle. No part may be
called `tokens` (the script stops if one is). Which level
becomes which item: `docs/architecture.md`.
- Items from `components/ai/` and `blocks/ai/**` have `categories: ["ai"]`;
  `ai-kit` (a `registry:item` with no files) depends on all of them:
  `npx shadcn add @kit/ai-kit`.
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
