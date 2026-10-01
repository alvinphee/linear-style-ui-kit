import { navigate } from '@/lib/router'

// Routes inside the ERP template, under #/templates/erp:
//   /login                 sign in
//   /companies             choose a company
//   /home/launchpad        the launchpad
//   /<module>/<page>       any module page, e.g. /accounting/invoices

export const BASE = '/templates/erp'

export type ErpRoute =
  | { screen: 'login' }
  | { screen: 'companies' }
  | { screen: 'app'; module: string; page: string | null }

export function parseRoute(path: string): ErpRoute {
  const rest = path.slice(BASE.length).split('?')[0].split('/').filter(Boolean)
  if (rest[0] === 'login') return { screen: 'login' }
  if (rest[0] === 'companies') return { screen: 'companies' }
  return { screen: 'app', module: rest[0] ?? 'home', page: rest[1] ?? null }
}

export const erpHref = (module: string, page?: string) => `#${BASE}/${module}${page ? `/${page}` : ''}`

export function go(module: string, page?: string) {
  navigate(`${BASE}/${module}${page ? `/${page}` : ''}`)
}

export const goScreen = (screen: 'login' | 'companies') => navigate(`${BASE}/${screen}`)
