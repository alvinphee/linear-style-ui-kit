// The ERP template comes in two editions that share all their code:
//   erp     #/templates/erp     Ask AI as a side panel (the copilot)
//   erp-ai  #/templates/erp-ai  the same, plus a full-page Assistant, a prompt
//                               box and an AI briefing on the launchpad, and
//                               a Start page setting
// The ERP + AI template (src/templates/erp-ai) renders ErpApp with WITH_AI.

export type Edition = {
  id: 'erp' | 'erp-ai'
  // Where its routes start.
  base: string
  // The full-page Assistant and everything that goes with it.
  assistant: boolean
}

export const CLASSIC: Edition = { id: 'erp', base: '/templates/erp', assistant: false }
export const WITH_AI: Edition = { id: 'erp-ai', base: '/templates/erp-ai', assistant: true }

let current = CLASSIC

// ErpApp sets this as it renders. Only one edition is on screen at a time,
// and switching template remounts the app, so plain functions (go(),
// parseRoute()) can read it without a context.
export function setEdition(edition: Edition) {
  current = edition
}

export const edition = () => current

// The Home page you land on after signing in: the Start page setting, which
// only the ERP + AI edition offers.
export const landingPage = (startPage: 'launchpad' | 'assistant') => (current.assistant ? startPage : 'launchpad')
