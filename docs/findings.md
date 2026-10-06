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
- Limits: one run each, one screen, one model. It says nothing about
  keeping 50 screens consistent, which is what the kit's shared parts are
  for.
