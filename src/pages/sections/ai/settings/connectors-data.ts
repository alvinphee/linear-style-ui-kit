import {
  BookOpen01Icon, BubbleChatIcon, Calendar03Icon, CustomerSupportIcon, DatabaseIcon, FolderCloudIcon, GitBranchIcon,
  GlobalIcon, Mail01Icon, Mic01Icon, PenTool01Icon, ServerStack01Icon, Table01Icon, Task01Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import type { Connector, ConnectorTool } from '@/blocks/ai/connectors/connector-card'

// The AI chat app's connectors: made-up apps with generic names. Three start
// connected, one needs reconnecting and one is disabled by the admin.

export const CONNECTORS_KEY = 'linear-kit:ai-connectors:v1'

// Who the sample user connects as.
export const DEFAULT_ACCOUNT = 'alex.morgan@example.com'

const HOUR = 3_600_000
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString()

const read = (name: string, description: string, permission: ConnectorTool['permission'] = 'always'): ConnectorTool =>
  ({ name, description, permission, kind: 'read' })
const write = (name: string, description: string, permission: ConnectorTool['permission'] = 'ask'): ConnectorTool =>
  ({ name, description, permission, kind: 'write' })

export const CONNECTORS: Connector[] = [
  {
    id: 'cloud-drive',
    name: 'Cloud Drive',
    description: 'Find, read and add files and folders in your shared drive.',
    category: 'files',
    icon: FolderCloudIcon,
    colour: 'var(--chart-1)',
    status: 'connected',
    account: DEFAULT_ACCOUNT,
    lastUsed: ago(2),
    scopes: ['See and search your files and folders', 'Read the files you point it to', 'Create files in folders you choose'],
    tools: [
      read('search_files', 'Search files by name and content.'),
      read('read_file', 'Read the text of one file.'),
      read('list_folder', 'List what is in a folder.'),
      write('create_file', 'Create a file in a folder.'),
      write('share_file', 'Share a file with someone.', 'off'),
    ],
  },
  {
    id: 'mail',
    name: 'Mail',
    description: 'Search your inbox, read threads and draft replies.',
    category: 'communication',
    icon: Mail01Icon,
    colour: 'var(--chart-2)',
    status: 'connected',
    account: DEFAULT_ACCOUNT,
    lastUsed: ago(26),
    scopes: ['Read your email and its attachments', 'Write drafts in your mailbox', 'Send email as you, when you allow it'],
    tools: [
      read('search_mail', 'Search messages by sender, subject or words.'),
      read('read_thread', 'Read a whole email thread.'),
      write('draft_reply', 'Write a reply and keep it as a draft.'),
      write('send_message', 'Send an email as you.'),
    ],
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Check your schedule, find free time and book meetings.',
    category: 'productivity',
    icon: Calendar03Icon,
    colour: 'var(--chart-3)',
    status: 'error',
    account: DEFAULT_ACCOUNT,
    lastUsed: ago(24 * 9),
    scopes: ['See your events and who is invited', 'See when your colleagues are free', 'Create and change events'],
    tools: [
      read('list_events', 'List events in a date range.'),
      read('find_free_time', 'Find a slot when everyone is free.'),
      write('create_event', 'Create an event and invite people.'),
      write('update_event', 'Move or change an event.'),
    ],
  },
  {
    id: 'team-chat',
    name: 'Team Chat',
    description: 'Search channels and messages, and post updates.',
    category: 'communication',
    icon: BubbleChatIcon,
    colour: 'var(--brand)',
    status: 'disconnected',
    scopes: ['Read messages in channels you belong to', 'See the list of channels and people', 'Post messages as you'],
    tools: [
      read('search_messages', 'Search messages across channels.'),
      read('read_channel', 'Read the latest messages in a channel.'),
      read('list_channels', 'List the channels you are in.'),
      write('post_message', 'Post a message in a channel.'),
    ],
  },
  {
    id: 'code-repository',
    name: 'Code Repository',
    description: 'Read code, review pull requests and open new ones.',
    category: 'development',
    icon: GitBranchIcon,
    colour: 'var(--chart-4)',
    status: 'connected',
    account: 'acme-labs',
    lastUsed: ago(5),
    scopes: ['Read code in the repositories you choose', 'See pull requests, issues and checks', 'Open pull requests and comment on them'],
    tools: [
      read('search_code', 'Search code across repositories.'),
      read('read_file', 'Read a file at a branch or commit.'),
      read('list_pull_requests', 'List open pull requests.'),
      write('create_pull_request', 'Open a pull request from a branch.'),
      write('comment_on_pull_request', 'Add a review comment.'),
    ],
  },
  {
    id: 'issue-tracker',
    name: 'Issue Tracker',
    description: 'Look up issues, file new ones and move them along.',
    category: 'development',
    icon: Task01Icon,
    colour: 'var(--status-progress)',
    status: 'disconnected',
    scopes: ['See issues, projects and cycles', 'Create issues and change their status', 'Comment on issues as you'],
    tools: [
      read('search_issues', 'Search issues by text, label or assignee.'),
      read('get_issue', 'Read one issue with its comments.'),
      write('create_issue', 'File a new issue.'),
      write('update_issue', 'Change status, assignee or priority.'),
      write('add_comment', 'Comment on an issue.'),
    ],
  },
  {
    id: 'wiki',
    name: 'Wiki',
    description: 'Search team pages and write new ones from a chat.',
    category: 'productivity',
    icon: BookOpen01Icon,
    colour: 'var(--chart-5)',
    status: 'disconnected',
    scopes: ['Read pages in spaces you can see', 'Create and edit pages'],
    tools: [
      read('search_pages', 'Search pages by title and text.'),
      read('read_page', 'Read one page.'),
      write('create_page', 'Create a page in a space.'),
      write('update_page', 'Change a page you can edit.'),
    ],
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Look up accounts, contacts and deals, and log activity.',
    category: 'sales',
    icon: UserGroupIcon,
    colour: 'var(--chart-2)',
    status: 'disabled',
    scopes: ['See accounts, contacts and deals', 'Log calls, emails and notes', 'Change a deal’s stage and amount'],
    tools: [
      read('search_contacts', 'Find contacts by name or company.'),
      read('get_account', 'Read an account with its deals.'),
      read('list_deals', 'List deals by stage or owner.'),
      write('log_activity', 'Log a call, email or note.'),
      write('update_deal', 'Move a deal or change its amount.'),
    ],
  },
  {
    id: 'data-warehouse',
    name: 'Data Warehouse',
    description: 'Explore tables and run read-only queries.',
    category: 'data',
    icon: DatabaseIcon,
    colour: 'var(--chart-1)',
    status: 'disconnected',
    scopes: ['See the schemas and tables you have access to', 'Run read-only queries'],
    tools: [
      read('list_tables', 'List tables in a schema.'),
      read('describe_table', 'Show a table’s columns and types.'),
      read('run_query', 'Run a read-only SQL query.', 'ask'),
    ],
  },
  {
    id: 'spreadsheets',
    name: 'Spreadsheets',
    description: 'Read sheets, and add rows or update cells.',
    category: 'data',
    icon: Table01Icon,
    colour: 'var(--status-done)',
    status: 'disconnected',
    scopes: ['Read spreadsheets you open with it', 'Change cells and add rows'],
    tools: [
      read('search_spreadsheets', 'Find spreadsheets by name.'),
      read('read_sheet', 'Read a range of cells.'),
      write('update_cells', 'Write values to a range.'),
      write('append_rows', 'Add rows to the end of a sheet.'),
    ],
  },
  {
    id: 'design-files',
    name: 'Design Files',
    description: 'Look up frames and components, and export images.',
    category: 'files',
    icon: PenTool01Icon,
    colour: 'var(--chart-5)',
    status: 'disconnected',
    scopes: ['See design files and their comments', 'Export frames as images', 'Comment as you'],
    tools: [
      read('search_designs', 'Search files and frames by name.'),
      read('get_frame', 'Read a frame’s layers and text.'),
      read('export_image', 'Export a frame as an image.'),
      write('add_comment', 'Comment on a frame.'),
    ],
  },
  {
    id: 'support-desk',
    name: 'Support Desk',
    description: 'Read customer tickets and draft replies.',
    category: 'sales',
    icon: CustomerSupportIcon,
    colour: 'var(--chart-3)',
    status: 'disconnected',
    scopes: ['See tickets and customer details', 'Reply to tickets and change their status'],
    tools: [
      read('search_tickets', 'Search tickets by customer or text.'),
      read('get_ticket', 'Read a ticket and its replies.'),
      write('reply_to_ticket', 'Send a reply to the customer.'),
      write('update_ticket', 'Change status, priority or owner.'),
    ],
  },
  {
    id: 'web-browser',
    name: 'Web Browser',
    description: 'Open web pages and read what they say.',
    category: 'productivity',
    icon: GlobalIcon,
    colour: 'var(--brand)',
    status: 'disconnected',
    scopes: ['Visit public web pages', 'Read the text and take screenshots of pages'],
    tools: [
      read('fetch_page', 'Read the text of a web page.'),
      read('take_screenshot', 'Take a picture of a page.'),
      read('find_links', 'List the links on a page.'),
    ],
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Find meetings, read transcripts and pull out action items.',
    category: 'productivity',
    icon: Mic01Icon,
    colour: 'var(--chart-4)',
    status: 'disconnected',
    scopes: ['See your recorded meetings', 'Read transcripts and summaries', 'Create action items'],
    tools: [
      read('list_meetings', 'List recorded meetings.'),
      read('get_transcript', 'Read a meeting’s transcript.'),
      read('get_summary', 'Read a meeting’s summary.'),
      write('create_action_items', 'Turn decisions into action items.'),
    ],
  },
]

// A custom connector's mark, and the tools the demo server answers with
// (a real MCP server lists its own once connected).
export const CUSTOM_ICON = ServerStack01Icon
export const CUSTOM_COLOUR = 'var(--muted-foreground)'
export const CUSTOM_TOOLS: ConnectorTool[] = [
  read('search', 'Search what the server holds.', 'ask'),
  read('fetch', 'Read one item by its id.', 'ask'),
]
