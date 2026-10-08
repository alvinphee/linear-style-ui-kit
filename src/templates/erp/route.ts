import { navigate } from '@/lib/router'
import { edition } from './edition'

// Routes inside the ERP template, under #/templates/erp (or #/templates/erp-ai
// for the ERP + AI edition):
//   /login                 sign in
//   /companies             choose a company
//   /home/launchpad        the launchpad
//   /home/assistant        the full-page Assistant (ERP + AI only)
//   /home/project/<id>     a project's page: instructions, knowledge, chats (ERP + AI only)
//   /<module>/<page>       any module page, e.g. /accounting/invoices
//   /<module>/<page>/<id>  one thing on that page, e.g. a form to fill in:
//                          /forms/catalogue/vehicle-check?context=SGX-4821
//                          (the deep link a QR code carries)

// Where the routes start, by edition.
export const base = () => edition().base

export type ErpRoute =
  | { screen: 'login' }
  | { screen: 'companies' }
  | { screen: 'app'; module: string; page: string | null; rest: string | null }

export function parseRoute(path: string): ErpRoute {
  const rest = path.slice(base().length).split('?')[0].split('/').filter(Boolean)
  if (rest[0] === 'login') return { screen: 'login' }
  if (rest[0] === 'companies') return { screen: 'companies' }
  return { screen: 'app', module: rest[0] ?? 'home', page: rest[1] ?? null, rest: rest[2] ? decodeURIComponent(rest[2]) : null }
}

// The query string of a route: "?context=SGX-4821" → { context: 'SGX-4821' }.
export function routeQuery(path: string): Record<string, string> {
  const q = path.split('?')[1]
  return q ? Object.fromEntries(new URLSearchParams(q)) : {}
}

export const erpPath = (module: string, page?: string, rest?: string, query?: Record<string, string | undefined>) => {
  const params = new URLSearchParams(Object.entries(query ?? {}).filter((e): e is [string, string] => !!e[1]))
  const search = params.toString()
  return `${base()}/${module}${page ? `/${page}` : ''}${rest ? `/${encodeURIComponent(rest)}` : ''}${search ? `?${search}` : ''}`
}

export const erpHref = (module: string, page?: string, rest?: string, query?: Record<string, string | undefined>) =>
  `#${erpPath(module, page, rest, query)}`

export function go(module: string, page?: string, rest?: string, query?: Record<string, string | undefined>) {
  navigate(erpPath(module, page, rest, query))
}

export const goScreen = (screen: 'login' | 'companies') => navigate(`${base()}/${screen}`)
