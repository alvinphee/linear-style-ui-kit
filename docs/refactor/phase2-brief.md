# Phase 2 brief: switch every page and template to the kit parts

Read docs/refactor/common-brief.md first (it still applies), then
docs/refactor/audit.md and the four phase 1 reports in docs/refactor/
(phase1-lib.md, phase1-components.md, phase1-blocks-a.md, phase1-blocks-b.md).
Those reports say, for each copy, exactly what to pass so it looks the same.

## Your job
In the files you own (see the table below), and only there:
1. Replace every copy and hand-drawn re-creation listed in the audit (sections A
   leftovers, C, D, E, F, G) with the kit part, then delete the local copy.
2. Import every kit part from its home, never through a re-export layer
   (audit section H). Homes are listed below.
3. Keep each screen looking and working the same. Where a report lists a small
   visible change, accept it unless a className keeps the old look cheaply.
4. If a file you own EXPORTS something that files you don't own import, keep
   that export working (make it use the kit part, or forward it) and list it in
   your report: phase 3 removes it once everyone has moved.
5. Remove exports in your files that nobody imports (audit H lists some).

## Where each part lives now
| Part | Import from |
|---|---|
| StatusIcon, WORKFLOW_STATUS | @/components/status-icon |
| PriorityIcon, PRIORITIES, PRIORITY_ORDER | @/components/priority-icon |
| LabelDot, LabelChip | @/components/label-dot |
| UserAvatar, Person, NoAssignee | @/components/person |
| Mention | @/components/mention |
| ProgressRing | @/components/progress-ring |
| LegendLine, LegendRow | @/components/chart-legend |
| BarList | @/components/bar-list |
| ViewSwitch, LIST_BOARD_VIEWS | @/components/view-switch |
| NavItem, NavHeading, NavGroup | @/components/nav-item |
| SearchField | @/components/search-field (not @/blocks/filter-bar) |
| DeleteConfirm | @/components/delete-confirm (not @/blocks/data-table) |
| CommentBox | @/components/comment-box |
| IconAction | @/components/icon-action |
| Shortcut, MOD, IS_MAC, keyLabel, ariaKeyShortcuts | @/components/shortcut |
| UsageMeter | @/components/usage-meter (not CreditsMeter) |
| DROPDOWN_MENU_KIT, CONTEXT_MENU_KIT, MenuKit | @/components/menu-kit |
| AiLabel | @/components/ai-label |
| Thinking, StreamCaret, ShimmerText, … | @/components/thinking-indicator |
| FileChip, fileIcon | @/components/file-chip |
| StatusBadge, TONE_* | @/components/status-badge |
| LetterMark, IconMark | @/components/mark |
| PageHeader | @/components/page-header |
| Panel (the kit card) | @/components/panel |
| DeltaBadge | @/components/delta-badge |
| AccountMenu | @/blocks/account-menu (not chat-history) |
| WorkspaceSwitcher | @/blocks/workspace-switcher |
| Sign-in parts | @/blocks/sign-in |
| DisplayMenu | @/blocks/display-menu |
| GroupedList, GroupedListRow | @/blocks/grouped-list |
| KanbanBoard, KanbanCard, KanbanCardMenu | @/blocks/kanban-board |
| Markdown | @/blocks/markdown (not @/blocks/ai/markdown) |
| ChatHistory and its parts | @/blocks/ai/chat-history |
| FacetFilter and data-table parts | @/blocks/data-table |
| copyText, useCopied | @/lib/clipboard |
| downloadText | @/lib/download |
| plural, pluralWord, slug, greeting | @/lib/text |
| useTimers | @/lib/use-timers |
| isTyping | @/lib/keyboard |
| useSvgId | @/lib/use-svg-id |
| seededRandom | @/lib/random |
| formatFileSize, formatDuration, formatTimer, formatNumber, formatMoney, formatShortDate, formatTime, relativeDay, formatRelativeDate, formatDateRange | @/lib/format |
| STATUS_ORDER, STATUS_LIST_ORDER, PRIORITY_RANK, dueRank, UNASSIGNED, LABEL_BY_ID | @/pages/data (job sample data) |

Inside src/pages/sections/ the kit's own page chrome stays: Section, Panel (the
page wrapper in sections/shared.tsx that wraps the kit Panel) and Row.

## Who owns which files (do not edit anyone else's)
- Blocks and components helper: src/blocks/**, src/components/**.
- Jobs helper: src/pages/sections/{JobListSection, IssueSection, JobActions,
  BoardSection, FilterBar, AppShellSection}.tsx, src/pages/sections/app-shell/**,
  and a NEW file src/pages/job-options.tsx.
- Kit pages A helper: src/pages/sections/{SettingsSection, OnboardingSection,
  SignInSection, OverlaysSection, OverlaysMoreSection, NavigationSection,
  FormsSection, FormModalsSection, InputsSection, InboxSection, RoadmapSection,
  StatusSection}.tsx.
- Kit pages B helper: src/pages/sections/{ContentSection, CalendarSection,
  ChartsSection, DashboardSection, AuditLogSection, DataTableSection,
  IconsSection, ThemeSection, ButtonsSection, DisplaySection}.tsx,
  src/pages/{KitchenSink, ShowcaseSidebar, ShortcutsSheet}.tsx.
- AI pages helper: src/pages/sections/ai/**, src/pages/sections/ai-features/**,
  src/pages/sections/{AiWorkspaceSection, AiFeaturesSection}.tsx.
- ERP helper: src/templates/**.
- Playgrounds helper: src/pages/playground/**.
Nobody edits src/lib/**, src/pages/data.ts, src/pages/jobs-store.tsx,
src/pages/nav.ts, src/App.tsx or docs/ (except as named above).
