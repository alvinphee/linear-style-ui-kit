import { BookOpen01Icon, CustomerSupportIcon, GlobalIcon, ShippingTruck01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import type {
  IndexStatus, KnowledgeBase, KnowledgeDocument, KnowledgeSource, RetrievalSettings,
} from '@/blocks/ai/knowledge/knowledge-types'
import { fileKind } from '@/components/file-chip'
import type { Recurrence } from '@/components/recurrence-picker'
import { seededRandom } from '@/lib/random'
import { at } from '../data'

// Four made-up knowledge bases on the demo clock: HR policies (shared with
// the organisation, uploads and pasted notes), product documentation (a
// website synced every day, some pages still processing), a support
// playbook (a Wiki space synced every weekday, one scanned PDF that failed)
// and customs and export rules (uploads, shared with a few people). Sizes,
// tokens and chunks come from a seeded generator, so they read the same on
// every load.

export const DEFAULT_RETRIEVAL: RetrievalSettings = {
  chunkSize: 512,
  chunkOverlap: 64,
  embeddingModel: 'text-embed-3',
  hybrid: true,
  rerank: true,
  topK: 8,
  minScore: 0.35,
}

// Each chunk moves on by its size less the overlap.
const chunksFor = (tokens: number) => Math.max(1, Math.ceil(tokens / (DEFAULT_RETRIEVAL.chunkSize - DEFAULT_RETRIEVAL.chunkOverlap)))

type DocSeed = string | { name: string; status?: IndexStatus; progress?: number; error?: string; daysAgo?: number }

// Documents for one source: a size, page count and token count to suit each
// file's kind, and an update time in the last `maxDaysAgo` days.
function documents(prefix: string, sourceId: string, seeds: DocSeed[], seed: number, opts: { web?: boolean; maxDaysAgo?: number } = {}) {
  const rand = seededRandom(seed)
  const between = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo))
  return seeds.map((s, i): KnowledgeDocument => {
    const d = typeof s === 'string' ? { name: s } : s
    const kind = opts.web ? 'text' : fileKind(d.name)
    let size: number
    let tokens: number
    let pages: number | undefined
    if (opts.web) {
      tokens = between(1_800, 18_000)
      size = Math.round(tokens * 4.6)
    } else if (kind === 'pdf' || kind === 'doc') {
      pages = between(2, 36)
      tokens = pages * between(380, 620)
      size = pages * between(kind === 'pdf' ? 38_000 : 9_000, kind === 'pdf' ? 90_000 : 16_000)
    } else if (kind === 'sheet' || kind === 'csv') {
      size = between(18_000, 220_000)
      tokens = Math.round(size / 5.5)
    } else {
      size = between(2_400, 28_000)
      tokens = Math.round(size / 4.2)
    }
    const status = d.status ?? 'indexed'
    const daysAgo = d.daysAgo ?? between(1, opts.maxDaysAgo ?? 60)
    return {
      id: `${prefix}-${i + 1}`,
      name: d.name,
      kind,
      sourceId,
      size,
      tokens,
      pages,
      chunks: status === 'indexed' ? chunksFor(tokens) : undefined,
      status,
      progress: status === 'processing' ? d.progress ?? between(10, 85) : undefined,
      error: d.error,
      updatedAt: at(daysAgo, between(8, 18), between(0, 59)),
    }
  })
}

// The schedules behind the synced sources' labels, so Edit schedule starts from them.
export const SAMPLE_SOURCE_SCHEDULES: Record<string, Recurrence> = {
  'kb-docs-web': { kind: 'daily', time: '02:00', timeZone: 'Asia/Singapore' },
  'kb-support-wiki': { kind: 'weekdays', time: '06:00', timeZone: 'Asia/Singapore' },
}

/* ---------- HR policies ---------- */

