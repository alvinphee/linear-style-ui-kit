# Audit: parts that should have one home

Read-only audit of src/ (paths under src\). "Data" = depends on sample data
(pages/data.ts, jobs-store, ERP data). Line numbers are approximate.

## A. Done: status icon, priority icon, label dot, no assignee
Moved to components/status-icon.tsx (StatusIcon, WORKFLOW_STATUS),
components/priority-icon.tsx (PriorityIcon, PRIORITIES, PRIORITY_ORDER),
components/label-dot.tsx (LabelDot), components/person.tsx (NoAssignee).
pages/data.ts aliases STATUS = WORKFLOW_STATUS and PRIORITY = PRIORITIES.
Leftovers:
- Private NoAssignee copy: pages\sections\JobListSection.tsx:369.
- Hand-made label dots → LabelDot: app-shell\IssueView.tsx:41,
  JobActions.tsx:356, IssueSection.tsx:611/625, FormModalsSection.tsx:127-128,
  InputsSection.tsx:438/491, NavigationSection.tsx:406, calendar event dots
  CalendarSection.tsx:318-321/385.
- "No assignee" drawn with UserIcon/UserCircleIcon → NoAssignee:
  JobActions.tsx:142/333/340, IssueSection.tsx:548/560, FormModalsSection.tsx:116-117.
- PRIORITY_ORDER copies → import from priority-icon: JobActions.tsx:32,
  JobListSection.tsx:32, app-shell\display.tsx:70.

## B. Leave (adapters over blocks, or domain screens)
- QuickCreateDialog (FormModalsSection.tsx:193; used by KitchenSink, AppShellSection):
  a jobs adapter over blocks\form-dialog. Move into a shared jobs module, not a section.
- FilterBar/FilterMenu/FilterChip/applyFilters/sortJobs/FIELDS (pages\sections\FilterBar.tsx):
  job configuration over the filter-bar block. Same relocation note.
- JobContextMenu/JobDropdownMenu/JobPeek (JobActions.tsx): shared jobs adapters. Fine.
- app-shell\NotificationsMenu.tsx: adapter over blocks\notifications-menu. Fine.
- Other adapters: ai\PromptBox, ai\ArtifactPanel, ai\Sidebar, erp\assistant\Turns,
  erp\Overlays, erp\ListPage, erp\ui.tsx StatusBadge/CellValue.
- Domain screens: AgentRunsPanel LogSheet, Calendar views, Roadmap rows, EmailRows,
  AuditLog ChangeDiff, ERP CommandPalette.
- Pages documenting a shadcn primitive: OverlaysMoreSection JobPeekSheet,
  NavigationSection breadcrumbs, ContentSection.tsx:302 avatar upload,
  StatusSection.tsx:68-70 avatar sizes.

## C. New small parts → src\components\ (no sample data)
- LabelChip (label pill with dot, optional remove). 7 copies: app-shell\IssueView.tsx:34
  (Labels), BoardSection.tsx:138-145, JobActions.tsx:354-357, ai-features\NlSearchPanel.tsx:293,
  NavigationSection.tsx:405-408; with remove: IssueSection.tsx:624-636, InputsSection.tsx:437-451.
- Mention pill. 3 copies: blocks\ai\chat-message.tsx:48 (PILL), InboxSection.tsx:337,
  OverlaysMoreSection.tsx:524-533.
- ProgressRing. 2: ChartsSection.tsx:124 (Ring), OnboardingSection.tsx:146.
- LegendLine. 2 identical: ChartsSection.tsx:179, DashboardSection.tsx:180.
- BarList (labelled bar breakdown). 2: templates\erp\pages\Overview.tsx:258 (Meters),
  DashboardSection.tsx:325-358.
- UsageMeter (label, count, progress). 4: blocks\ai\chat-history.tsx:269 (CreditsMeter),
  AppShellSection.tsx:638-645, SettingsSection.tsx:419-432, ai-features\UsagePanel.tsx:74-100.
- NavGroup (folding nav heading, add to nav-item.tsx). 2: AppShellSection.tsx:373 (Group),
  ShowcaseSidebar.tsx:94-103.
- Menu kit (dropdown/context menu part maps). 2: JobActions.tsx:38-49, blocks\ai\chat-history.tsx:76-84.
- SearchField: move from blocks\filter-bar\filter-bar.tsx:70 to components; add an `end`
  slot for a shortcut hint. Users in section E.
- DeleteConfirm: move from blocks\data-table\parts.tsx:519 (generic; ERP ListPage uses it).
- CommentBox: export from blocks\record-sheet.tsx:262 (private now). IssueSection.tsx:402
  (Composer) is a near copy that hard-codes "Ctrl + Enter" at :428.
