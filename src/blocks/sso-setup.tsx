import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleIcon, CheckmarkCircle02Icon, Login03Icon, Tick02Icon, Upload01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { CopyField } from '@/components/copy-field'
import { DeleteConfirm } from '@/components/delete-confirm'
import { FileChip } from '@/components/file-chip'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatTime } from '@/lib/format'

// Single sign-on (SSO) set-up, as an admin console walks an admin through
// it: pick the protocol (SAML 2.0 or OpenID Connect), then three steps.
//   1. Copy our service provider details into the identity provider.
//   2. Give us the identity provider's details: for SAML its metadata URL,
//      its metadata XML file, or the SSO URL, entity ID and X.509
//      certificate typed in; for OIDC the issuer URL, client ID and client
//      secret. Then which identity provider attribute holds each of email,
//      first name, last name and groups (attribute mapping).
//   3. Test sign-in, which shows the attributes that came back, then turn
//      SSO on. Its status reads Not set up, Testing or Active.
//
// The client secret is write-only: it is typed into a password field, handed
// to `onClientSecret` and cleared. The config only records that one is set.
//
// No data of its own: the app keeps the config and runs the test.

export type SsoProtocol = 'saml' | 'oidc'
export type SsoStatus = 'not-set-up' | 'testing' | 'active'
export type SamlSource = 'metadata-url' | 'metadata-file' | 'manual'
export type SsoAttribute = 'email' | 'firstName' | 'lastName' | 'groups'

export type SsoTestResult =
  | { ok: true; at: number; attributes: { email: string; name: string; groups: string[] } }
  | { ok: false; at: number; error: string }

export type SsoConfig = {
  protocol: SsoProtocol
  // SSO is on: people at verified domains can sign in through the identity provider.
  enabled: boolean
  saml: {
    source: SamlSource
    metadataUrl: string
    // The uploaded metadata file; its contents fill in the fields below.
    metadataFile: { name: string; size: number } | null
    ssoUrl: string
    entityId: string
    certificate: string
  }
  oidc: {
    issuer: string
    clientId: string
    // Never the secret itself.
    clientSecretSet: boolean
  }
  // Our attribute → the identity provider's attribute name.
  mapping: Record<SsoAttribute, string>
  // Cleared whenever the identity provider's details change.
  lastTest: SsoTestResult | null
}

export type SsoServiceProvider = {
  entityId: string
  acsUrl: string
  metadataUrl: string
  // OIDC's redirect URI. Defaults to the ACS URL.
  redirectUri?: string
}

const DEFAULT_MAPPING: Record<SsoProtocol, Record<SsoAttribute, string>> = {
  saml: { email: 'email', firstName: 'firstName', lastName: 'lastName', groups: 'groups' },
  oidc: { email: 'email', firstName: 'given_name', lastName: 'family_name', groups: 'groups' },
}

export const EMPTY_SSO_CONFIG: SsoConfig = {
  protocol: 'saml',
  enabled: false,
  saml: { source: 'metadata-url', metadataUrl: '', metadataFile: null, ssoUrl: '', entityId: '', certificate: '' },
  oidc: { issuer: '', clientId: '', clientSecretSet: false },
  mapping: DEFAULT_MAPPING.saml,
  lastTest: null,
}

const STATUS: Record<SsoStatus, { label: string; tone: Tone }> = {
  'not-set-up': { label: 'Not set up', tone: 'neutral' },
  testing: { label: 'Testing', tone: 'warning' },
  active: { label: 'Active', tone: 'success' },
}

const ATTRIBUTES: { id: SsoAttribute; label: string; required?: boolean }[] = [
  { id: 'email', label: 'Email', required: true },
  { id: 'firstName', label: 'First name' },
  { id: 'lastName', label: 'Last name' },
  { id: 'groups', label: 'Groups' },
]

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value.trim()).protocol === 'https:'
  } catch {
    return false
  }
}

