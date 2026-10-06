# Findings

What we have learned about Hugeicons with shadcn/ui.
Started 2026-09-30.

## Summary
- **Only icons.** Hugeicons gives you icon drawings and one wrapper
  component, `HugeiconsIcon`. No buttons, dialogs or other UI.
- **Free set:** `@hugeicons/core-free-icons` v4.3.5 has **6,025 icons**, all
  one style (Stroke Rounded). Other styles (Solid, Bulk, Duotone, Twotone,
  Sharp, Standard) need a Pro licence.
- **Tree-shaking works.** Ten named icons plus the wrapper add 11 KB to a
  build (3.7 KB gzipped). Loading every icon adds about 6.7 MB
  (1.5 MB gzipped), which only this playground does.
- **Lucide names are built in.** The free package also exports 1,308
  Lucide-style names (`Trash2`, `LayoutDashboard`, `House`, `ChevronDown`)
  that point at the matching Hugeicons icon. That makes a move from Lucide
  much easier.
- **The usage is different, though.** In Lucide each icon is a component
  (`<Trash2 />`). In Hugeicons each icon is data that goes into the wrapper
  (`<HugeiconsIcon icon={Trash2} />`). Every call site has to change, even
  where the name stays the same.
- **Some aliases are loose.** `AArrowDown` (a text-size icon in Lucide)
  points at a plain down arrow. Check each icon's look, not just its name.
- **The skill's list is out of date.** It lists 5,471 icons from v4.2.1, and
  the package now has 6,025. Newer icons such as `HardHatIcon` exist in the
  package but may not be in the skill's list.
- **`absoluteStrokeWidth` needs `strokeWidth`.** The wrapper only changes
  the stroke when `strokeWidth` is passed. With the "leave out defaults"
  rule, `absoluteStrokeWidth` alone silently does nothing. Seen in
  `@hugeicons/react` v1.1.10.
- **The skill installer fails on Windows** (a file in the repo has `:` in its
  name). See CLAUDE.md for the workaround.

## shadcn/ui with Hugeicons (added 2026-09-30)
- **shadcn supports Hugeicons directly.** Set `"iconLibrary": "hugeicons"` in
  `components.json`, and every component `shadcn add` writes uses
  `HugeiconsIcon`. No hand-editing, and no Lucide package. A project that
  already uses Lucide can switch the same way, but components it has already
  added need re-adding or editing by hand.
- **The Mira preset** (`npx shadcn@latest init -b radix -p mira`) sets
  Hugeicons, Inter, neutral colours and the compact `radix-mira` style in
  one step. Buttons are 28px tall with 12px text, which is close to Linear.
- **New `cn` package.** shadcn 4.21 installs `cn` (published by shadcn,
  from the `shadcn-ui/cn` repo) instead of `clsx` + `tailwind-merge`.
  Components import `cn` from `"cn"` directly.
- **`CommandDialog` needs a `<Command>` inside it.** Without it the page
  crashes when the menu opens (cmdk: "reading 'subscribe'").
- **`next-themes` is noisy in a Vite app.** It renders a `<script>` tag,
  and React 19 logs that as an error in an app that renders only in the
  browser. The playground uses a 60-line theme hook (`src/lib/theme.tsx`)
  instead.
- **Free Hugeicons cover Linear-style statuses.** `CircleDashedIcon`
  (backlog), `CircleIcon` (todo), `TimeHalfPassIcon` (in progress),
  `CheckmarkCircle02Icon` (done) and `CancelCircleIcon` (cancelled). Priority
  uses `NoSignalIcon`, `LowSignalIcon`, `MediumSignalIcon`, `FullSignalIcon`
  and `AlertSquareIcon`. Linear's filled "half circle" is not in the free
  set, because free icons are outline only.

## Lucide to Hugeicons
Hugeicons names for 145 common Lucide icons, checked on 2026-09-30.

- **126** have a Lucide alias in Hugeicons (the same icon under a Lucide name).
- **12** have a Hugeicons icon with the same name but no alias. Check that
  each one looks the same.
- **7** have no match by name. A close icon was picked by hand.

