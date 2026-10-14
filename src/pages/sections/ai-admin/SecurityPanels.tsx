import { useId, useState } from 'react'
import { toast } from 'sonner'
import { AuditLog } from '@/blocks/audit-log'
import { DomainVerification, type VerifiedDomain } from '@/blocks/domain-verification'
import { EMPTY_SSO_CONFIG, SsoSetup, type SsoConfig, type SsoTestResult } from '@/blocks/sso-setup'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Panel } from '../shared'
import { at, now, USER } from '../ai/data'
import { AI_AUDIT_ACTIONS, AI_AUDIT_EVENTS, AUDIT_ACTORS, AUDIT_NOW, AUDIT_PRESETS } from '../ai/admin/audit-data'
import { SERVICE_PROVIDER } from '../ai/admin/SsoTab'

// The admin console's security blocks on their own: SSO set-up live for SAML
// and for OpenID Connect (choose whether the next test sign-in works),
// domain verification, and the audit log fed with the AI app's events.

type Outcome = 'success' | 'failure'

function fakeTest(outcome: Outcome): Promise<SsoTestResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(outcome === 'success'
      ? { ok: true, at: now(), attributes: { email: USER.email, name: USER.name, groups: ['Assistant users', 'Operations'] } }
      : { ok: false, at: now(), error: 'The identity provider answered “invalid_client”: the client ID or secret is wrong.' }), 1200)
  })
}

const OIDC_START: SsoConfig = {
  ...EMPTY_SSO_CONFIG,
  protocol: 'oidc',
  oidc: { issuer: 'https://idp.example.com', clientId: 'assistant-web-7f3k', clientSecretSet: false },
  mapping: { email: 'email', firstName: 'given_name', lastName: 'family_name', groups: 'groups' },
}

const SAMPLE_DOMAINS: VerifiedDomain[] = [
  { domain: 'example.com', status: 'verified', txtName: '_assistant-challenge.example.com', txtValue: 'assistant-verification=1x9q2v7k7q3x', verifiedAt: at(41, 10, 5) },
  { domain: 'acme-logistics.example', status: 'pending', txtName: '_assistant-challenge.acme-logistics.example', txtValue: 'assistant-verification=8m2c0rw4k7q3x' },
  { domain: 'eu.example.com', status: 'failed', txtName: '_assistant-challenge.eu.example.com', txtValue: 'assistant-verification=3hz61bqk7q3x' },
]

function SsoDemo({ title, note, initial }: { title: string; note: string; initial: SsoConfig }) {
  const [config, setConfig] = useState(initial)
  const [outcome, setOutcome] = useState<Outcome>('success')
  const id = useId()
  return (
    <Panel title={title} note={note}>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span id={`${id}-outcome`} className="text-muted-foreground text-xs">Next test</span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={outcome}
            onValueChange={(v) => v && setOutcome(v as Outcome)}
            aria-labelledby={`${id}-outcome`}
          >
            <ToggleGroupItem value="success">Works</ToggleGroupItem>
            <ToggleGroupItem value="failure">Fails</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="rounded-md border">
          <SsoSetup
            config={config}
            onChange={setConfig}
            onTest={() => fakeTest(outcome)}
            onEnable={() => {
              setConfig((c) => ({ ...c, enabled: true }))
              toast.success('SSO is on', { description: 'Demo only.' })
            }}
            onDisable={() => setConfig((c) => ({ ...c, enabled: false }))}
            spDetails={SERVICE_PROVIDER}
          />
        </div>
      </div>
    </Panel>
  )
}

export function SecurityPanels() {
  const [domains, setDomains] = useState(SAMPLE_DOMAINS)

  return (
    <>
      <SsoDemo title="SSO set-up: SAML 2.0" note="Metadata URL, XML upload or typed in" initial={EMPTY_SSO_CONFIG} />
      <SsoDemo title="SSO set-up: OpenID Connect" note="Issuer and client ID filled in; save a secret" initial={OIDC_START} />
      <Panel title="Domain verification" note="Verified, pending and failed; add one" wide>
        <div className="rounded-md border">
          <DomainVerification
            domains={domains}
            onAdd={(domain) => setDomains((list) => [...list, {
              domain, status: 'pending', txtName: `_assistant-challenge.${domain}`, txtValue: `assistant-verification=${domain.length.toString(36)}d4ta9k7q3x`,
            }])}
            // A pending domain verifies; a failed one fails again, to show both.
            onVerify={(domain) => new Promise<void>((resolve) => window.setTimeout(() => {
              setDomains((list) => list.map((d) => d.domain !== domain ? d
                : d.status === 'pending' ? { ...d, status: 'verified', verifiedAt: now() } : { ...d, status: 'failed' }))
              resolve()
            }, 1400))}
            onRemove={(domain) => setDomains((list) => list.filter((d) => d.domain !== domain))}
          />
        </div>
      </Panel>
      <Panel title="Audit log" note="The AI app’s events: 30 days, export CSV" wide>
        <AuditLog
          events={AI_AUDIT_EVENTS}
          actions={AI_AUDIT_ACTIONS}
          actors={AUDIT_ACTORS}
          now={AUDIT_NOW}
          presets={AUDIT_PRESETS}
          csvFilename="ai-audit-log"
        />
      </Panel>
    </>
  )
}
