import type { Memory } from '@/blocks/ai/memory/memory-manager'
import { at } from '../data'

// The AI chat app's made-up memories: what the assistant has picked up
// across chats, each with the chat it came from. Kept in the browser. Dates
// count back from the workspace's demo clock (30 Sep 2026), so "Today" and
// "Yesterday" line up with its chats.

export const MEMORIES_KEY = 'linear-kit:ai-memories:v1'

export const SAMPLE_MEMORIES: Memory[] = [
  { id: 'mem-1', text: 'Works in logistics operations at a mid-sized distributor.', source: 'Weekly operations review', createdAt: at(28, 10, 14) },
  { id: 'mem-2', text: 'Prefers British spelling in everything written.', source: 'Rewrite the supplier onboarding guide', createdAt: at(27, 15, 40) },
  { id: 'mem-3', text: 'Likes answers short, with the conclusion first.', source: 'Summarise the Q3 board pack', createdAt: at(25, 9, 5) },
  { id: 'mem-4', text: 'Manages a team of six planners across two warehouses.', source: 'Plan the October rota', createdAt: at(23, 11, 22) },
  { id: 'mem-5', text: 'Uses spreadsheets for most reporting; comfortable with XLOOKUP and pivot tables.', source: 'Fix the stock ageing formula', createdAt: at(20, 14, 3) },
  { id: 'mem-6', text: 'Reports go to the operations director every Monday morning.', source: 'Draft the weekly KPI email', createdAt: at(17, 8, 47) },
  { id: 'mem-7', text: 'Wants dates written as 5 Oct 2026, never 10/5/26.', source: 'Shipment delay update', createdAt: at(14, 16, 31), updatedAt: at(13, 9, 10) },
  { id: 'mem-8', text: 'Is learning SQL and wants queries explained line by line.', source: 'Query late orders by carrier', createdAt: at(11, 13, 55) },
  { id: 'mem-9', text: 'Currently running a project to cut dock waiting times.', source: 'Dock schedule ideas', createdAt: at(8, 10, 2) },
  { id: 'mem-10', text: 'Main carriers are two regional hauliers and one parcel network.', source: 'Compare carrier on-time rates', createdAt: at(5, 15, 18) },
  { id: 'mem-11', text: 'Prefers tables over bullet lists when comparing options.', createdAt: at(1, 17, 44) },
  { id: 'mem-12', text: 'Is preparing a budget proposal for a new warehouse management system.', source: 'Outline the WMS business case', createdAt: at(0, 11, 26) },
]