| Lucide | Hugeicons | How matched |
|---|---|---|
| `AlertTriangle` | `Alert01Icon` | Lucide alias |
| `Archive` | `ArchiveIcon` | Lucide alias |
| `ArchiveRestore` | `ArchiveArrowUpIcon` | Lucide alias |
| `ArrowDown` | `ArrowDown01Icon` | Lucide alias |
| `ArrowLeft` | `ArrowLeft01Icon` | Lucide alias |
| `ArrowLeftRight` | `ArrowLeftRightIcon` | Lucide alias |
| `ArrowRight` | `ArrowRight01Icon` | Lucide alias |
| `ArrowUp` | `ArrowUp01Icon` | Lucide alias |
| `ArrowUpDown` | `ArrowUpDownIcon` | Lucide alias |
| `Award` | `Award01Icon` | Lucide alias |
| `BadgeCheck` | `CheckmarkBadge01Icon` | Lucide alias |
| `Ban` | `BanIcon` | Same name, check the glyph |
| `Bell` | `Notification01Icon` | Lucide alias |
| `Bookmark` | `Bookmark01Icon` | Lucide alias |
| `BookOpen` | `BookOpen01Icon` | Lucide alias |
| `Boxes` | `Package01Icon` | Lucide alias |
| `Building2` | `Building02Icon` | Lucide alias |
| `Calendar` | `Calendar01Icon` | Lucide alias |
| `CalendarClock` | `TimeScheduleIcon` | Lucide alias |
| `CalendarDays` | `Calendar02Icon` | Lucide alias |
| `Camera` | `Camera01Icon` | Lucide alias |
| `CameraOff` | `CameraOff01Icon` | Lucide alias |
| `ChartColumn` | `BarChartIcon` | Lucide alias |
| `ChartNoAxesColumn` | `ChartNoAxesColumnIcon` | Same name, check the glyph |
| `Check` | `Tick01Icon` | Lucide alias |
| `CheckCheck` | `TickDouble01Icon` | Lucide alias |
| `CheckCircle2` | `CheckmarkCircle02Icon` | No match, picked by hand |
| `ChevronDown` | `ArrowDown01Icon` | Lucide alias |
| `ChevronLeft` | `ArrowLeft01Icon` | Lucide alias |
| `ChevronRight` | `ArrowRight01Icon` | Lucide alias |
| `ChevronsUpDown` | `ArrowUpDownIcon` | Lucide alias |
| `ChevronUp` | `ArrowUp01Icon` | Lucide alias |
| `Circle` | `CircleIcon` | Lucide alias |
| `CircleAlert` | `AlertCircleIcon` | Lucide alias |
| `CircleCheck` | `CheckmarkCircle01Icon` | Lucide alias |
| `CircleHelp` | `HelpCircleIcon` | No match, picked by hand |
| `CircleOff` | `CircleOffIcon` | Same name, check the glyph |
| `CircleUser` | `UserCircleIcon` | Lucide alias |
| `ClipboardCheck` | `ClipboardIcon` | Lucide alias |
| `ClipboardList` | `CheckListIcon` | Lucide alias |
| `ClipboardPen` | `ClipboardPenIcon` | Same name, check the glyph |
| `Clock` | `Clock01Icon` | Lucide alias |
| `Construction` | `ConstructionIcon` | Same name, check the glyph |
| `Copy` | `Copy01Icon` | Lucide alias |
| `CornerUpLeft` | `ArrowTurnUpIcon` | Lucide alias |
| `Download` | `Download01Icon` | Lucide alias |
| `EllipsisVertical` | `MoreVerticalIcon` | Lucide alias |
| `Eraser` | `EraserIcon` | Lucide alias |
| `ExternalLink` | `ArrowUpRight01Icon` | Lucide alias |
| `Eye` | `ViewIcon` | Lucide alias |
| `EyeOff` | `ViewOffIcon` | Lucide alias |
| `File` | `File01Icon` | Lucide alias |
| `FileCheck2` | `FileValidationIcon` | No match, picked by hand |
| `FileSpreadsheet` | `FileSpreadsheetIcon` | Same name, check the glyph |
| `FileText` | `File02Icon` | Lucide alias |
| `FileWarning` | `FileExclamationPointIcon` | No match, picked by hand |
| `FileX` | `FileRemoveIcon` | Lucide alias |
| `Folder` | `Folder01Icon` | Lucide alias |
| `FolderOpen` | `FolderOpenIcon` | Lucide alias |
| `Gavel` | `GavelIcon` | Same name, check the glyph |
| `GraduationCap` | `Mortarboard01Icon` | Lucide alias |
| `Hammer` | `LegalHammerIcon` | Lucide alias |
| `HandCoins` | `Coins01Icon` | Lucide alias |
| `HardHat` | `HardHatIcon` | Same name, check the glyph |
| `History` | `WorkHistoryIcon` | Lucide alias |
| `Home` | `Home01Icon` | Lucide alias |
| `IdCard` | `IdCardIcon` | Same name, check the glyph |
| `Image` | `Image01Icon` | Lucide alias |
| `ImagePlus` | `ImageAdd01Icon` | Lucide alias |
| `Images` | `Image02Icon` | Lucide alias |
| `Info` | `InformationCircleIcon` | Lucide alias |
| `KeyRound` | `Key02Icon` | Lucide alias |
| `Laptop` | `LaptopIcon` | Lucide alias |
| `LayoutDashboard` | `DashboardSquare01Icon` | Lucide alias |
| `LayoutGrid` | `LayoutGridIcon` | Lucide alias |
| `LifeBuoy` | `LifebuoyIcon` | Lucide alias |
| `Link` | `Link01Icon` | Lucide alias |
| `List` | `ListViewIcon` | Lucide alias |
| `ListChecks` | `CheckListIcon` | Lucide alias |
| `Loader2` | `Loading03Icon` | No match, picked by hand |
| `Lock` | `LockIcon` | Lucide alias |
| `LogOut` | `Logout01Icon` | Lucide alias |
| `MapPin` | `Location01Icon` | Lucide alias |
| `MapPinOff` | `LocationOffline01Icon` | Lucide alias |
| `MessageSquare` | `Message01Icon` | Lucide alias |
| `MessagesSquare` | `MessageMultiple01Icon` | Lucide alias |
| `Moon` | `MoonIcon` | Lucide alias |
| `MoreHorizontal` | `MoreHorizontalIcon` | Lucide alias |
| `NotebookPen` | `Notebook01Icon` | Lucide alias |
| `OctagonX` | `OctagonXIcon` | Same name, check the glyph |
| `Package` | `PackageIcon` | Lucide alias |
| `PackageCheck` | `PackageDeliveredIcon` | Lucide alias |
| `PackageX` | `PackageRemoveIcon` | Lucide alias |
| `PanelLeft` | `PanelLeftIcon` | Lucide alias |
| `Paperclip` | `AttachmentIcon` | Lucide alias |
| `Pencil` | `PencilIcon` | Lucide alias |
| `PenLine` | `PenTool01Icon` | Lucide alias |
| `Pin` | `PinIcon` | Lucide alias |
| `PinOff` | `PinOffIcon` | Lucide alias |
| `Play` | `PlayIcon` | Lucide alias |
| `Plus` | `Add01Icon` | Lucide alias |
| `PlusCircle` | `AddCircleIcon` | No match, picked by hand |
| `Printer` | `PrinterIcon` | Lucide alias |
| `QrCode` | `QrCodeIcon` | Lucide alias |
| `ReceiptText` | `Invoice02Icon` | Lucide alias |
| `RefreshCw` | `RefreshIcon` | Lucide alias |
| `RotateCcw` | `RotateLeft01Icon` | Lucide alias |
| `RotateCw` | `RotateClockwiseIcon` | Lucide alias |
| `Route` | `Route01Icon` | Lucide alias |
| `ScanSearch` | `SearchAreaIcon` | Lucide alias |
| `Search` | `Search01Icon` | Lucide alias |
| `SearchX` | `SearchMinusIcon` | Lucide alias |
| `Send` | `MailSend01Icon` | Lucide alias |
| `Settings` | `Settings01Icon` | Lucide alias |
| `Settings2` | `Settings02Icon` | Lucide alias |
| `Shield` | `Shield01Icon` | Lucide alias |
| `ShieldAlert` | `Shield01Icon` | Lucide alias |
| `ShieldCheck` | `SecurityCheckIcon` | Lucide alias |
| `Siren` | `Alert02Icon` | Lucide alias |
| `SlidersHorizontal` | `SlidersHorizontalIcon` | Lucide alias |
| `Sparkles` | `SparklesIcon` | Lucide alias |
| `Square` | `SquareIcon` | Lucide alias |
| `SquarePen` | `Pen01Icon` | Lucide alias |
| `Stamp` | `StampIcon` | Lucide alias |
| `Tag` | `Tag01Icon` | Lucide alias |
| `Timer` | `Timer01Icon` | Lucide alias |
| `Trash` | `Delete01Icon` | Lucide alias |
| `Trash2` | `Delete02Icon` | Lucide alias |
| `TriangleAlert` | `TriangleAlertIcon` | Same name, check the glyph |
| `Truck` | `TruckIcon` | Lucide alias |
| `Upload` | `Upload01Icon` | Lucide alias |
| `UploadCloud` | `CloudUploadIcon` | No match, picked by hand |
| `User` | `UserIcon` | Lucide alias |
| `UserCheck` | `UserCheck01Icon` | Lucide alias |
| `UserCircle` | `UserCircleIcon` | Same name, check the glyph |
| `UserMinus` | `UserMinus01Icon` | Lucide alias |
| `UserPlus` | `UserAdd01Icon` | Lucide alias |
| `UserRound` | `UserCircleIcon` | Lucide alias |
| `Users` | `UserMultipleIcon` | Lucide alias |
| `UserX` | `UserRemove01Icon` | Lucide alias |
| `Video` | `Video01Icon` | Lucide alias |
| `Warehouse` | `WarehouseIcon` | Lucide alias |
| `Wrench` | `Wrench01Icon` | Lucide alias |
| `X` | `Cancel01Icon` | Lucide alias |
| `XCircle` | `CancelCircleIcon` | Lucide alias |

