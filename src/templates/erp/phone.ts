import { go } from './route'
import type { ErpModule } from './types'

// The window width the ERP's phone layout (PhoneShell) is for: below
// Tailwind's md breakpoint, where the desktop shell's sidebar would be a sheet.
export const PHONE = '(max-width: 767px)'
export const isPhone = () => typeof window !== 'undefined' && window.matchMedia(PHONE).matches

// Opens a module: on a phone, its list of pages (…/<module>, a screen of its
// own there); wider, its first page.
export function openModule(m: ErpModule) {
  if (isPhone() && m.id !== 'home') go(m.id)
  else go(m.id, m.pages[0].id)
}
