import { BasesPanels } from './ai-knowledge/BasesPanels'
import { CitationsPanels } from './ai-knowledge/CitationsPanels'
import { ProjectKnowledgePanels } from './ai-knowledge/ProjectKnowledgePanels'
import { RetrievalPanels } from './ai-knowledge/RetrievalPanels'
import { Section } from './shared'

// Knowledge: a project's own files read in full while they fit (and searched
// once they don't), knowledge bases searched with retrieval (RAG), the
// retrieval tester and settings, and citations back to the passages used.
export default function AiKnowledgeSection() {
  return (
    <Section
      id="ai-knowledge"
      title="Knowledge"
      description="Project knowledge and its context meter, knowledge bases, test retrieval, retrieval settings and citations"
    >
      <ProjectKnowledgePanels />
      <BasesPanels />
      <RetrievalPanels />
      <CitationsPanels />
    </Section>
  )
}
