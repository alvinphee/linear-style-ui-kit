# Phase 1 report: src/lib (shared functions)

## What exists now
- `@/lib/clipboard`: `copyText(text, { success?, description?, error?, errorDescription? }): Promise<boolean>`.
  Success toast "Copied to clipboard" by default (`success: false` for none); failure "Copy failed" /
  "Your browser blocked the clipboard." (`error: false` for none). `useCopied(ms = 1500)` → `[copied, flagCopied]`.
- `@/lib/download`: `downloadText(fileName, text, type = 'text/plain')`.
- `@/lib/text`: `plural(n, one, many?)` → "3 jobs"; `pluralWord(n, one, many?)` → "jobs";
  `slug(text, { maxLength?, fallback? })` (removes accents); `greeting(date?)` (before 5 am = "Good evening").
- `@/lib/use-timers`: `useTimers()` → `{ later, clearAll }` (same as ai-features/shared.tsx).
- `@/lib/keyboard`: `isTyping(target, { overlays = true })`: text fields, editable areas, and (unless
  `overlays: false`) dialogs, alert dialogs, menus, listboxes.
- `@/lib/use-svg-id`: `useSvgId()`.
- `@/lib/random`: `seededRandom(seed)` (mulberry32; all 4 copies identical, sample data unchanged).
- `@/lib/format`: `formatFileSize(bytes)`, `formatDuration(ms)`, `formatTimer(seconds)` ("1:05"),
  `formatNumber(n)`, `formatMoney(n, cents = true)` (USD), `formatShortDate(v, { year?, utc? })` ("5 Oct"),
  `formatTime(v, { seconds? })` ("09:05"), `relativeDay(v, now?)` ('Today' | 'Yesterday' | undefined),
  `formatRelativeDate(v, { now?, time? })`, `formatDateRange(from, to?, { year?, utc? })`.
  `utc: true` for dates stored as UTC midnights (Dashboard, Roadmap).
- `@/pages/data` (appended): `STATUS_ORDER`, `STATUS_LIST_ORDER`, `PRIORITY_RANK`, `dueRank`, `UNASSIGNED`, `LABEL_BY_ID`.

## Copies each replaces ("same" = no visible change)
- copyText. Same: ai/helpers.ts:90, artifact-panel.tsx:79, markdown.tsx:242 (`success: false, error: false`);
  erp/assistant/Turns.tsx:16, playground/ai-features.tsx:61, playground/inputs.tsx:563, Playground.tsx:207
  (`success: false`); OnboardingSection.tsx:316; erp/pages/Admin.tsx:1000. Small change (tick icon on
  success): IssueSection.tsx:46, FormModalsSection.tsx:1199, erp/Overlays.tsx:74. Error icon on failure:
  ThemeSection.tsx:70, IconsSection.tsx:75. Failure now reported: ai-features/shared.tsx:39. Insecure-page
  wording: data-table/parts.tsx:62, JobActions.tsx:58.
- useCopied, all same: chat-message.tsx:40, artifact-panel.tsx:126, markdown.tsx:258,
  OnboardingSection.tsx:312, playground/inputs.tsx:559, Playground.tsx:203.
- downloadText, same: artifact-panel.tsx:87, ai/helpers.ts:78, data-table/csv.ts:20 (downloadCsv keeps
  building the CSV + BOM, then calls it).
- plural, same: csv.ts:14, thinking-trail.tsx:69, ai/script.ts:81, AuditLogSection.tsx:259,
  ContentSection.tsx:63, erp/assistant/answers.ts:31, JobListSection.tsx:47 (count).
  erp/pages/Overview.tsx:37 adds thousands separators: use formatNumber(n) + pluralWord.
- slug: FormModalsSection.tsx:868 (`maxLength: 32`), ai/helpers.ts:98 (`fallback: 'untitled'`),
  playground/navigation.tsx:610.
- greeting: ai/data.ts:101 (same); erp/Launchpad.tsx:33, erp/assistant/AssistantPage.tsx:18 (midnight-5am
  now "Good evening").
- useTimers: ai-features/shared.tsx:11 (FeedbackPanel, InlineRewritePanel, NlSearchPanel, SummaryPanel, TriagePanel).
- isTyping: KitchenSink.tsx:62 (same); IssueSection.tsx:62 (`overlays: false`); erp/ErpApp.tsx:35;
  erp/Shell.tsx:52.
- useSvgId: ChartsSection.tsx:56, DashboardSection.tsx:141, erp/pages/Overview.tsx:159.
- seededRandom: DataTableSection.tsx:75, AuditLogSection.tsx:190, DashboardSection.tsx:38, erp/data.ts:8.
- formatFileSize: components/file-chip.tsx:28 (import from lib), ContentSection.tsx:57 (formatBytes).
- formatDuration: components/thinking-indicator.tsx:43 (import from lib).
- formatTimer: AgentRunsPanel.tsx:176, prompt-box.tsx:240.
- formatNumber: DashboardSection.tsx:35, SettingsSection.tsx:390, UsagePanel.tsx:28, MemoryPanel.tsx:168, erp/format.ts:8,12.
- formatMoney: DataTableSection.tsx:136-137, DashboardSection.tsx:36, ai/scenarios-invoices.ts:20-21,
  erp/format.ts:6-7,11 (ERP can re-export it).
- formatShortDate: ai/data.ts:111, AuditLogSection.tsx:247-249, CalendarSection.tsx:450;
  DashboardSection.tsx:30-34 and RoadmapSection.tsx:23-29 (`utc: true`); DataTableSection.tsx:197,441 and
  ai/scenario-helpers.ts:70 (`year: true`). erp/format.ts formatDate can call it inside its wrapper.
- formatTime: ai/data.ts:109, erp/assistant/LaunchpadAi.tsx:40, AuditLogSection.tsx:433,
  AgentRunsPanel.tsx:181 (`seconds: true`).
- relativeDay / formatRelativeDate: ai/data.ts:113 (formatWhen), AuditLogSection.tsx:246 (dayLabel),
  chat-history.tsx:66 (dateGroup keeps its "Previous 7 days"/"Older" buckets).
- formatDateRange: AuditLogSection.tsx:252, DashboardSection.tsx:80 (`utc: true`), CalendarSection.tsx:187;
  period-picker.tsx:52 (one-day range now "5 Oct 2026").
- Job constants: STATUS_ORDER (JobActions.tsx:31, display.tsx:69); STATUS_LIST_ORDER (JobListSection.tsx:31,
  display.tsx:68); PRIORITY_RANK (FilterBar.tsx:114, scenario-helpers.ts:8, FeedbackPanel.tsx:19);
  UNASSIGNED (FilterBar.tsx:45, nl-search.ts:22, JobListSection.tsx:38); LABEL_BY_ID (IssueView.tsx:22,
  BoardSection.tsx:18, JobActions.tsx:242); dueRank = FilterBar's (FilterBar.tsx:119); the AI copy
  (scenario-helpers.ts:14) differs slightly and should switch to it too.

## Not shared
Compact money (Dashboard "$48.0k" vs ERP "$48K"); CalendarSection.tsx:69, :73 (different jobs);
scenarios-assist.ts:35 (sample code in a string).

## Bug to fix
erp/pages/Overview.tsx:46 uses Intl's short month ("Sept"): use date-fns format(…, 'MMM').
