import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Building03Icon, Calendar03Icon,
  Cancel01Icon, CheckmarkCircle02Icon, FloppyDiskIcon, MinusSignIcon, PlusSignIcon, TextBoldIcon,
  TextItalicIcon, TextUnderlineIcon, Tick02Icon, UnfoldMoreIcon,
} from '@hugeicons/core-free-icons'
import { differenceInCalendarDays, endOfMonth, format, startOfMonth, subDays } from 'date-fns'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import type { DateRange } from 'react-day-picker'
import { toast } from 'sonner'
import { cn } from 'cn'
import { DateRangePicker, type DateRangePreset } from '@/blocks/period-picker'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CUSTOMERS, LABELS } from '../data'
import { Panel, Row, Section } from './shared'

const FORMATS = [
  { id: 'bold', label: 'Bold', keys: 'Ctrl B', icon: TextBoldIcon },
  { id: 'italic', label: 'Italic', keys: 'Ctrl I', icon: TextItalicIcon },
  { id: 'underline', label: 'Underline', keys: 'Ctrl U', icon: TextUnderlineIcon },
] as const

type Mark = (typeof FORMATS)[number]['id']

function ButtonGroupsPanel() {
  const [marks, setMarks] = useState<Mark[]>(['bold'])
  const [page, setPage] = useState(1)
  const pages = 5

  function toggle(mark: Mark) {
    setMarks((m) => (m.includes(mark) ? m.filter((x) => x !== mark) : [...m, mark]))
  }

  return (
    <Panel title="Button group" note="ButtonGroup, ButtonGroupText" wide>
      <div className="grid gap-3">
        <Row className="gap-3">
          <ButtonGroup aria-label="Text format">
            {FORMATS.map((f) => (
              <Tooltip key={f.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={f.label}
                    aria-pressed={marks.includes(f.id)}
                    className="aria-pressed:bg-muted aria-pressed:text-foreground"
                    onClick={() => toggle(f.id)}
                  >
                    <HugeiconsIcon icon={f.icon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {f.label} <Kbd className="ml-1">{f.keys}</Kbd>
                </TooltipContent>
              </Tooltip>
            ))}
          </ButtonGroup>

          <ButtonGroup>
            <Button onClick={() => toast.success('Changes saved')}>
              <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} data-icon="inline-start" />
              Save
            </Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" aria-label="More save options">
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => toast('Saved as draft')}>Save as draft</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toast('Saved and closed')}>Save and close</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>

          <ButtonGroup aria-label="Pages">
            <ButtonGroupText>Page</ButtonGroupText>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <ButtonGroupText aria-live="polite" className="dark:bg-input/30 min-w-14 justify-center bg-transparent font-normal tabular-nums">
              {page} / {pages}
            </ButtonGroupText>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </ButtonGroup>
        </Row>
        <p
          className={cn(
            'text-muted-foreground text-xs',
            marks.includes('bold') && 'text-foreground font-semibold',
            marks.includes('italic') && 'italic',
            marks.includes('underline') && 'underline underline-offset-4',
          )}
        >
          Release notes for version 2.4
        </p>
      </div>
    </Panel>
  )
}

const MIN = 0
const MAX = 99
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n))

function NumberField({ id, label, defaultValue, step = 1, unit }: {
  id: string
  label: string
  defaultValue: number
  step?: number
  unit?: string
}) {
  const [value, setValue] = useState(defaultValue)
  // What the person is typing, before it is clamped on blur or Enter.
  const [draft, setDraft] = useState<string | null>(null)
  const current = draft === null || draft === '' ? value : Number(draft)

  function commit(n: number) {
    setValue(clamp(n))
    setDraft(null)
  }

  const stepper = (dir: 1 | -1) => (
    <InputGroupButton
      size="icon-xs"
      aria-label={`${dir === 1 ? 'Increase' : 'Decrease'} ${label.toLowerCase()}`}
      disabled={dir === 1 ? current >= MAX : current <= MIN}
      onClick={() => commit(current + dir * step)}
    >
      <HugeiconsIcon icon={dir === 1 ? PlusSignIcon : MinusSignIcon} strokeWidth={2} />
    </InputGroupButton>
  )

  const input = (
    <InputGroupInput
      id={id}
      role="spinbutton"
      inputMode="numeric"
      autoComplete="off"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={value}
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))}
      onBlur={() => draft !== null && commit(current)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          commit(current + (e.key === 'ArrowUp' ? step : -step))
        } else if (e.key === 'Enter') {
          commit(current)
        }
      }}
      className={cn('tabular-nums', !unit && 'text-center')}
    />
  )

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {unit ? (
        <InputGroup className="w-40">
          {input}
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unit}</InputGroupText>
            <span aria-hidden className="bg-border mx-0.5 h-4 w-px" />
            {stepper(-1)}
            {stepper(1)}
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <InputGroup className="w-28">
          <InputGroupAddon>{stepper(-1)}</InputGroupAddon>
          {input}
          <InputGroupAddon align="inline-end">{stepper(1)}</InputGroupAddon>
        </InputGroup>
      )}
    </div>
  )
}

