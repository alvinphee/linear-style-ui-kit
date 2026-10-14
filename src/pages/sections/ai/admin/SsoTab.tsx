import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Key01Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { DomainVerification, type VerifiedDomain } from '@/blocks/domain-verification'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import {
  EMPTY_SSO_CONFIG, SsoSetup, type SsoConfig, type SsoServiceProvider, type SsoTestResult,
} from '@/blocks/sso-setup'
import { CopyField } from '@/components/copy-field'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatShortDate } from '@/lib/format'
import { at, now, USER } from '../data'
import { useStoredState } from '../settings/prefs'
import { ORG, useOrgPolicy } from './org'

// The admin console's SSO and provisioning section: the organisation's
// domains (verified with a DNS TXT record), SAML or OIDC single sign-on,
// Require SSO, and SCIM provisioning. Nothing talks to a server: the DNS
// check, the test sign-in and the SCIM token are made up, and everything
// but the token is kept in this browser.

export const SSO_KEY = 'linear-kit:ai-org-sso:v1'
const DOMAINS_KEY = 'linear-kit:ai-org-domains:v1'
const SCIM_KEY = 'linear-kit:ai-org-scim:v1'

// The organisation's SSO set-up, shared with the Security policies section.
export function useOrgSso() {
  return useStoredState<SsoConfig>(SSO_KEY, EMPTY_SSO_CONFIG)
}

// Our side of the connection: where the identity provider sends people back.
export const SERVICE_PROVIDER: SsoServiceProvider = {
  entityId: `https://assistant.example.com/sso/${ORG.id}`,
  acsUrl: `https://assistant.example.com/sso/${ORG.id}/saml/acs`,
  metadataUrl: `https://assistant.example.com/sso/${ORG.id}/saml/metadata.xml`,
  redirectUri: `https://assistant.example.com/sso/${ORG.id}/oidc/callback`,
}

// A made-up TXT record value: the same for a domain on every visit.
function txtValue(domain: string) {
  let hash = 2166136261
  for (const c of domain) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619)
  return `assistant-verification=${(hash >>> 0).toString(36)}${domain.length.toString(36)}k7q3x`
}

const domainRecord = (domain: string, status: VerifiedDomain['status'], verifiedAt?: number): VerifiedDomain => ({
  domain, status, txtName: `_assistant-challenge.${domain}`, txtValue: txtValue(domain), verifiedAt,
})

const SAMPLE_DOMAINS: VerifiedDomain[] = [
  domainRecord(ORG.domain, 'verified', at(41, 10, 5)),
  domainRecord('acme-logistics.example', 'pending'),
]

// The attributes a test sign-in sends back: the signed-in admin's own.
const TEST_ATTRIBUTES = { email: USER.email, name: USER.name, groups: ['Assistant users', 'Operations', 'Org admins'] }

// Pretends to sign in through the identity provider. A certificate pasted by
// hand that is too short to be real fails, so the failure can be seen too.
export function simulateSsoTest(config: SsoConfig, ms = 1200): Promise<SsoTestResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const shortCert = config.protocol === 'saml' && config.saml.source === 'manual' && config.saml.certificate.replace(/\s|-+[A-Z ]+-+/g, '').length < 200
      resolve(shortCert
        ? { ok: false, at: now(), error: 'The response’s signature didn’t match the certificate. Check you pasted the identity provider’s current signing certificate.' }
        : { ok: true, at: now(), attributes: TEST_ATTRIBUTES })
    }, ms)
  })
}

type ScimState = {
  enabled: boolean
  // Never the token itself: only its last four characters, for the masked copy.
  tokenEnd: string | null
  tokenCreated: number | null
}

const SCIM_INITIAL: ScimState = { enabled: false, tokenEnd: null, tokenCreated: null }
const SCIM_BASE_URL = `https://assistant.example.com/scim/v2/${ORG.id}`

// A made-up bearer token: 40 random letters and digits.
function newScimToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = new Uint8Array(40)
  crypto.getRandomValues(bytes)
  return `scim_${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`
}

