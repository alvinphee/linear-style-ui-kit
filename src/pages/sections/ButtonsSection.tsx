import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon, Copy01Icon, Delete02Icon,
  Download01Icon, FilterHorizontalIcon, FloppyDiskIcon, KanbanIcon, LeftToRightListBulletIcon, MoreHorizontalIcon,
  RefreshIcon, Settings01Icon, TextBoldIcon, TextItalicIcon, TextUnderlineIcon, ThumbsDownIcon, ThumbsUpIcon,
  Upload01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { Spinner } from '@/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Panel, Row, Section } from './shared'

function ReplyActions() {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  return (
    <Row className="gap-0.5">
      <IconAction label="Copy" icon={Copy01Icon} onClick={() => toast('Copied', { description: 'Demo only.' })} />
      <IconAction label="Regenerate" icon={RefreshIcon} onClick={() => toast('Regenerating', { description: 'Demo only.' })} />
      <IconAction label="Good reply" icon={ThumbsUpIcon} pressed={feedback === 'up'} onClick={() => setFeedback(feedback === 'up' ? null : 'up')} />
      <IconAction label="Bad reply" icon={ThumbsDownIcon} pressed={feedback === 'down'} onClick={() => setFeedback(feedback === 'down' ? null : 'down')} />
    </Row>
  )
}

const FORMATS = [
  { id: 'bold', label: 'Bold', key: 'B', icon: TextBoldIcon },
  { id: 'italic', label: 'Italic', key: 'I', icon: TextItalicIcon },
  { id: 'underline', label: 'Underline', key: 'U', icon: TextUnderlineIcon },
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
              <IconAction
                key={f.id}
                label={f.label}
                icon={f.icon}
                shortcut={['mod', f.key]}
                pressed={marks.includes(f.id)}
                variant="outline"
                size="icon"
                className="text-foreground"
                onClick={() => toggle(f.id)}
              />
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

export default function ButtonsSection() {
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('list')
  function fakeSave() {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }

  return (
    <Section id="buttons" title="Buttons and toggles" description="Buttons, icon buttons, button groups and toggles">
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

      <Panel title="Icon actions" note="Under a reply">
        <ReplyActions />
      </Panel>

      <ButtonGroupsPanel />

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
