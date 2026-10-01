import { useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { LockIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { usePath } from '@/lib/router'
import { CommandPalette } from './CommandPalette'
import { CopilotPanel } from './Copilot'
import { ROLE_LABEL } from './data'
import { ListPage } from './ListPage'
import { Login, Companies } from './Login'
import { MODULES, moduleById, pageFor } from './modules'
import { CreateDialog, RecordPeek } from './Overlays'
import { BASE, go, parseRoute } from './route'
import { Shell } from './Shell'
import { ErpProvider, useErp } from './store'

// The ERP template: #/templates/erp. A complete multi-module app made from
// the kit: sign-in, company picker, launchpad, module pages, command
// palette, side panels and an AI copilot. All data is made up.

export default function ErpApp() {
  return (
    <ErpProvider>
      <ErpRoutes />
    </ErpProvider>
  )
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]')

function ErpRoutes() {
  const path = usePath()
  const route = parseRoute(path)
  const { session, company, setPaletteOpen, setCopilotOpen, startCreate, peek, closePeek } = useErp()

  // Guards: sign in first, then choose a company. Replace, so Back skips them.
  const target = !session ? 'login' : !company && route.screen !== 'companies' ? 'companies' : session && route.screen === 'login' ? 'home' : null
  useEffect(() => {
    if (target === 'home') window.location.replace(`#${BASE}/home/launchpad`)
    else if (target) window.location.replace(`#${BASE}/${target}`)
  }, [target])

  const module = route.screen === 'app' ? moduleById(route.module) ?? MODULES[0] : MODULES[0]
  const page = route.screen === 'app' ? module.pages.find((p) => p.id === route.page) ?? module.pages[0] : module.pages[0]
  const allowed = !!session && module.roles.includes(session.role)

  const inApp = route.screen === 'app' && !!session && !!company
  useEffect(() => {
    if (!inApp) return
    document.title = `${page.label} · ${module.name} · Acme ERP`
    document.getElementById('erp-main')?.scrollTo({ top: 0 })
  }, [inApp, module, page])

  // Leaving a page closes its side panel. A record opened for the page you
  // land on (from the palette) stays open.
  const peekRef = useRef({ peek, closePeek })
  peekRef.current = { peek, closePeek }
  useEffect(() => {
    const { peek: open, closePeek: close } = peekRef.current
    if (open && pageFor(open.entity)?.page !== page) close()
  }, [page])

  // Ctrl+K / ⌘K palette, Ctrl+J / ⌘J copilot, G then a letter to jump to a
  // module, C to create on a list page.
  const pressedG = useRef(0)
  const state = useRef({ module, page, session })
  state.current = { module, page, session }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setCopilotOpen(true)
        return
      }
      if (mod || e.altKey || isTyping(e.target) || !state.current.session) return
      const key = e.key.toUpperCase()
      if (pressedG.current && Date.now() - pressedG.current < 1200) {
        pressedG.current = 0
        const m = MODULES.find((x) => x.key === key && state.current.session && x.roles.includes(state.current.session.role))
        if (m) {
          e.preventDefault()
          go(m.id, m.pages[0].id)
        }
        return
      }
      if (key === 'G') pressedG.current = Date.now()
      else if (e.key === '/') {
        e.preventDefault()
        setPaletteOpen(true)
      } else if (key === 'C' && state.current.page.list?.create) {
        e.preventDefault()
        startCreate(state.current.page.list.entity)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaletteOpen, setCopilotOpen, startCreate])

  if (!session || route.screen === 'login') return <Login />
  if (!company || route.screen === 'companies') return <Companies />

  return (
    <Shell module={module} page={page}>
      {allowed ? (
        page.render ? page.render() : page.list ? <ListPage key={`${module.id}/${page.id}`} spec={page.list} /> : null
      ) : (
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon"><HugeiconsIcon icon={LockIcon} strokeWidth={2} /></EmptyMedia>
            <EmptyTitle>You don't have access to {module.name}</EmptyTitle>
            <EmptyDescription>
              Your role is {ROLE_LABEL[session.role]}. Ask an administrator to add {module.name} to your role, or switch role from your account menu.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => go('home', 'launchpad')}>Go to the launchpad</Button>
          </EmptyContent>
        </Empty>
      )}
      <CommandPalette module={module} />
      <RecordPeek />
      <CreateDialog />
      <CopilotPanel />
    </Shell>
  )
}
