import { useMemo, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, ClipboardCheckIcon, Link01Icon, LinkSquare02Icon, PrinterIcon, QrCodeIcon, QrCodeScanIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { fieldsOf, isCheckField, type FormDefinition } from '@/blocks/form-renderer'
import { IconAction } from '@/components/icon-action'
import { IconMark } from '@/components/mark'
import { QrCode, type QrCodeMark } from '@/components/qr-code'
import { QrScanner } from '@/components/qr-scanner'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { copyText } from '@/lib/clipboard'
import { plural } from '@/lib/text'

// The forms a person can fill in, to pick one from: searched, grouped by
// category, each with what it asks and how long it takes. Open starts the
// form. With `href`, every form gets a QR button: a dialog with the code
// that opens that form (for one thing in particular, when the form has a
// context), to print and fix where the form is filled in. With `onScan`, a
// Scan button reads such a code with the camera, or takes it typed. The
// forms and what happens next all come in as props.

export type FormMeta = { submissions?: number; lastAt?: string }

// Branding for the QR codes: the company's name and mark.
export type FormQrBrand = { company?: string; mark?: QrCodeMark; logo?: ReactNode }

export function FormsCatalogue({
  forms, onOpen, href, brand, onScan, meta, search = true, actions, emptyText = 'No forms match', className,
}: {
  forms: FormDefinition[]
  onOpen: (form: FormDefinition) => void
  // The link that opens a form, for one thing when given. Turns the QR buttons on.
  href?: (form: FormDefinition, context?: string) => string
  brand?: FormQrBrand
  // Gets what a scanned code says. Turns the Scan button on.
  onScan?: (value: string) => void
  // Per form id: how often it was submitted, and when last.
  meta?: Record<string, FormMeta>
  search?: boolean
  // More buttons in the toolbar.
  actions?: ReactNode
  emptyText?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [qrFor, setQrFor] = useState<FormDefinition | null>(null)
  const [scanning, setScanning] = useState(false)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const shown = q
      ? forms.filter((f) => [f.name, f.description, f.category].some((t) => t?.toLowerCase().includes(q)))
      : forms
    const out: { title: string; forms: FormDefinition[] }[] = []
    for (const f of shown) {
      const title = f.category ?? 'Other'
      const g = out.find((x) => x.title === title)
      if (g) g.forms.push(f)
      else out.push({ title, forms: [f] })
    }
    return out
  }, [forms, query])

  const toolbar = search || onScan || actions
  const headings = groups.length > 1 || (groups.length === 1 && groups[0].title !== 'Other')

  return (
    <div className={cn('@container grid min-w-0 gap-4', className)}>
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {search && <SearchField value={query} onChange={setQuery} placeholder="Search forms" className="min-w-0 flex-1 basis-56" />}
          {onScan && (
            <Button variant="outline" onClick={() => setScanning(true)}>
              <HugeiconsIcon icon={QrCodeScanIcon} strokeWidth={2} data-icon="inline-start" /> Scan a code
            </Button>
          )}
          {actions}
        </div>
      )}

      {groups.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyTitle>{emptyText}</EmptyTitle>
            <EmptyDescription>Try another word, or clear the search.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        groups.map((g) => (
          <section key={g.title} aria-label={g.title} className="grid min-w-0 gap-1.5">
            {headings && <h3 className="text-muted-foreground px-0.5 text-[11px] font-medium">{g.title}</h3>}
            <ul className="bg-card divide-y rounded-lg border">
              {g.forms.map((form) => (
                <FormRow key={form.id} form={form} meta={meta?.[form.id]} onOpen={() => onOpen(form)} onQr={href ? () => setQrFor(form) : undefined} />
              ))}
            </ul>
          </section>
        ))
      )}

      {href && (
        <FormQrDialog form={qrFor} open={!!qrFor} onOpenChange={(open) => !open && setQrFor(null)} href={href} brand={brand} />
      )}

      {onScan && (
        <Dialog open={scanning} onOpenChange={setScanning}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Scan a code</DialogTitle>
              <DialogDescription>Point the camera at a form's QR code, or enter the code or link.</DialogDescription>
            </DialogHeader>
            {scanning && (
              <QrScanner
                onScan={(value) => {
                  setScanning(false)
                  onScan(value)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function FormRow({ form, meta, onOpen, onQr }: { form: FormDefinition; meta?: FormMeta; onOpen: () => void; onQr?: () => void }) {
  const fields = fieldsOf(form)
  const checks = fields.filter(isCheckField).length
  const others = fields.length - checks
  const about = [
    checks ? plural(checks, 'check') : null,
    others ? plural(others, 'field') : null,
    form.estimatedMinutes ? `about ${form.estimatedMinutes} min` : null,
    form.context ? `per ${form.context.label.toLowerCase()}` : null,
    meta?.submissions ? `${plural(meta.submissions, 'submission')}${meta.lastAt ? `, last ${meta.lastAt}` : ''}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <li className="hover:bg-accent/40 group relative flex items-center gap-3 px-3.5 py-2.5 transition-colors first:rounded-t-lg last:rounded-b-lg">
      <IconMark icon={form.icon ?? ClipboardCheckIcon} colour={form.colour ?? 'var(--brand)'} />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <h4 className="text-xs font-medium">
          {/* The whole row opens the form; the buttons sit above it. */}
          <button
            type="button"
            onClick={onOpen}
            className="focus-visible:ring-ring/40 rounded text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:ring-2"
          >
            {form.name}
          </button>
        </h4>
        {form.description && <p className="text-muted-foreground truncate text-[11px]">{form.description}</p>}
        <p className="text-muted-foreground truncate text-[11px] tabular-nums">{about}</p>
      </div>
      <div className="relative z-[1] flex shrink-0 items-center gap-1">
        {onQr && <IconAction label={`QR code for ${form.name}`} icon={QrCodeIcon} size="icon-sm" className="text-muted-foreground" onClick={onQr} />}
        <Button variant="outline" size="sm" className="hidden @md:inline-flex" onClick={onOpen}>Open</Button>
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 @md:hidden" aria-hidden="true" />
      </div>
    </li>
  )
}

/* ---------- The QR code ---------- */

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

// Opens the code in a window of its own and prints it.
function printQr(container: HTMLElement | null, title: string, caption: string) {
  const svg = container?.querySelector('svg')?.outerHTML
  if (!svg) return
  const w = window.open('', '_blank', 'width=520,height=680')
  if (!w) return
  w.document.write(
    `<!doctype html><title>${escape(title)}</title>` +
    '<body style="margin:0;height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;text-align:center;color:#111">' +
    `<div><div style="width:300px;margin:0 auto">${svg.replace(/\s(width|height)="[^"]*"/g, '').replace('<svg', '<svg width="300" height="300"')}</div>` +
    `<h1 style="font-size:22px;margin:16px 0 6px">${escape(title)}</h1><p style="margin:0;color:#555">${escape(caption)}</p></div></body>`,
  )
  w.document.close()
  w.focus()
  w.print()
}

// The QR code that opens one form: for one thing, when the form has a
// context (type the tag, and the code and link follow). Copy the link, print
// the code, or open the link to try it.
export function FormQrDialog({ form, open, onOpenChange, href, brand }: {
  form: FormDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  href: (form: FormDefinition, context?: string) => string
  brand?: FormQrBrand
}) {
  const [context, setContext] = useState('')
  const box = useRef<HTMLDivElement>(null)
  // The last form stays on screen while the dialog fades out.
  const [shown, setShown] = useState(form)
  if (form && form !== shown) {
    setShown(form)
    setContext('')
  }
  if (!shown) return null
  const ctx = context.trim()
  const link = href(shown, ctx || undefined)
  const caption = ctx && shown.context ? `${shown.context.label} ${ctx} · scan to open` : 'Scan to open this form'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR code: {shown.name}</DialogTitle>
          <DialogDescription>
            {shown.context
              ? `Scanning it opens the form for one ${shown.context.label.toLowerCase()}. Print one per ${shown.context.label.toLowerCase()} and fix it where the form is filled in.`
              : 'Scanning it opens this form. Print it and put it where the form is filled in.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-start gap-5">
          <div ref={box} className="shrink-0">
            <QrCode value={link} size={168} shape="rounded" company={brand?.company} mark={brand?.mark ?? (brand?.company ? 'initials' : 'none')} logo={brand?.logo} caption={caption} />
          </div>
          <div className="grid min-w-0 flex-1 basis-48 gap-3">
            {shown.context && (
              <div className="grid gap-1.5">
                <Label htmlFor="qr-context">{shown.context.label} <span className="text-muted-foreground font-normal">Optional</span></Label>
                <Input id="qr-context" value={context} onChange={(e) => setContext(e.target.value)} placeholder={shown.context.placeholder ?? 'Leave blank to ask when scanned'} autoComplete="off" />
              </div>
            )}
            <div className="grid gap-1">
              <span className="text-muted-foreground text-[11px]">Link</span>
              <code className="bg-muted block truncate rounded px-1.5 py-1 font-mono text-[11px]" title={link}>{link}</code>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" size="sm" asChild>
            {/* Following the link is the scan: the dialog goes with it. */}
            <a href={link} onClick={() => onOpenChange(false)}>
              <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} data-icon="inline-start" /> Open link
            </a>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => copyText(link, { success: 'Link copied' })}>
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} data-icon="inline-start" /> Copy link
            </Button>
            <Button size="sm" onClick={() => printQr(box.current, shown.name, caption)}>
              <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} data-icon="inline-start" /> Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
