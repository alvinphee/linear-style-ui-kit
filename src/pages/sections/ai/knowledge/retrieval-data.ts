import type { EmbeddingModelOption } from '@/blocks/ai/knowledge/knowledge-base-settings'
import type { RetrievalSettings, RetrievedChunk } from '@/blocks/ai/knowledge/knowledge-types'
import type { FileKind } from '@/components/file-chip'

// A made-up retriever for the retrieval tester demo. No embeddings: each
// chunk is scored by how many of the question's words (and a few close
// words, standing in for meaning) it contains, plus a small fixed amount of
// noise, so every result is the same each time. Hybrid search adds a boost
// for exact words; reranking pulls good and poor matches further apart.
//
// It returns every chunk at or above the cut-off, sorted, with the best few
// below it, so the tester can show what was left out and why. The tester
// applies top-K and the cut-off itself.

export const EMBEDDING_MODELS: EmbeddingModelOption[] = [
  { id: 'text-embed-3', label: 'text-embed-3', hint: 'Fast, and right for most English text.' },
  { id: 'text-embed-3-large', label: 'text-embed-3-large', hint: 'More accurate on long technical documents; slower to index.' },
  { id: 'multilingual-embed-2', label: 'multilingual-embed-2', hint: 'For documents and questions in several languages.' },
]

export const SAMPLE_RETRIEVAL_SETTINGS: RetrievalSettings = {
  chunkSize: 512, chunkOverlap: 51, embeddingModel: 'text-embed-3', hybrid: true, rerank: true, topK: 8, minScore: 0.35,
}

export const RETRIEVAL_EXAMPLES = [
  'How many days of annual leave can I carry over?',
  'Do I need a receipt to claim a taxi?',
  'Can I export a report to CSV every week?',
  'What marking do wooden pallets need?',
  'What happens if a chilled shipment goes above 8 °C?',
]

type SampleChunk = { id: string; doc: string; page?: number; text: string }

const DOCUMENTS: Record<string, { name: string; kind: FileKind }> = {
  leave: { name: 'Leave policy 2025.pdf', kind: 'pdf' },
  expenses: { name: 'Expenses and travel policy.pdf', kind: 'pdf' },
  remote: { name: 'Remote work guidelines.docx', kind: 'doc' },
  export: { name: 'Exporting data.md', kind: 'text' },
  permissions: { name: 'Roles and permissions.md', kind: 'text' },
  pallets: { name: 'Pallet and packaging rules.pdf', kind: 'pdf' },
  cold: { name: 'Cold chain handling guide.pdf', kind: 'pdf' },
  declarations: { name: 'Import declarations checklist.xlsx', kind: 'sheet' },
}