const HR_FILES = [
  'Annual leave policy.pdf', 'Sick leave and medical claims.pdf', 'Parental leave policy.pdf', 'Flexible working policy.docx',
  'Remote work guidelines.pdf', 'Code of conduct.pdf', 'Anti-harassment policy.pdf', 'Grievance procedure.pdf',
  'Disciplinary procedure.pdf', 'Performance review guide.docx', 'Probation policy.pdf', 'Onboarding checklist.docx',
  'Offboarding checklist.docx', 'Travel and expenses policy.pdf', 'Expense claim rates 2026.xlsx',
  'Overtime and shift allowances.pdf', 'Public holidays 2026.csv', 'Training and development policy.pdf',
  'Education sponsorship.pdf', 'Benefits overview.pdf', 'Health insurance summary.pdf', 'Pension scheme guide.pdf',
  'Data protection for staff.pdf', 'IT acceptable use policy.pdf', 'Workplace safety handbook.pdf',
  'Whistleblowing policy.pdf', 'Equal opportunities policy.pdf', 'Recruitment and referrals.docx',
  'Salary bands 2026.xlsx', 'Organisation chart.pdf',
]
const HR_DOCS = [
  ...documents('kb-hr-d', 'kb-hr-files', HR_FILES, 11),
  ...documents('kb-hr-t', 'kb-hr-notes', ['Leave questions and answers.md', 'Who to ask in HR.txt'], 12, { maxDaysAgo: 20 }),
]
const HR_SOURCES: KnowledgeSource[] = [
  { id: 'kb-hr-files', kind: 'upload', name: 'Policy files', detail: `${HR_FILES.length} files uploaded`, documentCount: HR_FILES.length },
  { id: 'kb-hr-notes', kind: 'text', name: 'Pasted notes', detail: '2 notes', documentCount: 2 },
]

/* ---------- Product documentation ---------- */

const DOC_SECTIONS = ['Getting started', 'Accounts', 'Projects', 'Billing', 'Integrations', 'API', 'Admin', 'Security', 'Reports', 'Mobile app']
const DOC_TOPICS = [
  'Overview', 'Set up', 'Permissions', 'Settings', 'Limits', 'Troubleshooting', 'Questions and answers', 'Import',
  'Export', 'Notifications', 'Keyboard shortcuts', 'What changed',
]
// The newest pages, still being indexed after this morning's sync.
const DOCS_BUSY: Record<number, Partial<Extract<DocSeed, object>>> = {
  4: { status: 'processing', progress: 72, daysAgo: 0 },
  15: { status: 'processing', progress: 45, daysAgo: 0 },
  27: { status: 'processing', progress: 18, daysAgo: 0 },
  58: { status: 'queued', daysAgo: 0 },
  91: { status: 'queued', daysAgo: 0 },
}
const DOC_PAGES: DocSeed[] = DOC_SECTIONS.flatMap((section, s) =>
  DOC_TOPICS.map((topic, t) => ({ name: `${section} › ${topic}`, ...DOCS_BUSY[s * DOC_TOPICS.length + t] })))
const DOCS_DOCS = documents('kb-docs-d', 'kb-docs-web', DOC_PAGES, 21, { web: true, maxDaysAgo: 30 })
const DOCS_SOURCES: KnowledgeSource[] = [
  {
    id: 'kb-docs-web',
    kind: 'website',
    name: 'docs.example.com',
    detail: 'https://docs.example.com/guide · 2 links deep',
    icon: GlobalIcon,
    sync: { label: 'Every day at 02:00 (Singapore)', lastSyncedAt: at(0, 2, 4), status: 'idle' },
    documentCount: DOC_PAGES.length,
  },
]

/* ---------- Support playbook ---------- */

const SUPPORT_PAGES: DocSeed[] = [
  'Refund requests.md', 'Late delivery replies.md', 'Damaged goods claims.md', 'Address changes.md',
  'Order cancellations.md', 'Account access problems.md', 'Password resets.md', 'Billing disputes.md',
  'Invoice copies.md', 'Tone of voice.md', 'Saved replies.md',
  {
    name: 'Escalation matrix (scanned).pdf',
    status: 'failed',
    error: 'No text found: the PDF is scanned pages. Upload a text version, or turn on text recognition (OCR) in Settings.',
    daysAgo: 0,
  },
  'On-call rota.xlsx', 'Service level targets.pdf', 'Priority definitions.md', 'Bug report template.md',
  'Feature request triage.md', 'Cancellation save offers.md', 'Key accounts.md', 'Peak season playbook.md',
  'Outage communication.md', 'Status page updates.md', 'Social media replies.md', 'Chat handover rules.md',
]
const SUPPORT_UPLOADS = ['Returns label guide.pdf', 'Support team contacts.csv']
const SUPPORT_DOCS = [
  ...documents('kb-sp-d', 'kb-support-wiki', SUPPORT_PAGES, 31, { maxDaysAgo: 14 }),
  ...documents('kb-sp-u', 'kb-support-files', SUPPORT_UPLOADS, 32),
]
const SUPPORT_SOURCES: KnowledgeSource[] = [
  {
    id: 'kb-support-wiki',
    kind: 'connector',
    connectorId: 'wiki',
    name: 'Wiki › Support',
    detail: '/Support/Playbook',
    icon: BookOpen01Icon,
    sync: { label: 'Every weekday at 06:00 (Singapore)', lastSyncedAt: at(0, 6, 1), status: 'idle' },
    documentCount: SUPPORT_PAGES.length,
  },
  { id: 'kb-support-files', kind: 'upload', name: 'Uploaded files', detail: '2 files uploaded', documentCount: SUPPORT_UPLOADS.length },
]

