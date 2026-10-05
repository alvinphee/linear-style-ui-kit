import { navigate } from '@/lib/router'
import { edition } from './edition'

// Routes inside the ERP template, under #/templates/erp (or #/templates/erp-ai
// for the ERP + AI edition):
//   /login                 sign in
//   /companies             choose a company
//   /home/launchpad        the launchpad
//   /home/assistant        the full-page Assistant (ERP + AI only)
//   /<module>/<page>       any module page, e.g. /accounting/invoices

// Where the routes start, by edition.
export const base = () => edition().base

export type ErpRoute =
  | { screen: 'login' }
  | { screen: 'companies' }
  | { screen: 'app'; module: string; page: string | null }

export function parseRoute(path: string): ErpRoute {
  const rest = path.slice(base().length).split('?')[0].split('/').filter(Boolean)
  if (rest[0] === 'login') return { screen: 'login' }
  if (rest[0] === 'companies') return { screen: 'companies' }
  return { screen: 'app', module: rest[0] ?? 'home', page: rest[1] ?? null }
}

export const erpHref = (module: string, page?: string) => `#${base()}/${module}${page ? `/${page}` : ''}`

export function go(module: string, page?: string) {
  navigate(`${base()}/${module}${page ? `/${page}` : ''}`)
}

export const goScreen = (screen: 'login' | 'companies') => navigate(`${base()}/${screen}`)