const CHUNKS: SampleChunk[] = [
  // HR: leave
  { id: 'leave-1', doc: 'leave', page: 2, text: 'Full-time staff receive 20 days of annual leave each calendar year, plus public holidays. Part-time staff receive leave in proportion to their contracted hours. Leave builds up monthly from your start date.' },
  { id: 'leave-2', doc: 'leave', page: 3, text: 'You may carry over up to 5 days of unused annual leave into the next year. Days carried over must be taken by 31 March, or they are lost. Your manager can approve carrying over more in exceptional cases, such as a long project or sick leave late in the year.' },
  { id: 'leave-3', doc: 'leave', page: 3, text: 'Request annual leave in the HR portal at least two weeks before the first day. Your manager approves or declines within three working days. For a request of more than ten days in a row, ask at least a month ahead.' },
  { id: 'leave-4', doc: 'leave', page: 5, text: 'Sick leave is paid for up to 14 days a year. For an absence of more than two days in a row, send a medical certificate to HR. Tell your manager before your start time on the first day you are unwell.' },
  { id: 'leave-5', doc: 'leave', page: 6, text: 'Parental leave is 16 weeks at full pay for the primary carer and 4 weeks for the secondary carer, to be taken within the first year. Tell HR at least eight weeks before the leave starts.' },

  // HR: expenses
  { id: 'exp-1', doc: 'expenses', page: 1, text: 'Submit an expense claim within 30 days of spending the money. Claims older than 90 days are not paid unless the finance team agrees in writing.' },
  { id: 'exp-2', doc: 'expenses', page: 2, text: 'Every claim needs a receipt, including taxi, train and parking costs. For a lost receipt, fill in the missing receipt form; it covers up to two claims a year and no more than 50 per claim.' },
  { id: 'exp-3', doc: 'expenses', page: 2, text: 'Taxis are allowed late at night, when carrying equipment, or where no public transport runs. Otherwise take the train or bus. Ride-sharing receipts count as taxi receipts.' },
  { id: 'exp-4', doc: 'expenses', page: 3, text: 'Meals while travelling are paid up to 25 for lunch and 45 for dinner, including tips. Alcohol is not paid. Client meals need the names of the guests on the claim.' },
  { id: 'exp-5', doc: 'expenses', page: 4, text: 'Mileage for a private car used on company business is paid per kilometre at the rate set each January. Commuting to your usual office is not business travel.' },

  // HR: remote work
  { id: 'rem-1', doc: 'remote', page: 1, text: 'Most roles may work from home up to three days a week, agreed with your manager. Roles that need site access, such as warehouse and field service, are excluded.' },
  { id: 'rem-2', doc: 'remote', page: 2, text: 'Remote staff receive a one-off equipment allowance for a desk, chair and monitor. Laptops and phones are supplied by IT and remain company property.' },
  { id: 'rem-3', doc: 'remote', page: 2, text: 'Core hours are 10:00 to 16:00 in your home time zone. Outside core hours, work when suits you, as long as your team can reach you for planned meetings.' },
  { id: 'rem-4', doc: 'remote', page: 3, text: 'Working from another country for more than 10 days a year needs approval from HR and Legal first, because of tax and visa rules. Short trips to visit family are usually approved.' },

  // Product: export
  { id: 'xp-1', doc: 'export', text: 'Export any list or report to CSV or Excel from the Export button in its toolbar. The export includes the columns you can see and the filters you have applied.' },
  { id: 'xp-2', doc: 'export', text: 'Scheduled exports send a report by email every day, week or month. Open the report, choose Export › Schedule, pick the format and the people to send it to. Each person needs access to the report.' },
  { id: 'xp-3', doc: 'export', text: 'A single export holds up to 100,000 rows. For larger data sets, use the API or split the export with a date filter. Exports of more than 10,000 rows are prepared in the background and emailed as a link.' },
  { id: 'xp-4', doc: 'export', text: 'Export links expire after 7 days. Admins can turn off exports for the whole workspace in Settings › Security, or limit them to admins only.' },

  // Product: permissions
  { id: 'perm-1', doc: 'permissions', text: 'Every workspace has three built-in roles: Admin, Member and Guest. Admins manage billing, members and security settings. Members create and edit records. Guests see only what is shared with them.' },
  { id: 'perm-2', doc: 'permissions', text: 'On the Business plan, admins can create custom roles with permissions chosen one by one, such as export data, delete records or manage integrations.' },
  { id: 'perm-3', doc: 'permissions', text: 'To transfer workspace ownership, the current owner opens Settings › Members, chooses an admin and selects Make owner. Only one person can be the owner at a time.' },
  { id: 'perm-4', doc: 'permissions', text: 'Changes to roles and permissions are kept in the audit log for 12 months, with who made the change and when. Export the audit log to CSV from Settings › Security.' },

  // Customs: pallets
  { id: 'pal-1', doc: 'pallets', page: 2, text: 'Wooden pallets and crates for export must be heat-treated to ISPM 15 and carry the IPPC mark, with the country code, the producer number and HT. Unmarked wooden pallets can be refused or treated at the border at the shipper’s cost.' },
  { id: 'pal-2', doc: 'pallets', page: 3, text: 'Pallets for air freight must not be taller than 160 cm including the pallet, or 300 cm on main-deck freighters. Loads must not overhang the pallet edge.' },
  { id: 'pal-3', doc: 'pallets', page: 4, text: 'Label every pallet on two adjacent sides with the shipment number, the number of pieces and any handling marks, such as fragile or this way up.' },
  { id: 'pal-4', doc: 'pallets', page: 5, text: 'Plastic and pressed-wood pallets are exempt from ISPM 15 marking. Note the pallet material on the packing list so customs can check it without opening the load.' },

  // Customs: cold chain
  { id: 'cold-1', doc: 'cold', page: 1, text: 'Chilled goods must stay between 2 and 8 °C from collection to delivery; frozen goods at −18 °C or below. Every chilled or frozen shipment travels with a calibrated temperature data logger.' },
  { id: 'cold-2', doc: 'cold', page: 3, text: 'A temperature excursion is any reading outside the agreed range for more than 30 minutes. If a chilled shipment goes above 8 °C, quarantine it, record the logger data and tell the customer within 2 hours. Do not deliver it until the customer decides.' },
  { id: 'cold-3', doc: 'cold', page: 4, text: 'Dry ice is a dangerous good for air freight. Declare the net weight in kilograms on the air waybill and label each package with UN 1845. Packages must let the gas escape.' },

  // Customs: declarations
  { id: 'dec-1', doc: 'declarations', text: 'Every import declaration needs the commercial invoice, the packing list and the transport document (air waybill or bill of lading). Check that the values and weights match across all three.' },
  { id: 'dec-2', doc: 'declarations', text: 'Classify each item with its 8-digit HS code. A wrong HS code can mean the wrong duty, a fine, or the goods held. Ask the customs team when an item could fit two codes.' },
  { id: 'dec-3', doc: 'declarations', text: 'To claim a lower duty rate under a trade agreement, attach a certificate of origin or the exporter’s origin statement. Keep it for five years in case of an audit.' },
]

