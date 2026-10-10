import { useEffect, useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Folder01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { ProjectPage as ProjectPageBlock, type ProjectChat } from '@/blocks/ai/projects/project-page'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { usePath } from '@/lib/router'
import { go, parseRoute } from '../route'
import { useErp } from '../store'
import { chatType } from './AssistantPage'
import { useAssistant } from './store'

// Home › Projects › <project> (ERP + AI edition): a project's own page,
// …/home/project/<id>, from the kit's ProjectPage block. Its name, description,
// custom instructions, project knowledge (files, kept for the visit) and
// chats. The sidebar's New project and Edit project both land here; the
// breadcrumb ends with the project's name.

let fileSeq = 0

export function ErpProjectPage() {
  const path = usePath()
  const route = parseRoute(path)
  const { setPageTitle } = useErp()
  const {
    projects, chats, updateProject, addProjectFiles, removeProjectFile, deleteProject, newChat, openChat,
  } = useAssistant()
  const project = route.screen === 'app' ? projects.find((p) => p.id === route.rest) : undefined

  useEffect(() => {
    setPageTitle(project ? project.name || 'Untitled project' : null)
    return () => setPageTitle(null)
  }, [project, setPageTitle])

  const rows = useMemo((): ProjectChat[] => (project ? chats
    .filter((c) => c.projectId === project.id)
    .map((c) => {
      const type = chatType(c.topic)
      return { id: c.id, title: c.title, updatedAt: c.updatedAt, icon: type.icon, iconColour: type.colour }
    }) : []), [chats, project])

  if (!project) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon"><HugeiconsIcon icon={Folder01Icon} strokeWidth={2} /></EmptyMedia>
          <EmptyTitle>No such project</EmptyTitle>
          <EmptyDescription>Pick a project in the sidebar, or make one with the plus beside Projects.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={() => go('home', 'assistant')}>Go to the Assistant</Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <ProjectPageBlock
      className="h-full"
      project={project}
      chats={rows}
      filesHint="Files the assistant draws on in every chat in this project. They are kept for this visit."
      onChange={(patch) => updateProject(project.id, patch)}
      onAddFiles={(files) => {
        addProjectFiles(project.id, files.map((f) => ({ id: `pf${++fileSeq}-${Date.now()}`, name: f.name, size: f.size })))
        toast(files.length === 1 ? `Added ${files[0].name}` : `Added ${files.length} files`)
      }}
      onRemoveFile={(fileId) => removeProjectFile(project.id, fileId)}
      onNewChat={() => {
        newChat(project.id)
        go('home', 'assistant')
      }}
      onOpenChat={(id) => {
        openChat(id)
        go('home', 'assistant')
      }}
      onDelete={() => {
        deleteProject(project.id)
        toast('Project deleted', { description: 'Its chats are back in your history.' })
        go('home', 'assistant')
      }}
    />
  )
}