export function SsoTab() {
  const id = useId()
  const [domains, setDomains] = useStoredState<VerifiedDomain[]>(DOMAINS_KEY, SAMPLE_DOMAINS)
  const [sso, setSso] = useOrgSso()
  const [scim, setScim] = useStoredState<ScimState>(SCIM_KEY, SCIM_INITIAL)
  const { policy, patch } = useOrgPolicy()
  // The new token, shown once until the admin hides it or leaves the page.
  const [freshToken, setFreshToken] = useState<string | null>(null)
  const active = sso.enabled
  const verified = domains.filter((d) => d.status === 'verified')

  function verify(domain: string) {
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        // The sample domain's record is in place; a newly added domain fails
        // its first check (the record isn't there yet) and passes the next.
        setDomains((list) => list.map((d) => {
          if (d.domain !== domain) return d
          const passes = d.domain === 'acme-logistics.example' || d.status === 'failed'
          return passes ? { ...d, status: 'verified', verifiedAt: now() } : { ...d, status: 'failed' }
        }))
        resolve()
      }, 1400)
    })
  }

  function generateToken() {
    const token = newScimToken()
    setFreshToken(token)
    setScim((s) => ({ ...s, tokenEnd: token.slice(-4), tokenCreated: now() }))
  }

  return (
    <>
      <SettingsHeader
        title="SSO and provisioning"
        description={`How people at ${ORG.name} sign in through your identity provider, and how their accounts are created and removed.`}
      />

      <SettingsGroup title="Domains" description="Verify the email domains your organisation owns. SSO and provisioning apply to people at verified domains.">
        <DomainVerification
          domains={domains}
          onAdd={(domain) => {
            setDomains((list) => [...list, domainRecord(domain, 'pending')])
            toast(`${domain} added`, { description: 'Add its TXT record at your DNS host, then verify it.' })
          }}
          onVerify={verify}
          onRemove={(domain) => {
            setDomains((list) => list.filter((d) => d.domain !== domain))
            toast(`${domain} removed`)
          }}
        />
      </SettingsGroup>

      <SettingsGroup title="Single sign-on (SSO)" description="Let people sign in with your identity provider’s account instead of a password.">
        <SsoSetup
          config={sso}
          onChange={setSso}
          onTest={(config) => simulateSsoTest(config)}
          onEnable={() => {
            setSso((c) => ({ ...c, enabled: true }))
            toast.success('SSO is on', { description: `People at ${verified.map((d) => d.domain).join(', ') || 'your verified domains'} can sign in with it. Demo only.` })
          }}
          onDisable={() => {
            setSso((c) => ({ ...c, enabled: false }))
            if (policy.security.ssoRequired) patch('security', { ...policy.security, ssoRequired: false })
            toast('SSO is off', { description: 'People sign in with a password or passkey again.' })
          }}
          spDetails={SERVICE_PROVIDER}
        />
      </SettingsGroup>

      <SettingsGroup title="Enforcement">
        <SettingsRow
          label="Require SSO"
          htmlFor={`${id}-require`}
          hint={active
            ? 'Everyone at a verified domain must sign in through your identity provider. Owners can still use a password, in case it is down.'
            : 'Turn on SSO first: set it up above and run a test sign-in.'}
        >
          <Switch
            id={`${id}-require`}
            checked={active && policy.security.ssoRequired}
            disabled={!active}
            onCheckedChange={(on) => {
              patch('security', { ...policy.security, ssoRequired: on })
              toast(on ? 'SSO is required' : 'SSO is optional', {
                description: on ? 'Passwords and passkeys stop working for people at verified domains.' : 'People may also use a password or passkey.',
              })
            }}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="SCIM provisioning"
        description="Your identity provider creates, updates and removes accounts and groups here, so leavers lose access straight away."
      >
        <SettingsRow label="SCIM provisioning" htmlFor={`${id}-scim`} hint={scim.enabled ? 'On' : 'Off. Accounts are made the first time someone signs in.'}>
          <Switch
            id={`${id}-scim`}
            checked={scim.enabled}
            onCheckedChange={(on) => {
              setScim((s) => ({ ...s, enabled: on }))
              if (!on) setFreshToken(null)
            }}
          />
        </SettingsRow>
        {scim.enabled && (
          <>
            <SettingsRow label="Base URL" hint="Paste it into your identity provider’s SCIM app." stacked>
              <CopyField value={SCIM_BASE_URL} label="SCIM base URL" />
            </SettingsRow>
            <SettingsRow
              label="Bearer token"
              hint={scim.tokenEnd
                ? `Made ${formatShortDate(scim.tokenCreated ?? now(), { year: true })}. It is shown only once; regenerate it if it is lost.`
                : 'Your identity provider sends it with every request.'}
              stacked
            >
              {freshToken ? (
                <div className="grid min-w-0 gap-2">
                  <p role="alert" className="text-status-blocked flex items-start gap-1.5 text-[11px]">
                    <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-px size-3.5 shrink-0" />
                    Copy it now. You won’t see it again.
                  </p>
                  <CopyField value={freshToken} label="SCIM bearer token" />
                  <Button variant="outline" size="sm" className="w-fit" onClick={() => setFreshToken(null)}>I’ve copied it</Button>
                </div>
              ) : scim.tokenEnd ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <code className="bg-muted min-w-0 truncate rounded-md px-2 py-1 font-mono text-[11px]" aria-label={`Token ending ${scim.tokenEnd}`}>
                    scim_••••••••••••{scim.tokenEnd}
                  </code>
                  <DeleteConfirm
                    icon={null}
                    destructive={false}
                    title="Regenerate the SCIM token?"
                    description="The current token stops working straight away. Provisioning pauses until you paste the new one into your identity provider."
                    confirmLabel="Regenerate"
                    size="sm"
                    onConfirm={generateToken}
                  >
                    <Button variant="outline" size="sm">
                      <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" /> Regenerate
                    </Button>
                  </DeleteConfirm>
                </div>
              ) : (
                <Button size="sm" className="w-fit" onClick={generateToken}>
                  <HugeiconsIcon icon={Key01Icon} strokeWidth={2} data-icon="inline-start" /> Generate token
                </Button>
              )}
            </SettingsRow>
            <p className="text-muted-foreground px-3 py-2.5 text-[11px]" aria-live="polite">
              {scim.tokenEnd
                ? <>Last sync 12 min ago · 21 users, 4 groups</>
                : 'Waiting for the first sync: generate a token and add it to your identity provider.'}
            </p>
          </>
        )}
      </SettingsGroup>
    </>
  )
}