## Still to check
- Look through the 12 "check the glyph" rows and the 7 hand-picked rows in
  the kitchen sink.
- Test at 16 and 20px next to real text.
- Decide whether the free Stroke Rounded style is enough, or whether a Pro
  licence is worth it.

## Component quirks found while building the playgrounds (added 2026-10-01)
- **`Textarea` ignores `rows`.** Its `field-sizing-content` class sizes it to
  the text. Add `field-sizing-fixed` when you want a fixed number of rows.
- **`InputOTP` warns with `defaultValue`.** It passes `defaultValue` on to its
  `<input>` as well as using it itself, and React warns. Use a controlled
  `value` instead.
- **`RadioGroup` `orientation` only changes the arrow keys.** The layout
  needs its own className (for example `flex` for a row).
- **A one-thumb `Slider` has no accessible name.** Radix names the thumbs of
  a range only, and the wrapper has no prop to label a thumb. Needs a fix in
  `slider.tsx` before a slider ships in a real form.

## TanStack Table v9 (added 2026-10-01)
- `globalFilterFn` accepts a function, which makes "search every column of a
  row" a one-liner. The data-table block uses it for its search box.
- `tableFeatures({ columnMeta })` types each column's `meta` without global
  declaration merging, so a block can carry its own column options (label,
  alignment, hide below a container width).

