import type { OrgMember } from '@/blocks/members-table'
import type { Permission, PermissionRole } from '@/blocks/role-permissions'
import { at } from '../data'
import { PEOPLE, YOU } from '../projects/people'
import { ORG } from './org'

// The organisation's people for the admin console: everyone from the
// projects' directory, a few more colleagues, three pending invites (one to
// an address outside example.com) and one suspended account. 21 of the 25
// seats. Then the groups, the roles (Owner, Admin, Member and the custom
// Agent builder), every permission and what each role starts with.

export const MEMBERS_KEY = 'linear-kit:ai-org-members:v1'
export const GROUPS_KEY = 'linear-kit:ai-org-groups:v1'
export const AUTO_JOIN_KEY = 'linear-kit:ai-org-auto-join:v1'
export const ROLES_KEY = 'linear-kit:ai-org-roles:v1'
export const GRANTS_KEY = 'linear-kit:ai-org-grants:v1'

export const INVITE_LINK = `https://app.example.com/join/${ORG.id}-7f3k2q`

export type OrgGroup = { id: string; name: string; description?: string }

export const SAMPLE_GROUPS: OrgGroup[] = [
  { id: 'g-ops', name: 'Operations' },
  { id: 'g-support', name: 'Support' },
  { id: 'g-finance', name: 'Finance' },
  { id: 'g-sales', name: 'Sales' },
]

const person = (id: string) => PEOPLE.find((p) => p.id === id)!

const active = (
  id: string, role: string, groups: string[], lastActive: [number, number], joined: number, sso = true,
): OrgMember => {
  const p = person(id)
  return {
    id: p.id, name: p.name, email: p.email, role, status: 'active', groups, sso,
    lastActiveAt: at(lastActive[0], lastActive[1]), joinedAt: at(joined, 9),
  }
}

export const SAMPLE_MEMBERS: OrgMember[] = [
  {
    id: YOU.id, name: YOU.name, email: YOU.email, role: 'owner', status: 'active', groups: ['g-ops'], sso: true,
    isYou: true, lastActiveAt: at(0, 18, 38), joinedAt: at(420, 9),
  },
  active('u-priya', 'admin', ['g-finance'], [0, 17], 400),
  active('u-daniel', 'member', ['g-ops'], [0, 16], 380),
  active('u-mei', 'member', ['g-support'], [0, 11], 350),
  active('u-jonas', 'agent-builder', ['g-ops'], [0, 15], 340),
  active('u-sofia', 'member', [], [1, 14], 300),
  active('u-omar', 'member', ['g-sales'], [0, 10], 290),
  active('u-grace', 'admin', [], [2, 9], 280),
  active('u-lucas', 'member', ['g-ops', 'g-support'], [3, 8], 250),
  active('u-aisha', 'member', [], [6, 16], 220),
  active('u-tom', 'member', ['g-finance', 'g-ops'], [1, 12], 200),
  active('u-nina', 'member', ['g-sales'], [0, 13], 180),
  active('u-ravi', 'agent-builder', ['g-finance'], [0, 9], 160),
  {
    id: 'u-hana', name: 'Hana Suzuki', email: 'hana.suzuki@example.com', role: 'member', status: 'active',
    groups: ['g-support'], sso: true, lastActiveAt: at(0, 8), joinedAt: at(120, 9),
  },
  {
    id: 'u-carlos', name: 'Carlos Mendes', email: 'carlos.mendes@example.com', role: 'member', status: 'active',
    groups: ['g-sales'], sso: true, lastActiveAt: at(4, 15), joinedAt: at(90, 9),
  },
  {
    id: 'u-zoe', name: 'Zoe Clarke', email: 'zoe.clarke@example.com', role: 'member', status: 'active',
    groups: ['g-support'], lastActiveAt: at(1, 17), joinedAt: at(45, 9),
  },
  {
    id: 'u-ben', name: 'Ben Adeyemi', email: 'ben.adeyemi@example.com', role: 'member', status: 'suspended',
    groups: ['g-sales'], lastActiveAt: at(38, 11), joinedAt: at(260, 9),
  },
  {
    id: 'u-leila', name: 'Leila Ahmadi', email: 'leila.ahmadi@example.com', role: 'member', status: 'active',
    groups: ['g-finance'], sso: true, lastActiveAt: at(2, 10), joinedAt: at(30, 9),
  },
  { id: 'inv-kenji', name: '', email: 'kenji.sato@example.com', role: 'member', status: 'invited', groups: ['g-ops'], joinedAt: at(2, 10) },
  { id: 'inv-ines', name: '', email: 'ines.costa@example.com', role: 'agent-builder', status: 'invited', joinedAt: at(5, 14) },
  { id: 'inv-maria', name: '', email: 'maria.lopez@partner.example.org', role: 'member', status: 'invited', joinedAt: at(1, 16) },
]

