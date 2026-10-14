import type { View } from './types'

// The AI chat app's addresses, so a chat, a project or a settings section can
// be linked to, reloaded and reached with the back button:
//   #/templates/ai-chat                       a new chat
//   #/templates/ai-chat/project/<id>/new      a new chat in a project
//   #/templates/ai-chat/chat/<id>             a chat
//   #/templates/ai-chat/project/<id>[/<tab>]  a project's page, at a tab
//   #/templates/ai-chat/library               All chats
//   #/templates/ai-chat/knowledge[/<id>[/<tab>]]  knowledge bases, or one at a tab
//   #/templates/ai-chat/agents[/new | /<id>[/<tab> | /edit]]  agents, the builder
//   #/templates/ai-chat/runs[/<id>]           the runs inbox, one run open
//   #/templates/ai-chat/settings[/<section>]  Settings
//   #/templates/ai-chat/admin[/<section>]     the admin console
// Only the full-page app uses them; in the kit the workspace sits in a card.

export const APP_BASE = '/templates/ai-chat'
// The template's old address.
const OLD_BASE = '/mockups/ai-chat'

// The app's own addresses; anything else is the kit or another template.
export const isAppPath = (path: string) =>
  [APP_BASE, OLD_BASE].some((base) => path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`))

// settings and admin: undefined when that page isn't open, null for its list of
// sections (the first section on a wide screen).
export type AppRoute = { view: View | null; settings: string | null | undefined; admin: string | null | undefined }

export function parseRoute(path: string): AppRoute {
  const base = path.startsWith(OLD_BASE) ? OLD_BASE : APP_BASE
  const [kind, id, extra] = path.split('?')[0].slice(base.length).split('/').filter(Boolean).map(decodeURIComponent)
  if (kind === 'settings') return { view: null, settings: id ?? null, admin: undefined }
  if (kind === 'admin') return { view: null, settings: undefined, admin: id ?? null }
  const view: View | null =
    !kind ? { kind: 'new', projectId: null }
      : kind === 'chat' && id ? { kind: 'chat', chatId: id }
        : kind === 'project' && id
          ? (extra === 'new' ? { kind: 'new', projectId: id } : { kind: 'project', projectId: id, tab: extra || undefined })
          : kind === 'library' ? { kind: 'library' }
            : kind === 'knowledge' ? { kind: 'knowledge', baseId: id, tab: extra }
              : kind === 'agents' ? { kind: 'agents', agentId: id, tab: extra }
                : kind === 'runs' ? { kind: 'runs', runId: id }
                  : null
  return { view, settings: undefined, admin: undefined }
}

export function pathFor(view: View) {
  switch (view.kind) {
    case 'chat': return `${APP_BASE}/chat/${encodeURIComponent(view.chatId)}`
    case 'project': {
      const base = `${APP_BASE}/project/${encodeURIComponent(view.projectId)}`
      return view.tab && view.tab !== 'overview' ? `${base}/${encodeURIComponent(view.tab)}` : base
    }
    case 'library': return `${APP_BASE}/library`
    case 'agents': {
      // The gallery's tab (Yours, Shared, Explore) stays out of the address.
      if (!view.agentId) return `${APP_BASE}/agents`
      const base = `${APP_BASE}/agents/${encodeURIComponent(view.agentId)}`
      return view.tab && view.tab !== 'overview' ? `${base}/${encodeURIComponent(view.tab)}` : base
    }
    case 'runs': return view.runId ? `${APP_BASE}/runs/${encodeURIComponent(view.runId)}` : `${APP_BASE}/runs`
    case 'knowledge': {
      if (!view.baseId) return `${APP_BASE}/knowledge`
      const base = `${APP_BASE}/knowledge/${encodeURIComponent(view.baseId)}`
      return view.tab && view.tab !== 'documents' ? `${base}/${encodeURIComponent(view.tab)}` : base
    }
    case 'new': return view.projectId ? `${APP_BASE}/project/${encodeURIComponent(view.projectId)}/new` : APP_BASE
  }
}

export const settingsPath = (section: string | null) => `${APP_BASE}/settings${section ? `/${encodeURIComponent(section)}` : ''}`
export const adminPath = (section: string | null) => `${APP_BASE}/admin${section ? `/${encodeURIComponent(section)}` : ''}`

// Settings and the admin console fill the window, with no view behind them.
export const isFullPage = (route: AppRoute) => route.settings !== undefined || route.admin !== undefined
