import { useCallback } from 'react'
import type { ModelId } from '../types'
import { useStoredState } from '../settings/prefs'

// The organisation the signed-in person belongs to, and the policies its
// admins set in the admin console. Kept in this browser so the mockup holds
// together: a connector turned off here shows as "Disabled by admin" in
// Settings, a feature turned off disappears from the prompt box, and so on.

export type OrgRole = 'owner' | 'admin' | 'member'

// What the organisation lets people do. Each switch is read by the app.
export type OrgPolicy = {
  // Models people may pick; the rest are hidden.
  models: ModelId[]
  features: {
    webSearch: boolean
    research: boolean
    voice: boolean
    imageGeneration: boolean
    codeExecution: boolean
    memory: boolean
    // Shared links to chats outside the organisation.
    publicLinks: boolean
    // People may make agents; off: only admins.
    agents: boolean
  }
  connectors: {
    // Connector ids turned off for everyone.
    blocked: string[]
    // People may add their own remote MCP servers.
    customServers: boolean
    // Tools that send or change things always ask first, whatever a person chose.
    approvalForWrites: boolean
  }
  // Days chats are kept; null keeps them until people delete them.
  retentionDays: number | null
  // Chats are never used to train models (the organisation's choice, not each person's).
  trainingOptOut: boolean
  security: {
    ssoRequired: boolean
    twoStepRequired: boolean
    // Hours before people sign in again.
    sessionHours: number
  }
}

export const DEFAULT_ORG_POLICY: OrgPolicy = {
  models: ['swift', 'balanced', 'depth', 'depth-max'],
  features: {
    webSearch: true, research: true, voice: true, imageGeneration: false, codeExecution: true, memory: true,
    publicLinks: true, agents: true,
  },
  connectors: { blocked: ['crm', 'design-files'], customServers: true, approvalForWrites: true },
  retentionDays: null,
  trainingOptOut: true,
  security: { ssoRequired: false, twoStepRequired: false, sessionHours: 24 * 14 },
}

export const ORG = {
  id: 'org-acme',
  name: 'Acme',
  domain: 'example.com',
  plan: 'Team',
  seats: 25,
}

// The signed-in person's role in the organisation: Alex Morgan owns it.
export const MY_ROLE: OrgRole = 'owner'

export const ORG_POLICY_KEY = 'linear-kit:ai-org-policy:v1'

export function useOrgPolicy() {
  const [policy, setPolicy] = useStoredState<OrgPolicy>(ORG_POLICY_KEY, DEFAULT_ORG_POLICY)
  const patch = useCallback(<K extends keyof OrgPolicy>(key: K, value: OrgPolicy[K]) => {
    setPolicy((p) => ({ ...p, [key]: value }))
  }, [setPolicy])
  const reset = useCallback(() => setPolicy(DEFAULT_ORG_POLICY), [setPolicy])
  return { policy, setPolicy, patch, reset }
}