function NumberPanel() {
  return (
    <Panel title="Number input" note="InputGroup with steppers, 0–99">
      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField id="num-seats" label="Seats" defaultValue={12} />
          <NumberField id="num-timeout" label="Session timeout" defaultValue={30} step={5} unit="min" />
        </div>
        <p className="text-muted-foreground flex flex-wrap items-center gap-1 text-[11px]">
          Focus a field and press <Kbd>↑</Kbd> <Kbd>↓</Kbd> to step the value.
        </p>
      </div>
    </Panel>
  )
}

function OtpPanel() {
  const [code, setCode] = useState('')
  const done = code.length === 6

  return (
    <Panel title="One-time code" note="InputOTP, digits only">
      <div className="grid gap-3">
        <Label htmlFor="otp-code">Enter the 6-digit code we emailed you</Label>
        <InputOTP
          id="otp-code"
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
          onChange={setCode}
          containerClassName="gap-2"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          {/* InputOTPSeparator replaces its classes with any className, so colour it from a wrapper. */}
          <div className="text-muted-foreground">
            <InputOTPSeparator />
          </div>
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className="text-xs">
            {done ? (
              <span className="text-status-done flex items-center gap-1.5">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5" />
                Code accepted
              </span>
            ) : (
              <span className="text-muted-foreground tabular-nums">{6 - code.length} digits to go</span>
            )}
          </p>
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0"
            onClick={() => {
              setCode('')
              toast('New code sent', { description: 'Check your inbox. It expires in 10 minutes.' })
            }}
          >
            Resend code
          </Button>
        </div>
      </div>
    </Panel>
  )
}

function DatePickerPanel() {
  const [date, setDate] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)

  return (
    <Panel title="Date picker" note="Popover + Calendar">
      <div className="grid gap-1.5">
        <Label htmlFor="due-date">Due date</Label>
        <Row>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button id="due-date" variant="outline" className={cn('w-full justify-start font-normal sm:w-56', !date && 'text-muted-foreground')}>
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} data-icon="inline-start" className="text-muted-foreground" />
                {date ? format(date, 'EEE, d MMM yyyy') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                defaultMonth={date}
                onSelect={(d) => {
                  setDate(d)
                  setOpen(false)
                }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          {date && (
            <Button variant="ghost" size="sm" onClick={() => setDate(undefined)}>
              Clear
            </Button>
          )}
        </Row>
      </div>
    </Panel>
  )
}

function DateRangePanel() {
  const [today] = useState(() => new Date())
  const [range, setRange] = useState<DateRange | undefined>({ from: subDays(today, 6), to: today })

  const presets: DateRangePreset[] = [
    { label: 'Last 7 days', range: { from: subDays(today, 6), to: today } },
    { label: 'This month', range: { from: startOfMonth(today), to: endOfMonth(today) } },
    { label: 'Clear' },
  ]
  const days = range?.from && range.to ? differenceInCalendarDays(range.to, range.from) + 1 : 0

  return (
    <Panel title="Date range" note='mode="range" with presets'>
      <div className="grid gap-1.5">
        <Label htmlFor="date-range">Reporting period</Label>
        <DateRangePicker
          id="date-range"
          value={range}
          onChange={setRange}
          presets={presets}
          defaultMonth={today}
          className="w-full sm:w-64"
        />
        <p className="text-muted-foreground text-[11px]">
          {days > 0 ? `${days} days selected` : range?.from ? 'Pick an end date' : 'No range selected'}
        </p>
      </div>
    </Panel>
  )
}