// Words that say nothing about the topic.
const STOP = new Set([
  'the', 'and', 'for', 'can', 'what', 'how', 'many', 'much', 'does', 'need', 'are', 'was', 'with', 'you', 'your', 'our',
  'when', 'who', 'why', 'where', 'which', 'this', 'that', 'there', 'into', 'from', 'about', 'any', 'have', 'has', 'get',
  'should', 'would', 'could', 'will', 'every', 'each', 'goes', 'happens', 'they', 'them', 'than', 'its', 'not', 'do',
  'if', 'to', 'of', 'in', 'on', 'is', 'it', 'my', 'me', 'an', 'be', 'or', 'at', 'by', 'we', 'us', 'so', 'as',
])

// Close words, standing in for what an embedding model would match on meaning.
const RELATED: Record<string, string[]> = {
  holiday: ['leave'], vacation: ['leave'], pto: ['leave'], days: ['leave'],
  claim: ['expense', 'receipt'], reimburse: ['expense', 'claim'], refund: ['expense', 'claim'], cab: ['taxi'], uber: ['taxi'],
  wfh: ['remote', 'home'], home: ['remote'], abroad: ['country'],
  download: ['export'], csv: ['export'], spreadsheet: ['excel', 'export'], schedule: ['scheduled'], weekly: ['week'], week: ['scheduled'],
  access: ['permission', 'role'], admin: ['role'], owner: ['ownership'],
  wooden: ['wood'], wood: ['ispm', 'heat-treated'], marking: ['mark', 'ippc'],
  chilled: ['temperature', 'cold'], frozen: ['temperature'], fridge: ['chilled'], warm: ['excursion', 'temperature'], above: ['excursion'],
  duty: ['tariff'], tariff: ['duty', 'hs'], customs: ['declaration'],
}

// A word in a simple common form: lower case, without a plural or -ed / -ing.
function stem(word: string) {
  let w = word.toLowerCase().replace(/[’']s$/, '')
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`
  else if (w.length > 4 && w.endsWith('ing')) w = w.slice(0, -3)
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  return w
}

const WORD = /[\p{L}\p{N}][\p{L}\p{N}-]*/gu

// The close words by the stem of the word they belong to.
const RELATED_BY_STEM = new Map(Object.entries(RELATED).map(([word, close]) => [stem(word), close.map(stem)]))

// A fixed number from 0 to 1 for a pair of strings, for the noise.
function noise(a: string, b: string) {
  let h = 2166136261
  for (const ch of `${a}|${b}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

const round = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number) => Math.min(0.97, Math.max(0.02, n))

// How many below the cut-off come back, for the tester's faded list.
const BELOW = 8

export function sampleSearch(query: string, settings: RetrievalSettings): RetrievedChunk[] {
  const words = [...query.matchAll(WORD)]
    .map((m) => m[0].toLowerCase())
    .filter((w) => (w.length > 1 || /\d/.test(w)) && !STOP.has(w))
  const terms = [...new Set(words.map(stem))]
  if (!terms.length) return []
  const codeTerms = new Set(
    [...query.matchAll(WORD)].map((m) => m[0]).filter((w) => /\d/.test(w) || /^[A-Z]{2,}$/.test(w)).map(stem),
  )
  // What "meaning" adds: the close words of each term, weighted lower.
  const related = new Set(terms.flatMap((t) => RELATED_BY_STEM.get(t) ?? []).filter((t) => !terms.includes(t)))

  const scored = CHUNKS.map((chunk): RetrievedChunk => {
    const highlights: [number, number][] = []
    const exact = new Set<string>()
    const near = new Set<string>()
    for (const m of chunk.text.matchAll(WORD)) {
      const s = stem(m[0])
      const hit = terms.includes(s) ? exact : related.has(s) ? near : null
      if (!hit) continue
      hit.add(s)
      highlights.push([m.index!, m.index! + m[0].length])
    }
    const coverage = exact.size / terms.length
    const meaning = Math.min(1, coverage + near.size * 0.18)
    let score = 0.1 + noise(chunk.id, query) * 0.14 + meaning * 0.6
    // Exact words count again in keyword search: codes, numbers and
    // abbreviations (CSV, HS) most, which meaning search tends to miss.
    if (settings.hybrid && exact.size) {
      const codes = [...exact].filter((t) => codeTerms.has(t)).length
      score += coverage * 0.12 + codes * 0.06
    }
    if (settings.rerank) score += score >= 0.5 ? 0.06 : -0.05
    const doc = DOCUMENTS[chunk.doc]
    return {
      id: chunk.id,
      documentId: chunk.doc,
      documentName: doc.name,
      documentKind: doc.kind,
      page: chunk.page,
      text: chunk.text,
      score: round(clamp(score)),
      highlights,
    }
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))

  const above = scored.filter((c) => c.score >= settings.minScore)
  const below = scored.filter((c) => c.score < settings.minScore).slice(0, BELOW)
  return [...above, ...below]
}
