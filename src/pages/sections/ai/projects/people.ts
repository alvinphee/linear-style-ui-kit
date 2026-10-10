import type { ShareMember, SharePerson, ShareRole } from '@/blocks/share-dialog'
import { USER } from '../data'

// Made-up colleagues at Acme to share projects with, and the roles a project
// member can have. The signed-in user is Alex Morgan (USER).

export const ORGANISATION = 'Acme'

export const PROJECT_ROLES: ShareRole[] = [
  { id: 'view', label: 'Can view', hint: 'Reads the instructions, knowledge and shared chats' },
  { id: 'chat', label: 'Can chat', hint: 'Starts chats that use the project’s instructions and knowledge' },
  { id: 'edit', label: 'Can edit', hint: 'Also changes the instructions, knowledge and who has access' },
]

export const YOU: SharePerson = { id: 'u-alex', name: USER.name, email: USER.email, detail: 'Operations lead' }

export const PEOPLE: SharePerson[] = [
  { id: 'u-priya', name: 'Priya Shah', email: 'priya.shah@example.com', detail: 'Finance' },
  { id: 'u-daniel', name: 'Daniel Okafor', email: 'daniel.okafor@example.com', detail: 'Dispatch' },
  { id: 'u-mei', name: 'Mei Lin Tan', email: 'meilin.tan@example.com', detail: 'Customer success' },
  { id: 'u-jonas', name: 'Jonas Weber', email: 'jonas.weber@example.com', detail: 'Engineering' },
  { id: 'u-sofia', name: 'Sofia Russo', email: 'sofia.russo@example.com', detail: 'Design' },
  { id: 'u-omar', name: 'Omar Haddad', email: 'omar.haddad@example.com', detail: 'Sales' },
  { id: 'u-grace', name: 'Grace Kim', email: 'grace.kim@example.com', detail: 'People' },
  { id: 'u-lucas', name: 'Lucas Martin', email: 'lucas.martin@example.com', detail: 'Field service' },
  { id: 'u-aisha', name: 'Aisha Bello', email: 'aisha.bello@example.com', detail: 'Legal' },
  { id: 'u-tom', name: 'Tom Becker', email: 'tom.becker@example.com', detail: 'Purchasing' },
  { id: 'u-nina', name: 'Nina Petrova', email: 'nina.petrova@example.com', detail: 'Marketing' },
  { id: 'u-ravi', name: 'Ravi Kumar', email: 'ravi.kumar@example.com', detail: 'Data' },
]

const member = (p: SharePerson, role: string, change: Partial<ShareMember> = {}): ShareMember => ({
  id: p.id, name: p.name, email: p.email, role, status: 'active', ...change,
})

const by = (id: string) => PEOPLE.find((p) => p.id === id)!

// A project shared with a few people: you own it, three have joined, one has
// a pending invite (to an address outside the directory).
export const SAMPLE_MEMBERS: ShareMember[] = [
  member(YOU, 'edit', { isOwner: true, isYou: true }),
  member(by('u-priya'), 'edit'),
  member(by('u-daniel'), 'chat'),
  member(by('u-mei'), 'view'),
  { id: 'inv-sam', name: '', email: 'sam.lee@example.com', role: 'chat', status: 'invited' },
]

// Only you.
export const ONLY_YOU: ShareMember[] = [member(YOU, 'edit', { isOwner: true, isYou: true })]

// Shared with most of the team, for the +N on the avatar stack.
export const MANY_MEMBERS: ShareMember[] = [
  ...ONLY_YOU,
  ...PEOPLE.slice(0, 8).map((p, i) => member(p, i % 3 === 0 ? 'edit' : 'chat')),
]
