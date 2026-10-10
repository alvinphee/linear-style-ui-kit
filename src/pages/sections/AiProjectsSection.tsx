import { SchedulesPanels } from './ai-projects/SchedulesPanels'
import { SharingPanels } from './ai-projects/SharingPanels'
import { ShellPanels } from './ai-projects/ShellPanels'
import { ToolsPanels } from './ai-projects/ToolsPanels'
import { Section } from './shared'

// Projects as workspaces: the tabbed project page, creating one from a
// template, sharing, the Tools tab (connectors, skills, project memory),
// scheduled tasks, and the chat history's richer project rows.
export default function AiProjectsSection() {
  return (
    <Section
      id="ai-projects"
      title="Projects"
      description="A project as a workspace: tabs, templates, sharing, tools, project memory and scheduled tasks"
    >
      <ShellPanels />
      <ToolsPanels />
      <SchedulesPanels />
      <SharingPanels />
    </Section>
  )
}
