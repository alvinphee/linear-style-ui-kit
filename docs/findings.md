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
