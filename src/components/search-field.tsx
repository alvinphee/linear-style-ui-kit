import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

// A search input with a magnifier, and a clear button once something is
// typed. `end` shows at the right while it is empty, such as the shortcut
// that focuses it (<Shortcut keys={['/']} />); the clear button takes its
// place when there is text. Escape clears it (and only then bubbles on, so a
// dialog around it closes on the second Escape). Size and width come from
// className ("h-8 w-60").
export function SearchField({ value, onChange, placeholder, label, end, autoFocus, className }: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  // The accessible name, when the placeholder alone is too short.
  label?: string
  end?: ReactNode
  autoFocus?: boolean
  className?: string
}) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key !== 'Escape' || !value) return
          e.stopPropagation()
          onChange('')
        }}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => onChange('')}>
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </InputGroupButton>
        </InputGroupAddon>
      ) : end && (
        <InputGroupAddon align="inline-end">{end}</InputGroupAddon>
      )}
    </InputGroup>
  )
}
