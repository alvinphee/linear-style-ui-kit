import { createContext, useContext, type ReactNode } from 'react'
import { SAMPLE_KNOWLEDGE_BASES } from './bases-data'
import { useKnowledgeLibrary } from './library'

// The AI chat app's knowledge bases, kept in this browser and shared by the
// Knowledge pages and each project's Knowledge tab. In a provider of its own
// so the indexer's ticks re-render only what shows knowledge, not the whole
// workspace.

type Library = ReturnType<typeof useKnowledgeLibrary>

const KnowledgeContext = createContext<Library | null>(null)

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const library = useKnowledgeLibrary(SAMPLE_KNOWLEDGE_BASES, 'linear-kit:ai-knowledge:v1')
  return <KnowledgeContext.Provider value={library}>{children}</KnowledgeContext.Provider>
}

export function useKnowledge() {
  const library = useContext(KnowledgeContext)
  if (!library) throw new Error('useKnowledge must be used inside KnowledgeProvider')
  return library
}
