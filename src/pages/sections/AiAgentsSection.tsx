import { BuilderPanels } from './ai-agents/BuilderPanels'
import { ConfigPanels } from './ai-agents/ConfigPanels'
import { GalleryPanels } from './ai-agents/GalleryPanels'
import { RunsPanels } from './ai-agents/RunsPanels'
import { Section } from './shared'

// Agents: saved assistants with instructions, knowledge, tools and triggers.
// The gallery and an agent's page, the builder (describe it, or configure
// it, with a preview), triggers, and runs with their approvals.
export default function AiAgentsSection() {
  return (
    <Section
      id="ai-agents"
      title="Agents"
      description="Agent gallery, describe-to-build with a live preview, configure and triggers, runs and approvals"
    >
      <GalleryPanels />
      <BuilderPanels />
      <ConfigPanels />
      <RunsPanels />
    </Section>
  )
}
