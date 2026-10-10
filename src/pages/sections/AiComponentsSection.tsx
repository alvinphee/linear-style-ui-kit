import { AiLabel } from '@/components/ai/ai-label'
import { ContextMeter, ContextModeBadge } from '@/components/ai/context-meter'
import { ShimmerText, StreamCaret, Thinking, TypingDots } from '@/components/ai/thinking-indicator'
import { Panel, Row, Section } from './shared'

export default function AiComponentsSection() {
  return (
    <Section id="ai-components" title="AI components" description="AI label, thinking indicator, incognito toggle and context meter: the parts the AI blocks are made of">
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

      <Panel title="Context meter" note="How much of a project's context its knowledge uses">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <ContextModeBadge mode="full" />
            <ContextMeter used={76_000} limit={200_000} />
          </div>
          <div className="grid gap-2">
            <ContextModeBadge mode="search" />
            <ContextMeter used={248_000} limit={200_000} />
          </div>
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
    </Section>
  )
}
