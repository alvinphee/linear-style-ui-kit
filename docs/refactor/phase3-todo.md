# Phase 3 to-do (collected from the phase 2 reports)

## Remove temporary re-exports once nothing imports them
- chat-history: DROPDOWN_MENU_KIT, CONTEXT_MENU_KIT, ChatMenuKit, AccountMenu, CreditsMeter.
- filter-bar: SearchField. data-table index: DeleteConfirm, copyText, plural.
- blocks/ai/markdown.tsx (whole file).
- chat-message: FileChip, formatFileSize. prompt-box: fileIcon, formatFileSize.
- kpi-card: DeltaBadge, Sparkline, KpiDelta, KpiTone.
- file-chip: formatFileSize. thinking-indicator: formatDuration.

## Kit improvements the helpers suggested
- SearchField: add Escape-to-clear, then use it for chat-history's search box.
- DeleteConfirm: a way to move focus only after an actual delete, then use it for DeleteChatDialog.
- FilterChip: readOnly, operator and summary props, for NlSearchPanel's ParsedChip.

## Other
- Move the shared job adapters out of section files into a jobs module
  (FilterBar.tsx, JobActions.tsx, QuickCreateDialog), updating importers.
- CLAUDE.md: pages/job-options.tsx in the folder map.
- Browser check of every page and the three templates, desktop and phone.
- IconAction: when `pressed` is set with variant="outline", the pressed fill loses to the outline's
  dark-mode fill. Fix in the component (aria-pressed:bg-muted aria-pressed:text-foreground), then remove
  the workaround in InputsSection.
- QuickCreateDialog export (FormModalsSection) is used by KitchenSink and AppShellSection: part of the
  jobs-module move.
- DateRangePicker (period-picker): add a `disabled` prop for the calendar, then pass
  `disabled={{ after: NOW }}` in AuditLogSection so future days can't be picked.
- ShortcutsSheet.tsx description says "…like Linear.": remove the Linear name (CLAUDE.md rule).
- KitchenSink.tsx imports QuickCreateDialog from ./sections/FormModalsSection: follow the jobs-module move.
- Also on screen: ButtonsSection.tsx:55 note "The Linear habit…", OverlaysSection.tsx:152 note
  "Linear's signature…". Reword without the name (code comments can stay).
- data-table index: export MIXED (JobListSection imports it from @/blocks/data-table/parts for now).
- FilterBar.tsx: remove forwards/unused exports once unused: UNASSIGNED, type Ordering, FilterMenu,
  FilterChip, FIELD_ORDER. display.tsx: type Property alias.
- NlSearchPanel ResultRow → JobRow (JobActions) if the AI helper didn't; nl-search.ts UNASSIGNED from data.
- Optional: FilterBar block end slot for the app shell's view switch + Display menu.
- file-chip: export fileKind(name) (sheet, PDF, image…) so ai/data.ts can drop its copy of the extension lists.
- FilterChip `operator` (+ read-only) would let NlSearchPanel drop its local TextChip.

## Status (end of phase 3)
Done: every item above, except
- the jobs-module move (FilterBar.tsx, JobActions.tsx, QuickCreateDialog stay in sections; documented
  in architecture.md as sample-data wiring);
- the FilterBar block end slot (optional);
- deleting src/blocks/ai/markdown.tsx (now only forwards to src/blocks/markdown.tsx; nothing imports it):
  waiting for the go-ahead to delete files.
