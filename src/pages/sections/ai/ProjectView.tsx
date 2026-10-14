import { useMemo, useState } from 'react'
import {
  BubbleChatIcon, Calendar03Icon, File01Icon, Home01Icon, Plug01Icon, Settings01Icon, UserGroupIcon, Wrench01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { ProjectKnowledge } from '@/blocks/ai/knowledge/project-knowledge'
import { NewProjectDialog } from '@/blocks/ai/projects/new-project-dialog'
import {
  ProjectChatList, ProjectInstructions, ProjectOverviewHeader, ProjectPage, ProjectStartChat,
  ProjectStats, type ProjectPageTab,
} from '@/blocks/ai/projects/project-page'
import { ProjectSharing } from '@/blocks/ai/projects/project-sharing'
import { ProjectConnectors, ProjectMemory, ProjectSkills } from '@/blocks/ai/projects/project-tools'
import { ScheduledTaskDialog, type ScheduledTask, type ScheduledTaskDraft } from '@/blocks/ai/schedules/scheduled-task-dialog'
import { ScheduledTaskList } from '@/blocks/ai/schedules/scheduled-task-list'
import { TaskRunsSheet } from '@/blocks/ai/schedules/task-run-history'
import { SettingsGroup, SettingsRow } from '@/blocks/settings-page'
import { ShareDialog, shareSummaryLabel, type ShareMember } from '@/blocks/share-dialog'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconColourSwatch } from '@/components/icon-colour-picker'
import { Button } from '@/components/ui/button'
import { estimateFileTokens, estimateTokens } from '@/lib/token-estimate'
import { plural } from '@/lib/text'
import { useOrgPolicy } from './admin/org'
import { useActions } from './context'
import { now, toFileRef, uid } from './data'
import { useKnowledge } from './knowledge/context'
import { PRIVATE_SHARING } from './projects/defaults'
import { ORGANISATION, PEOPLE, PROJECT_ROLES } from './projects/people'
import { SAMPLE_RUN_SUMMARIES, SCHEDULE_MODELS } from './projects/schedules-data'
import { PROJECT_COLOURS, PROJECT_ICONS, projectIcon } from './projects/templates'
import { useConnectors } from './settings/ConnectorsTab'
import { useSkills } from './settings/skills-data'
import type { ChatSummary } from './Sidebar'
import type { ModelId, Project, ProjectSharing as Sharing } from './types'

// A project in the AI chat app, as a workspace with tabs: Overview (start a
// chat, its instructions, recent chats), Chats, Knowledge, Tools (connectors,
// skills, project memory), Schedules (scheduled tasks), Sharing and Settings.
// The tab is in the address (#/templates/ai-chat/project/<id>/<tab>).

// The project's context: how many tokens its knowledge may use before the
// assistant switches to searching it. A typical long-context model's window.
const CONTEXT_LIMIT = 200_000

export const PROJECT_TABS = ['overview', 'chats', 'knowledge', 'tools', 'schedules', 'sharing', 'settings'] as const

const colourId = (value: string) => PROJECT_COLOURS.find((c) => c.value === value)?.id ?? PROJECT_COLOURS[0].id

