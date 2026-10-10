import { SkillsPanels } from './ai-settings/SkillsPanels'
import { Section } from './shared'

export default function AiSkillsSection() {
  return (
    <Section
      id="ai-skills"
      title="Skills and memory"
      description="Skills the assistant loads when a task needs them, and what it remembers about you"
    >
      <SkillsPanels />
    </Section>
  )
}