function ComboboxPanel() {
  const [open, setOpen] = useState(false)
  const [customer, setCustomer] = useState('')

  return (
    <Panel title="Combobox" note="Popover + Command">
      <div className="grid gap-1.5">
        <Label htmlFor="customer-combobox">Customer</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="customer-combobox"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal sm:w-64"
            >
              <span className={cn('truncate', !customer && 'text-muted-foreground')}>
                {customer || 'Select a customer…'}
              </span>
              <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} data-icon="inline-end" className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search customers…" />
              <CommandList>
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {CUSTOMERS.map((c) => (
                    <CommandItem
                      key={c}
                      value={c}
                      data-checked={customer === c}
                      onSelect={() => {
                        setCustomer(customer === c ? '' : c)
                        setOpen(false)
                      }}
                    >
                      <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="text-muted-foreground" />
                      {c}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </Panel>
  )
}

function TagsPanel() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>(['export', 'key'])
  const triggerRef = useRef<HTMLButtonElement>(null)

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <Panel title="Multi-select with tags" note="Backspace in search removes the last tag">
      <div className="grid gap-1.5">
        <Label htmlFor="labels-trigger">Labels</Label>
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (!o) setSearch('')
          }}
        >
          <PopoverAnchor asChild>
            <div
              className="border-input bg-input/20 dark:bg-input/30 flex min-h-7 w-full min-w-0 flex-wrap items-center gap-1 rounded-md border p-1"
              onClick={(e) => e.target === e.currentTarget && setOpen(true)}
            >
              {selected.map((id) => {
                const label = LABELS.find((l) => l.id === id)!
                return (
                  <span key={id} className="bg-muted inline-flex h-5 max-w-full items-center gap-1 rounded-sm pr-0.5 pl-1.5 text-[11px]">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: label.colour }} />
                    <span className="truncate">{label.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${label.name}`}
                      className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/30 rounded-xs p-0.5 outline-none focus-visible:ring-2"
                      onClick={() => {
                        toggle(id)
                        triggerRef.current?.focus()
                      }}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
                    </button>
                  </span>
                )
              })}
              <PopoverTrigger asChild>
                <Button ref={triggerRef} id="labels-trigger" variant="ghost" size="xs" className="text-muted-foreground">
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                  {selected.length ? 'Add' : 'Add labels'}
                </Button>
              </PopoverTrigger>
            </div>
          </PopoverAnchor>
          <PopoverContent align="start" className="w-60 gap-0 p-0">
            <Command>
              <CommandInput
                placeholder="Search labels…"
                value={search}
                onValueChange={setSearch}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && search === '' && selected.length) {
                    e.preventDefault()
                    setSelected((s) => s.slice(0, -1))
                  }
                }}
              />
              <CommandList>
                <CommandEmpty>No label found.</CommandEmpty>
                <CommandGroup>
                  {LABELS.map((l) => {
                    const on = selected.includes(l.id)
                    return (
                      <CommandItem key={l.id} value={l.name} aria-checked={on} onSelect={() => toggle(l.id)}>
                        <span
                          aria-hidden
                          className={cn(
                            'border-input flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border',
                            on && 'border-primary bg-primary text-primary-foreground',
                          )}
                        >
                          {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-2.5" />}
                        </span>
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: l.colour }} />
                        {l.name}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
            <p className="text-muted-foreground border-t px-2.5 py-1.5 text-[11px]">
              {selected.length} selected · <Kbd>⌫</Kbd> removes the last
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </Panel>
  )
}

export default function InputsSection() {
  return (
    <Section id="inputs" title="More inputs" description="Button groups, numbers, codes, dates, comboboxes and tags">
      <ButtonGroupsPanel />
      <NumberPanel />
      <OtpPanel />
      <DatePickerPanel />
      <DateRangePanel />
      <ComboboxPanel />
      <TagsPanel />
    </Section>
  )
}