export function ProjectView({ project, chats, tab, start }: {
  project: Project
  chats: ChatSummary[]
  tab?: string
  start?: React.ReactNode
}) {
  const { policy } = useOrgPolicy()
  const actions = useActions()
  const { connectors } = useConnectors()
  const { skills } = useSkills()
  const knowledge = useKnowledge()
  const [sharing, setSharing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [task, setTask] = useState<{ id: string | null } | null>(null)
  const [runsOf, setRunsOf] = useState<string | null>(null)

  const id = project.id
  const patch = (p: Partial<Omit<Project, 'id'>>) => actions.patchProject(id, p)
  const share: Sharing = project.sharing ?? PRIVATE_SHARING
  const setShare = (p: Partial<Sharing>) => patch({ sharing: { ...share, ...p } })
  const schedules = project.schedules ?? []
  const setSchedules = (update: (tasks: ScheduledTask[]) => ScheduledTask[]) =>
    actions.patchProject(id, { schedules: update(project.schedules ?? []) })
  const enabledConnectors = project.connectors ?? {}
  const enabledSkills = project.skills ?? {}
  const connectorCount = connectors.filter((c) => enabledConnectors[c.id] && c.status === 'connected').length
  const activeSchedules = schedules.filter((s) => s.enabled).length
  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt), [chats])
  const time = now()
  const go = (next: string) => actions.openProject(id, next)
  const startChat = (text: string) => actions.send(text, [], id)
  const others = share.members.filter((m) => !m.isYou)
  const excluded = project.excludedFiles ?? []
  const linkedIds = project.knowledgeBases ?? []
  const baseSummaries = knowledge.bases.map((b) => ({
    id: b.id, name: b.name, icon: b.icon, colour: b.colour,
    documentCount: b.documents.length, tokens: b.documents.reduce((n, d) => n + d.tokens, 0),
  }))
  const linkedBases = baseSummaries.filter((b) => linkedIds.includes(b.id))

  // A web page is read in the background: queued, then indexed (or, for an
  // address with "fail" in it, a failed read).
  function addLink(url: string) {
    const lid = uid('l')
    patch({ links: [...(project.links ?? []), { id: lid, url, status: 'queued' }] })
    window.setTimeout(() => actions.patchProjectWith(id, (p) => ({
      links: (p.links ?? []).map((l) => (l.id !== lid ? l : /fail/i.test(url)
        ? { ...l, status: 'failed', error: 'The page could not be read. It may need a sign-in.' }
        : { ...l, status: 'indexed', title: new URL(url).hostname, tokens: estimateTokens(url) * 400 })),
    })), 1500)
  }

  function saveTask(draft: ScheduledTaskDraft) {
    const editingId = task?.id
    if (editingId) setSchedules((tasks) => tasks.map((t) => (t.id === editingId ? { ...t, ...draft } : t)))
    else setSchedules((tasks) => [...tasks, { ...draft, id: uid('st'), enabled: true, projectId: id, runs: [] }])
    toast(editingId ? 'Scheduled task saved' : 'Scheduled task created', { description: draft.name })
    setTask(null)
  }

  // A run in the demo: running for a moment, then a result. Opening the
  // result starts a chat in the project with the task's prompt.
  function runNow(taskId: string) {
    const t = schedules.find((s) => s.id === taskId)
    if (!t) return
    const runId = uid('run')
    setSchedules((tasks) => tasks.map((s) => (s.id === taskId
      ? { ...s, runs: [...s.runs, { id: runId, startedAt: now(), status: 'running' as const }] }
      : s)))
    window.setTimeout(() => {
      actions.patchProjectWith(id, (p) => ({
        schedules: (p.schedules ?? []).map((s) => (s.id === taskId
          ? {
              ...s,
              runs: s.runs.map((r) => (r.id === runId
                ? { ...r, status: 'succeeded' as const, finishedAt: now(), summary: SAMPLE_RUN_SUMMARIES[taskId] ?? 'Finished. The result is ready to open.' }
                : r)),
            }
          : s)),
      }))
      toast(`${t.name} finished`, {
        description: 'Its result is ready.',
        action: { label: 'Open', onClick: () => startChat(t.prompt) },
      })
    }, 2200)
  }

  const runsTask = schedules.find((s) => s.id === runsOf) ?? null
  const editTask = task?.id ? schedules.find((s) => s.id === task.id) : undefined

  const tabs: ProjectPageTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home01Icon,
      content: (
        <div className="grid min-w-0 gap-7">
          <ProjectOverviewHeader name={project.name} description={project.description} onChange={patch} />
          <ProjectStartChat projectName={project.name || 'this project'} onSend={startChat} />
          <ProjectStats
            items={[
              { id: 'chats', label: 'Chats', value: chats.length, icon: BubbleChatIcon, onClick: () => go('chats') },
              { id: 'files', label: 'Files', value: project.files.length, icon: File01Icon, onClick: () => go('knowledge') },
              { id: 'tools', label: 'Connectors', value: connectorCount, icon: Plug01Icon, onClick: () => go('tools') },
              { id: 'schedules', label: 'Scheduled', value: activeSchedules, icon: Calendar03Icon, onClick: () => go('schedules') },
            ]}
          />
          <ProjectInstructions value={project.instructions} onChange={(instructions) => patch({ instructions })} />
          <ProjectChatList
            title="Recent chats"
            chats={sorted.slice(0, 5)}
            onOpenChat={actions.openChat}
            onNewChat={() => actions.newChat(id)}
            now={time}
          />
          {sorted.length > 5 && (
            <Button variant="ghost" size="sm" className="-mt-5 w-fit" onClick={() => go('chats')}>
              All {sorted.length} chats
            </Button>
          )}
        </div>
      ),
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: BubbleChatIcon,
      count: chats.length,
      content: <ProjectChatList chats={sorted} onOpenChat={actions.openChat} onNewChat={() => actions.newChat(id)} now={time} />,
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: File01Icon,
      count: project.files.length + (project.texts?.length ?? 0) + (project.links?.length ?? 0) + linkedIds.length || undefined,
      content: (
        <ProjectKnowledge
          files={project.files.map((f) => ({ ...f, tokens: estimateFileTokens(f.size, f.kind), included: !excluded.includes(f.id) }))}
          texts={project.texts ?? []}
          links={project.links ?? []}
          bases={linkedBases}
          availableBases={baseSummaries.filter((b) => !linkedIds.includes(b.id))}
          limit={CONTEXT_LIMIT}
          hint="Files, text and pages the assistant draws on in every chat in this project. They stay in this browser only."
          onAddFiles={(files) => actions.addProjectFiles(id, files.map(toFileRef))}
          onRemoveFile={(fileId) => actions.removeProjectFile(id, fileId)}
          onToggleFile={(fileId, included) => patch({
            excludedFiles: included ? excluded.filter((x) => x !== fileId) : [...excluded, fileId],
          })}
          onAddText={({ title, text }) => patch({ texts: [...(project.texts ?? []), { id: uid('t'), title, text }] })}
          onRemoveText={(tid) => patch({ texts: (project.texts ?? []).filter((t) => t.id !== tid) })}
          onAddLink={addLink}
          onRemoveLink={(lid) => patch({ links: (project.links ?? []).filter((l) => l.id !== lid) })}
          onLinkBase={(ids) => {
            patch({ knowledgeBases: [...linkedIds, ...ids.filter((x) => !linkedIds.includes(x))] })
            toast(`Linked ${plural(ids.length, 'knowledge base')}`, { description: 'The assistant searches it when a question needs it.' })
          }}
          onUnlinkBase={(bid) => patch({ knowledgeBases: linkedIds.filter((x) => x !== bid) })}
          onOpenBase={(bid) => actions.openKnowledge(bid)}
        />
      ),
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: Wrench01Icon,
      content: (
        <div className="grid min-w-0 gap-8">
          <ProjectConnectors
            connectors={connectors}
            enabled={enabledConnectors}
            onEnabledChange={(cid, on) => patch({ connectors: { ...enabledConnectors, [cid]: on } })}
            onManage={() => actions.openSettings('connectors')}
            onOpenSettings={() => actions.openSettings('connectors')}
          />
          <ProjectSkills
            skills={skills}
            enabled={enabledSkills}
            onEnabledChange={(sid, on) => patch({ skills: { ...enabledSkills, [sid]: on } })}
            onOpenSettings={() => actions.openSettings('skills')}
          />
          <ProjectMemory
            enabled={project.memoryOn ?? true}
            onEnabledChange={(memoryOn) => patch({ memoryOn })}
            memories={project.memories ?? []}
            onEdit={(mid, text) => patch({ memories: (project.memories ?? []).map((m) => (m.id === mid ? { ...m, text, updatedAt: now() } : m)) })}
            onDelete={(mid) => {
              const before = project.memories ?? []
              patch({ memories: before.filter((m) => m.id !== mid) })
              toast('Memory deleted', { action: { label: 'Undo', onClick: () => patch({ memories: before }) } })
            }}
            onClearAll={() => {
              const before = project.memories ?? []
              patch({ memories: [] })
              toast('Project memory cleared', { action: { label: 'Undo', onClick: () => patch({ memories: before }) } })
            }}
            now={time}
          />
        </div>
      ),
    },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: Calendar03Icon,
      count: schedules.length,
      content: (
        <ScheduledTaskList
          tasks={schedules}
          now={time}
          onCreate={() => setTask({ id: null })}
          onToggle={(tid, on) => {
            setSchedules((tasks) => tasks.map((t) => (t.id === tid ? { ...t, enabled: on } : t)))
            toast(on ? 'Scheduled task resumed' : 'Scheduled task paused')
          }}
          onRunNow={runNow}
          onEdit={(tid) => setTask({ id: tid })}
          onOpenRuns={setRunsOf}
          onDelete={(tid) => {
            const before = schedules
            setSchedules((tasks) => tasks.filter((t) => t.id !== tid))
            toast('Scheduled task deleted', { action: { label: 'Undo', onClick: () => patch({ schedules: before }) } })
          }}
          empty="Have the assistant run a prompt on its own, every day or week. Each run's result arrives as a new chat here."
        />
      ),
    },
    {
      id: 'sharing',
      label: 'Sharing',
      icon: UserGroupIcon,
      count: others.length || undefined,
      content: (
        <ProjectSharing
          members={share.members}
          roles={PROJECT_ROLES}
          access={share.access}
          accessRole={share.accessRole}
          organisation={ORGANISATION}
          onManage={() => setSharing(true)}
          chatVisibility={share.chats}
          onChatVisibilityChange={(chats) => setShare({ chats })}
          memberPermission={share.membersCan}
          onMemberPermissionChange={(membersCan) => setShare({ membersCan })}
        />
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings01Icon,
      content: (
        <div className="grid min-w-0 gap-6">
          <SettingsGroup title="Project details">
            <SettingsRow label="Name, icon and description" hint={project.name || 'Untitled project'}>
              <div className="flex items-center gap-2">
                <IconColourSwatch icons={PROJECT_ICONS} colours={PROJECT_COLOURS} icon={project.icon ?? 'folder'} colour={colourId(project.colour)} />
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit details</Button>
              </div>
            </SettingsRow>
          </SettingsGroup>
          <SettingsGroup title="Manage">
            <SettingsRow label="Duplicate" hint="A copy with the same instructions, files, tools and schedules, but no chats.">
              <Button variant="outline" size="sm" onClick={() => actions.duplicateProject(id)}>Duplicate</Button>
            </SettingsRow>
            <SettingsRow
              label={project.archived ? 'Restore' : 'Archive'}
              hint={project.archived
                ? 'Put the project back in your sidebar.'
                : 'Hide it from your sidebar. Its chats and schedules are kept, and scheduled tasks stop running.'}
            >
              <Button variant="outline" size="sm" onClick={() => archive(!project.archived)}>
                {project.archived ? 'Restore' : 'Archive'}
              </Button>
            </SettingsRow>
            <SettingsRow label="Delete project" hint={`Its instructions, files and schedules are removed. Its ${plural(chats.length, 'chat')} move to your history.`}>
              <Button variant="destructive" size="sm" onClick={() => setDeleting(true)}>Delete</Button>
            </SettingsRow>
          </SettingsGroup>
        </div>
      ),
    },
  ]

  function archive(archived: boolean) {
    patch({ archived })
    toast(archived ? `Archived “${project.name}”` : `Restored “${project.name}”`, archived
      ? { description: 'It is hidden from your sidebar.', action: { label: 'Undo', onClick: () => patch({ archived: false }) } }
      : undefined)
  }

  function invite(emails: { email: string; personId?: string; name?: string }[], role: string) {
    const added: ShareMember[] = emails.map((e) => {
      const person = PEOPLE.find((p) => p.id === e.personId || p.email === e.email)
      return person
        ? { id: person.id, name: person.name, email: person.email, role, status: 'invited' }
        : { id: uid('inv'), name: e.name ?? '', email: e.email, role, status: 'invited' }
    })
    setShare({ members: [...share.members, ...added.filter((a) => !share.members.some((m) => m.email === a.email))] })
    toast(`Invited ${plural(added.length, 'person', 'people')}`, { description: 'Demo only. No email is sent.' })
  }

  return (
    <>
      <ProjectPage
        project={project}
        chats={sorted}
        onChange={patch}
        start={start}
        icon={projectIcon(project.icon)}
        tabs={tabs}
        tab={tab && (PROJECT_TABS as readonly string[]).includes(tab) ? tab : 'overview'}
        onTabChange={go}
        starred={project.starred}
        onStarChange={(starred) => patch({ starred })}
        onShare={() => setSharing(true)}
        sharedLabel={shareSummaryLabel(share.members, share.access, ORGANISATION)}
        onNewChat={() => actions.newChat(id)}
        onOpenChat={actions.openChat}
        onEditDetails={() => setEditing(true)}
        onDuplicate={() => actions.duplicateProject(id)}
        archived={project.archived}
        onArchive={archive}
        onDelete={() => setDeleting(true)}
      />

      <ShareDialog
        open={sharing}
        onOpenChange={setSharing}
        title={`Share “${project.name || 'Untitled project'}”`}
        description="People you add can open the project and its chats, as their role allows."
        members={share.members}
        people={PEOPLE}
        roles={PROJECT_ROLES}
        defaultRole="chat"
        onInvite={invite}
        onRoleChange={(mid, role) => setShare({ members: share.members.map((m) => (m.id === mid ? { ...m, role } : m)) })}
        onRemove={(mid) => setShare({ members: share.members.filter((m) => m.id !== mid) })}
        onResend={() => toast('Invite sent again', { description: 'Demo only.' })}
        access={share.access}
        onAccessChange={(access) => setShare({ access })}
        accessRole={share.accessRole}
        onAccessRoleChange={(accessRole) => setShare({ accessRole })}
        organisation={ORGANISATION}
        linkUrl={`${window.location.origin}${window.location.pathname}#/templates/ai-chat/project/${id}`}
      />

      <NewProjectDialog
        open={editing}
        onOpenChange={setEditing}
        mode="edit"
        icons={PROJECT_ICONS}
        colours={PROJECT_COLOURS}
        initial={{
          name: project.name, description: project.description, instructions: project.instructions,
          icon: project.icon ?? 'folder', colour: colourId(project.colour),
        }}
        onCreate={(draft) => {
          patch({
            name: draft.name, description: draft.description, instructions: draft.instructions, icon: draft.icon,
            colour: PROJECT_COLOURS.find((c) => c.id === draft.colour)?.value ?? project.colour,
          })
          setEditing(false)
          toast('Project details saved')
        }}
      />

      <ScheduledTaskDialog
        open={!!task}
        onOpenChange={(open) => !open && setTask(null)}
        initial={editTask}
        editing={!!editTask}
        models={SCHEDULE_MODELS.filter((m) => policy.models.includes(m.value as ModelId))}
        now={time}
        onSave={saveTask}
        key={task?.id ?? 'new'}
      />

      <TaskRunsSheet
        open={!!runsTask}
        onOpenChange={(open) => !open && setRunsOf(null)}
        name={runsTask?.name ?? ''}
        runs={runsTask?.runs ?? []}
        now={time}
        onRunNow={runsTask ? () => runNow(runsTask.id) : undefined}
        onOpenChat={() => runsTask && startChat(runsTask.prompt)}
      />

      <DeleteConfirm
        open={deleting}
        onOpenChange={setDeleting}
        icon={null}
        title={`Delete “${project.name || 'Untitled project'}”?`}
        description={`Its instructions, files and schedules are removed. Its ${plural(chats.length, 'chat')} move to your history.`}
        onConfirm={() => actions.deleteProject(id)}
      />
    </>
  )
}
