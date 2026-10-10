import {
  CustomerSupportIcon, DeliveryTruck01Icon, Invoice01Icon, Rocket01Icon, Sun03Icon, Target02Icon, UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import type { HistoryChat, HistoryProject } from '@/blocks/ai/chat/chat-history'
import type { Memory } from '@/blocks/ai/memory/memory-manager'
import { at } from '../data'

// Made-up Tools tab settings for the AI chat app's projects (ids from
// seed.ts): which connectors and skills each project may use (ids from
// settings/connectors-data.ts and settings/skills-data.ts), project memory
// on or off with what it has learned, and two projects colleagues shared.
// Dates count back from the workspace's demo clock (30 Sep 2026).

export type ProjectTools = {
  connectors: Record<string, boolean>
  skills: Record<string, boolean>
  memoryOn: boolean
  memories: Memory[]
}

export const PROJECT_TOOLS: Record<string, ProjectTools> = {
  'p-q4': {
    connectors: { 'cloud-drive': true, mail: false, calendar: true, 'code-repository': false },
    skills: { 'sk-sheets': true, 'sk-slides': true, 'sk-analysis': true, 'sk-minutes': true },
    memoryOn: true,
    memories: [
      { id: 'pm-q4-1', text: 'Q4 revenue target is 12% above Q3, split evenly across the three months.', source: 'Jobs by status', createdAt: at(4, 14, 32) },
      { id: 'pm-q4-2', text: 'Two planner roles open in November; interviews run in the last week of October.', source: 'Hiring plan for Q4', createdAt: at(9, 10, 5) },
      { id: 'pm-q4-3', text: 'Capacity is counted in pallet moves per shift, not in hours.', source: 'Capacity by depot', createdAt: at(12, 15, 48) },
      { id: 'pm-q4-4', text: 'The plan goes to the leadership team on 14 Oct.', createdAt: at(15, 9, 20) },
      { id: 'pm-q4-5', text: 'December numbers leave out the week between Christmas and New Year.', source: 'December forecast', createdAt: at(21, 11, 12), updatedAt: at(19, 16, 2) },
    ],
  },
  'p-support': {
    connectors: { mail: true, 'cloud-drive': true, calendar: false, 'code-repository': false },
    skills: { 'sk-email': true, 'sk-brand': true, 'sk-invoices': true },
    memoryOn: true,
    memories: [
      { id: 'pm-sup-1', text: 'Refunds over $500 need a team lead to approve before they are offered.', source: 'Delay email to Bayview Foods', createdAt: at(0, 15, 22) },
      { id: 'pm-sup-2', text: 'Replies open with the customer’s first name, never “Dear customer”.', source: 'Damaged pallet reply', createdAt: at(6, 11, 40) },
      { id: 'pm-sup-3', text: 'Delays of more than two days get a proactive email before the customer asks.', createdAt: at(10, 9, 15) },
      { id: 'pm-sup-4', text: 'Credit notes are raised in the finance system, not promised in the reply.', source: 'Refund for a short delivery', createdAt: at(13, 14, 3) },
      { id: 'pm-sup-5', text: 'The support inbox is covered until 6 pm on weekdays.', source: 'Out-of-hours reply', createdAt: at(24, 17, 30) },
    ],
  },
  'p-ops': {
    connectors: { 'cloud-drive': true, mail: false, calendar: true, 'code-repository': false },
    skills: { 'sk-sheets': true, 'sk-minutes': true, 'sk-analysis': true },
    memoryOn: false,
    memories: [
      { id: 'pm-ops-1', text: 'Jobs are named by their DO number, such as DO-2041.', source: 'Assign the export job', createdAt: at(3, 9, 52) },
      { id: 'pm-ops-2', text: 'The north depot opens at 6 am; the south depot at 7 am.', source: 'Depot opening hours', createdAt: at(7, 8, 10) },
      { id: 'pm-ops-3', text: 'Drivers do not work more than five days in a row.', source: 'Driver rota check', createdAt: at(11, 13, 26) },
      { id: 'pm-ops-4', text: 'Cold chain loads always go on the two refrigerated trucks.', createdAt: at(16, 10, 44) },
      { id: 'pm-ops-5', text: 'The safety walk is every Monday before the first shift.', source: 'Weekly safety checklist', createdAt: at(26, 7, 55) },
    ],
  },
}

// A new project's Tools tab: nothing on yet, project memory on.
export const EMPTY_PROJECT_TOOLS: ProjectTools = { connectors: {}, skills: {}, memoryOn: true, memories: [] }

// Projects colleagues have shared with the sample user.
export const SHARED_WITH_ME: HistoryProject[] = [
  { id: 'p-shared-launch', name: 'Spring product launch', colour: 'var(--chart-4)', icon: Rocket01Icon, owner: 'Priya Shah', unread: 2 },
  { id: 'p-shared-close', name: 'Month-end close', colour: 'var(--chart-5)', icon: Invoice01Icon, owner: 'Sam Lee' },
]

// The chat history demo: starred, shared, archived (not listed) and unread
// projects, with a few chats in them and in the plain history.
export const HISTORY_DEMO_PROJECTS: HistoryProject[] = [
  { id: 'p-q4', name: 'Q4 planning', colour: 'var(--chart-1)', icon: Target02Icon, starred: true, unread: 3 },
  { id: 'p-support', name: 'Customer support', colour: 'var(--chart-2)', icon: CustomerSupportIcon, shared: true },
  { id: 'p-ops', name: 'Operations', colour: 'var(--chart-3)', icon: DeliveryTruck01Icon },
  { id: 'p-hiring', name: 'Hiring', colour: 'var(--chart-4)', icon: UserAdd01Icon, starred: true },
  { id: 'p-summer', name: 'Summer campaign', colour: 'var(--chart-5)', icon: Sun03Icon, archived: true },
]

export const HISTORY_DEMO_CHATS: HistoryChat[] = [
  { id: 'h1', title: 'Weekly Q4 summary (scheduled)', projectId: 'p-q4', updatedAt: at(0, 8, 0), unread: true },
  { id: 'h2', title: 'Capacity by depot', projectId: 'p-q4', updatedAt: at(2, 14, 20) },
  { id: 'h3', title: 'Delay email to Bayview Foods', projectId: 'p-support', updatedAt: at(0, 15, 10) },
  { id: 'h4', title: 'Assign the export job', projectId: 'p-ops', updatedAt: at(3, 9, 40) },
  { id: 'h5', title: 'Planner job description', projectId: 'p-hiring', updatedAt: at(5, 11, 0) },
  { id: 'h6', title: 'Launch checklist review', projectId: 'p-shared-launch', updatedAt: at(1, 16, 5), unread: true },
  { id: 'h7', title: 'Accruals for September', projectId: 'p-shared-close', updatedAt: at(2, 10, 30) },
  { id: 'h8', title: 'Summer campaign results', projectId: 'p-summer', updatedAt: at(40, 9, 0) },
  { id: 'h9', title: 'Urgent jobs this week', updatedAt: at(0, 17, 52), pinned: true },
  { id: 'h10', title: 'Daily jobs digest (scheduled)', updatedAt: at(0, 7, 0), unread: true },
  { id: 'h11', title: 'Cold chain rules for pharma', updatedAt: at(1, 16, 30) },
  { id: 'h12', title: 'CSV export script', updatedAt: at(5, 10, 15) },
]
