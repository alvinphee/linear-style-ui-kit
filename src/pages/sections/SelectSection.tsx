import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Building03Icon, Tick02Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { LabelChip, LabelDot } from '@/components/label-dot'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CUSTOMERS, LABEL_BY_ID, LABELS } from '../data'
import { Panel, Section } from './shared'

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
              {selected.map((id) => (
                <LabelChip
                  key={id}
                  name={LABEL_BY_ID[id].name}
                  colour={LABEL_BY_ID[id].colour}
                  variant="soft"
                  onRemove={() => {
                    toggle(id)
                    triggerRef.current?.focus()
                  }}
                />
              ))}
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
                        <LabelDot colour={l.colour} />
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

export default function SelectSection() {
  return (
    <Section id="select" title="Select and combobox" description="Pick one or several from a list, with search and tags">
      <ComboboxPanel />

      <TagsPanel />
    </Section>
  )
}
