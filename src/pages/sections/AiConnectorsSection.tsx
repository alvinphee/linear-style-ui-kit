import { ConnectorsPanels } from './ai-settings/ConnectorsPanels'
import { Section } from './shared'

export default function AiConnectorsSection() {
  return (
    <Section
      id="ai-connectors"
      title="Connectors"
      description="Let the assistant use other apps: a catalogue, consent, tool permissions and custom MCP servers"
    >
      <ConnectorsPanels />
    </Section>
  )
}