- ViewSwitch (list/board): AppShellSection.tsx:829, erp\pages\Pipeline.tsx:83-98.
- Single use, leave in place: Stepper (FormModalsSection.tsx:872), DiffText + diffWords
  (ai-features\shared.tsx), GrowingTextarea (IssueSection.tsx:232).

## D. Blocks → src\blocks\
- WorkspaceSwitcher. 3: AppShellSection.tsx:396 (WorkspaceMenu, triggers 426-433,
  593-603, 731-737), ShowcaseSidebar.tsx:25, templates\erp\Shell.tsx:86 (CompanySwitcher).
- AccountMenu: move out of blocks\ai\chat-history.tsx:292 (not AI-specific); then use it in
  erp\Shell.tsx:371 (hand-made trigger 378-385) and AppShellSection.tsx:646-665.
- DisplayMenu: see F.
- GroupedList: folding group header, rows, selection slot. See F.
- KanbanCard shell in kanban-board.tsx: role=button, cardProps spread, Enter/Space opens,
  selected state, menu beside the card. 3 copies: BoardSection.tsx:95,
  app-shell\IssueView.tsx:175, erp\pages\Pipeline.tsx:133.
- SignIn screen. 2: pages\sections\SignInSection.tsx:41-135 (LogoMark, SignInForm,
  Testimonial), templates\erp\Login.tsx:24-219 (also hand-makes the "or" separator 144-146
  and field errors 103/132).
- Markdown: move out of blocks\ai\ to blocks\ (ContentSection needs it, not AI).
- Optional, skip: a chart wrapper block (Overview Columns/HBars/TrendArea vs Dashboard
  MetricChart); a floating BulkBar from JobListSection.tsx:221.

## E. Replace with the existing kit part
- UserAvatar: FormModalsSection.tsx:402 (private initialsOf) + 464-466, 495-497;
  OnboardingSection.tsx:331-333; OverlaysMoreSection.tsx:551-553; SettingsSection.tsx:130-132;
  SignInSection.tsx:124-126.
- StatusBadge: SettingsSection.tsx:279-282, 482-486 (+ Dot helper :102); ChartsSection.tsx:207-209;
  StatusSection.tsx:34-39 ("In transit"/"Delivered").
- Shortcut (these hard-code "Ctrl"): ai\Sidebar.tsx:77-81, FormModalsSection.tsx:158-161,
  OverlaysSection.tsx:158-161, FormsSection.tsx:108, ai-features\InlineRewritePanel.tsx:399.
  pages\ShortcutsSheet.tsx:40-47 rebuilds Shortcut's loop: add a "then" sequence option.
- IconAction (add a `shortcut` prop and a way to sit inside a dropdown trigger first):
  AppShellSection.tsx:176-190, 435-442, 1062-1069; erp\Shell.tsx:290-297;
  InboxSection.tsx:218-225, 367-377, 388-395; IssueSection.tsx:206 (local IconButton ×6),
  157-167; JobListSection.tsx:355-364; FormModalsSection.tsx:277-290; ContentSection.tsx:666-685;
  KitchenSink.tsx:193-200, 212-219.
- AiLabel: ai-features\FeedbackPanel.tsx:77-80.
- PageHeader: templates\erp\Launchpad.tsx:67-71, IconsSection.tsx:198-203,
  AppShellSection.tsx:858-865, KitchenSink.tsx:122-127.
- Panel: templates\erp\pages\Admin.tsx:49, erp\pages\Reports.tsx:426 (StatementCard),
  SettingsSection.tsx:548-554 section headers.
- NavItem: OverlaysMoreSection.tsx:300-314, SettingsSection.tsx:73-84,
  ShowcaseSidebar.tsx:139-147 (end={<Shortcut>}), AppShellSection.tsx:473-482;
  rail button AppShellSection.tsx:522-538 needs a square icon-only variant.
- LetterMark / IconMark: NavigationSection.tsx:79-81, OverlaysMoreSection.tsx:326,
  DashboardSection.tsx:332-337, SignInSection.tsx:41 (LogoMark).
- SearchField: AuditLogSection.tsx:298-315, SettingsSection.tsx:227-237,
  OnboardingSection.tsx:222-232, AppShellSection.tsx:1079 (SearchBox).
- DateRangePicker: AuditLogSection.tsx:513 (DateRangeFilter; rangeLabel dup at :252).
- RecordSheet / RecordSheetContent: DataTableSection.tsx:385 (CustomerPeek, hand-made).
- Markdown: ContentSection.tsx:744 (inline), 784 (renderMarkdown) ≈125 lines duplicating
  the Markdown block.
