import { useState, type ReactNode } from 'react'
import {
  BubbleChatIcon, Book02Icon, Calendar03Icon, DashboardSquare02Icon, Plug01Icon, Settings02Icon, UserMultipleIcon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { NewProjectDialog, type ProjectDraft } from '@/blocks/ai/projects/new-project-dialog'
import {
  ProjectChatList, ProjectInstructions, ProjectKnowledgeList, ProjectOverviewHeader, ProjectPage, ProjectStartChat,
  ProjectStats, type ProjectChat, type ProjectFile, type ProjectPageProps, type ProjectPageTab,
} from '@/blocks/ai/projects/project-page'
import { IconColourPicker, IconColourSwatch } from '@/components/icon-colour-picker'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { Panel, Row } from '../shared'
import { at, now } from '../ai/data'
import { PROJECT_COLOURS, PROJECT_ICONS, PROJECT_TEMPLATES, projectColour, projectIcon } from '../ai/projects/templates'

// The project page as a workspace, on local state (nothing here touches the
// AI chat app's saved projects): the tabbed page with an Overview made from
// the page's exported parts, the header's states (starred, shared,
// archived), the icon and colour picker, and the new project dialog in both
// modes. Tools, Schedules, Sharing and Settings hold placeholders here; the
// app fills them.

const demo = (what: string) => toast('Demo only', { description: `${what} is not saved here.` })

type DemoProject = {
  id: string
  name: string
  description: string
  instructions: string
  icon: string
  colour: string
  files: ProjectFile[]
}

const START: DemoProject = {
  id: 'p-launch',
  name: 'Autumn product launch',
  description: 'Messaging, pricing page and the launch email for the October release.',
  instructions: PROJECT_TEMPLATES.find((t) => t.id === 'writing')!.instructions,
  icon: 'rocket',
  colour: 'accent',
  files: [
    { id: 'f1', name: 'Launch brief.pdf', size: 482_000 },
    { id: 'f2', name: 'Pricing tiers.xlsx', size: 61_400 },
    { id: 'f3', name: 'Brand voice.md', size: 7_200 },
  ],
}

const CHATS: ProjectChat[] = [
  { id: 'c1', title: 'Launch email, second draft', updatedAt: at(0, 17, 20) },
  { id: 'c2', title: 'Pricing page headline options', updatedAt: at(0, 11, 5) },
  { id: 'c3', title: 'Competitor messaging summary', updatedAt: at(1, 15, 40) },
  { id: 'c4', title: 'FAQ for the support team', updatedAt: at(4, 9, 30) },
]

function Placeholder({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Empty className="rounded-lg border px-4 py-8">
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{children}</EmptyDescription>
    </Empty>
  )
}

export function ShellPanels() {
  const [project, setProject] = useState<DemoProject>(START)
  const [tab, setTab] = useState('overview')
  const [starred, setStarred] = useState(true)
  const [archived, setArchived] = useState(false)
  const [dialog, setDialog] = useState<{ open: boolean; mode: 'create' | 'edit' }>({ open: false, mode: 'create' })
  const [look, setLook] = useState({ icon: 'chart', colour: 'teal' })

  const patch = (change: Partial<DemoProject>) => setProject((p) => ({ ...p, ...change }))
  const pageProject = { ...project, colour: projectColour(project.colour) }
  const counts = { chats: CHATS.length, files: project.files.length, connectors: 2, schedules: 1 }

  const tabs: ProjectPageTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: DashboardSquare02Icon,
      content: (
        <div className="grid min-w-0 gap-6">
          <ProjectOverviewHeader name={project.name} description={project.description} onChange={patch} />
          <ProjectStartChat projectName={project.name} onSend={(text) => toast('Demo only', { description: `Would start a chat: “${text}”` })} />
          <ProjectStats
            items={[
              { id: 'chats', label: 'Chats', value: counts.chats, icon: BubbleChatIcon, onClick: () => setTab('chats') },
              { id: 'files', label: 'Files', value: counts.files, icon: Book02Icon, onClick: () => setTab('knowledge') },
              { id: 'connectors', label: 'Connectors', value: counts.connectors, icon: Plug01Icon, onClick: () => setTab('tools') },
              { id: 'schedules', label: 'Schedules', value: counts.schedules, icon: Calendar03Icon, onClick: () => setTab('schedules') },
            ]}
          />
          <ProjectInstructions value={project.instructions} onChange={(instructions) => patch({ instructions })} />
          <ProjectChatList chats={CHATS.slice(0, 3)} title="Recent chats" now={now} onOpenChat={() => demo('Opening a chat')} />
        </div>
      ),
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: BubbleChatIcon,
      count: counts.chats,
      content: <ProjectChatList chats={CHATS} now={now} onOpenChat={() => demo('Opening a chat')} onNewChat={() => demo('A new chat')} />,
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: Book02Icon,
      count: counts.files,
      content: (
        <ProjectKnowledgeList
          files={project.files}
          hint="Files the assistant draws on in every chat in this project. Here they last until you leave the page."
          onAddFiles={(files) => patch({ files: [...project.files, ...files.map((f, i) => ({ id: `f${Date.now()}-${i}`, name: f.name, size: f.size }))] })}
          onRemoveFile={(id) => patch({ files: project.files.filter((f) => f.id !== id) })}
        />
      ),
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: Wrench01Icon,
      count: counts.connectors,
      content: <Placeholder title="Tools">The connectors and skills this project may use. The app puts its project tools here.</Placeholder>,
    },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: Calendar03Icon,
      count: counts.schedules,
      content: <Placeholder title="Schedules">Scheduled tasks that run a prompt in this project. The app puts them here.</Placeholder>,
    },
    {
      id: 'sharing',
      label: 'Sharing',
      icon: UserMultipleIcon,
      content: <Placeholder title="Sharing">Who can see and edit the project. The app puts its share settings here.</Placeholder>,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings02Icon,
      content: <Placeholder title="Settings">Model, memory and other project settings. The app puts them here.</Placeholder>,
    },
  ]

  const header = (extra: Partial<ProjectPageProps>) => (
    <div className="bg-background flex h-44 min-w-0 flex-col overflow-hidden rounded-lg border">
      <ProjectPage
        project={pageProject}
        icon={projectIcon(project.icon)}
        onChange={patch}
        onNewChat={() => demo('A new chat')}
        tabs={[{ id: 'overview', label: 'Overview', content: <p className="text-muted-foreground text-xs">{project.description}</p> }]}
        {...extra}
      />
    </div>
  )

  const create = (draft: ProjectDraft) => {
    setDialog((d) => ({ ...d, open: false }))
    if (dialog.mode === 'edit') {
      patch({ name: draft.name, description: draft.description, instructions: draft.instructions, icon: draft.icon, colour: draft.colour })
      toast('Project updated')
    } else {
      toast('Demo only', { description: `“${draft.name}” would be created from the ${PROJECT_TEMPLATES.find((t) => t.id === draft.templateId)?.name ?? 'Blank'} template.` })
    }
  }

  return (
    <>
      <Panel title="Project workspace" note="Tabs, star, share, archive, menu" wide>
        <div className="bg-background flex h-[36rem] min-w-0 flex-col overflow-hidden rounded-lg border">
          <ProjectPage
            project={pageProject}
            chats={CHATS}
            now={now}
            icon={projectIcon(project.icon)}
            onChange={patch}
            tabs={tabs}
            tab={tab}
            onTabChange={setTab}
            starred={starred}
            onStarChange={setStarred}
            onShare={() => demo('Sharing')}
            sharedLabel="Shared with 4"
            onNewChat={() => demo('A new chat')}
            onEditDetails={() => setDialog({ open: true, mode: 'edit' })}
            onDuplicate={() => demo('Duplicating')}
            archived={archived}
            onArchive={setArchived}
            onDelete={() => demo('Deleting')}
          />
        </div>
      </Panel>

      <Panel title="Header states" note="Plain, starred and shared, archived">
        <div className="grid min-w-0 gap-2">
          {header({ onDelete: () => demo('Deleting') })}
          {header({ starred: true, onStarChange: () => demo('Starring'), onShare: () => demo('Sharing'), sharedLabel: 'Shared with 4' })}
          {header({ archived: true, onArchive: () => demo('Restoring'), onDelete: () => demo('Deleting') })}
        </div>
      </Panel>

      <Panel title="Icon and colour picker" note="Popover, radio groups, search">
        <div className="grid min-w-0 gap-4">
          <p className="text-muted-foreground text-xs">
            Arrow keys move through the colours and icons and choose as they go; up and down move a row in the grid.
          </p>
          <Row>
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <IconColourPicker
                key={size}
                size={size}
                icons={PROJECT_ICONS}
                colours={PROJECT_COLOURS}
                icon={look.icon}
                colour={look.colour}
                label="Project icon"
                onChange={(change) => setLook((l) => ({ ...l, ...change }))}
              />
            ))}
            <span className="text-muted-foreground text-xs">
              {PROJECT_ICONS.find((i) => i.id === look.icon)?.label}, {PROJECT_COLOURS.find((c) => c.id === look.colour)?.label}
            </span>
          </Row>
          <Row>
            {PROJECT_COLOURS.map((c) => (
              <IconColourSwatch key={c.id} icons={PROJECT_ICONS} colours={PROJECT_COLOURS} icon={look.icon} colour={c.id} />
            ))}
          </Row>
        </div>
      </Panel>

      <Panel title="New project dialog" note="Templates, create and edit">
        <div className="grid min-w-0 gap-3">
          <p className="text-muted-foreground text-xs">
            A template sets the icon, colour and instructions until you change them yourself. Edit mode changes the
            workspace project above.
          </p>
          <Row>
            <Button size="sm" onClick={() => setDialog({ open: true, mode: 'create' })}>New project</Button>
            <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, mode: 'edit' })}>Edit project details</Button>
          </Row>
        </div>
      </Panel>

      <NewProjectDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        mode={dialog.mode}
        templates={PROJECT_TEMPLATES}
        icons={PROJECT_ICONS}
        colours={PROJECT_COLOURS}
        initial={dialog.mode === 'edit' ? project : undefined}
        onCreate={create}
      />
    </>
  )
}
