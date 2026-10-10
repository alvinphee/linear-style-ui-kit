import type { View } from './types'

// The AI chat app's addresses, so a chat, a project or a settings section can
// be linked to, reloaded and reached with the back button:
//   #/templates/ai-chat                       a new chat
//   #/templates/ai-chat/project/<id>/new      a new chat in a project
//   #/templates/ai-chat/chat/<id>             a chat
//   #/templates/ai-chat/project/<id>[/<tab>]  a project's page, at a tab
//   #/templates/ai-chat/library               All chats
//   #/templates/ai-chat/knowledge[/<id>[/<tab>]]  knowledge bases, or one at a tab
//   #/templates/ai-chat/settings[/<section>]  Settings
// Only the full-page app uses them; in the kit the workspace sits in a card.

export const APP_BASE = '/templates/ai-chat'
// The template's old address.
const OLD_BASE = '/mockups/ai-chat'

// The app's own addresses; anything else is the kit or another template.
export const isAppPath = (path: string) =>
  [APP_BASE, OLD_BASE].some((base) => path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`))

export type AppRoute ={ view: View | null; settings: string | null | undefined }

export function parseRoute(path: string): AppRoute {
  const base = path.startsWith(OLD_BASE) ? OLD_BASE : APP_BASE
  const [kind, id, extra] = path.split('?')[0].slice(base.length).split('/').filter(Boolean).map(decodeURIComponent)
  if (kind === 'settings') return { view: null, settings: id ?? null }
  const view: View | null =
    !kind ? { kind: 'new', projectId: null }
      : kind === 'chat' && id ? { kind: 'chat', chatId: id }
        : kind === 'project' && id
          ? (extra === 'new' ? { kind: 'new', projectId: id } : { kind: 'project', projectId: id, tab: extra || undefined })
          : kind === 'library' ? { kind: 'library' }
            : kind === 'knowledge' ? { kind: 'knowledge', baseId: id, tab: extra }
            : null
  return { view, settings: undefined }
}

export function pathFor(view: View) {
  switch (view.kind) {
    case 'chat': return `${APP_BASE}/chat/${encodeURIComponent(view.chatId)}`
    case 'project': {
      const base = `${APP_BASE}/project/${encodeURIComponent(view.projectId)}`
      return view.tab && view.tab !== 'overview' ? `${base}/${encodeURIComponent(view.tab)}` : base
    }
    case 'library': return `${APP_BASE}/library`
    case 'knowledge': {
      if (!view.baseId) return `${APP_BASE}/knowledge`
      const base = `${APP_BASE}/knowledge/${encodeURIComponent(view.baseId)}`
      return view.tab && view.tab !== 'documents' ? `${base}/${encodeURIComponent(view.tab)}` : base
    }
    case 'new': return view.projectId ? `${APP_BASE}/project/${encodeURIComponent(view.projectId)}/new` : APP_BASE
  }
}

export const settingsPath = (section: string | null) => `${APP_BASE}/settings${section ? `/${encodeURIComponent(section)}` : ''}`