## shadcn's default theme, next to the kit's (added 2026-10-05)
- **The stock Mira preset is already Hugeicons and Inter.** shadcn's preset
  list reads `mira: { iconLibrary: "hugeicons", font: "inter",
  baseColor: "neutral", radius: "default" }`. So the kit's font and icons
  are shadcn's own choice for Mira, and so are the 28px controls (`h-7` in
  `components/ui`). What `styles.css` adds is the colours, 13px body text,
  Inter's alternate letters (`cv01`, `ss03`), 8px corners, thin scrollbars
  and a tinted text selection, plus the brand, subtle and status tokens.
- **Stock values** (registry `ui.shadcn.com/r/colors/neutral.json`): pure
  greys, light-mode borders a solid `oklch(0.922 0 0)`, dark-mode borders
  10% white, black (light) or near-white (dark) primary, `--radius`
  0.625rem, and charts in five greys (no colours any more).
- **The stock base layer sets no body text size**, only
  `bg-background text-foreground`. Text that doesn't set its own size is the
  browser's 16px.
- **The theme comparison** (`#/compare/<page>`) shows both side by side,
  and each part can be switched back on its own.

## Roadmap (Gantt chart) (added 2026-10-05)
The chart is the `gantt-chart` block, built from the GanttBar,
MilestoneMarker and TimeMarker components (split out 2026-10-06).
- **A bar's name can stick to the view's edge only if the bar clips with
  `overflow: clip`, not `hidden`.** `overflow: hidden` makes the bar a
  scroll container, so a `position: sticky` name inside it sticks to the
  bar and never moves. `overflow-clip` clips the same (rounded corners
  included) without being a scroll container, so the name sticks to the
  timeline's scroll area instead (GanttBar reads `--gantt-sticky-left`,
  which the block sets just past its names column). A sticky element can
  only move inside its parent, so the name sits in a `flex-1` wrapper and
  is `w-fit` itself.
- **Anything absolutely placed in a scroller widens it, even by a few
  pixels.** A Monday's date on the last day or two, or the Today pill on
  the last day, gave Months a scrollbar. The block drops week dates without
  room for them, and clips the today line to the timeline.
- **Fitting a whole range into any width needs the labels to adapt too.**
  Months has no minimum day width now, so on a phone a day is under 2px.
  Week dates and lines drop out below 20px a week, month names shorten to
  "Sep" (sliced from the long name, since Intl's short en-GB form is
  "Sept"), and a name beside a bar goes before it when the timeline ends
  first, so it never widens the chart.

## Dock schedule (added 2026-10-06)
The `dock-schedule` block: DockSchedule (one day, a row per dock door),
DockWeek (a heatmap of docks by day) and DockSlotPicker (free docks per
start time), sharing the maths in `schedule.ts`.
- **A click handler can't trust state set on mousemove.** Clicking a free
  slot first read the slot from hover state, and a quick click (or a
  scripted one) ran before that state had rendered, so nothing happened.
  The click now works the slot out again from the pointer.