// A PEM certificate, or just its base64 body.
const certificateBody = (text: string) =>
  text.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, '')
const isCertificate = (text: string) => /^[A-Za-z0-9+/]{64,}={0,2}$/.test(certificateBody(text))

// What is still missing before a test sign-in, or nothing when it can run.
export function ssoMissing(config: SsoConfig): string | undefined {
  if (config.protocol === 'saml') {
    const s = config.saml
    if (s.source === 'metadata-url' && !isHttpsUrl(s.metadataUrl)) return 'Enter the metadata URL.'
    if (s.source === 'metadata-file' && !s.metadataFile) return 'Upload the metadata XML file.'
    if (s.source === 'manual' && (!isHttpsUrl(s.ssoUrl) || !s.entityId.trim() || !isCertificate(s.certificate))) {
      return 'Enter the SSO URL, entity ID and certificate.'
    }
  } else {
    const o = config.oidc
    if (!isHttpsUrl(o.issuer) || !o.clientId.trim() || !o.clientSecretSet) return 'Enter the issuer URL, client ID and client secret.'
  }
  if (!config.mapping.email.trim()) return 'Map the email attribute.'
  return undefined
}

export function ssoStatus(config: SsoConfig): SsoStatus {
  if (config.enabled) return 'active'
  return ssoMissing(config) ? 'not-set-up' : 'testing'
}

export function SsoStatusBadge({ config }: { config: SsoConfig }) {
  const status = STATUS[ssoStatus(config)]
  return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
}

// Reads a SAML metadata file's entity ID, SSO URL and signing certificate.
function parseMetadata(xml: string) {
  const entityId = /entityID="([^"]+)"/.exec(xml)?.[1]
  const ssoUrl = /<(?:\w+:)?SingleSignOnService\b[^>]*\bLocation="([^"]+)"/.exec(xml)?.[1]
  const certificate = /<(?:\w+:)?X509Certificate>([^<]+)</.exec(xml)?.[1]?.replace(/\s+/g, '')
  return entityId && ssoUrl ? { entityId, ssoUrl, certificate: certificate ?? '' } : null
}

