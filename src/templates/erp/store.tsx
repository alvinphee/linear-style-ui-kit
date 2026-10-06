import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { COMPANIES, SEED, type Company } from './data'
import { ERP_FORMS, type ErpForm } from './forms/definitions'
import { TODAY } from './format'
import type { Data, EntityId, Role, Row, Value } from './types'

// The ERP template's state: who is signed in, which company, the records,
// and the overlays any page can open (side panel, create dialog, palette,
// copilot). Records live in memory and reset on reload; the session,
// company and favourites are kept in this browser.

export type Session = { name: string; email: string; role: Role; title: string }
export type Recent = { entity: EntityId; id: string; label: string }

// Where you land after signing in (the ERP + AI edition lets you choose).
export type StartPage = 'launchpad' | 'assistant'

// groupByDate: the Assistant's chat history grouped by date, or one list (the default).
// copilotWidth: the Ask AI panel's width, as you last left it.
type Saved = {
  session: Session | null; companyId: string | null; favourites: string[]; startPage: StartPage; groupByDate: boolean
  copilotWidth: number
}

const KEY = 'linear-kit:erp:v1'

const DEFAULTS: Saved = { session: null, companyId: null, favourites: ['accounting', 'sales'], startPage: 'launchpad', groupByDate: false, copilotWidth: 400 }

function load(): Saved {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

type ErpState = {
  session: Session | null
  company: Company | null
  data: Data
  // The forms in the catalogue: the samples, plus any made or edited in the builder this visit.
  forms: ErpForm[]
  favourites: string[]
  startPage: StartPage
  groupByDate: boolean
  copilotWidth: number
  // A page's own title for the end of the breadcrumb, such as a chat's.
  pageTitle: string | null
  // Where a deep link (a scanned QR code) was going when sign-in got in the way.
  returnTo: string | null
  recent: Recent[]
  peek: { entity: EntityId; id: string } | null
  creating: { entity: EntityId; values?: Record<string, Value> } | null
  paletteOpen: boolean
  copilotOpen: boolean
  signIn: (session: Session) => void
  signOut: () => void
  setRole: (role: Role, title: string) => void
  setCompany: (id: string) => void
  add: (entity: EntityId, row: Row) => void
  update: (entity: EntityId, ids: string[], patch: Record<string, Value>) => void
  remove: (entity: EntityId, ids: string[]) => void
  saveForm: (form: ErpForm) => void
  toggleFavourite: (moduleId: string) => void
  setStartPage: (page: StartPage) => void
  setGroupByDate: (byDate: boolean) => void
  setCopilotWidth: (width: number) => void
  setPageTitle: (title: string | null) => void
  setReturnTo: (path: string | null) => void
  openPeek: (entity: EntityId, id: string) => void
  closePeek: () => void
  startCreate: (entity: EntityId, values?: Record<string, Value>) => void
  endCreate: () => void
  setPaletteOpen: (open: boolean) => void
  setCopilotOpen: (open: boolean) => void
}

const ErpContext = createContext<ErpState | null>(null)

let events = 0

export function ErpProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(load)
  const [data, setData] = useState<Data>(SEED)
  const [forms, setForms] = useState<ErpForm[]>(ERP_FORMS)
  const [recent, setRecent] = useState<Recent[]>([])
  const [peek, setPeek] = useState<ErpState['peek']>(null)
  const [creating, setCreating] = useState<ErpState['creating']>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [returnTo, setReturnTo] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved))
    } catch {
      // Storage can be blocked; the demo still works for this visit.
    }
  }, [saved])

  const company = COMPANIES.find((c) => c.id === saved.companyId) ?? null

  // Every change is written to the audit trail, as a real ERP would.
  function audit(action: string, target: string) {
    const now = new Date()
    const at = `${TODAY} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const event: Row = {
      id: `EV-${9100 + ++events}`, at, actor: saved.session?.name ?? 'You', action, target, module: 'This session', ip: '10.0.1.24',
    }
    setData((d) => ({ ...d, audit: [event, ...d.audit] }))
  }

  const value = useMemo<ErpState>(() => ({
    session: saved.session,
    company,
    data,
    forms,
    favourites: saved.favourites,
    startPage: saved.startPage,
    groupByDate: saved.groupByDate,
    copilotWidth: saved.copilotWidth,
    pageTitle,
    returnTo,
    recent,
    peek,
    creating,
    paletteOpen,
    copilotOpen,
    signIn: (session) => setSaved((s) => ({ ...s, session })),
    signOut: () => {
      setSaved((s) => ({ ...s, session: null, companyId: null }))
      setPeek(null)
      setRecent([])
    },
    setRole: (role, title) => setSaved((s) => (s.session ? { ...s, session: { ...s.session, role, title } } : s)),
    setCompany: (companyId) => setSaved((s) => ({ ...s, companyId })),
    add: (entity, row) => {
      setData((d) => ({ ...d, [entity]: [row, ...d[entity]] }))
      audit('created', row.id)
    },
    update: (entity, ids, patch) => {
      setData((d) => ({ ...d, [entity]: d[entity].map((r) => (ids.includes(r.id) ? { ...r, ...patch } : r)) }))
      const change = Object.entries(patch).map(([k, v]) => `${k} → ${v}`).join(', ')
      for (const id of ids) audit(`set ${change} on`, id)
    },
    remove: (entity, ids) => {
      setData((d) => ({ ...d, [entity]: d[entity].filter((r) => !ids.includes(r.id)) }))
      setPeek((p) => (p && ids.includes(p.id) ? null : p))
      for (const id of ids) audit('deleted', id)
    },
    saveForm: (form) => {
      setForms((all) => (all.some((f) => f.id === form.id) ? all.map((f) => (f.id === form.id ? form : f)) : [...all, form]))
      audit('saved form', form.name)
    },
    toggleFavourite: (moduleId) => setSaved((s) => ({
      ...s,
      favourites: s.favourites.includes(moduleId) ? s.favourites.filter((m) => m !== moduleId) : [...s.favourites, moduleId],
    })),
    setStartPage: (startPage) => setSaved((s) => ({ ...s, startPage })),
    setGroupByDate: (groupByDate) => setSaved((s) => ({ ...s, groupByDate })),
    setCopilotWidth: (copilotWidth) => setSaved((s) => ({ ...s, copilotWidth })),
    setPageTitle,
    setReturnTo,
    openPeek: (entity, id) => {
      setPeek({ entity, id })
      const row = data[entity].find((r) => r.id === id)
      if (!row) return
      const label = String(row.name ?? row.customer ?? row.vendor ?? row.subject ?? row.item ?? row.memo ?? row.employee ?? id)
      setRecent((list) => [{ entity, id, label }, ...list.filter((r) => r.id !== id)].slice(0, 6))
    },
    closePeek: () => setPeek(null),
    startCreate: (entity, values) => setCreating({ entity, values }),
    endCreate: () => setCreating(null),
    setPaletteOpen,
    setCopilotOpen,
  }), [saved, company, data, forms, recent, peek, creating, paletteOpen, copilotOpen, pageTitle, returnTo])

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>
}

export function useErp() {
  const state = useContext(ErpContext)
  if (!state) throw new Error('useErp must be used inside ErpProvider')
  return state
}