export const BUILT_IN_ROLES = ['owner', 'admin', 'member']

// The roles without their member counts, which follow the members.
export type OrgRoleDef = Omit<PermissionRole, 'memberCount'>

export const SAMPLE_ROLES: OrgRoleDef[] = [
  { id: 'owner', name: 'Owner', description: 'Owns the organisation and its billing. Has every permission.', builtIn: true, locked: true },
  { id: 'admin', name: 'Admin', description: 'Manages members, roles, policies and connectors.', builtIn: true },
  { id: 'member', name: 'Member', description: 'Chats, makes projects and uses the tools the organisation allows.', builtIn: true },
  { id: 'agent-builder', name: 'Agent builder', description: 'A member who also builds agents and publishes them to the organisation.' },
]

export const PERMISSIONS: Permission[] = [
  { id: 'chat.start', group: 'Chats', label: 'Start chats' },
  { id: 'chat.web', group: 'Chats', label: 'Use web search', hint: 'Answers can search the web and cite pages' },
  { id: 'chat.research', group: 'Chats', label: 'Use research', hint: 'Long, multi-step research reports' },
  { id: 'projects.create', group: 'Chats', label: 'Create projects' },
  { id: 'agents.create', group: 'Agents', label: 'Create agents' },
  { id: 'agents.publish', group: 'Agents', label: 'Publish agents to the organisation', hint: 'Everyone can find and use them' },
  { id: 'agents.schedule', group: 'Agents', label: 'Run agents on a schedule' },
  { id: 'knowledge.create', group: 'Knowledge', label: 'Create knowledge bases' },
  { id: 'knowledge.upload', group: 'Knowledge', label: 'Add files to project knowledge' },
  { id: 'connectors.connect', group: 'Connectors', label: 'Connect apps', hint: 'Only the connectors the organisation allows' },
  { id: 'connectors.custom', group: 'Connectors', label: 'Add custom MCP servers' },
  { id: 'sharing.projects', group: 'Sharing', label: 'Share projects with people' },
  { id: 'sharing.public', group: 'Sharing', label: 'Share chats publicly', hint: 'A link anyone can open, no sign-in needed' },
  { id: 'admin.invite', group: 'Admin', label: 'Invite members' },
  { id: 'admin.roles', group: 'Admin', label: 'Manage roles' },
  { id: 'admin.sso', group: 'Admin', label: 'Manage SSO', hint: 'Single sign-on and verified domains' },
  { id: 'admin.audit', group: 'Admin', label: 'View the audit log' },
  { id: 'admin.usage', group: 'Admin', label: 'View usage' },
]

const MEMBER_GRANTS = [
  'chat.start', 'chat.web', 'chat.research', 'projects.create', 'agents.create', 'knowledge.upload',
  'connectors.connect', 'sharing.projects',
]

export const DEFAULT_GRANTS: Record<string, string[]> = {
  owner: PERMISSIONS.map((p) => p.id),
  admin: PERMISSIONS.map((p) => p.id).filter((id) => id !== 'admin.sso'),
  member: MEMBER_GRANTS,
  'agent-builder': [...MEMBER_GRANTS, 'agents.publish', 'agents.schedule', 'knowledge.create', 'connectors.custom'],
}

// For the role select and the invite dialog.
export const roleOptions = (roles: OrgRoleDef[]) =>
  roles.map((r) => ({ id: r.id, label: r.name, hint: r.description }))
