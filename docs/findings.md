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

## Forms and checklists (added 2026-10-06)
- **One field schema, two homes for the form.** The form dialog's field
  types and renderer moved to `blocks/form-fields.tsx`, and the page-sized
  `FormRenderer` uses the same `FormField` and `FormControl`. New field
  kinds (check, yes-no, rating, photo, signature) were added once and both
  got them. The dialog file shrank by half and nothing it did changed.
- **A check's answer is an object.** `FormValue` was `string | boolean`;
  a check needs its outcome, a note and a photo together, so it is now
  `{ result, note?, photo? }` as well. Everything that trims or copies
  values checks `typeof v === 'string'` first, so the object passes
  through untouched.
- **The blocks stay generic by taking the definition as data.** A
  checklist, an expense claim and a survey differ only in their
  `FormDefinition`; the catalogue, renderer and submission view never name
  a domain. The sample definitions live with the pages (kit) and the
  template (ERP), never in the blocks.
- **A QR code is just a deep link.** The kit route gained an optional
  third segment and a query (`#/forms-catalogue/vehicle-check?context=…`,
  `#/templates/erp/forms/catalogue/vehicle-check?context=…`), and
  `QrCode` encodes the whole address. The ERP keeps the link while it sends
  you through sign-in and the company pick, then returns to it.
- **Reading a code in the page.** `BarcodeDetector` is in Chrome, Edge,
  Safari 17 and Android browsers but not Firefox, and the camera needs
  https or localhost. `QrScanner` falls back to a text box, so the flow
  works everywhere; the demo on the QR code page starts the camera on a
  click, not on page load, so the All components page never asks for it.
- **Drafts in the browser.** The renderer keeps what is entered under
  `kit:form-draft:<form>:<context>` in localStorage on every change and
  clears it on submit, so a phone refresh (or a mis-tap that leaves the
  page) loses nothing. Two tags of the same form keep separate drafts.
- **Sticky header and footer inside the scroll container.** In the ERP
  the page scrolls inside `#erp-main`, so `sticky top-0` works. In the kit
  the window scrolls under a fixed bar, so the demo gives the form its own
  scroll area (and a 375px frame for the phone view) instead of offsetting
  the header.
- **Radix toggle items re-render on every answer,** so element refs taken
  before a click are stale after it. When driving the page from a script,
  answer in one pass or re-find after each click.

## Form builder and the submission feed (added 2026-10-07)
- **A builder is an editor for the definition, nothing more.** FormBuilder
  takes a `FormDefinition`, edits it, and hands it back on Save. It never
  touches storage, so the kit page keeps forms in React state and the ERP
  keeps them in its store; a real app would POST the same object.
- **Keys are made once and kept.** New fields get a temporary `new-…` key
  while they are edited and a slug of their label on Save, unique within
  the form. Fields that already have a key keep it, so an edited form still
  reads its old submissions. Editing bumps the version instead.
- **A component declared inside a component remounts on every render.**
  The renderer's field control did this and lost focus after one letter
  (fixed the day before); the builder's rows are plain functions and
  separate components from the start.
- **Container queries, not breakpoints, for anything that can sit in a
  frame.** The radio grid and the builder's two panes switch on `@sm` /
  `@3xl`, so the same form reads right in a 375px frame, a dialog and a
  wide page.
- **The feed is the glanceable view, the table the working one.** Cards
  carry the result, a three-colour score bar, the failed checks as chips
  and who and when; the table keeps sorting, filters, bulk actions and CSV.
  A view switch in the page header offers both.
- **Icons are the only thing in a definition that is not data.** A
  `FormDefinition` carries its icon as a Hugeicons element, which JSON
  cannot hold. `toStoredForm` swaps it for the id of an icon in the
  builder's list and `fromStoredForm` swaps it back, so the kit page keeps
  built forms in localStorage and an app can keep them in a database the
  same way. Sample forms with `validate` functions lose them in JSON, which
  is right: a stored form's rules are the schema's built-in ones.

## Dark mode that still shows its outlines (added 2026-10-07)
The first dark theme was too dark: background at L 0.17 with borders at 7%
white, so a text field's outline or a card's edge needed a squint. Linear,
VS Code's "Dark modern" and phone dark modes stay dark but keep each step of
the grey scale a clear step up, with borders around 12% white and input
borders nearer 18%. The `.dark` block in `styles.css` now follows that:
background 0.195, card 0.225, popover 0.255, muted 0.265, secondary 0.29;
`--border` 12%, `--input` 18%, `--accent` 9%, the sidebar a shade darker
than the page with a 10% seam. Muted text went from 0.66 to 0.70 for the
same reason. Light mode is unchanged. Everything else that reads an outline
got it for free, because every border in the kit goes through these tokens.

