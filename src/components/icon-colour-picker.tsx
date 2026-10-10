import { useRef, useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from 'cn'
import { IconMark } from '@/components/mark'
import { SearchField } from '@/components/search-field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Pick an icon and a colour for a thing the person names themselves: a
// project, a folder, a saved view. The trigger shows the icon in its colour;
// the popover holds a row of colour swatches and a grid of icons with a
// search. Both are radio groups: arrow keys move and choose, Tab leaves.
// The caller passes the choices, and keeps the icon and colour by id, so
// they can be saved as JSON and looked up again.

export type IconOption = { id: string; icon: IconSvgElement; label: string }
// `value` is a CSS colour built from theme tokens, such as var(--chart-2).
export type ColourOption = { id: string; value: string; label: string }

const COLUMNS = 7

// One icon in one colour, from their ids. An unknown icon shows the first
// choice; an unknown colour shows the text colour.
export function IconColourSwatch({ icons, colours, icon, colour, size = 'md', className }: {
  icons: IconOption[]
  colours: ColourOption[]
  icon: string
  colour: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const shown = icons.find((i) => i.id === icon) ?? icons[0]
  const tone = colours.find((c) => c.id === colour)?.value ?? 'currentColor'
  if (!shown) return null
  return <IconMark icon={shown.icon} colour={tone} size={size} className={className} />
}

export function IconColourPicker({
  icons, colours, icon, colour, onChange, label = 'Icon and colour', size = 'md', disabled, className,
}: {
  icons: IconOption[]
  colours: ColourOption[]
  // The chosen ids.
  icon: string
  colour: string
  // Called with the part that changed.
  onChange: (change: { icon?: string; colour?: string }) => void
  // What it picks for, read before the current choice: "Project icon".
  label?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const grid = useRef<HTMLDivElement>(null)
  const current = icons.find((i) => i.id === icon) ?? icons[0]
  const tone = colours.find((c) => c.id === colour)
  const q = query.trim().toLowerCase()
  const shown = q ? icons.filter((i) => i.label.toLowerCase().includes(q) || i.id.includes(q)) : icons

  // Up and down move a row in the grid; Radix moves one item for the rest.
  const moveRow = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const next = index + (e.key === 'ArrowDown' ? COLUMNS : -COLUMNS)
    if (next < 0 || next >= shown.length) return e.preventDefault()
    e.preventDefault()
    grid.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery('') }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label}: ${current?.label ?? 'none'}, ${tone?.label ?? 'no colour'}`}
          className={cn(
            'hover:ring-border focus-visible:ring-ring/50 aria-expanded:ring-border inline-flex shrink-0 rounded-md outline-none hover:ring-2 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-expanded:ring-2',
            className,
          )}
        >
          {current && <IconMark icon={current.icon} colour={tone?.value ?? 'currentColor'} size={size} />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[17.5rem] max-w-[calc(100vw-2rem)] gap-3">
        <div className="grid gap-1.5">
          <span aria-hidden="true" className="text-muted-foreground text-[11px] font-medium">Colour</span>
          <RadioGroupPrimitive.Root
            aria-label="Colour"
            value={colour}
            onValueChange={(value) => onChange({ colour: value })}
            orientation="horizontal"
            loop
            className="flex flex-wrap gap-1.5"
          >
            {colours.map((c) => (
              <RadioGroupPrimitive.Item
                key={c.id}
                value={c.id}
                aria-label={c.label}
                title={c.label}
                className="ring-offset-popover focus-visible:ring-ring/50 data-[state=checked]:ring-foreground/60 size-6 rounded-full outline-none ring-offset-2 focus-visible:ring-2 data-[state=checked]:ring-2"
                style={{ background: c.value }}
              />
            ))}
          </RadioGroupPrimitive.Root>
        </div>

        <div className="grid gap-1.5">
          <span aria-hidden="true" className="text-muted-foreground text-[11px] font-medium">Icon</span>
          <SearchField value={query} onChange={setQuery} placeholder="Search icons" className="h-7" />
          {shown.length ? (
            <RadioGroupPrimitive.Root
              ref={grid}
              aria-label="Icon"
              value={icon}
              onValueChange={(value) => onChange({ icon: value })}
              loop={false}
              className="-mx-1 grid max-h-48 grid-cols-7 gap-0.5 overflow-y-auto p-1"
            >
              {shown.map((option, index) => (
                <RadioGroupPrimitive.Item
                  key={option.id}
                  value={option.id}
                  aria-label={option.label}
                  title={option.label}
                  onKeyDown={(e) => moveRow(e, index)}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 data-[state=checked]:bg-accent grid aspect-square place-items-center rounded-md outline-none focus-visible:ring-2"
                  style={option.id === icon ? { color: tone?.value } : undefined}
                >
                  <HugeiconsIcon icon={option.icon} strokeWidth={2} className="size-4" />
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroupPrimitive.Root>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-xs">No icons match “{query.trim()}”.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