/* ---------- Customs and export rules ---------- */

const CUSTOMS_FILES = [
  'Export control overview.pdf', 'Tariff code lookup guide.pdf', 'Tariff schedule 2026.xlsx',
  'Certificate of origin how-to.pdf', 'Incoterms quick reference.pdf', 'Dangerous goods declaration.pdf',
  'Commercial invoice template.docx', 'Packing list template.docx', 'Customs valuation rules.pdf',
  'Free trade agreements summary.pdf', 'Restricted parties screening.pdf', 'Duty drawback process.pdf',
  'Temporary imports and carnets.pdf', 'Bonded warehouse rules.pdf', 'Import permit checklist.docx',
  'Sanctioned countries.csv', 'Customs broker contacts.xlsx', 'Record keeping for audits.pdf',
]
const CUSTOMS_DOCS = documents('kb-cx-d', 'kb-customs-files', CUSTOMS_FILES, 41, { maxDaysAgo: 90 })
const CUSTOMS_SOURCES: KnowledgeSource[] = [
  { id: 'kb-customs-files', kind: 'upload', name: 'Uploaded files', detail: `${CUSTOMS_FILES.length} files uploaded`, documentCount: CUSTOMS_FILES.length },
]

const newest = (docs: KnowledgeDocument[]) => Math.max(...docs.map((d) => d.updatedAt))

export const SAMPLE_KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: 'kb-hr',
    name: 'HR policies',
    description: 'Leave, benefits, conduct and expenses: the staff handbook and every policy behind it.',
    icon: UserGroupIcon,
    colour: 'var(--chart-1)',
    sources: HR_SOURCES,
    documents: HR_DOCS,
    settings: { ...DEFAULT_RETRIEVAL },
    access: 'organisation',
    linkedProjects: [{ id: 'p-q4', name: 'Q4 planning' }, { id: 'p-ops', name: 'Operations' }],
    owner: 'Priya Nair',
    updatedAt: newest(HR_DOCS),
  },
  {
    id: 'kb-docs',
    name: 'Product documentation',
    description: 'The public help centre, crawled from docs.example.com every night.',
    icon: BookOpen01Icon,
    colour: 'var(--chart-2)',
    sources: DOCS_SOURCES,
    documents: DOCS_DOCS,
    settings: { ...DEFAULT_RETRIEVAL },
    access: 'organisation',
    linkedProjects: [{ id: 'p-support', name: 'Customer support' }],
    owner: 'Alex Morgan',
    updatedAt: at(0, 2, 4),
  },
  {
    id: 'kb-support',
    name: 'Support playbook',
    description: 'How the support team answers refunds, delays, damage and account problems, synced from the Wiki.',
    icon: CustomerSupportIcon,
    colour: 'var(--chart-3)',
    sources: SUPPORT_SOURCES,
    documents: SUPPORT_DOCS,
    settings: { ...DEFAULT_RETRIEVAL, topK: 6 },
    access: 'people',
    members: [
      { id: 'u-sam', name: 'Sam Lee', email: 'sam.lee@example.com' },
      { id: 'u-jo', name: 'Jo Tan', email: 'jo.tan@example.com' },
      { id: 'u-ria', name: 'Ria Das', email: 'ria.das@example.com' },
    ],
    linkedProjects: [{ id: 'p-support', name: 'Customer support' }],
    owner: 'Sam Lee',
    updatedAt: at(0, 6, 1),
  },
  {
    id: 'kb-customs',
    name: 'Customs and export rules',
    description: 'Tariff codes, certificates of origin, permits and the paperwork for shipping across borders.',
    icon: ShippingTruck01Icon,
    colour: 'var(--chart-4)',
    sources: CUSTOMS_SOURCES,
    documents: CUSTOMS_DOCS,
    settings: { ...DEFAULT_RETRIEVAL },
    access: 'private',
    linkedProjects: [{ id: 'p-ops', name: 'Operations' }],
    owner: 'Alex Morgan',
    updatedAt: newest(CUSTOMS_DOCS),
  },
]