- FileChip / fileIcon / formatFileSize: ContentSection.tsx:206 (FileRow), :43 (KIND_ICON),
  :51 (kindOf); ai\ProjectPage.tsx:134-151; ai\data.ts:74 (fileKind), :86 (FILE_ICONS).
- KpiCard + DeltaBadge: erp\pages\Reports.tsx:389 (Kpi), :413 (Change).
- Block ModelPicker (blocks\ai\prompt-box.tsx:181): ai\Conversation.tsx:38 is a copy;
  its Meter :24 can go in the block's details slot.
- ChatWelcome / PromptStarters / FollowUps: erp\Copilot.tsx:111-134 empty state;
  NlSearchPanel.tsx:126-133 example pills.
- AssistantMessage + MessageActions: FeedbackPanel.tsx:75-130.
- Filter-bar FilterChip: NlSearchPanel.tsx:236 (ParsedChip; add a read-only option).
- Filter-bar helpers: AppShellSection.tsx:884-893 (setField, toggleValue) re-implement
  setFieldValues/toggleFieldValue; :924-943 re-implements the FilterBar row.
- FormDialog: SettingsSection.tsx:323 (InviteDialog); partly Admin.tsx:313, 961, 1133.
- DeleteConfirm: IssueSection.tsx:183-201, JobListSection.tsx:323-352, ai\ProjectPage.tsx:206-219.
- listNames and MIXED from the data-table block: JobListSection.tsx:233, :41.
- Spinner: ContentSection.tsx:720.
- shadcn Field: Admin.tsx:64 (FormField), :732 (SwitchRow); ai\SettingsDialog.tsx:129 (Row);
  SettingsSection.tsx:557-565; error lines in erp\Login.tsx.
- shadcn Empty: NlSearchPanel.tsx:210, TriagePanel.tsx:171, MemoryPanel.tsx:129,
  ai\ProjectPage.tsx:154, 194; centred "nothing here" lines in Launchpad.tsx:174, 214,
  Admin.tsx:934, 1117, Overview.tsx:259, 328.

## F. Duplicates between kit pages
- Display menus: FilterBar.tsx:214 (private DisplayMenu) and app-shell\DisplayMenu.tsx:17.
  ORDERINGS twice (FilterBar.tsx:165, display.tsx:49); PROPERTIES twice (FilterBar.tsx:156,
  display.tsx:31). → one src\blocks\display-menu.tsx taking sections as props.
- Job list vs IssueList: JobListSection.tsx (group header 157-164, JobRow 377) and
  app-shell\IssueView.tsx:52 (IssueList), :103 (IssueRow); customer pill JobListSection.tsx:431,
  IssueView.tsx:125; NlSearchPanel.tsx:272 (ResultRow) is a third row copy.
  → a generic GroupedList block, plus one shared JobRow in the jobs module.
- FacetFilter: only re-exported by DataTableSection.tsx:24 for AuditLogSection.tsx:16 →
  import from @/blocks/data-table.
- "Needs attention" rows: Launchpad.tsx:136-171 vs Overview.tsx:288 (ListCard), :339 (Decide).
- Job option lists (status, priority, assignee, labels): FilterBar.tsx:51-90,
  FormModalsSection.tsx:99-129, JobActions, IssueSection, JobListSection BulkToolbar
  → one shared job-options module (data).

## G. Utilities → src\lib\
- Clipboard → lib\clipboard.ts copyText: artifact-panel.tsx:79, markdown.tsx:242
  (writeClipboard), data-table\parts.tsx:62 (exported, toasts), ai\helpers.ts:90
  (copyToClipboard), ai-features\shared.tsx:39, IssueSection.tsx:46, JobActions.tsx:58 (copyId),
  erp\assistant\Turns.tsx:16, playground ai-features.tsx:61; inline: FormModalsSection.tsx:1199,
  OnboardingSection.tsx:316, ThemeSection.tsx:70, IconsSection.tsx:75, erp\Overlays.tsx:74,
  erp\pages\Admin.tsx:1000, playground\inputs.tsx:563, Playground.tsx:207.
- useCopied (brief "copied" flag), 6: chat-message.tsx:40, artifact-panel.tsx:126,
  markdown.tsx:258, OnboardingSection.tsx:312, playground\inputs.tsx:559, Playground.tsx:203.
- useTimers: ai-features\shared.tsx:11 (5 users).
- Blob download → lib\download.ts: artifact-panel.tsx:87 (saveText), data-table\csv.ts:20,
  ai\helpers.ts:78 (downloadText).
