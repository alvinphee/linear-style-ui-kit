# Phase 1 report: small kit components

1. `LabelChip` (`@/components/label-dot`): `name`, `colour`, `size` ('sm' 20px default | 'md' 24px),
   `variant` ('outline' default | 'soft' filled, for inside an input), `onRemove` (× "Remove {name}"), `className`.
   IssueView Labels, BoardSection → 'sm'; JobActions → 'md'; NavigationSection: keep dark text with
   `className="text-foreground"`; IssueSection (removable): `text-foreground` too; InputsSection → `variant="soft"`.
2. `Mention` (`@/components/mention`): link props + `href` (without: a text pill). Replaces chat-message PILL
   (and its /command pill), InboxSection NoteBody pill, OverlaysMoreSection hover-card pill.
3. `ProgressRing` (`@/components/progress-ring`): `value` 0–100, `size` (40), `strokeWidth` (3), `colour`
   (CSS colour, default brand), `label` (sr name; none = decorative), `animateIn`, `children` (centre, sized
   by className). ChartsSection Ring → `size={80} strokeWidth={7} animateIn` (drop its own animate code);
   OnboardingSection ring.
4. `LegendLine`, `LegendRow` (`@/components/chart-legend`): LegendLine `label`, `colour`, `dashed`,
   `className`. ChartsSection, DashboardSection. Prop is `colour`.
5. `BarList` (`@/components/bar-list`): `items` ({ id, label, hint, value, display, secondary, start, colour }),
   `colour`, `max`, `ranked`, `empty`, `className`. erp Overview Meters (identical); Dashboard top customers
   (bars 2px thicker, value bold, hint shows on phones unless a hidden-on-mobile span is passed).
6. `ViewSwitch`, `LIST_BOARD_VIEWS` (`@/components/view-switch`): `views`, `value`, `onChange`, `showLabels`,
   `label` ("View"), `className`. AppShellSection uses LIST_BOARD_VIEWS; Pipeline its own views with
   `showLabels label="Layout"`.
7. `NavGroup` (`@/components/nav-item`): `title`, `count`, `action`, `open`/`defaultOpen`/`onOpenChange`,
   `foldable` (false = plain heading), `children`, `className`. AppShell Group, ShowcaseSidebar headings.
   NavItem additions: `rail` (square icon button with the active bar), `expanded` (chevron + expanded state
   for a folding team row); extra props and ref pass through (can be a menu trigger); `end` slot existed.
   OverlaysMoreSection sheet, SettingsSection nav: recolour through className.
8. `SearchField` (`@/components/search-field`, moved from the filter-bar block): new `end` (shown while
   empty, e.g. a shortcut hint) and `autoFocus`. AuditLogSection (same), Settings and Onboarding (gain clear
   button), AppShell SearchBox (input-group border/focus/key style).
9. `DeleteConfirm` (`@/components/delete-confirm`, moved from the data-table block): `confirmLabel`,
   `cancelLabel`, `destructive` (true), `icon` (null hides), `size` ('sm'), `returnFocusRef`. IssueSection
   (no icon, focus back to More), JobListSection, ai/ProjectPage (no icon). Record sheet already uses it.
10. `CommentBox` (`@/components/comment-box`, from record-sheet): `onComment`, `placeholder`, `label`,
    `actions` (buttons before Send), `className`. IssueSection Composer (Attach in `actions`); hint is key caps.
11. `IconAction`: new `shortcut` (keys in tooltip + aria-keyshortcuts); Button props and ref pass through
    (works as a dropdown/popover trigger); `onClick` optional; `variant`, `size`. Copies that weren't grey
    (Inbox, KitchenSink, sidebar toggles, Clear selection) need `className="text-foreground"`.
12. `Shortcut`: new `then` option ("G then B", as ShortcutsSheet draws it); helper `ariaKeyShortcuts(keys)`.

Temporary re-exports (phase 3 removes): SearchField from `@/blocks/filter-bar`, DeleteConfirm from
`@/blocks/data-table`. `src/blocks/data-table/data-table.tsx` must import SearchField from
`@/components/search-field`. `src/blocks/ai/chat-message.tsx` should use Mention.

Glossary to add: bar list, progress ring, chart legend, view switch, nav group, comment box, delete confirmation.