## A project is a page, not a dialog (added 2026-10-07)
ChatGPT, Claude and Gemini open a project as a screen of its own: title,
custom instructions, project knowledge (the files) and the chats in it. The
ERP + AI edition had a two-field dialog instead, with no files at all, while
the AI chat template already had a page written inside its kit section. The
page is now a block (`src/blocks/ai/projects/project-page.tsx`) and both apps render
it; the ERP got a `files` field on its projects and a `/home/project/<id>`
route, so a project can be linked and the breadcrumb ends with its name.
What stays a dialog is quick create: name it in the sidebar, then land on
the page. Nobody writes a thousand characters of instructions before they
have seen the project.

Two terms worth keeping straight (now in the glossary): the feature is
"project knowledge". RAG (retrieval-augmented generation: index the files,
put only the matching chunks in the prompt) and long context ("context
stuffing": paste the whole lot in every turn) are the two ways to get those
files to the model, not the feature's name. The kit's hints say the
assistant "draws on" the files, which commits to neither.

Vite could not hot-reload `modules.tsx` and `assistant/AssistantPage.tsx`
while they changed: the two import each other (the module list names the
Assistant pages, and the pages read the module list), so a reload of one
re-ran the other before its icons were defined and the page went blank. A
full reload fixes it. The cycle predates this work; worth breaking one day.

## A new ERP module is mostly data (added 2026-10-07)
The Workplace safety module (toolbox meetings, inspections, checklists,
safety documents with versions, training certificates, risk assessments)
took five `ListSpec`s, a sample generator and an overview; every list, peek,
create dialog, bulk action, saved view, palette search and launchpad tile
came from the existing machinery. What it needed of its own was small and
sits in `src/templates/erp/wsh/`: the version history and Publish inside a
document's peek, and the 5 × 5 risk matrix inside an assessment's. Both
keep their structured part (versions, hazards) as a JSON string on the row,
the way submissions keep their answers, so the generic table never sees it;
the store's audit line now skips values that look like JSON, or a published
version would have written the whole history into the audit trail.

Checklists did not need a new page: the module's Checklists page is the
Forms catalogue filtered to `module: 'wsh'`, and the incident report moved
there from Administration, where it never belonged. Inspections did not
need their own records either. The first cut kept a planned list of
inspections (type, inspector, date, a status set by hand) beside the
checklists, with nothing joining them; the owner's model was simpler: an
inspection *is* the filled-in checklist, like a paper form handed to the
boss. So the Inspections page is the submissions of checklists in the
Inspections category, New inspection picks one and fills it in, and the
result comes from the checks. One generic hook made that possible: a
`ListSpec` can `filter` its entity's records, so the same submissions
appear in Forms › Submissions and in WSH › Inspections without being stored
twice. A submission now keeps its form's category for that. Two statuses were
reused rather than invented (Expired, Expiring), and Expired turned red: a
lapsed certificate is a stop, and an expired quotation reads the same way.

A second Claude session cannot preview the kit while the first holds port
5180 (`strictPort`). The dev server now takes a `PORT` variable, and the
launch config sets `autoPort`, so each session gets its own server.

## The bulk bar takes the toolbar's place (added 2026-10-07)
Selecting rows used to insert the bulk bar above the table, so every table
jumped down a row the moment the first checkbox was ticked, and back up
when the selection cleared. Gmail and the Material data table put the
selection actions where the toolbar was instead. The data table block now
lays the bar over its toolbar (or over the column header when it has no
toolbar), with the covered controls made inert and invisible, so the rows
stay exactly where they were. The bar scrolls sideways rather than
wrapping, so it is never taller than what it covers.

## A phone layout is its own frame, not the desktop one folded (added 2026-10-08)
The desktop shells already work at 375px: the sidebar becomes a sheet, the
table drops columns, the record opens in a modal. That is a page that
survives a phone, not one made for it. The phone layout on the App shells
page swaps the frame and keeps everything inside it: a tab bar for the
sidebar, a pushed screen with a back arrow for the centre peek, cards for
table rows, bottom sheets for menus, the main action at the foot. The
components (status and priority icons, avatars, label dots, the search
field, empty states) and the job store are the same ones, so an edit made
in the phone shows in the desktop frame above it.

Two things were needed from below. shadcn's `SheetContent` always portals
to the body and covers the window; it now takes `container`, and with one
it is positioned inside that element, so a bottom sheet stays inside the
phone's screen. And each tab keeps its own stack of screens, so going to
Inbox and back to Issues returns to the issue you had open; tapping the tab
you are on empties its stack, as phone apps do.

What a real PWA adds is not drawn, only mimicked: the manifest
(`display: standalone`, icons, theme colour), the service worker (cache the
app shell, queue changes, background sync) and `env(safe-area-inset-*)`,
which the frame already uses and which is zero outside an installed app.

## The ERP's phone layout is a route stack, not a second app (added 2026-10-08)
The phone layout moved from a demo on the App shells page into a block,
`mobile-shell`, once the ERP needed it too: the demo and the ERP now draw
the same top bar, tab bar, floating button, bottom sheets, chips, cards and
grouped rows. Below 768px the ERP renders `PhoneShell` instead of `Shell`
around the same page; nothing in the modules changed.

The stack of screens is the route itself, which already had the levels:
launchpad, module, page, one thing on the page. The only new address is
`/<module>` with no page, which a phone shows as the module's list of pages
and a computer, as before, as its first page; `openModule` (in `phone.ts`)
picks which to go to. Because every screen is a route, the phone's Back
button and the top bar's back arrow always agree, and a scanned QR code
lands on the right screen with the right back arrow.

Three things were found by checking every page at 375px. A wrapper with
`min-h-full` broke the Assistant: its chat fills its parent with `h-full`,
which needs a definite height, so the composer slid under the tab bar;
`h-full` on the wrapper fixed it, and taller pages still scroll. Inbox and
More must lie over the page rather than replace it, or a list loses its
search and the record peek, palette and create dialog (which live beside
the page) unmount. And a card needs the amount's label ("Balance due"): a
bare $0.00 on a paid invoice reads as a mistake.

## A menu screen beside the tab bar, and no dialogs inside it (added 2026-10-08)
The phone layout now offers a second way round, taken from shadcn's own
site at phone width: "Menu" in the top bar, whose two bars turn into a
cross, opens every destination full screen under the bar, in big type under
small headings, on a blurred page. Their version is a popover sized to the
space under the header; the kit's (`MobileMenu`) is a layer inside the
mobile shell under the top bar, so it works in the App shells page's phone
frame as well as full screen, and what it covers is made `inert`. It is an
option, not a replacement: More › Navigation in the ERP, a picker on the
App shells page.

Two bugs came from it. Escape inside the menu did nothing, because the
menu stopped the key from reaching its own document listener; it now
listens once, on the document, and marks the key handled. And a dialog
must not open over the open menu: the role sheet, rendered inside the
menu's settings, stalled the page on opening the menu, and opened from
there it shut at once, its focus taken back by the menu. Every choice in
the menu now closes it first and then acts (Scan, Ask AI, Role), and the
sheets live beside the shell, not in the settings the menu reuses.

## iOS 26's tab bar is behaviour, not glass (added 2026-10-08)
Asked for "a tab bar like iOS 26", the first cut copied its look as well:
translucent glass with blur. What was wanted was how it works: it floats
over the page instead of taking a strip of it, search sits apart as a round
button, and it shrinks to the current tab while you scroll down, coming
back as you scroll up or tap it. The floating bar is now solid, in the
kit's card style. Ask which is meant when a reference has both a look and a
behaviour; this kit keeps its own look.

MobileShell measures the scroll and tells the bar when to shrink (its
`floatingBar` is a function of `minimized`), so any page gets the
behaviour without knowing about it. The page's last cards need room to
scroll out from under the bar (`pb-28`), and the floating New button sits
above it.


## Syncing an app's view with its address (added 2026-10-10)
The AI chat app keeps its open view (chat, project, library) in a reducer
and, full page, in the address too. Two effects keep them together: a new
view goes into the address, and a new address (typed, or the back button)
opens its view. Three traps came up:
- Read the address when the state is first made, not in an effect, or the
  chat that was open last time wins over the link that was followed.
- The "view into address" effect must run on a change of view only. Run
  also when Settings closed, it put the old chat back before the back
  button's address could open the new one, and the two effects bounced.
- The workspace is still mounted for a moment after the address leaves the
  app, so both effects ignore addresses outside it (`isAppPath`), or
  following a link to the kit sends you straight back into the app.

## A domain across the levels (added 2026-10-10)
Gathering every AI part in one place did not need a sixth level. Each level
keeps an `ai/` folder, the sidebar has an AI group, and the registry tags
the items `categories: ["ai"]` with an `ai-kit` bundle, as Vercel's AI
Elements does for shadcn. The level rule and `npm run check` stay as they
were. The test for what goes in: it makes sense only in an AI product.

## A percentage max-width can widen a whole sidebar (added 2026-10-10)
The "Shared with me" rows put the owner's name in `max-w-[45%]`. Inside the
NavGroup's grid, whose one column was implicit (`auto`), the percentage
could not be resolved while sizing, so the column grew to the row's full
text and the sidebar scrolled sideways. NavGroup now sets
`grid-cols-[minmax(0,1fr)]`, the same fix as the rule for page grids, and
the owner's name has a fixed cap. Any grid that lists rows of text needs
the explicit column.

## A part named like the theme overwrote it in the registry (added 2026-10-11)
A new lib file, `src/lib/tokens.ts`, would have become the registry item
`tokens`, the theme's own name. The theme is added apart from the parts, so
the duplicate check missed it, and `public/r/tokens.json` would have held
whichever came last: installing the theme could have installed a token
counter. The file is now `token-estimate.ts`, and the registry script stops
if any part is called `tokens`.

## A badge must count what its page counts (added 2026-10-13)
The sidebar's Runs badge first added "waiting for approval" and "not opened"
together, and showed 5 while the inbox's Needs you showed 3: a run that is
waiting and not opened was counted twice, and finished runs not opened
counted too. The badge now uses the inbox's own rule (`needsYou` in
runs-inbox.tsx), so the two can't disagree. Export the rule with the list
and count with it, rather than rebuilding the count from the store.