- plural: data-table\csv.ts:14 (exported), thinking-trail.tsx:69, ai\script.ts:81,
  AuditLogSection.tsx:259, ContentSection.tsx:63, erp\assistant\answers.ts:31;
  variants erp\pages\Overview.tsx:37 (count), JobListSection.tsx:47 (count).
- greeting: ai\data.ts:101 (before 5 am = evening), erp\Launchpad.tsx:33,
  erp\assistant\AssistantPage.tsx:18 (these two identical).
- Money/number: DataTableSection.tsx:136-137, DashboardSection.tsx:35-36, 94, ai\scenarios-invoices.ts:20-21,
  erp\format.ts:6-15 (+ wrappers answers.ts:30, Overview.tsx:38), SettingsSection.tsx:390, UsagePanel.tsx:28.
- Dates: "d MMM" with the "Sept" fix: DashboardSection.tsx:30-34, RoadmapSection.tsx:23-29,
  ai\data.ts:111, erp\format.ts:9, 24, FilterBar.tsx:115. Time of day: ai\data.ts:109,
  erp\assistant\LaunchpadAi.tsx:40, AgentRunsPanel.tsx:181, CalendarSection.tsx:69.
  Today/Yesterday: ai\data.ts:113 (formatWhen), chat-history.tsx:66 (dateGroup),
  AuditLogSection.tsx:246 (dayLabel). Range labels: period-picker.tsx:52, AuditLogSection.tsx:252,
  DashboardSection.tsx:80.
- File size: components\file-chip.tsx:28 vs ContentSection.tsx:57 (formatBytes).
- Durations: thinking-indicator.tsx:43 vs AgentRunsPanel.tsx:176 (m:ss), CalendarSection.tsx:73,
  prompt-box.tsx:240.
- Seeded random: DataTableSection.tsx:75, AuditLogSection.tsx:190, DashboardSection.tsx:38,
  erp\data.ts:8. (Only share if the algorithm is identical: changing it changes sample data.)
- isTyping: KitchenSink.tsx:62, erp\ErpApp.tsx:35, inline IssueSection.tsx:62, erp\Shell.tsx:52.
- useSvgId: ChartsSection.tsx:56, DashboardSection.tsx:141, erp\pages\Overview.tsx:159.
- Slug: ai\helpers.ts:98, FormModalsSection.tsx:868 (slugify), playground\navigation.tsx:610.
- Job constants (data → pages\data.ts): PRIORITY_RANK (FilterBar.tsx:114,
  ai\scenario-helpers.ts:8, FeedbackPanel.tsx:19); dueRank (FilterBar.tsx:119,
  scenario-helpers.ts:14); status orders (JobActions.tsx:31 = display.tsx:69;
  JobListSection.tsx:31 = display.tsx:68); UNASSIGNED (FilterBar.tsx:45, nl-search.ts:22,
  JobListSection.tsx:38); LABEL_BY_ID (IssueView.tsx:22, BoardSection.tsx:18, JobActions.tsx:242).

## H. Re-export layers (import from the source, delete the layer)
- pages\sections\ai-features\shared.tsx:6-8 forwards AiLabel, IconAction, StreamCaret,
  Thinking (8 importers). Keep the file only for diffWords/DiffText.
- pages\sections\ai\Message.tsx:19 forwards IconAction (Conversation, AiWorkspaceSection).
- pages\sections\ai\parts.tsx:25-26: SourcesRow, StoppedNote (Message.tsx); TypingDots,
  useNow, Elapsed, ActivityLine unused; AiStyles (AiWorkspaceSection).
- pages\sections\ai\markdown.tsx:8-9: CodeBlock (ArtifactPanel); Cite, parseBlocks, Caret unused.
- pages\sections\ai\Sidebar.tsx:18, 22: RenameInput and DROPDOWN_KIT alias (Conversation).
- pages\sections\ai\data.ts:11-12: formatSize alias (ProjectPage, scenarios-assist, script),
  formatDuration (Message).
- pages\sections\DataTableSection.tsx:24: FacetFilter / FacetOption (AuditLogSection).
- templates\erp\ui.tsx: Person (:15), IS_MAC/MOD (:16) unused; ModuleMark = IconMark (:57,
  5 users); PageHeader (:60), Card (:71) wrappers.
- templates\erp\format.ts: Tone type (:40), TONE_CLASS (:63) unused; TONE_DOT used by ListPage, Pipeline.
- Blocks forwarding components: chat-message.tsx:28 FileChip (ai/Message), formatFileSize unused;
  prompt-box.tsx:112 fileIcon, formatFileSize unused; kpi-card.tsx:10 DeltaBadge/KpiDelta.
- pages\data.ts STATUS/PRIORITY aliases: fine.
