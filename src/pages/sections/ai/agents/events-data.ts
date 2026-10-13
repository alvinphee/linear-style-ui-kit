import type { AgentEventOption } from '@/blocks/ai/agents/trigger-editor'

// The events the AI chat app's connectors can start an agent's run on, by the
// connector ids in settings/connectors-data.ts. The filter hints are in each
// app's own search terms; nothing reads them, they only guide the person.

export const AGENT_EVENTS: AgentEventOption[] = [
  { connectorId: 'mail', id: 'new-email', label: 'New email', filterHint: 'from:@supplier.com subject:invoice has:attachment' },
  { connectorId: 'mail', id: 'new-email-attachment', label: 'New email with an attachment', filterHint: 'from: subject: filename:*.pdf' },
  { connectorId: 'cloud-drive', id: 'new-file', label: 'New file in a folder', filterHint: 'folder:/Finance/Invoices type:pdf' },
  { connectorId: 'cloud-drive', id: 'file-changed', label: 'File changed', filterHint: 'folder: name:' },
  { connectorId: 'calendar', id: 'event-starting', label: 'Event starting soon', filterHint: 'within:15m title: organiser:me' },
  { connectorId: 'support-desk', id: 'new-ticket', label: 'New ticket', filterHint: 'priority:high tag: channel:email' },
  { connectorId: 'support-desk', id: 'ticket-updated', label: 'Ticket updated', filterHint: 'status: assignee:me' },
  { connectorId: 'issue-tracker', id: 'new-issue', label: 'New issue', filterHint: 'project: label:bug' },
  { connectorId: 'issue-tracker', id: 'issue-moved', label: 'Issue moved', filterHint: 'to:Done project:' },
  { connectorId: 'team-chat', id: 'mention', label: 'Message mentioning the assistant', filterHint: 'channel:#support' },
  { connectorId: 'crm', id: 'deal-stage-changed', label: 'Deal stage changed', filterHint: 'to:Won owner:me' },
]
