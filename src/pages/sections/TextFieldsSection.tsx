import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon, MinusSignIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { toast } from 'sonner'
import { SearchField } from '@/components/search-field'
import { Shortcut } from '@/components/shortcut'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, InputGroupButton,
} from '@/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Panel, Section } from './shared'

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

export default function TextFieldsSection() {
  const [search, setSearch] = useState('')

  return (
    <Section id="text-fields" title="Text fields" description="Inputs, text areas, input groups, search fields, one-time codes and the comment box">
      <Panel title="States" note="disabled, invalid, with suffix">
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="dis">Disabled</Label>
            <Input id="dis" disabled value="Locked after dispatch" readOnly />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bad">Invalid</Label>
            <Input id="bad" aria-invalid defaultValue="DO-2481" />
            <p className="text-destructive flex items-center gap-1 text-[11px]">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3" />
              DO numbers have 5 digits.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wt">With suffix</Label>
            <InputGroup>
              <InputGroupInput id="wt" defaultValue="480" inputMode="numeric" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>kg</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </Panel>

      <Panel title="Search field" note="SearchField with a shortcut hint">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search jobs, DO numbers, customers…"
          end={<Shortcut keys={['/']} />}
        />
      </Panel>

      <NumberPanel />

      <OtpPanel />
    </Section>
  )
}
