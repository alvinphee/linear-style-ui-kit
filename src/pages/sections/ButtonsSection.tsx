import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, Delete02Icon, Download01Icon, FilterHorizontalIcon, KanbanIcon,
  LeftToRightListBulletIcon, Calendar03Icon, MoreHorizontalIcon, Settings01Icon,
  Upload01Icon,
} from '@hugeicons/core-free-icons'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Spinner } from '@/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Panel, Row, Section } from './shared'

export default function ButtonsSection() {
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('list')

  function fakeSave() {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }

  return (
    <Section id="buttons" title="Buttons" description="Variants, sizes, icons and shortcuts">
      <Panel title="Variants" note="variant=">
        <Row>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </Row>
      </Panel>

      <Panel title="Sizes" note="size=">
        <Row>
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon-sm" variant="outline" aria-label="Settings">
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
          </Button>
          <Button size="icon" variant="outline" aria-label="Settings">
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
          </Button>
          <Button size="icon-lg" variant="outline" aria-label="Settings">
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
          </Button>
        </Row>
      </Panel>

      <Panel title="With icons and shortcuts" note="Show the key next to the action">
        <Row>
          <Button>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            New job
            <Kbd className="bg-primary-foreground/15 text-primary-foreground ml-1">C</Kbd>
          </Button>
          <Button variant="outline">
            <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} data-icon="inline-start" />
            Upload photos
          </Button>
          <Button variant="outline">
            Export
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
          </Button>
          <Button variant="secondary" onClick={fakeSave} disabled={saving}>
            {saving && <Spinner aria-hidden className="size-3.5" data-icon="inline-start" />}
            {saving ? 'Saving…' : 'Save (click me)'}
          </Button>
          <Button variant="destructive">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
            Delete
          </Button>
        </Row>
      </Panel>

      <Panel title="Icon buttons with tooltips" note="Hover each one">
        <Row>
          {[
            { label: 'Filter', keys: ['F'], icon: FilterHorizontalIcon },
            { label: 'Download PDF', keys: ['mod', 'P'], icon: Download01Icon },
            { label: 'More actions', keys: ['.'], icon: MoreHorizontalIcon },
          ].map((b) => (
            <IconAction key={b.label} label={b.label} icon={b.icon} shortcut={b.keys} size="icon" className="text-foreground" />
          ))}
        </Row>
      </Panel>

      <Panel title="Segmented control" note="ToggleGroup" wide>
        <Row>
          <ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => v && setView(v)}>
            <ToggleGroupItem value="list" aria-label="List view">
              <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} /> List
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label="Board view">
              <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} /> Board
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar view">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} /> Calendar
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="text-muted-foreground text-xs">Showing: {view}</span>
        </Row>
      </Panel>
    </Section>
  )
}