export function SsoSetup({ config, onChange, onTest, onEnable, onDisable, onClientSecret, spDetails, className }: {
  config: SsoConfig
  onChange: (config: SsoConfig) => void
  // Runs a test sign-in against the identity provider.
  onTest: (config: SsoConfig) => Promise<SsoTestResult>
  onEnable: () => void
  // Asked to confirm first.
  onDisable: () => void
  // Gets a newly typed client secret, to send to the server. It is never shown again.
  onClientSecret?: (secret: string) => void
  spDetails: SsoServiceProvider
  className?: string
}) {
  const id = useId()
  const [testing, setTesting] = useState(false)
  // The latest config, for writing the test's result after it settles.
  const latest = useRef(config)
  useEffect(() => {
    latest.current = config
  })

  const missing = ssoMissing(config)
  const tested = config.lastTest?.ok === true
  const saml = config.protocol === 'saml'

  // A change to the identity provider's details makes the last test stale.
  const setSaml = (patch: Partial<SsoConfig['saml']>) => onChange({ ...config, saml: { ...config.saml, ...patch }, lastTest: null })
  const setOidc = (patch: Partial<SsoConfig['oidc']>) => onChange({ ...config, oidc: { ...config.oidc, ...patch }, lastTest: null })

  function setProtocol(protocol: SsoProtocol) {
    const other = DEFAULT_MAPPING[config.protocol]
    const untouched = ATTRIBUTES.every((a) => config.mapping[a.id] === other[a.id])
    onChange({ ...config, protocol, mapping: untouched ? DEFAULT_MAPPING[protocol] : config.mapping, lastTest: null })
  }

  async function test() {
    setTesting(true)
    try {
      const result = await onTest(latest.current)
      onChange({ ...latest.current, lastTest: result })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className={cn('grid min-w-0 divide-y', className)}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs" id={`${id}-protocol`}>Protocol</span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={config.protocol}
            onValueChange={(v) => v && setProtocol(v as SsoProtocol)}
            disabled={config.enabled}
            aria-labelledby={`${id}-protocol`}
          >
            <ToggleGroupItem value="saml">SAML 2.0</ToggleGroupItem>
            <ToggleGroupItem value="oidc">OpenID Connect</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <SsoStatusBadge config={config} />
      </div>

      <ol className="grid min-w-0 divide-y">
        <Step n={1} done title="Add us to your identity provider" description={saml
          ? 'Create a SAML app in your identity provider and paste these into it.'
          : 'Create an OpenID Connect app (a web application) and add this redirect URI.'}>
          <dl className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center sm:gap-x-3">
            {saml ? (
              <>
                <dt className="text-muted-foreground text-[11px]">Entity ID</dt>
                <dd><CopyField value={spDetails.entityId} label="entity ID" /></dd>
                <dt className="text-muted-foreground text-[11px]">ACS URL</dt>
                <dd><CopyField value={spDetails.acsUrl} label="ACS URL" /></dd>
                <dt className="text-muted-foreground text-[11px]">Metadata URL</dt>
                <dd><CopyField value={spDetails.metadataUrl} label="metadata URL" /></dd>
              </>
            ) : (
              <>
                <dt className="text-muted-foreground text-[11px]">Redirect URI</dt>
                <dd><CopyField value={spDetails.redirectUri ?? spDetails.acsUrl} label="redirect URI" /></dd>
                <dt className="text-muted-foreground text-[11px]">Scopes</dt>
                <dd><CopyField value="openid email profile groups" label="scopes" /></dd>
              </>
            )}
          </dl>
        </Step>

        <Step n={2} done={!missing} title="Your identity provider’s details" description={saml
          ? 'Its metadata fills everything in. Without it, type the details in.'
          : 'From the app you made in step 1.'}>
          {saml ? <SamlDetails config={config} onSaml={setSaml} /> : (
            <OidcDetails config={config} onOidc={setOidc} onClientSecret={onClientSecret} />
          )}
          <AttributeMapping
            mapping={config.mapping}
            onChange={(mapping) => onChange({ ...config, mapping, lastTest: null })}
          />
        </Step>

        <Step n={3} done={tested} title="Test sign-in" description="Sign in once through your identity provider to check it works. Nobody else is affected.">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={!!missing || testing} onClick={test}>
              {testing ? <Spinner data-icon="inline-start" className="size-3.5" /> : (
                <HugeiconsIcon icon={Login03Icon} strokeWidth={2} data-icon="inline-start" />
              )}
              {testing ? 'Waiting for your identity provider…' : config.lastTest ? 'Test again' : 'Test sign-in'}
            </Button>
            {missing && <span className="text-muted-foreground text-[11px]">{missing}</span>}
          </div>
          <div aria-live="polite">{config.lastTest && !testing && <TestResult result={config.lastTest} />}</div>
        </Step>
      </ol>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2.5">
        <p className="text-muted-foreground min-w-0 flex-1 basis-48 text-[11px]">
          {config.enabled
            ? 'SSO is on. People at your verified domains can sign in through your identity provider.'
            : tested
              ? 'The test worked. Turn SSO on to let everyone at your verified domains use it.'
              : 'Turn SSO on after a test sign-in works.'}
        </p>
        {config.enabled ? (
          <DeleteConfirm
            icon={null}
            title="Turn off SSO?"
            description="People sign in with a password or passkey again, and Require SSO is switched off. Your set-up is kept."
            confirmLabel="Turn off SSO"
            size="sm"
            onConfirm={onDisable}
          >
            <Button variant="outline" size="sm">Turn off SSO</Button>
          </DeleteConfirm>
        ) : (
          <Button size="sm" disabled={!tested || !!missing} onClick={onEnable}>Turn on SSO</Button>
        )}
      </div>
    </div>
  )
}

function Step({ n, done, title, description, children }: {
  n: number
  done?: boolean
  title: string
  description: ReactNode
  children: ReactNode
}) {
  return (
    <li className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 px-3 py-3">
      <span
        aria-hidden
        className={cn(
          'grid size-5 place-items-center rounded-full text-[11px] font-medium tabular-nums',
          done ? 'bg-status-done/15 text-status-done' : 'bg-muted text-muted-foreground',
        )}
      >
        {done ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" /> : n}
      </span>
      <div className="grid min-w-0 gap-3">
        <div className="grid gap-0.5">
          <h4 className="text-xs font-medium">
            <span className="sr-only">Step {n}{done ? ', done' : ''}: </span>{title}
          </h4>
          <p className="text-muted-foreground text-[11px] leading-4">{description}</p>
        </div>
        {children}
      </div>
    </li>
  )
}

function SamlDetails({ config, onSaml }: { config: SsoConfig; onSaml: (patch: Partial<SsoConfig['saml']>) => void }) {
  const id = useId()
  const s = config.saml
  const fileInput = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string>()

  async function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 1024 * 1024) {
      setFileError('That file is over 1 MB. Metadata files are much smaller.')
      return
    }
    const parsed = parseMetadata(await file.text())
    if (!parsed) {
      setFileError('That file isn’t SAML metadata: no entity ID or SSO URL in it.')
      return
    }
    setFileError(undefined)
    onSaml({ metadataFile: { name: file.name, size: file.size }, ...parsed })
  }

  const urlError = s.metadataUrl.trim() && !isHttpsUrl(s.metadataUrl) ? 'Enter a full https:// address.' : undefined
  const ssoUrlError = s.ssoUrl.trim() && !isHttpsUrl(s.ssoUrl) ? 'Enter a full https:// address.' : undefined
  const certError = s.certificate.trim() && !isCertificate(s.certificate)
    ? 'Paste the whole certificate, from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE-----.'
    : undefined

  return (
    <div className="grid min-w-0 gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={0}
        value={s.source}
        onValueChange={(v) => v && onSaml({ source: v as SamlSource })}
        aria-label="How to give the identity provider’s details"
        className="flex-wrap"
      >
        <ToggleGroupItem value="metadata-url">Metadata URL</ToggleGroupItem>
        <ToggleGroupItem value="metadata-file">Upload XML</ToggleGroupItem>
        <ToggleGroupItem value="manual">Enter manually</ToggleGroupItem>
      </ToggleGroup>

      {s.source === 'metadata-url' && (
        <Field data-invalid={!!urlError || undefined}>
          <FieldLabel htmlFor={`${id}-metadata`}>Metadata URL</FieldLabel>
          <Input
            id={`${id}-metadata`}
            type="url"
            inputMode="url"
            spellCheck={false}
            placeholder="https://idp.example.com/app/metadata.xml"
            value={s.metadataUrl}
            onChange={(e) => onSaml({ metadataUrl: e.target.value })}
            aria-invalid={!!urlError || undefined}
          />
          {urlError ? <FieldError>{urlError}</FieldError> : (
            <FieldDescription>We read it again every day, so a new certificate is picked up by itself.</FieldDescription>
          )}
        </Field>
      )}

      {s.source === 'metadata-file' && (
        <div className="grid min-w-0 gap-2">
          <input ref={fileInput} type="file" accept=".xml,application/xml,text/xml" className="sr-only" tabIndex={-1} aria-hidden onChange={readFile} />
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} data-icon="inline-start" />
              {s.metadataFile ? 'Replace file' : 'Upload metadata XML'}
            </Button>
            {s.metadataFile && (
              <FileChip
                name={s.metadataFile.name}
                size={s.metadataFile.size}
                onRemove={() => onSaml({ metadataFile: null, entityId: '', ssoUrl: '', certificate: '' })}
              />
            )}
          </div>
          {fileError && <p role="alert" className="text-destructive text-xs">{fileError}</p>}
          {s.metadataFile && (
            <dl className="bg-subtle grid grid-cols-[minmax(0,1fr)] gap-1 rounded-md border p-2.5 text-[11px] sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-3">
              <dt className="text-muted-foreground">Entity ID</dt>
              <dd className="truncate font-mono">{s.entityId}</dd>
              <dt className="text-muted-foreground">SSO URL</dt>
              <dd className="truncate font-mono">{s.ssoUrl}</dd>
              <dt className="text-muted-foreground">Certificate</dt>
              <dd>{s.certificate ? 'Found' : 'Not in the file'}</dd>
            </dl>
          )}
        </div>
      )}

      {s.source === 'manual' && (
        <div className="grid min-w-0 gap-3">
          <Field data-invalid={!!ssoUrlError || undefined}>
            <FieldLabel htmlFor={`${id}-sso-url`}>SSO URL</FieldLabel>
            <Input
              id={`${id}-sso-url`}
              type="url"
              inputMode="url"
              spellCheck={false}
              placeholder="https://idp.example.com/sso/saml"
              value={s.ssoUrl}
              onChange={(e) => onSaml({ ssoUrl: e.target.value })}
              aria-invalid={!!ssoUrlError || undefined}
            />
            {ssoUrlError && <FieldError>{ssoUrlError}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-entity`}>Identity provider entity ID</FieldLabel>
            <Input
              id={`${id}-entity`}
              spellCheck={false}
              placeholder="https://idp.example.com/entity"
              value={s.entityId}
              onChange={(e) => onSaml({ entityId: e.target.value })}
            />
          </Field>
          <Field data-invalid={!!certError || undefined}>
            <FieldLabel htmlFor={`${id}-cert`}>X.509 certificate</FieldLabel>
            <Textarea
              id={`${id}-cert`}
              spellCheck={false}
              rows={4}
              placeholder={'-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----'}
              value={s.certificate}
              onChange={(e) => onSaml({ certificate: e.target.value })}
              aria-invalid={!!certError || undefined}
              className="font-mono text-[11px]"
            />
            {certError ? <FieldError>{certError}</FieldError> : (
              <FieldDescription>The identity provider’s signing certificate, in PEM format.</FieldDescription>
            )}
          </Field>
        </div>
      )}
    </div>
  )
}

function OidcDetails({ config, onOidc, onClientSecret }: {
  config: SsoConfig
  onOidc: (patch: Partial<SsoConfig['oidc']>) => void
  onClientSecret?: (secret: string) => void
}) {
  const id = useId()
  const o = config.oidc
  // Only while typing: saved, it is handed on and cleared.
  const [secret, setSecret] = useState('')
  const issuerError = o.issuer.trim() && !isHttpsUrl(o.issuer) ? 'Enter a full https:// address.' : undefined

  function saveSecret() {
    if (!secret.trim()) return
    onClientSecret?.(secret.trim())
    setSecret('')
    onOidc({ clientSecretSet: true })
  }

  return (
    <div className="grid min-w-0 gap-3">
      <Field data-invalid={!!issuerError || undefined}>
        <FieldLabel htmlFor={`${id}-issuer`}>Issuer URL</FieldLabel>
        <Input
          id={`${id}-issuer`}
          type="url"
          inputMode="url"
          spellCheck={false}
          placeholder="https://idp.example.com"
          value={o.issuer}
          onChange={(e) => onOidc({ issuer: e.target.value })}
          aria-invalid={!!issuerError || undefined}
        />
        {issuerError ? <FieldError>{issuerError}</FieldError> : (
          <FieldDescription>We find the rest from its /.well-known/openid-configuration.</FieldDescription>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-client`}>Client ID</FieldLabel>
        <Input
          id={`${id}-client`}
          spellCheck={false}
          autoComplete="off"
          value={o.clientId}
          onChange={(e) => onOidc({ clientId: e.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-secret`}>Client secret</FieldLabel>
        <div className="flex min-w-0 gap-2">
          <Input
            id={`${id}-secret`}
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            placeholder={o.clientSecretSet ? '••••••••••••' : undefined}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                saveSecret()
              }
            }}
            aria-describedby={`${id}-secret-hint`}
            className="min-w-0 flex-1"
          />
          <Button variant="outline" disabled={!secret.trim()} onClick={saveSecret}>
            {o.clientSecretSet ? 'Replace' : 'Save'}
          </Button>
        </div>
        <FieldDescription id={`${id}-secret-hint`}>
          {o.clientSecretSet
            ? 'A secret is saved. It is never shown again; type a new one to replace it.'
            : 'Saved encrypted, and never shown again.'}
        </FieldDescription>
      </Field>
    </div>
  )
}

function AttributeMapping({ mapping, onChange }: {
  mapping: Record<SsoAttribute, string>
  onChange: (mapping: Record<SsoAttribute, string>) => void
}) {
  const id = useId()
  return (
    <div className="grid min-w-0 gap-1.5">
      <p id={`${id}-title`} className="text-xs font-medium">Attribute mapping</p>
      <div className="overflow-hidden rounded-md border">
        <table aria-labelledby={`${id}-title`} className="w-full table-fixed text-xs">
          <thead className="text-muted-foreground bg-muted/50">
            <tr>
              <th scope="col" className="w-[38%] px-2.5 py-1.5 text-left font-medium">Our attribute</th>
              <th scope="col" className="px-2.5 py-1.5 text-left font-medium">Identity provider attribute</th>
            </tr>
          </thead>
          <tbody>
            {ATTRIBUTES.map((a) => (
              <tr key={a.id} className="border-t">
                <th scope="row" className="px-2.5 py-1.5 text-left align-middle font-normal">
                  <label htmlFor={`${id}-${a.id}`}>
                    {a.label}
                    {a.required && <span className="text-muted-foreground"> (required)</span>}
                  </label>
                </th>
                <td className="px-1.5 py-1">
                  <Input
                    id={`${id}-${a.id}`}
                    spellCheck={false}
                    value={mapping[a.id]}
                    onChange={(e) => onChange({ ...mapping, [a.id]: e.target.value })}
                    aria-invalid={(a.required && !mapping[a.id].trim()) || undefined}
                    className="h-6 font-mono text-[11px]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TestResult({ result }: { result: SsoTestResult }) {
  return (
    <div className={cn('grid min-w-0 gap-2 rounded-md border p-2.5', result.ok ? 'bg-status-done/5' : 'bg-destructive/5')}>
      <p className={cn('flex items-center gap-1.5 text-xs font-medium', result.ok ? 'text-status-done' : 'text-destructive')}>
        <HugeiconsIcon icon={result.ok ? CheckmarkCircle02Icon : AlertCircleIcon} strokeWidth={2} className="size-3.5 shrink-0" />
        {result.ok ? 'Test sign-in worked' : 'Test sign-in failed'}
        <span className="text-muted-foreground ml-auto font-normal tabular-nums">{formatTime(result.at)}</span>
      </p>
      {result.ok ? (
        <>
          <p className="text-muted-foreground text-[11px]">Attributes received from your identity provider:</p>
          <dl className="bg-card grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md border px-2.5 py-2 text-xs">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-mono text-[11px]">{result.attributes.email}</dd>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="truncate">{result.attributes.name}</dd>
            <dt className="text-muted-foreground">Groups</dt>
            <dd className="flex min-w-0 flex-wrap gap-1">
              {result.attributes.groups.length ? result.attributes.groups.map((g) => (
                <span key={g} className="bg-muted rounded px-1.5 py-px text-[11px]">{g}</span>
              )) : <span className="text-muted-foreground">None sent</span>}
            </dd>
          </dl>
        </>
      ) : (
        <p className="text-xs [overflow-wrap:anywhere]">{result.error}</p>
      )}
    </div>
  )
}

