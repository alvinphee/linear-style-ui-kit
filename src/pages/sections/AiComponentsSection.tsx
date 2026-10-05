import { useState } from 'react'
import { Copy01Icon, RefreshIcon, ThumbsDownIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AiLabel } from '@/components/ai-label'
import { FileChip } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { ShimmerText, StreamCaret, Thinking, TypingDots } from '@/components/thinking-indicator'
import { Panel, Row, Section } from './shared'

// The small AI components the AI blocks are made of: the AI label, the
// thinking indicator and its working signs, icon actions and file chips.
// Their playgrounds are in src/pages/playground/ai-components.tsx.

const FILES = [
  { name: 'aging-report.pdf', size: 248_000 },
  { name: 'q3-invoices.xlsx', size: 61_400 },
  { name: 'customer-notes.md', size: 3_200 },
]

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

export default function AiComponentsSection() {
  return (
    <Section
      id="ai-components"
      title="AI components"
      description="AI label, thinking indicator, icon actions and file chips: the parts the AI blocks are made of"
    >
      <Panel title="AI label" note="Marks what the AI wrote">
        <div className="grid gap-3">
          <Row>
            <span className="text-xs font-medium">Summary</span>
            <AiLabel />
          </Row>
          <Row>
            <AiLabel>AI suggests</AiLabel>
            <span className="text-muted-foreground text-xs">Set priority to High: the customer is waiting on it.</span>
          </Row>
        </div>
      </Panel>

      <Panel title="Thinking and streaming" note="While the AI works">
        <div className="grid gap-3 text-xs">
          <Thinking label="Reading 30 customer invoices…" />
          <Row className="gap-3">
            <TypingDots />
            <ShimmerText>Drafting the reminder…</ShimmerText>
          </Row>
          <p>
            Seven invoices are overdue, the largest from Northwind Traders
            <StreamCaret />
          </p>
        </div>
      </Panel>

      <Panel title="Icon actions" note="Under a reply">
        <ReplyActions />
      </Panel>

      <Panel title="File chips" note="Attached to a message">
        <Row className="gap-1.5">
          {FILES.map((f) => <FileChip key={f.name} name={f.name} size={f.size} />)}
        </Row>
      </Panel>
    </Section>
  )
}
