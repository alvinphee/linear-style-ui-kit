import { HugeiconsIcon } from '@hugeicons/react'
import { CommandIcon } from '@hugeicons/core-free-icons'
import { Shortcut } from '@/components/shortcut'
import { Button } from '@/components/ui/button'
import { Panel, Row, Section } from './shared'

export default function CommandPaletteSection({ onOpenCommand }: { onOpenCommand: () => void }) {
  return (
    <Section id="command-palette" title="Command palette" description="Find and run anything from the keyboard, and the search button that opens it">
      <Panel title="Command menu" note="Everything from the keyboard">
        <Row>
          <Button variant="outline" onClick={onOpenCommand}>
            <HugeiconsIcon icon={CommandIcon} strokeWidth={2} data-icon="inline-start" />
            Open command menu
          </Button>
          <Shortcut keys={['mod', 'K']} />
        </Row>
      </Panel>
    </Section>
  )
}
