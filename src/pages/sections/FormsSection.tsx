import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, TruckIcon, Location01Icon, Alert02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PRIORITY, type Priority } from '../data'
import { Panel, Section } from './shared'

export default function FormsSection() {
  const [pallets, setPallets] = useState([12])

  return (
    <Section id="forms" title="Forms" description="Inputs, selects, toggles and a full example">
      <Panel title="Create job" note="Every control in one real form">
        <form
          className="grid gap-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            toast.success('Job created', { description: 'This is a demo. Nothing was saved.' })
          }}
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="do">DO number</Label>
              <Input id="do" placeholder="DO-24818" />
            </div>
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Select defaultValue="bayview">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Recent</SelectLabel>
                    <SelectItem value="bayview">Bayview Foods</SelectItem>
                    <SelectItem value="lumen">Lumen Electronics</SelectItem>
                    <SelectItem value="orchid">Orchid Pharma</SelectItem>
                    <SelectItem value="tanjong">Tanjong Paints</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="dest">Delivery address</Label>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={Location01Icon} strokeWidth={2} />
              </InputGroupAddon>
              <InputGroupInput id="dest" placeholder="12 Jurong Port Road" />
            </InputGroup>
          </div>

          <div className="grid gap-1.5">
            <Label>Priority</Label>
            <RadioGroup defaultValue="medium" className="flex flex-wrap gap-3">
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                <Label key={p} className="flex items-center gap-1.5 font-normal">
                  <RadioGroupItem value={p} />
                  <HugeiconsIcon icon={PRIORITY[p].icon} strokeWidth={2} className={`size-3.5 ${PRIORITY[p].className}`} />
                  {PRIORITY[p].label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Pallets</Label>
              <span className="text-muted-foreground text-xs tabular-nums">{pallets[0]}</span>
            </div>
            <Slider value={pallets} onValueChange={setPallets} min={1} max={40} step={1} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes for driver</Label>
            <Textarea id="notes" placeholder="Gate code, loading bay, contact person…" rows={3} />
          </div>

          <div className="grid gap-2.5">
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox defaultChecked /> Proof photos required
            </Label>
            <Label className="flex items-center justify-between gap-2 font-normal">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={TruckIcon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                Notify driver on WhatsApp
              </span>
              <Switch defaultChecked />
            </Label>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3.5">
            <Button type="button" variant="ghost">Cancel</Button>
            <Button type="submit">
              Create job <Kbd className="bg-primary-foreground/15 text-primary-foreground ml-1">Ctrl ↵</Kbd>
            </Button>
          </div>
        </form>
      </Panel>

      <div className="grid content-start gap-3">
        <Panel title="Search field" note="InputGroup with icon and hint">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search jobs, DO numbers, customers…" />
            <InputGroupAddon align="inline-end">
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </Panel>

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
      </div>
    </Section>
  )
}
