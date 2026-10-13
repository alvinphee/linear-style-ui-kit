import { ChatCorePanels } from './ai-chat-features/ChatCorePanels'
import { ComposerPanels } from './ai-chat-features/ComposerPanels'
import { ModesPanels } from './ai-chat-features/ModesPanels'
import { StatesPanels } from './ai-chat-features/StatesPanels'
import { Section } from './shared'

// What makes an AI chat feel finished: the prompt library and queued
// messages, branches, fork, read aloud and shared links, voice mode and deep
// research, and the edge states (usage limits, offline, first run, shortcuts).
export default function AiChatFeaturesSection() {
  return (
    <Section
      id="ai-chat-features"
      title="Chat features"
      description="Prompt library, queued messages, branches and fork, read aloud, share chat, voice mode, deep research, limits and onboarding"
    >
      <ComposerPanels />
      <ChatCorePanels />
      <ModesPanels />
      <StatesPanels />
    </Section>
  )
}
