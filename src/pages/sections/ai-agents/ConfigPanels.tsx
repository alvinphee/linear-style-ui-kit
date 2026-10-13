import { useState } from 'react'
import { toast } from 'sonner'
import { Invoice01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  AgentConfigForm, hasAgentDraftErrors, validateAgentDraft, type AgentDraftErrors,
} from '@/blocks/ai/agents/agent-config-form'
import type { AgentDraft, AgentTrigger } from '@/blocks/ai/agents/agent-types'
import { TriggerEditor } from '@/blocks/ai/agents/trigger-editor'
import type { KnowledgeBaseSummary } from '@/blocks/ai/knowledge/knowledge-types'
import { AGENT_EVENTS } from '../ai/agents/events-data'
import { DEFAULT_MODEL, MODELS, now } from '../ai/data'
import { SAMPLE_KNOWLEDGE_BASES } from '../ai/knowledge/bases-data'
import { PROJECT_COLOURS, PROJECT_ICONS } from '../ai/projects/templates'
import { CONNECTORS } from '../ai/settings/connectors-data'
import { SAMPLE_SKILLS, toSkill } from '../ai/settings/skills-data'
import { Panel } from '../shared'

// The agent builder's Configure tab on local state: the whole form on a
// sample invoice agent (real connector, skill and knowledge base ids, so
// statuses and counts are the sample data's), the trigger editor on its own,
// and an empty draft with its validation errors showing.

const demo = (what: string) => toast(what, { description: 'Demo only: nothing was changed.' })

const SKILLS = SAMPLE_SKILLS.map(toSkill)
const BASES: KnowledgeBaseSummary[] = SAMPLE_KNOWLEDGE_BASES.map((b) => ({
  id: b.id, name: b.name, icon: b.icon, colour: b.colour,
  documentCount: b.documents.length,
  tokens: b.documents.reduce((sum, d) => sum + d.tokens, 0),
}))
const TZ = 'Asia/Singapore'

const SAMPLE_TRIGGERS: AgentTrigger[] = [
  { id: 'tr-manual', kind: 'manual', enabled: true },
  {
    id: 'tr-mail', kind: 'event', enabled: true,
    connectorId: 'mail', event: 'new-email-attachment', eventLabel: 'New email with an attachment',
    filter: 'from:@supplier.com filename:*.pdf',
  },
  { id: 'tr-weekly', kind: 'schedule', enabled: true, recurrence: { kind: 'weekly', days: [1], time: '08:30', timeZone: TZ } },
]

const SAMPLE_DRAFT: AgentDraft = {
  name: 'Invoice assistant',
  description: 'Reads supplier invoices from Mail, checks them against purchase orders and drafts them for approval.',
  icon: Invoice01Icon,
  colour: 'var(--chart-2)',
  instructions: [
    'You help the finance team with supplier invoices.',
    '',
    '## Each run',
    '1. Read each new invoice attached to an email.',
    '2. Find its purchase order in Cloud Drive › Finance › Purchase orders.',
    '3. Check the supplier, the amounts and the payment terms.',
    '4. Draft a reply to the supplier only when something does not match.',
    '',
    '## Rules',
    '- Never approve or pay an invoice yourself.',
    '- Ask before sending any email.',
  ].join('\n'),
  starters: [
    'Which invoices are waiting for approval?',
    'Check this invoice against its purchase order',
    'Summarise this week’s supplier invoices',
  ],
  model: 'depth',
  files: [
    { id: 'f-limits', name: 'Approval limits 2026.xlsx', size: 18_400 },
    { id: 'f-suppliers', name: 'Approved suppliers.csv', size: 42_000 },
  ],
  knowledgeBases: ['kb-customs'],
  connectors: {
    mail: { search_mail: 'always', read_thread: 'always', draft_reply: 'ask', send_message: 'off' },
    'cloud-drive': { search_files: 'always', read_file: 'always', list_folder: 'always', create_file: 'ask', share_file: 'off' },
  },
  skills: ['sk-invoices', 'sk-sheets'],
  triggers: SAMPLE_TRIGGERS,
  access: 'organisation',
}

