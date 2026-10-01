import { createContext, useContext, useId, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowDown02Icon, ArrowLeft01Icon, ArrowLeftDoubleIcon, ArrowRight01Icon, ArrowRightDoubleIcon, ArrowUp02Icon,
  ArrowUpDownIcon, Delete02Icon, MoreHorizontalIcon, PlusSignCircleIcon, Rows2Icon, Rows4Icon, SlidersHorizontalIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { FlexRender, type Header, type Row, type RowData, type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command'
import { ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut } from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { dataTableColumns, type ContainerSize, type DataTableColumn, type DataTableColumnMeta, type DataTableFeatures, type DataTableInstance } from './features'

/* ---------- Shared bits ---------- */

// Literal class names, so Tailwind sees every one of them.
export const HIDE_BELOW: Record<ContainerSize, string> = {
  '@xs': 'hidden @xs:table-cell',
  '@sm': 'hidden @sm:table-cell',
  '@md': 'hidden @md:table-cell',
  '@lg': 'hidden @lg:table-cell',
  '@xl': 'hidden @xl:table-cell',
  '@2xl': 'hidden @2xl:table-cell',
  '@3xl': 'hidden @3xl:table-cell',
  '@4xl': 'hidden @4xl:table-cell',
  '@5xl': 'hidden @5xl:table-cell',
  '@6xl': 'hidden @6xl:table-cell',
}

// The shared Checkbox only styles checked/unchecked, so draw the "some selected" dash here.
export const MIXED =
  'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary dark:data-[state=indeterminate]:bg-primary ' +
  'data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:[&_svg]:hidden ' +
  'data-[state=indeterminate]:before:absolute data-[state=indeterminate]:before:h-0.5 data-[state=indeterminate]:before:w-2 ' +
  'data-[state=indeterminate]:before:rounded-full data-[state=indeterminate]:before:bg-current'

// "Ava Hart, Liam Okafor and 3 more"
export function listNames(names: string[]) {
  return names.length > 3 ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} more` : names.join(', ')
}

export function copyText(value: string, what: string) {
  if (!navigator.clipboard) {
    toast.error('Clipboard not available')
    return
  }
  navigator.clipboard.writeText(value).then(
    () => toast.success(`Copied ${value}`),
    () => toast.error(`Could not copy the ${what}`),
  )
}

/* ---------- Row context: what cells need from the table's props ---------- */

export type DataTableRowAction =
  | { label: string; icon?: IconSvgElement; shortcut?: string; destructive?: boolean; onSelect: () => void }
  | 'separator'

type RowContext = {
  rowLabel: (row: any) => string | undefined
  rowActions?: (row: any) => DataTableRowAction[]
}

export const DataTableRowContext = createContext<RowContext>({ rowLabel: () => undefined })

/* ---------- Columns the block provides ---------- */

function SelectAllCheckbox<TData extends RowData>({ table }: { table: Table<DataTableFeatures, TData> }) {
  const all = table.getIsAllPageRowsSelected()
  const some = table.getIsSomePageRowsSelected()
  return (
    <Checkbox
      checked={all ? true : some ? 'indeterminate' : false}
      onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
      disabled={table.getRowModel().rows.length === 0}
      aria-label="Select all rows on this page"
      className={MIXED}
    />
  )
}

function RowCheckbox<TData extends RowData>({ row }: { row: Row<DataTableFeatures, TData> }) {
  const { rowLabel } = useContext(DataTableRowContext)
  const selected = row.getIsSelected()
  return (
    <Checkbox
      checked={selected}
      // The handler reads target.checked and shiftKey; Radix checkboxes are buttons, so pass both in.
      onClick={(e) => row.getToggleSelectedHandler()({ target: { checked: !selected }, shiftKey: e.shiftKey })}
      aria-label={`Select ${rowLabel(row.original) ?? row.id}`}
    />
  )
}

// A checkbox column: put it first. Shift-click selects a range.
export function selectColumn<TData extends RowData>(): DataTableColumn<TData> {
  return dataTableColumns<TData>().display({
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <RowCheckbox row={row} />,
    enableHiding: false,
    meta: { label: 'Select', className: 'w-8' },
  })
}

// A "…" column for the row actions given to <DataTable rowActions>: put it last.
export function actionsColumn<TData extends RowData>(meta?: Partial<DataTableColumnMeta>): DataTableColumn<TData> {
  return dataTableColumns<TData>().display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActionsMenu row={row} />,
    enableHiding: false,
    meta: { label: 'Actions', className: 'w-10', ...meta },
  })
}

/* ---------- Row actions: one list, shown by right-click and by the … button ---------- */

export function ActionItems({ actions, menu }: { actions: DataTableRowAction[]; menu: 'dropdown' | 'context' }) {
  return actions.map((action, i) => {
    if (action === 'separator') {
      return menu === 'dropdown' ? <DropdownMenuSeparator key={i} /> : <ContextMenuSeparator key={i} />
    }
    const variant = action.destructive ? 'destructive' : 'default'
    const body = (
      <>
        {action.icon && <HugeiconsIcon icon={action.icon} strokeWidth={2} />}
        {action.label}
        {action.shortcut && (menu === 'dropdown'
          ? <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
          : <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>)}
      </>
    )
    return menu === 'dropdown'
      ? <DropdownMenuItem key={action.label} variant={variant} onSelect={action.onSelect}>{body}</DropdownMenuItem>
      : <ContextMenuItem key={action.label} variant={variant} onSelect={action.onSelect}>{body}</ContextMenuItem>
  })
}

// The … button stays for touch screens and keyboards, but only shows on hover or focus with a mouse.
function RowActionsMenu<TData extends RowData>({ row }: { row: Row<DataTableFeatures, TData> }) {
  const { rowLabel, rowActions } = useContext(DataTableRowContext)
  if (!rowActions) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${rowLabel(row.original) ?? row.id}`}
          className="opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <ActionItems menu="dropdown" actions={rowActions(row.original)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------- Header cell: sort button, direction, multi-sort order ---------- */

export function HeaderCell<TData extends RowData>({ header, multiSort, onSort, className }: {
  header: Header<DataTableFeatures, TData, unknown>
  multiSort: boolean
  onSort: () => void
  className?: string
}) {
  const column = header.column
  const meta = column.columnDef.meta
  const right = meta?.align === 'right'
  const canSort = !header.isPlaceholder && column.getCanSort()
  const sorted = column.getIsSorted()

  return (
    <th
      scope="col"
      aria-sort={canSort ? (sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none') : undefined}
      // A shadow, not a border: collapsed table borders do not travel with a sticky cell.
      className={cn(
        'text-muted-foreground sticky top-0 z-10 h-8 px-2 text-left align-middle font-medium whitespace-nowrap shadow-[inset_0_-1px_0_var(--border)]',
        className,
        right && 'text-right',
        meta?.hideBelow && HIDE_BELOW[meta.hideBelow],
        meta?.className,
      )}
    >
      {header.isPlaceholder ? null : canSort ? (
        <button
          type="button"
          onClick={(e) => {
            column.getToggleSortingHandler()?.(e)
            onSort()
          }}
          className={cn(
            'hover:text-foreground focus-visible:ring-ring/30 group/sort -mx-1.5 inline-flex h-6 items-center gap-1 rounded-md px-1.5 outline-none focus-visible:ring-2',
            sorted && 'text-foreground',
            right && 'flex-row-reverse',
          )}
        >
          <FlexRender header={header} />
          <HugeiconsIcon
            icon={sorted === 'asc' ? ArrowUp02Icon : sorted === 'desc' ? ArrowDown02Icon : ArrowUpDownIcon}
            strokeWidth={2}
            className={cn('size-3', !sorted && 'opacity-40 group-hover/sort:opacity-80')}
          />
          {multiSort && sorted && (
            <span className="text-muted-foreground text-[10px] tabular-nums">{column.getSortIndex() + 1}</span>
          )}
        </button>
      ) : (
        <FlexRender header={header} />
      )}
    </th>
  )
}

/* ---------- Toolbar controls ---------- */

export type FacetOption = { value: string; label: string; visual?: ReactNode; count?: number }

// A dashed "+ Title" button that opens a searchable, multi-select list with counts.
export function FacetFilter({ title, options, selected, onChange }: {
  title: string
  options: FacetOption[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const chosen = options.filter((o) => selected.includes(o.value))

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} data-icon="inline-start" />
          {title}
          {chosen.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 my-1" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {chosen.length === 1 ? chosen[0].label : `${chosen.length} selected`}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 gap-0 p-0">
        <Command className="rounded-lg">
          <CommandInput placeholder={`Filter by ${title.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No matches</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const on = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-checked={on}
                    onSelect={() => toggle(option.value)}
                    // The leading box shows the tick here, so hide the item's own trailing one.
                    className="[&>svg:last-child]:hidden"
                  >
                    <span
                      className={cn(
                        'border-input flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border',
                        on && 'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" />}
                    </span>
                    {option.visual && <span className="flex shrink-0">{option.visual}</span>}
                    <span className="truncate">{option.label}</span>
                    {on && <span className="sr-only">(selected)</span>}
                    {option.count !== undefined && (
                      <span className="text-muted-foreground ml-auto tabular-nums">{option.count}</span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="Clear filter" onSelect={() => onChange([])} className="justify-center [&>svg:last-child]:hidden">
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// A dashed "+ Title" button for a number range: a two-thumb slider and presets.
export function RangeFilter({ title, heading, value, max, step = 1, format = String, presets = [], onChange }: {
  title: string
  // The popover's heading, when it says more than the title ("Monthly amount").
  heading?: string
  value: [number, number] | undefined
  max: number
  step?: number
  format?: (n: number) => string
  presets?: { label: string; range: [number, number] }[]
  onChange: (value: [number, number] | undefined) => void
}) {
  const current: [number, number] = value ?? [0, max]

  function commit([a, b]: [number, number]) {
    const lo = Math.max(0, Math.min(a, b))
    const hi = Math.min(max, Math.max(a, b))
    onChange(lo <= 0 && hi >= max ? undefined : [lo, hi])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} data-icon="inline-start" />
          {title}
          {value && (
            <>
              <Separator orientation="vertical" className="mx-0.5 my-1" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal tabular-nums">
                {format(value[0])} – {format(value[1])}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">{heading ?? title}</span>
          <span className="text-muted-foreground tabular-nums">
            {format(current[0])} – {format(current[1])}
          </span>
        </div>
        <Slider
          min={0}
          max={max}
          step={step}
          value={current}
          onValueChange={(v) => commit([v[0], v[1]])}
          className="py-1"
        />
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => {
            const active = value?.[0] === p.range[0] && value[1] === p.range[1]
            return (
              <Button key={p.label} variant={active ? 'secondary' : 'ghost'} size="sm" onClick={() => commit(p.range)}>
                {p.label}
              </Button>
            )
          })}
          {value && (
            <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto" onClick={() => onChange(undefined)}>
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// "View": a menu of columns to show or hide.
export function ViewOptions<TData extends RowData>({ table }: { table: DataTableInstance<TData> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={SlidersHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            // Keep the menu open so several columns can be switched in a row.
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(on) => column.toggleVisibility(on)}
          >
            {column.columnDef.meta?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => table.resetColumnVisibility(true)}>Show all columns</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type Density = 'compact' | 'comfortable'
export const ROW_HEIGHT: Record<Density, string> = { compact: 'h-9', comfortable: 'h-12' }
export const CELL_PADDING: Record<Density, string> = { compact: 'py-1', comfortable: 'py-2.5' }

export function DensityToggle({ value, onChange }: { value: Density; onChange: (density: Density) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      onValueChange={(v) => v && onChange(v as Density)}
      aria-label="Row density"
    >
      <ToggleGroupItem value="compact" aria-label="Compact rows" className="text-xs">
        <HugeiconsIcon icon={Rows4Icon} strokeWidth={2} data-icon="inline-start" />
        <span className="hidden sm:inline">Compact</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="comfortable" aria-label="Comfortable rows" className="text-xs">
        <HugeiconsIcon icon={Rows2Icon} strokeWidth={2} data-icon="inline-start" />
        <span className="hidden sm:inline">Comfortable</span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

/* ---------- Footer: selection count and pages ---------- */

function PageButton({ label, icon, disabled, onClick }: {
  label: string
  icon: IconSvgElement
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button variant="outline" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </Button>
  )
}

export function Pagination<TData extends RowData>({ table, pageSizes, selectable, className }: {
  table: DataTableInstance<TData>
  pageSizes: number[]
  selectable: boolean
  className?: string
}) {
  const pageSizeId = useId()
  const { pagination } = table.state
  const pageCount = table.getPageCount()
  const filteredCount = table.getFilteredRowModel().rows.length
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <footer className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t py-2 text-xs', className)}>
      <span className="text-muted-foreground tabular-nums">
        {selectable ? `${selectedCount} of ${filteredCount} row(s) selected` : `${filteredCount} row(s)`}
      </span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={pageSizeId} className="text-muted-foreground font-normal whitespace-nowrap">
            Rows per page
          </Label>
          <Select value={String(pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger id={pageSizeId} size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" side="top" align="end">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="whitespace-nowrap tabular-nums" aria-live="polite">
          Page {Math.min(pagination.pageIndex + 1, Math.max(1, pageCount))} of {Math.max(1, pageCount)}
        </span>
        <div className="flex items-center gap-1">
          <PageButton label="First page" icon={ArrowLeftDoubleIcon} disabled={!table.getCanPreviousPage()} onClick={() => table.firstPage()} />
          <PageButton label="Previous page" icon={ArrowLeft01Icon} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} />
          <PageButton label="Next page" icon={ArrowRight01Icon} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} />
          <PageButton label="Last page" icon={ArrowRightDoubleIcon} disabled={!table.getCanNextPage()} onClick={() => table.lastPage()} />
        </div>
      </div>
    </footer>
  )
}

/* ---------- Delete with a confirm step ---------- */

// The confirm dialog. Pass a trigger as children, or drive it with open/onOpenChange.
export function DeleteConfirm({ title, description, onConfirm, open, onOpenChange, children }: {
  title: ReactNode
  description: ReactNode
  onConfirm: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// The bulk bar's Delete button, with its confirm dialog.
export function BulkDelete({ title, description, onConfirm }: {
  title: ReactNode
  description: ReactNode
  onConfirm: () => void
}) {
  return (
    <DeleteConfirm title={title} description={description} onConfirm={onConfirm}>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
        Delete
      </Button>
    </DeleteConfirm>
  )
}