- **To refuse a drop and still say why, skip `preventDefault` in dragover
  but keep drawing.** The browser then shows the no-drop cursor and never
  fires `drop`, while the ghost under the pointer turns red with the
  reason ("Taken by…", "Outbound only", "Maintenance"). Synthetic mouse
  drags in the preview browser don't fire HTML5 drag events; test drops by
  dispatching `DragEvent`s with a `DataTransfer`, or through the
  Shift + arrow keys, which share the same check.
- **"No free dock" has two causes.** A slot where every dock is closed (a
  shift change) reads "Closed", not "Full", in the free docks row.
- **FormDialog's children can be a function of the values**, for a control
  of its own that depends on them, such as the slot picker (which needs the
  direction and length). Added for the booking dialog rather than
  hand-building a second dialog.
- **The kit's TimeMarker draws the now line.** The schedule first drew its
  own line and pill; it uses the component now, as the Gantt chart does.

## Dock schedule, docks as columns (added 2026-10-06)
`DockSchedule` takes `orientation="vertical"`: a column per dock and time
down the side, like a calendar's day view. One component, not a copy: the
drag, keyboard, booking and closure logic is shared, and only the frame and
where things sit (top and height instead of left and width) change. Shift
and the arrow keys follow the axes: up and down move the time, left and
right the dock.
- **A short bar can drop whole lines.** A vertical bar's lines sit in a
  column flexbox that wraps (`flex-col flex-wrap`) inside a box that clips.
  A line that doesn't fit wraps into a second column, outside the bar, so a
  15-minute bar shows only the carrier and never half of the time line.
  The column gap must be wider than the side padding, or the start of the
  wrapped column shows through the padding.
- **Switching layout reuses the scroll area.** React keeps the same scroll
  element when the layout changes, so the vertical layout opened scrolled
  sideways by where the horizontal one had been. The schedule now resets
  the other axis when it scrolls to now.
- **TimeMarker got `orientation="horizontal"`** (a line across with its
  pill at the left) for the vertical layout's now line. The pill sits in the
  sticky time column, so it stays in view when the docks scroll sideways.

## Brief vs setup test (added 2026-10-06)
The same task list page was built four times by fresh Claude Code sessions
(Opus 5.5, effort xhigh), each in its own folder outside the kit, so none
saw this kit's CLAUDE.md. Same sample data and the same 28 shadcn
components; the builders could not open a browser. The test folder is
`Desktop\ui-brief-test` (README, prompts, side-by-side page). Full
write-up: `docs/brief-vs-setup-study/paper.md`, with the same folder kept
in the test folder's `docs\`.

| | 1 stock, short brief | 2 stock, Linear brief | 3 kit setup, short brief | 4 kit setup, Linear brief |
|---|---|---|---|---|
| Font, row text | Geist, 14px | Geist, 13px | Inter, 13px | Inter, 13px |
| Row height | 44px | 40px | 40px | 40px |
| Main button | black | black | indigo | indigo |
| Row borders | solid grey | grey at 60% | 6%, tinted | 5%, tinted |
| Ctrl+K menu, toasts | no | yes | no | yes |
| Lines written | 2,106 | 3,647 | 2,368 | 3,570 |

- **The model already knows the pattern.** With no style words at all
  (version 1), it built a list grouped by status with status and priority
  icons, task IDs, label chips, due dates and avatars. The layout comes
  from the model, not from the brief or the setup.
- **The setup sets the look.** Mira plus the kit's tokens gave versions 3
  and 4 the kit's type, colours, faint borders and density, without being
  asked. It did not change what was built.
- **The brief adds features, not looks.** "Linear-style" brought denser
  rows, Linear's words ("issues", view tabs) and power features (Ctrl+K
  menu, keyboard shortcuts, toasts): 51–73% more code. Neither builder
  touched the colours or the font.
- **Looking at the result still matters.** In version 4, 9 of the 18 task
  IDs wrap onto two lines (a 64px column). The builder never saw the page.
  The kit avoids this by checking each part on its playground.
- Limits: one run each, one screen, one model. It says nothing about
  keeping 50 screens consistent, which is what the kit's shared parts are
  for.

## The shadcn registry (added 2026-10-06)
`npm run registry` writes `registry.json` from the code
(`scripts/build-registry.mjs`), then `shadcn build` turns it into one JSON
file per item in `public/r/`. 110 items: 47 ui, 30 components, 24 blocks,
8 lib and the `tokens` theme. What we learned from shadcn 4.21's own code:

- **Imports are rewritten on install.** `@/x` becomes the project's alias for
  it: `@/components/ui/…` → its ui alias, `@/lib/…` → its lib alias, and
  anything else (`@/blocks/kanban-board`) → `@/components/blocks/kanban-board`.
  So blocks must be installed into `components/blocks/`, which each block
  file's `target` (`@components/blocks/…`) does. Relative imports are kept,
  so a folder block (data table) keeps working.