const EMPTY_DRAFT: AgentDraft = {
  name: '',
  description: '',
  instructions: '',
  starters: [],
  files: [],
  knowledgeBases: [],
  connectors: {},
  skills: [],
  triggers: [
    { id: 'tr-empty-manual', kind: 'manual', enabled: true },
    { id: 'tr-empty-event', kind: 'event', enabled: true, connectorId: '', event: '', eventLabel: '' },
    { id: 'tr-empty-weekly', kind: 'schedule', enabled: true, recurrence: { kind: 'weekly', days: [], time: '09:00', timeZone: TZ } },
  ],
  access: 'private',
}

let fileCount = 0

export function ConfigPanels() {
  const [draft, setDraft] = useState<AgentDraft>(SAMPLE_DRAFT)
  const [errors, setErrors] = useState<AgentDraftErrors | undefined>()
  const [triggers, setTriggers] = useState<AgentTrigger[]>(SAMPLE_TRIGGERS)
  const [empty, setEmpty] = useState<AgentDraft>(EMPTY_DRAFT)
  const clock = now()

  const patch = (p: Partial<AgentDraft>) => {
    const next = { ...draft, ...p }
    setDraft(next)
    // Once Save has shown errors, they follow the edits.
    if (errors) setErrors(validateAgentDraft(next, clock))
  }
  const save = () => {
    const found = validateAgentDraft(draft, clock)
    setErrors(found)
    if (hasAgentDraftErrors(found)) toast.error('Fix the marked fields to save the agent.')
    else demo(`Saved “${draft.name.trim()}”`)
  }
  const shared = {
    icons: PROJECT_ICONS,
    colours: PROJECT_COLOURS,
    models: MODELS,
    defaultModel: DEFAULT_MODEL,
    connectors: CONNECTORS,
    events: AGENT_EVENTS,
    skills: SKILLS,
    bases: BASES,
    now: clock,
    onOpenSettings: (section: 'connectors' | 'skills', id?: string) =>
      demo(`Opens Settings › ${section === 'connectors' ? 'Connectors' : 'Skills'}${id ? ` at ${CONNECTORS.find((c) => c.id === id)?.name ?? id}` : ''}`),
  }

  return (
    <>
      <Panel title="Configure tab" note="The whole agent as one form; the section list shows on wide boxes" wide>
        <div className="bg-background grid min-w-0 overflow-hidden rounded-lg border">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
            <span className="text-muted-foreground min-w-0 truncate text-xs">Editing {draft.name.trim() || 'a new agent'}</span>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => { setDraft(SAMPLE_DRAFT); setErrors(undefined) }}>Reset</Button>
              <Button size="sm" onClick={save}>Save</Button>
            </div>
          </div>
          <div className="h-[44rem] max-h-[80vh] min-w-0 overflow-y-auto p-4">
            <AgentConfigForm
              {...shared}
              draft={draft}
              onChange={patch}
              errors={errors}
              onAddFiles={(files) => patch({
                files: [...draft.files, ...files.map((f) => ({ id: `f-up-${++fileCount}`, name: f.name, size: f.size }))],
              })}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Trigger editor" note="Manual is always there; add a schedule or an event from a connected app">
        <div className="bg-card min-w-0 rounded-lg border">
          <TriggerEditor
            triggers={triggers}
            onChange={setTriggers}
            connectors={CONNECTORS}
            events={AGENT_EVENTS}
            now={clock}
            onOpenSettings={() => demo('Opens Settings › Connectors')}
          />
        </div>
      </Panel>

      <Panel title="Validation" note="An empty draft after Save: name, instructions and two unfinished triggers">
        <AgentConfigForm
          {...shared}
          draft={empty}
          onChange={(p) => setEmpty((d) => ({ ...d, ...p }))}
          sections={['basics', 'instructions', 'triggers']}
          errors={validateAgentDraft(empty, clock)}
        />
      </Panel>
    </>
  )
}
