import { AgentRunsPanel } from './ai-features/AgentRunsPanel'
import { FeedbackPanel } from './ai-features/FeedbackPanel'
import { InlineRewritePanel } from './ai-features/InlineRewritePanel'
import { MemoryPanel } from './ai-features/MemoryPanel'
import { NlSearchPanel } from './ai-features/NlSearchPanel'
import { SummaryPanel } from './ai-features/SummaryPanel'
import { TriagePanel } from './ai-features/TriagePanel'
import { UsagePanel } from './ai-features/UsagePanel'
import { Section } from './shared'

// Every AI result here is scripted in the browser. No model is called.
export default function AiFeaturesSection() {
  return (
    <Section id="ai-features" title="AI in the product" description="Inline rewrite, summaries, triage suggestions and more">
      <InlineRewritePanel />
      <SummaryPanel />
      <TriagePanel />
      <NlSearchPanel />
      <AgentRunsPanel />
      <UsagePanel />
      <MemoryPanel />
      <FeedbackPanel />
    </Section>
  )
}
