import { useEffect, useId, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

// Add a custom connector: a remote MCP server the catalogue does not list.
// Its name, its URL (https only), how it signs in (none, OAuth, or an API
// key sent in a header) and an optional line on what it is for. Add checks
// the form and hands it to onAdd; the dialog keeps nothing afterwards.
//
// The API key field is a password field and the key is never shown again:
// not in the field, not in the connector. Store it on the server side.

export type ConnectorAuth = 'none' | 'oauth' | 'api-key'

export type CustomConnectorInput = {
  name: string
  url: string
  description?: string
  auth: ConnectorAuth
  // With api-key: the header the key goes in, and the key.
  header?: string
  apiKey?: string
}

const AUTH: { value: ConnectorAuth; title: string; hint: string }[] = [
  { value: 'none', title: 'None', hint: 'The server is open, or sits behind your network.' },
  { value: 'oauth', title: 'OAuth', hint: 'You sign in to the server in a new window.' },
  { value: 'api-key', title: 'API key', hint: 'A key sent in a request header.' },
]

// Why a server URL will not do, or null when it will.
export function serverUrlError(value: string) {
  const text = value.trim()
  if (!text) return "Enter the server's URL."
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return 'This is not a valid URL. It starts with https://'
  }
  if (url.protocol !== 'https:') return 'Use an https:// address: the server must use a secure connection.'
  if (!url.hostname.includes('.') && url.hostname !== 'localhost') return 'Add the full host name, such as mcp.example.com.'
  return null
}

const EMPTY = { name: '', url: '', description: '', auth: 'oauth' as ConnectorAuth, header: 'Authorization', apiKey: '' }

export function CustomConnectorDialog({ open, onOpenChange, onAdd, existingNames = [] }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (input: CustomConnectorInput) => void
  // Names already taken, so two connectors are not called the same.
  existingNames?: string[]
}) {
  const id = useId()
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [tried, setTried] = useState(false)

  // A fresh form each time it opens, so a key typed before is gone.
  useEffect(() => {
    if (!open) return
    setForm(EMPTY)
    setTouched({})
    setTried(false)
  }, [open])

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }))
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }))

  const name = form.name.trim()
  const errors: Partial<Record<'name' | 'url' | 'header' | 'apiKey', string>> = {
    name: !name
      ? 'Give the connector a name.'
      : existingNames.some((n) => n.toLowerCase() === name.toLowerCase())
        ? 'You already have a connector with this name.'
        : undefined,
    url: serverUrlError(form.url) ?? undefined,
    header: form.auth === 'api-key' && !form.header.trim() ? 'Name the header the key goes in.' : undefined,
    apiKey: form.auth === 'api-key' && !form.apiKey ? 'Enter the API key.' : undefined,
  }
  const shown = (key: keyof typeof errors) => (tried || touched[key]) && errors[key]

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    const first = (['name', 'url', 'header', 'apiKey'] as const).find((k) => errors[k])
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    onAdd({
      name,
      url: form.url.trim(),
      description: form.description.trim() || undefined,
      auth: form.auth,
      ...(form.auth === 'api-key' ? { header: form.header.trim(), apiKey: form.apiKey } : {}),
    })
    setForm(EMPTY)
    onOpenChange(false)
  }

  const field = (key: keyof typeof errors) => ({
    id: `${id}-${key}`,
    'aria-invalid': !!shown(key) || undefined,
    'aria-describedby': shown(key) ? `${id}-${key}-error` : undefined,
    onBlur: () => touch(key),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(44rem,90vh)] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b p-4 pr-10">
          <DialogTitle>Add custom connector</DialogTitle>
          <DialogDescription>Connect a remote MCP server. The assistant can then use the tools it offers.</DialogDescription>
        </DialogHeader>

        <form id={`${id}-form`} noValidate onSubmit={submit} className="@container min-h-0 flex-1 overflow-y-auto p-4">
          <FieldGroup className="gap-4">
            <Field data-invalid={!!shown('name') || undefined}>
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input {...field('name')} value={form.name} maxLength={40} placeholder="Inventory server" autoComplete="off" onChange={(e) => set('name', e.target.value)} />
              {shown('name') && <FieldError id={`${id}-name-error`} className="text-[11px]">{errors.name}</FieldError>}
            </Field>

            <Field data-invalid={!!shown('url') || undefined}>
              <FieldLabel htmlFor={`${id}-url`}>Server URL</FieldLabel>
              <Input
                {...field('url')}
                type="url"
                inputMode="url"
                spellCheck={false}
                autoComplete="off"
                value={form.url}
                placeholder="https://mcp.example.com/mcp"
                className="font-mono text-[11px]"
                onChange={(e) => set('url', e.target.value)}
              />
              {shown('url')
                ? <FieldError id={`${id}-url-error`} className="text-[11px]">{errors.url}</FieldError>
                : <FieldDescription className="text-[11px]">The address the server takes requests on (streamable HTTP or SSE).</FieldDescription>}
            </Field>

            <Field>
              <FieldLabel id={`${id}-auth-label`}>Authentication</FieldLabel>
              <RadioGroup
                aria-labelledby={`${id}-auth-label`}
                value={form.auth}
                onValueChange={(v) => set('auth', v as ConnectorAuth)}
                className="gap-1.5"
              >
                {AUTH.map((a) => (
                  <FieldLabel key={a.value} htmlFor={`${id}-auth-${a.value}`}>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={a.value} id={`${id}-auth-${a.value}`} />
                      <FieldContent>
                        <FieldTitle className="text-xs">{a.title}</FieldTitle>
                        <FieldDescription className="text-[11px] leading-4">{a.hint}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </Field>

            {form.auth === 'api-key' && (
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                <Field data-invalid={!!shown('header') || undefined}>
                  <FieldLabel htmlFor={`${id}-header`}>Header</FieldLabel>
                  <Input {...field('header')} value={form.header} spellCheck={false} autoComplete="off" className="font-mono text-[11px]" onChange={(e) => set('header', e.target.value)} />
                  {shown('header') && <FieldError id={`${id}-header-error`} className="text-[11px]">{errors.header}</FieldError>}
                </Field>
                <Field data-invalid={!!shown('apiKey') || undefined}>
                  <FieldLabel htmlFor={`${id}-apiKey`}>API key</FieldLabel>
                  <Input
                    {...field('apiKey')}
                    type="password"
                    autoComplete="new-password"
                    spellCheck={false}
                    value={form.apiKey}
                    placeholder="Paste the key"
                    onChange={(e) => set('apiKey', e.target.value)}
                  />
                  {shown('apiKey')
                    ? <FieldError id={`${id}-apiKey-error`} className="text-[11px]">{errors.apiKey}</FieldError>
                    : <FieldDescription className="text-[11px]">Kept on the server. It is never shown again.</FieldDescription>}
                </Field>
              </div>
            )}

            <Field>
              <FieldLabel htmlFor={`${id}-description`}>
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </FieldLabel>
              <Textarea
                id={`${id}-description`}
                value={form.description}
                maxLength={160}
                rows={2}
                placeholder="What the assistant can do with it"
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>

            <p className="text-muted-foreground bg-subtle flex items-start gap-2 rounded-lg border p-3 text-[11px] leading-4">
              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="mt-px size-3.5 shrink-0" />
              Only add servers you trust. A connector sees what the assistant sends its tools, and its answers go into your chats.
            </p>
          </FieldGroup>
        </form>

        <DialogFooter className="flex-row justify-end gap-2 border-t p-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form={`${id}-form`}>Add connector</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
