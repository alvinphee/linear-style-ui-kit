import { createContext, useContext } from 'react'
import type { FileRef, ModelId, Modes, Project } from './types'

// Every action the workspace offers. The object is stable for the life of
// the section, so memoised children do not re-render on each streamed chunk.
export type WorkspaceActions = {
  send: (text: string, attachments: FileRef[]) => void
  stop: () => void
  regenerate: (chatId: string, messageId: string) => void
  selectVersion: (chatId: string, messageId: string, index: number) => void
  feedback: (chatId: string, messageId: string, replyId: string, value: 'up' | 'down' | undefined) => void
  decide: (chatId: string, messageId: string, replyId: string, partId: string, decision: 'approved' | 'denied') => void
  editMessage: (chatId: string, messageId: string, text: string) => void
  openArtifact: (id: string, version: number) => void
  closeArtifact: () => void
  openChat: (id: string) => void
  newChat: (projectId?: string | null) => void
  openProject: (id: string) => void
  renameChat: (id: string, title: string) => void
  pinChat: (id: string, pinned: boolean) => void
  moveChat: (id: string, projectId: string | null) => void
  duplicateChat: (id: string) => void
  deleteChat: (id: string) => void
  exportChat: (id: string) => void
  createProject: (name: string) => string
  patchProject: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  deleteProject: (id: string) => void
  addProjectFiles: (id: string, files: FileRef[]) => void
  removeProjectFile: (id: string, fileId: string) => void
  setModel: (model: ModelId) => void
  setModes: (modes: Modes) => void
  toggleSidebar: () => void
  resetDemo: () => void
}

export const ActionsContext = createContext<WorkspaceActions | null>(null)

export function useActions() {
  const actions = useContext(ActionsContext)
  if (!actions) throw new Error('useActions must be used inside the AI workspace')
  return actions
}
