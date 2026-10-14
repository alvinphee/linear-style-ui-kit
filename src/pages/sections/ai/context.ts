import { createContext, useContext } from 'react'
import type { ShareChatOptions } from '@/blocks/ai/chat/share-chat-dialog'
import type { FileRef, ModelId, Modes, Project } from './types'

// Every action the workspace offers. The object is stable for the life of
// the section, so memoised children do not re-render on each streamed chunk.
export type WorkspaceActions = {
  // inProject: a new chat in that project, whatever is open.
  send: (text: string, attachments: FileRef[], inProject?: string | null) => void
  stop: () => void
  // A voice conversation's lines, kept as messages in the open chat (or a new one).
  addTranscript: (lines: { role: 'user' | 'assistant'; text: string }[]) => void
  regenerate: (chatId: string, messageId: string) => void
  selectVersion: (chatId: string, messageId: string, index: number) => void
  feedback: (chatId: string, messageId: string, replyId: string, value: 'up' | 'down' | undefined) => void
  decide: (chatId: string, messageId: string, replyId: string, partId: string, decision: 'approved' | 'denied') => void
  // Edit a user message: a new branch with the new text and a new reply. The
  // old branch, and everything after it, is kept.
  editMessage: (chatId: string, messageId: string, text: string) => void
  // Show another branch of a user message (by index), with what follows it.
  selectBranch: (chatId: string, messageId: string, index: number) => void
  // A new chat with the messages up to and including this one, in the same
  // project, opened. From a user message, it starts a new reply to it.
  forkChat: (chatId: string, messageId: string) => void
  // The chat's shared link: create it, change it (a snapshot is retaken), or
  // revoke it.
  shareChat: (chatId: string, options: ShareChatOptions) => void
  updateShare: (chatId: string, options: ShareChatOptions) => void
  revokeShare: (chatId: string) => void
  openArtifact: (id: string, version: number) => void
  closeArtifact: () => void
  openChat: (id: string) => void
  newChat: (projectId?: string | null) => void
  // A project's page, at a tab (Overview when left out).
  openProject: (id: string, tab?: string) => void
  // All chats: the chat library.
  openLibrary: () => void
  // Knowledge bases: the library, or one at a tab (Documents when left out).
  openKnowledge: (baseId?: string, tab?: string) => void
  // Agents: the gallery (at a tab), 'new' for the builder, or one agent at a
  // tab ('edit' is its builder).
  openAgents: (agentId?: string, tab?: string) => void
  // The runs inbox, with one run open.
  openRuns: (runId?: string) => void
  // Incognito on or off; either way a new chat starts.
  setIncognito: (on: boolean) => void
  // The history's chats by date, or one list.
  setGroupByDate: (on: boolean) => void
  renameChat: (id: string, title: string) => void
  pinChat: (id: string, pinned: boolean) => void
  moveChat: (id: string, projectId: string | null) => void
  duplicateChat: (id: string) => void
  deleteChat: (id: string) => void
  exportChat: (id: string) => void
  createProject: (name: string) => string
  patchProject: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  patchProjectWith: (id: string, update: (project: Project) => Partial<Omit<Project, 'id'>>) => void
  duplicateProject: (id: string) => void
  deleteProject: (id: string) => void
  addProjectFiles: (id: string, files: FileRef[]) => void
  removeProjectFile: (id: string, fileId: string) => void
  setModel: (model: ModelId) => void
  setModes: (modes: Modes) => void
  toggleSidebar: () => void
  resetDemo: () => void
  // Settings, at one section; null opens the list of sections (the first
  // section on a wide screen).
  openSettings: (section?: string | null) => void
  closeSettings: () => void
  // The admin console, at one section (owners and admins).
  openAdmin: (section?: string | null) => void
  closeAdmin: () => void
  // The model new chats start with, whatever chat is open.
  setDefaultModel: (model: ModelId) => void
}

export const ActionsContext = createContext<WorkspaceActions | null>(null)

export function useActions() {
  const actions = useContext(ActionsContext)
  if (!actions) throw new Error('useActions must be used inside the AI workspace')
  return actions
}