- **Without a target, the folder comes from the type** (ui, lib, components)
  and the file name from the path after that folder's name. That is right
  for ui, components and lib, and wrong for blocks, hence the targets.
- **Kit items depend on each other as `@kit/<name>`**, and that only works
  when the installing project names the registry in its `components.json`
  (`"registries": { "@kit": "http://localhost:5180/r/{name}.json" }`).
  Without it, shadcn stops with "Unknown registry".
- **`cn` comes from the `cn` package**, not `@/lib/utils`, so no item needs
  the project's utils file; `cn` is just an npm dependency.
- **The tokens item is the whole theme**, read from `styles.css`: the
  `@theme inline` block, `:root`, `.dark`, the mono buttons, the base layer
  and the Inter import. shadcn also writes `--x: var(--x)` lines into
  `@theme inline` for tokens whose value is a `var()` or a number. Tailwind
  outputs them inside its `theme` layer, but the real values in `:root` and
  `.dark` sit outside any layer, so they win: the test page looked right.
  Noise, not a bug.
- **Tested end to end:** a new Vite project with an empty theme installed all
  110 items with one `npx shadcn add`. `tsc` and `vite build` passed, and a
  page made of installed parts looked like the kit (screenshot checked).
- **Keeping it current** (`vite.config.ts`, `npm run check`). Tested: a new
  component appeared in `public/r/` about 15 seconds after it was saved, an
  edit to Panel showed in `panel.json`, and a deleted part's JSON was
  removed. Two snags on the way:
  - `shadcn build` only writes files, so a deleted part stayed installable.
    The script now removes JSON that no item owns.
  - Every rebuild reloaded the open page. Tailwind reads every file that is
    not in `.gitignore` for class names, `registry.json` included, and
    reloads the page when one changes. `@source not "../registry.json"` in
    `styles.css` stops that, and the script only rewrites `registry.json`
    when its content changes. `public/r/` is in `.gitignore`, so Tailwind
    never read it.

## App shells: the Two rows header (added 2026-10-06)
A sixth header on the App shells page, tried before changing the ERP
template's header. Row 1 is the global header: sidebar buttons on the left,
search in the middle, Ask AI, notifications and the account on the right.
Row 2 is the Breadcrumb header (path, favourite, people, Share, New issue).
A switch, "Top row over the sidebar", sets where row 1 sits:
- **Over the page only (the default).** The sidebar keeps its full height
  and its workspace switcher; it only loses search and the account, which
  moved up. When no sidebar is beside the page (hidden, or on a phone), row
  1 shows the workspace switcher itself.
- **Across the whole app,** over the sidebar, on the sidebar's colour, with
  the workspace switcher in it. Each sidebar then also drops its switcher or
  logo (and Teams its New issue button). With Top nav, the global header
  replaces its first row, so it reads global header, tabs, breadcrumb.
- **A second switch, "Account at the sidebar's foot",** keeps the account
  in the sidebar instead: a row (name and email) in Teams and Inset, the
  avatar alone in Rail and folded Icons, its menu opening to the right. The
  top row's avatar then shows only when no sidebar is beside the page, so
  the account is always one click away.
- **The account menu got an avatar trigger** (`variant="avatar"`). Its name
  is not on screen, so the menu starts with it. Light and dark mode are a
  toggle in the top row (added with the ERP change), with System in the
  menu's Theme sub-menu.
- **On a phone** the search box becomes an icon that opens over the row and
  Ask AI shows its icon only; the breadcrumb row folds as before.

