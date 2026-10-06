import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { differenceInCalendarDays, endOfMonth, format, startOfMonth, subDays } from 'date-fns'
import { type DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRangePicker, type DateRangePreset } from '@/blocks/period-picker'
import { Panel, Row, Section } from './shared'

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

export default function DatePickerSection() {
  return (
    <Section id="date-picker" title="Date picker" description="A day, or a range of days, from a calendar">
      <DatePickerPanel />

      <DateRangePanel />
    </Section>
  )
}
