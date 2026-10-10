import { useState } from 'react'
import { toast } from 'sonner'
import { ChatHistory, type HistoryChat, type HistoryProject } from '@/blocks/ai/chat/chat-history'
import type { Memory } from '@/blocks/ai/memory/memory-manager'
import { ProjectConnectors, ProjectMemory, ProjectSkills } from '@/blocks/ai/projects/project-tools'
import { now } from '../ai/data'
import { HISTORY_DEMO_CHATS, HISTORY_DEMO_PROJECTS, PROJECT_TOOLS, SHARED_WITH_ME } from '../ai/projects/tools-data'
import { CONNECTORS } from '../ai/settings/connectors-data'
import { SAMPLE_SKILLS, toSkill } from '../ai/settings/skills-data'
import { Panel } from '../shared'

// A project's Tools tab and the chat history for richer projects, on local
// state (nothing here touches the AI chat app's saved projects): the
// project's connectors, skills and memory live for Q4 planning, then the
// history with starred, shared, archived and unread projects and a Shared
// with me group.

const demo = (what: string) => toast(what, { description: 'Demo only: nothing was changed.' })

const SAMPLE = PROJECT_TOOLS['p-q4']

export function ToolsPanels() {
  const [connectors, setConnectors] = useState(SAMPLE.connectors)
  const [skills, setSkills] = useState(SAMPLE.skills)
  const [memoryOn, setMemoryOn] = useState(SAMPLE.memoryOn)
  const [memories, setMemories] = useState<Memory[]>(SAMPLE.memories)

  return (
    <>
      <Panel title="Project connectors" note="A switch per connected app; open a row for its tools">
        <ProjectConnectors
          connectors={CONNECTORS}
          enabled={connectors}
          onEnabledChange={(id, on) => setConnectors((m) => ({ ...m, [id]: on }))}
          onManage={(id) => demo(`Opens ${CONNECTORS.find((c) => c.id === id)?.name} in Settings`)}
          onOpenSettings={() => demo('Opens Settings › Connectors')}
        />
      </Panel>

      <Panel title="Project skills" note="By source; only skills on in your settings">
        <ProjectSkills
          skills={SAMPLE_SKILLS.map(toSkill)}
          enabled={skills}
          onEnabledChange={(id, on) => setSkills((m) => ({ ...m, [id]: on }))}
          onOpenSettings={() => demo('Opens Settings › Skills')}
        />
      </Panel>

      <Panel title="Project memory" note="Kept apart from your personal memory">
        <ProjectMemory
          enabled={memoryOn}
          onEnabledChange={setMemoryOn}
          memories={memories}
          onEdit={(id, text) => setMemories((list) => list.map((m) => (m.id === id ? { ...m, text, updatedAt: now() } : m)))}
          onDelete={(id) => {
            const gone = memories.find((m) => m.id === id)
            setMemories((list) => list.filter((m) => m.id !== id))
            if (gone) {
              toast('Memory deleted', {
                action: { label: 'Undo', onClick: () => setMemories((list) => [...list, gone]) },
              })
            }
          }}
          onClearAll={() => setMemories([])}
          now={now()}
        />
      </Panel>

      <HistoryPanel />
    </>
  )
}

function HistoryPanel() {
  const [projects, setProjects] = useState<HistoryProject[]>(HISTORY_DEMO_PROJECTS)
  const [shared, setShared] = useState<HistoryProject[]>(SHARED_WITH_ME)
  const [chats, setChats] = useState<HistoryChat[]>(HISTORY_DEMO_CHATS)
  const [activeChat, setActiveChat] = useState<string | null>('h3')
  const [activeProject, setActiveProject] = useState<string | null>(null)

  const patchProject = (id: string, change: Partial<HistoryProject>) => {
    setProjects((list) => list.map((p) => (p.id === id ? { ...p, ...change } : p)))
    setShared((list) => list.map((p) => (p.id === id ? { ...p, ...change } : p)))
  }
  const patchChat = (id: string, change: Partial<HistoryChat>) =>
    setChats((list) => list.map((c) => (c.id === id ? { ...c, ...change } : c)))
  const nameOf = (id: string) => [...projects, ...shared].find((p) => p.id === id)?.name ?? 'Project'
  const archived = projects.filter((p) => p.archived).length

  return (
    <Panel title="Chat history" note="Starred first, shared, unread, archived hidden, Shared with me">
      <div className="grid gap-2">
        <div className="bg-sidebar text-sidebar-foreground mx-auto h-[32rem] w-full max-w-64 overflow-hidden rounded-lg border">
          <ChatHistory
            chats={chats}
            projects={projects}
            sharedProjects={shared}
            activeChatId={activeChat}
            activeProjectId={activeProject}
            now={now}
            onNewChat={() => demo('Starts a new chat')}
            onOpenChat={(id) => {
              setActiveChat(id)
              setActiveProject(null)
              patchChat(id, { unread: false })
            }}
            onOpenProject={(id) => {
              setActiveProject(id)
              setActiveChat(null)
              patchProject(id, { unread: 0 })
            }}
            onCreateProject={(name) => setProjects((list) => [...list, { id: `p-${Date.now().toString(36)}`, name, colour: 'var(--chart-2)' }])}
            onNewChatInProject={(id) => demo(`Starts a chat in ${nameOf(id)}`)}
            onEditProject={(id) => demo(`Opens ${nameOf(id)}`)}
            onDeleteProject={(id) => {
              setProjects((list) => list.filter((p) => p.id !== id))
              setChats((list) => list.map((c) => (c.projectId === id ? { ...c, projectId: null } : c)))
            }}
            onStarProject={(id, starred) => patchProject(id, { starred })}
            onShareProject={(id) => demo(`Shares ${nameOf(id)}`)}
            onDuplicateProject={(id) => {
              const from = [...projects, ...shared].find((p) => p.id === id)
              if (!from) return
              setProjects((list) => [...list, {
                ...from, id: `${id}-copy-${Date.now().toString(36)}`, name: `${from.name} (copy)`,
                owner: undefined, shared: false, starred: false, unread: 0,
              }])
            }}
            onArchiveProject={(id) => {
              patchProject(id, { archived: true })
              toast(`${nameOf(id)} archived`, {
                action: { label: 'Undo', onClick: () => patchProject(id, { archived: false }) },
              })
            }}
            onRenameChat={(id, title) => patchChat(id, { title })}
            onPinChat={(id, pinned) => patchChat(id, { pinned })}
            onMoveChat={(id, projectId) => patchChat(id, { projectId })}
            onDeleteChat={(id) => setChats((list) => list.filter((c) => c.id !== id))}
          />
        </div>
        <p className="text-muted-foreground text-center text-[11px]">
          {archived === 0 ? 'No archived projects.' : `${archived} archived ${archived === 1 ? 'project is' : 'projects are'} not listed.`}{' '}
          {archived > 0 && (
            <button
              type="button"
              onClick={() => setProjects((list) => list.map((p) => ({ ...p, archived: false })))}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Restore
            </button>
          )}
        </p>
      </div>
    </Panel>
  )
}
