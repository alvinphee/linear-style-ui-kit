# Findings

What we have learned about Hugeicons, for a possible another app spec.
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
  `HugeiconsIcon`. No hand-editing, and no Lucide package. another app's
  `client/components.json` (style `radix-nova`, icon library `lucide`) could
  switch the same way, although components already in the app would need
  re-adding or editing by hand.
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
  instead. another app does not use `next-themes`, so this does not affect
  it today.
- **Free Hugeicons cover Linear-style statuses.** `CircleDashedIcon`
  (backlog), `CircleIcon` (todo), `TimeHalfPassIcon` (in progress),
  `CheckmarkCircle02Icon` (done) and `CancelCircleIcon` (cancelled). Priority
  uses `NoSignalIcon`, `LowSignalIcon`, `MediumSignalIcon`, `FullSignalIcon`
  and `AlertSquareIcon`. Linear's filled "half circle" is not in the free
  set, because free icons are outline only.

## Lucide icons used in another app
Taken from `client/src` on 2026-09-30: 145 Lucide icons are imported.

- **126** have a Lucide alias in Hugeicons (the same icon under a Lucide name).
- **12** have a Hugeicons icon with the same name but no alias. Check that
  each one looks the same.
- **7** have no match by name. A close icon was picked by hand.

"Uses" counts the files that import the icon.