## The ERP on Two rows (added 2026-10-06)
Both ERP templates now use the App shells combination Alvin chose: the
Teams sidebar (full height, no inset card), the top row over the page only,
and the account at the sidebar's foot. The top row holds search (opens the
command palette), Ask AI, notifications and a light / dark toggle; the
breadcrumb has its own row. The account menu's Header setting (breadcrumb
with or without search) is gone: search always sits in the top row now.
- **Two new shared parts, so nothing is written twice:** the GlobalHeader
  block (the top row's layout, used by App shells and the ERP) and the
  ThemeToggle component (also in the kit's header and the theme
  comparison, which each had their own copy).
- **The top row centres search without breakpoints:** the start and end
  slots share the room either side equally (`flex-1 basis-0`), so it works
  the same in a window (the ERP) and in a demo frame (App shells). A first
  idea, a container on the row itself, would have taken over the frame's
  own `@2xl` checks, which decide whether the sidebar is showing.
- **Checked in the browser:** the invoice list and the ERP + AI Assistant
  at desktop width, the sidebar hidden (module switcher and account move
  up), light mode, and 390px (no sideways scrolling).

## The Assistant's sidebar, All chats and incognito (added 2026-10-06)
Alvin asked for the ERP + AI Assistant to look like a polished chat app:
+ New chat, projects with instructions, project folders, pinned, then the
history with the date groups switchable, a page of all chats with a search
and filters by type, and an incognito mode.
- **Kit first.** ChatHistory gained `newChatIcon`, `onNewProject` (your own
  setup instead of naming in place), a project menu (new chat in it, edit,
  delete with a confirm), a Chats heading whose calendar button turns the
  date groups off (`groupByDate`, uncontrolled unless you pass it) and an
  "All chats" link (`onViewAll`). New: the ChatLibrary block (All chats)
  and the IncognitoToggle component, with demos on the AI workspace and AI
  components pages. The project setup is the existing FormDialog block
  (name, plus instructions with a 1,000-character counter).
- **Chat type = module.** `topicOf` in `answers.ts` returns the module of
  the answer a question matches, so a chat's type needs no extra data.
- **Incognito chats live in the store but not in `chats`**, so the
  sidebar, All chats and the side panel never list them; starting or
  opening another chat, or turning incognito off, deletes them.
- **A circular import to watch:** `modules.tsx` imports the Assistant's
  pages, which use `MODULES`. A list built from `MODULES` at the top of the
  Assistant file crashed on load, so the chat types are built on first use.
- **Then laid out like the big chat apps** (from two screenshots Alvin
  gave, structure only; the look is the kit's): New chat, a few rows
  (Search chats, All chats and any of your own, folding under More past four),
  then Projects, Pinned and Chats as folding NavGroup headings, the rows
  NavItem-sized on the sidebar's colours. The date switch and a type filter
  moved into one options menu on Chats. Every chat has an icon: its type's
  (the ERP's module icons) or a chat bubble.
- **A load-order slip:** a playground's sample data used a constant defined
  further down the file. TypeScript allows it, but the module throws when it
  loads, and every kit page went blank. Only opening the page shows this.
- **Live reload while another session edits shared files** (here
  `lib/text.ts`) can swap the assistant store under a running page:
  "useAssistant must be used inside AssistantProvider". A full reload
  clears it; it cannot happen in a build.
- **Incognito left the sidebar** (Alvin's call): one way in is enough, the
  toggle at the top right of the chat, where you are when you want it. The
  block's `links` stay for rows of your own; the kit's Chat history demo
  shows the incognito row only when its switch is on.
- **The AI chat template got the same sidebar** (the AI workspace, so the
  kit's AI workspace page too): + New chat, All chats (`ai/AllChats.tsx`,
  the ChatLibrary block), a type icon on every chat, the project menu,
  Chats by date or as one list (saved with the chats), and the incognito
  toggle at the top right. No ERP code was copied: both wire the same
  blocks. The types come from the scripted agent's own intents
  (`chatTypeOf`), as the ERP's come from `topicOf`.
- **The incognito toggle never looked pressed.** It styled `data-[state=on]`,
  but its tooltip trigger (`TooltipTrigger asChild`) writes its own
  `data-state` ("closed", "delayed-open") over the Toggle's. The Mira Toggle
  styles `aria-pressed` for this reason; the incognito toggle now does too.
  Any Toggle inside a tooltip trigger needs `aria-pressed:` variants.
- **Opening a kept chat now ends incognito**, in both apps. Before, the
  toggle could stay pressed over a chat that was being saved.
- **The All chats preview skips tables, code and list marks**: a line made
  from a Markdown table read as "--- :---- Backlog 1 0".
- **The Browser pane can freeze CSS transitions** when it is not on screen:
  `getComputedStyle` then returns a colour halfway through its fade. Turn
  `transition` off on the element (or take a screenshot) before trusting a
  computed colour.
- **Chats are one list by default** (Alvin's call), in the ChatHistory
  block and both apps; the options menu groups them by date. The saved
  setting was renamed from `chatsByDate` to `groupByDate` (the block's
  prop), so a browser that saved the old default starts on the new one.

## Ask AI docks beside the page; records open as modals (added 2026-10-06)
Alvin asked for Ask AI to slide out from the side (whichever is more
polished) and be resizable, and for the other side slide-outs to be modals.
- **Docked, not over the page.** The big products' assistants (Microsoft
  Copilot, GitHub Copilot Chat, Notion AI) sit beside the page and narrow
  it, because an answer is about what is on that page. An overlay covers the
  very records it talks about. The new DockedPanel block does this: it docks
  under the global header (the Ask AI button stays in reach, and its header
  lines up with the breadcrumb bar), slides by animating its width with the
  content pinned to the outer edge (so it slides rather than squeezes),
  and resizes from its edge: drag, arrow keys, double-click to reset, never
  over 60% of the row. Below 1024px there is no room, so it is a sheet.
- **Docked, it stays open** when an answer's record or page opens, which a
  sheet could not (it had to close to make way).
- **Records open in a centred modal**, Notion's "center peek": the
  RecordSheet block's new `peek` prop, `center` by default, `side` for the
  old panel. One change moved the ERP's records and the kit's job, customer
  and dock-appointment peeks. The same header, body and footer work in both,
  since a Sheet is a Radix Dialog underneath.
- **Also modals now:** the kit's "?" shortcuts (ShortcutsDialog, the groups
  side by side) and an agent run's log. Left as sheets on purpose: the
  sidebars on a phone (navigation slides from its own edge), the AI
  workspace's sidebar and artifact panel on narrow screens (they are inline
  when there is room), the Sheet and Drawer demos, and the "form in a
  sheet" example.
- **`useMediaQuery` moved to `lib/`** from the period picker, now that a
  second block needs it.
- **Testing in the Browser pane:** CSS transitions and animations stall
  while the pane is not drawing, so a panel can look half open and a closed
  dialog can stay in the page until a screenshot is taken. Check the state
  (`aria-valuenow`, `data-state`, the saved width), not the frame.

## QR code (added 2026-10-06)
- **A new component, `QrCode`** (`src/components/qr-code.tsx`), on its own
  QR code page: playground, shapes × marks, states, and two
  examples (pay an invoice, set up an authenticator app). It takes a
  company's name: printed under the code with an optional caption, and as a
  mark in the middle (`mark="initials"` or `"name"`, or `logo` for your own).
- **Encoding comes from `uqr`** (MIT, no dependencies). It returns the grid
  and each module's type (finder, alignment, timing, data), so the kit draws
  the SVG itself: three module shapes, whole finder patterns, and a cleared
  box under the mark.
- **A mark hides modules**, so with one the code uses error correction H and
  at least version 4 (33 modules), which keeps the box clear of the finder,
  timing and format areas. `boostEcc` raises the level for free when the
  data fits.
- **Dots failed to scan until the alignment patterns were drawn whole.**
  Tested by rendering the component, rasterising it (resvg) and decoding it
  (jsQR): with dots of radius 0.42, or even 0.45, 34 of 56 dotted codes
  failed to decode; at 0.5 (touching) they passed. Drawing the alignment
  patterns as solid rings, like the finder patterns, fixed it at 0.42:
  168 of 168 decoded (every shape, mark and level, with the mark drawn as a
  dark block and as a light one). At about 4px a module, dense codes fail
  in every shape alike: that is the decoder running out of pixels.
- **The one fixed-colour part:** the plate is white with black modules in
  both modes, because not every scanner reads a light-on-dark code. Only
  the mark takes a colour (`markColour`, `var(--brand)` by default).
- **`initials()` moved to `lib/text.ts`** from `person.tsx`, so the avatar
  and the QR code's mark share it. One word gives two letters, so
  "Northwind" is "NO": use the full name ("Northwind Trading" → NT).

## One page per component family (added 2026-10-06)
- **Why:** the Components pages had become grab-bags. "Feedback and
  display" held alerts, cards, the page header and the QR code; "Status"
  held badges, avatars, keyboard keys and skeletons; "More inputs" and "More
  overlays" were overflow. Alvin chose family pages (about 30, not one per
  component) under category headings.
- **Now:** 38 pages in nine categories (Actions, Inputs, Data display,
  Feedback, Overlays, Navigation, Layout, Charts, AI), A to Z within each.
  Components that belong together share a page (Badges and labels; Avatars
  and people, with the marks; Progress: bar, ring and usage meter). Parts
  that had landed on the wrong page moved: IconAction to Buttons and
  toggles, FileChip to File upload, Shortcut to Keyboard keys, SearchTrigger
  to Command palette, ProgressRing to Progress, Sparkline to Charts. Form
  modals joined Forms. The old page addresses (`#/display`, `#/status`…)
  now open All components.
- **How:** a script (`@babel/parser`) split the 13 playground and 13 section
  files by their top-level demos and panels, and gave each new file exactly
  the constants, helpers, state and imports its demos use. Two clashing
  names were renamed first (`ACTIONS` in the AI components demos), and the
  chart colour options moved into `Playground.tsx` so two pages share them.
  Three demos or panels that mixed two families were split by hand first
  (Progress and loading; LabelDot and NoAssignee; SearchTrigger and
  Shortcut). Small demo helpers (`orDefault`, `noop`) are copied per page,
  as they were per file before.
- **Another session was editing `playground/overlays-more.tsx`** (the
  docked panel demos) while this was planned, so the split was built and
  type-checked in a copy first, then applied once that session had
  committed. Worth doing again for any change that rewrites shared files.
- **Section can have no children:** a page with demos only (Tabs, Slider…)
  shows no "Examples" heading, and its demos stand in for examples on the
  All components page.

