import type { Project, ProjectSharing } from '../types'
import { ONLY_YOU, SAMPLE_MEMBERS } from './people'
import { scheduledTasksFor } from './schedules-data'
import { EMPTY_PROJECT_TOOLS, PROJECT_TOOLS } from './tools-data'

// What the demo projects start with beyond their name and files: an icon, a
// star, sharing, tools, memory and scheduled tasks. A project saved before
// these existed gets them on load; a new project gets the empty ones.

const SEED_LOOK: Record<string, Pick<Project, 'icon' | 'starred'>> = {
  'p-q4': { icon: 'target', starred: true },
  'p-support': { icon: 'support' },
  'p-ops': { icon: 'truck' },
}

export const PRIVATE_SHARING: ProjectSharing = {
  members: ONLY_YOU, access: 'restricted', accessRole: 'chat', chats: 'shared', membersCan: 'edit',
}

const SEED_SHARING: Record<string, ProjectSharing> = {
  'p-support': { ...PRIVATE_SHARING, members: SAMPLE_MEMBERS },
}

export function withProjectDefaults(project: Project): Project {
  const tools = PROJECT_TOOLS[project.id] ?? EMPTY_PROJECT_TOOLS
  return {
    ...SEED_LOOK[project.id],
    connectors: { ...tools.connectors },
    skills: { ...tools.skills },
    memoryOn: tools.memoryOn,
    memories: tools.memories,
    schedules: scheduledTasksFor(project.id),
    sharing: SEED_SHARING[project.id] ?? PRIVATE_SHARING,
    ...project,
  }
}