| Lucide | Uses | Hugeicons | How matched |
|---|---:|---|---|
| `Plus` | 37 | `Add01Icon` | Lucide alias |
| `ArrowLeft` | 32 | `ArrowLeft01Icon` | Lucide alias |
| `Search` | 26 | `Search01Icon` | Lucide alias |
| `Pencil` | 20 | `PencilIcon` | Lucide alias |
| `Check` | 20 | `Tick01Icon` | Lucide alias |
| `TriangleAlert` | 19 | `TriangleAlertIcon` | Same name, check the glyph |
| `Loader2` | 19 | `Loading03Icon` | No match, picked by hand |
| `X` | 18 | `Cancel01Icon` | Lucide alias |
| `Image` | 14 | `Image01Icon` | Lucide alias |
| `AlertTriangle` | 14 | `Alert01Icon` | Lucide alias |
| `Trash2` | 13 | `Delete02Icon` | Lucide alias |
| `Lock` | 13 | `LockIcon` | Lucide alias |
| `Info` | 13 | `InformationCircleIcon` | Lucide alias |
| `RotateCcw` | 11 | `RotateLeft01Icon` | Lucide alias |
| `Download` | 10 | `Download01Icon` | Lucide alias |
| `ClipboardList` | 10 | `CheckListIcon` | Lucide alias |
| `Siren` | 8 | `Alert02Icon` | Lucide alias |
| `ExternalLink` | 8 | `ArrowUpRight01Icon` | Lucide alias |
| `ClipboardCheck` | 8 | `ClipboardIcon` | Lucide alias |
| `User` | 7 | `UserIcon` | Lucide alias |
| `ShieldAlert` | 7 | `Shield01Icon` | Lucide alias |
| `MapPin` | 7 | `Location01Icon` | Lucide alias |
| `FileText` | 7 | `File02Icon` | Lucide alias |
| `ChevronRight` | 7 | `ArrowRight01Icon` | Lucide alias |
| `CheckCircle2` | 7 | `CheckmarkCircle02Icon` | No match, picked by hand |
| `CalendarDays` | 7 | `Calendar02Icon` | Lucide alias |
| `Printer` | 6 | `PrinterIcon` | Lucide alias |
| `GraduationCap` | 6 | `Mortarboard01Icon` | Lucide alias |
| `Copy` | 6 | `Copy01Icon` | Lucide alias |
| `Wrench` | 5 | `Wrench01Icon` | Lucide alias |
| `Users` | 5 | `UserMultipleIcon` | Lucide alias |
| `Stamp` | 5 | `StampIcon` | Lucide alias |
| `Construction` | 5 | `ConstructionIcon` | Same name, check the glyph |
| `ClipboardPen` | 5 | `ClipboardPenIcon` | Same name, check the glyph |
| `CircleCheck` | 5 | `CheckmarkCircle01Icon` | Lucide alias |
| `ChevronDown` | 5 | `ArrowDown01Icon` | Lucide alias |
| `Camera` | 5 | `Camera01Icon` | Lucide alias |
| `Ban` | 5 | `BanIcon` | Same name, check the glyph |
| `Truck` | 4 | `TruckIcon` | Lucide alias |
| `SquarePen` | 4 | `Pen01Icon` | Lucide alias |
| `ShieldCheck` | 4 | `SecurityCheckIcon` | Lucide alias |
| `ScanSearch` | 4 | `SearchAreaIcon` | Lucide alias |
| `MoreHorizontal` | 4 | `MoreHorizontalIcon` | Lucide alias |
| `MessagesSquare` | 4 | `MessageMultiple01Icon` | Lucide alias |
| `Link` | 4 | `Link01Icon` | Lucide alias |
| `KeyRound` | 4 | `Key02Icon` | Lucide alias |
| `FileWarning` | 4 | `FileExclamationPointIcon` | No match, picked by hand |
| `FileSpreadsheet` | 4 | `FileSpreadsheetIcon` | Same name, check the glyph |
| `FileCheck2` | 4 | `FileValidationIcon` | No match, picked by hand |
| `EyeOff` | 4 | `ViewOffIcon` | Lucide alias |
| `CircleAlert` | 4 | `AlertCircleIcon` | Lucide alias |
| `ChevronsUpDown` | 4 | `ArrowUpDownIcon` | Lucide alias |
| `ChevronLeft` | 4 | `ArrowLeft01Icon` | Lucide alias |
| `BookOpen` | 4 | `BookOpen01Icon` | Lucide alias |
| `Bell` | 4 | `Notification01Icon` | Lucide alias |
| `Award` | 4 | `Award01Icon` | Lucide alias |
| `ArrowRight` | 4 | `ArrowRight01Icon` | Lucide alias |
| `UserMinus` | 3 | `UserMinus01Icon` | Lucide alias |
| `Trash` | 3 | `Delete01Icon` | Lucide alias |
| `Square` | 3 | `SquareIcon` | Lucide alias |
| `SlidersHorizontal` | 3 | `SlidersHorizontalIcon` | Lucide alias |
| `Send` | 3 | `MailSend01Icon` | Lucide alias |
| `RefreshCw` | 3 | `RefreshIcon` | Lucide alias |
| `Play` | 3 | `PlayIcon` | Lucide alias |
| `PenLine` | 3 | `PenTool01Icon` | Lucide alias |
| `LayoutDashboard` | 3 | `DashboardSquare01Icon` | Lucide alias |
| `HardHat` | 3 | `HardHatIcon` | Same name, check the glyph |
| `Clock` | 3 | `Clock01Icon` | Lucide alias |
| `CircleUser` | 3 | `UserCircleIcon` | Lucide alias |
| `Circle` | 3 | `CircleIcon` | Lucide alias |
| `ChartColumn` | 3 | `BarChartIcon` | Lucide alias |
| `Calendar` | 3 | `Calendar01Icon` | Lucide alias |
| `Building2` | 3 | `Building02Icon` | Lucide alias |
| `BadgeCheck` | 3 | `CheckmarkBadge01Icon` | Lucide alias |
| `ArrowUp` | 3 | `ArrowUp01Icon` | Lucide alias |
| `ArrowDown` | 3 | `ArrowDown01Icon` | Lucide alias |
| `XCircle` | 2 | `CancelCircleIcon` | Lucide alias |
| `Warehouse` | 2 | `WarehouseIcon` | Lucide alias |
| `Video` | 2 | `Video01Icon` | Lucide alias |
| `UserX` | 2 | `UserRemove01Icon` | Lucide alias |
| `UserCheck` | 2 | `UserCheck01Icon` | Lucide alias |
| `Upload` | 2 | `Upload01Icon` | Lucide alias |
| `UploadCloud` | 2 | `CloudUploadIcon` | No match, picked by hand |
| `Timer` | 2 | `Timer01Icon` | Lucide alias |
| `Shield` | 2 | `Shield01Icon` | Lucide alias |
| `Settings` | 2 | `Settings01Icon` | Lucide alias |
| `ReceiptText` | 2 | `Invoice02Icon` | Lucide alias |
| `Paperclip` | 2 | `AttachmentIcon` | Lucide alias |
| `Package` | 2 | `PackageIcon` | Lucide alias |
| `PackageCheck` | 2 | `PackageDeliveredIcon` | Lucide alias |
| `LogOut` | 2 | `Logout01Icon` | Lucide alias |
| `List` | 2 | `ListViewIcon` | Lucide alias |
| `ListChecks` | 2 | `CheckListIcon` | Lucide alias |
| `LayoutGrid` | 2 | `LayoutGridIcon` | Lucide alias |
| `ImagePlus` | 2 | `ImageAdd01Icon` | Lucide alias |
| `IdCard` | 2 | `IdCardIcon` | Same name, check the glyph |
| `History` | 2 | `WorkHistoryIcon` | Lucide alias |
| `HandCoins` | 2 | `Coins01Icon` | Lucide alias |
| `Gavel` | 2 | `GavelIcon` | Same name, check the glyph |
| `Folder` | 2 | `Folder01Icon` | Lucide alias |
| `File` | 2 | `File01Icon` | Lucide alias |
| `CircleHelp` | 2 | `HelpCircleIcon` | No match, picked by hand |
| `ChevronUp` | 2 | `ArrowUp01Icon` | Lucide alias |
| `Boxes` | 2 | `Package01Icon` | Lucide alias |
| `Bookmark` | 2 | `Bookmark01Icon` | Lucide alias |
| `ArrowUpDown` | 2 | `ArrowUpDownIcon` | Lucide alias |
| `ArchiveRestore` | 2 | `ArchiveArrowUpIcon` | Lucide alias |
| `Archive` | 2 | `ArchiveIcon` | Lucide alias |
| `UserRound` | 1 | `UserCircleIcon` | Lucide alias |
| `UserPlus` | 1 | `UserAdd01Icon` | Lucide alias |
| `UserCircle` | 1 | `UserCircleIcon` | Same name, check the glyph |
| `Tag` | 1 | `Tag01Icon` | Lucide alias |
| `Sparkles` | 1 | `SparklesIcon` | Lucide alias |
| `Settings2` | 1 | `Settings02Icon` | Lucide alias |
| `SearchX` | 1 | `SearchMinusIcon` | Lucide alias |
| `Route` | 1 | `Route01Icon` | Lucide alias |
| `RotateCw` | 1 | `RotateClockwiseIcon` | Lucide alias |
| `QrCode` | 1 | `QrCodeIcon` | Lucide alias |
| `PlusCircle` | 1 | `AddCircleIcon` | No match, picked by hand |
| `PinOff` | 1 | `PinOffIcon` | Lucide alias |
| `Pin` | 1 | `PinIcon` | Lucide alias |
| `PanelLeft` | 1 | `PanelLeftIcon` | Lucide alias |
| `PackageX` | 1 | `PackageRemoveIcon` | Lucide alias |
| `OctagonX` | 1 | `OctagonXIcon` | Same name, check the glyph |
| `NotebookPen` | 1 | `Notebook01Icon` | Lucide alias |
| `Moon` | 1 | `MoonIcon` | Lucide alias |
| `MessageSquare` | 1 | `Message01Icon` | Lucide alias |
| `MapPinOff` | 1 | `LocationOffline01Icon` | Lucide alias |
| `LifeBuoy` | 1 | `LifebuoyIcon` | Lucide alias |
| `Laptop` | 1 | `LaptopIcon` | Lucide alias |
| `Images` | 1 | `Image02Icon` | Lucide alias |
| `Home` | 1 | `Home01Icon` | Lucide alias |
| `Hammer` | 1 | `LegalHammerIcon` | Lucide alias |
| `FolderOpen` | 1 | `FolderOpenIcon` | Lucide alias |
| `FileX` | 1 | `FileRemoveIcon` | Lucide alias |
| `Eye` | 1 | `ViewIcon` | Lucide alias |
| `Eraser` | 1 | `EraserIcon` | Lucide alias |
| `EllipsisVertical` | 1 | `MoreVerticalIcon` | Lucide alias |
| `CornerUpLeft` | 1 | `ArrowTurnUpIcon` | Lucide alias |
| `CircleOff` | 1 | `CircleOffIcon` | Same name, check the glyph |
| `CheckCheck` | 1 | `TickDouble01Icon` | Lucide alias |
| `ChartNoAxesColumn` | 1 | `ChartNoAxesColumnIcon` | Same name, check the glyph |
| `CameraOff` | 1 | `CameraOff01Icon` | Lucide alias |
| `CalendarClock` | 1 | `TimeScheduleIcon` | Lucide alias |
| `ArrowLeftRight` | 1 | `ArrowLeftRightIcon` | Lucide alias |

## Still to check
- Look through the 12 "check the glyph" rows and the 7 hand-picked rows in
  the kitchen sink.
- Test at another app's usual icon sizes (16 and 20) next to real text.
- Decide whether the free Stroke Rounded style is enough, or whether a Pro
  licence is worth it.
