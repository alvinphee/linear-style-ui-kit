import { Fragment, useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CodeIcon, Copy01Icon, RefreshIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { copyText, useCopied } from '@/lib/clipboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// The building blocks of a component page: a live Playground (preview,
// props pane, code), a Variants grid that shows every value side by side,
// and a CodeBlock. Pages under src/pages/playground/ compose these.

export type Control =
  | { kind: 'select'; name: string; label: string; options: readonly string[]; initial: string }
  | { kind: 'switch'; name: string; label: string; initial: boolean }
  | { kind: 'text'; name: string; label: string; initial: string }

export type Values = Record<string, string | boolean>

const initialValues = (controls: Control[]): Values => Object.fromEntries(controls.map((c) => [c.name, c.initial]))

// Reads a value with its type, so render and code stay tidy.
export const str = (v: Values, name: string) => String(v[name] ?? '')
export const bool = (v: Values, name: string) => v[name] === true

export function Playground({ title, description, controls, render, code, previewClassName }: {
  title: string
  description?: string
  controls: Control[]
  render: (values: Values) => ReactNode
  code: (values: Values) => string
  previewClassName?: string
}) {
  const id = useId()
  const [values, setValues] = useState<Values>(() => initialValues(controls))
  const set = (name: string, value: string | boolean) => setValues((v) => ({ ...v, [name]: value }))
  const changed = controls.some((c) => values[c.name] !== c.initial)
  // The preview leads; the code is one click away.
  const [showCode, setShowCode] = useState(false)

  return (
    <article aria-label={`${title} playground`} className="bg-card min-w-0 overflow-hidden rounded-lg border">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b py-1.5 pr-1.5 pl-3.5">
        <h3 className="text-xs font-medium">{title} <span className="text-muted-foreground font-normal">playground</span></h3>
        <div className="flex min-w-0 items-center gap-2">
          {description && <span className="text-muted-foreground hidden truncate text-[11px] sm:inline">{description}</span>}
          <Button variant={showCode ? 'secondary' : 'ghost'} size="sm" aria-pressed={showCode} onClick={() => setShowCode(!showCode)}>
            <HugeiconsIcon icon={CodeIcon} strokeWidth={2} data-icon="inline-start" />
            {showCode ? 'Hide code' : 'Show code'}
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className={cn('grid min-w-0', showCode ? 'grid-rows-[minmax(11rem,1fr)_auto]' : 'grid-rows-[minmax(11rem,1fr)]')}>
          <div
            className={cn(
              'bg-subtle flex min-w-0 items-center justify-center p-6',
              '[background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:14px_14px]',
              previewClassName,
            )}
          >
            {render(values)}
          </div>
          {showCode && <CodeBlock code={code(values)} className="rounded-none border-0 border-t" />}
        </div>
        <form
          aria-label={`${title} props`}
          onSubmit={(e) => e.preventDefault()}
          className="grid content-start gap-3 border-t p-3.5 lg:border-t-0 lg:border-l"
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-medium">Props</span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-muted-foreground"
              disabled={!changed}
              onClick={() => setValues(initialValues(controls))}
            >
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" /> Reset
            </Button>
          </div>
          {controls.map((c) => {
            const field = `${id}-${c.name}`
            if (c.kind === 'switch') {
              return (
                <div key={c.name} className="flex items-center justify-between gap-3">
                  <Label htmlFor={field} className="font-normal">{c.label}</Label>
                  <Switch id={field} checked={bool(values, c.name)} onCheckedChange={(on) => set(c.name, on)} />
                </div>
              )
            }
            if (c.kind === 'text') {
              return (
                <div key={c.name} className="grid gap-1.5">
                  <Label htmlFor={field} className="text-muted-foreground font-normal">{c.label}</Label>
                  <Input id={field} value={str(values, c.name)} onChange={(e) => set(c.name, e.target.value)} />
                </div>
              )
            }
            return (
              <div key={c.name} className="grid gap-1.5">
                <Label htmlFor={field} className="text-muted-foreground font-normal">{c.label}</Label>
                <Select value={str(values, c.name)} onValueChange={(v) => set(c.name, v)}>
                  <SelectTrigger id={field} size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {c.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </form>
      </div>
    </article>
  )
}

// Every value of one prop (rows), optionally crossed with another (columns).
export function Variants<R extends string, C extends string = never>({ title, note, rows, cols, render }: {
  title: string
  note?: string
  rows: { name: string; values: readonly R[] }
  cols?: { name: string; values: readonly C[] }
  render: (row: R, col?: C) => ReactNode
}) {
  const colValues: (C | undefined)[] = cols ? [...cols.values] : [undefined]
  return (
    <article className="bg-card min-w-0 overflow-hidden rounded-lg border">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b px-3.5 py-2.5">
        <h3 className="text-xs font-medium">{title}</h3>
        <span className="text-muted-foreground font-mono text-[11px]">{note ?? (cols ? `${rows.name} × ${cols.name}` : rows.name)}</span>
      </header>
      <div className="overflow-x-auto p-3.5">
        <div
          className="grid w-max min-w-full items-center gap-x-4 gap-y-3"
          style={{ gridTemplateColumns: `minmax(5.5rem,auto) repeat(${colValues.length}, auto)` }}
        >
          {cols && (
            <>
              <span />
              {cols.values.map((c) => <span key={c} className="text-muted-foreground font-mono text-[11px]">{c}</span>)}
            </>
          )}
          {rows.values.map((r) => (
            <Fragment key={r}>
              <span className="text-muted-foreground font-mono text-[11px]">{r}</span>
              {colValues.map((c) => <div key={c ?? 'only'} className="flex items-center">{render(r, c)}</div>)}
            </Fragment>
          ))}
        </div>
      </div>
    </article>
  )
}

// A labelled row of examples: states (hover, disabled, loading) or anything
// that is not a single prop.
export function Gallery({ title, note, items }: {
  title: string
  note?: string
  items: { label: string; node: ReactNode }[]
}) {
  return (
    <article className="bg-card min-w-0 overflow-hidden rounded-lg border">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b px-3.5 py-2.5">
        <h3 className="text-xs font-medium">{title}</h3>
        {note && <span className="text-muted-foreground text-[11px]">{note}</span>}
      </header>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 p-3.5">
        {items.map((item) => (
          <figure key={item.label} className="grid justify-items-start gap-2">
            {item.node}
            <figcaption className="text-muted-foreground font-mono text-[11px]">{item.label}</figcaption>
          </figure>
        ))}
      </div>
    </article>
  )
}

// A fixed example (no props pane) with its code one click away. The body is
// an @container, for the blocks' @sm / @md details.
export function Example({ title, note, code, children }: { title: string; note?: string; code: string; children: ReactNode }) {
  const [showCode, setShowCode] = useState(false)
  return (
    <article aria-label={title} className="bg-card min-w-0 overflow-hidden rounded-lg border">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b py-1.5 pr-1.5 pl-3.5">
        <h3 className="text-xs font-medium">{title} <span className="text-muted-foreground font-normal">example</span></h3>
        <div className="flex min-w-0 items-center gap-2">
          {note && <span className="text-muted-foreground hidden truncate text-[11px] sm:inline">{note}</span>}
          <Button variant={showCode ? 'secondary' : 'ghost'} size="sm" aria-pressed={showCode} onClick={() => setShowCode(!showCode)}>
            <HugeiconsIcon icon={CodeIcon} strokeWidth={2} data-icon="inline-start" />
            {showCode ? 'Hide code' : 'Show code'}
          </Button>
        </div>
      </header>
      <div className="@container min-w-0 p-4 sm:p-6">{children}</div>
      {showCode && <CodeBlock code={code} className="rounded-none border-0 border-t" />}
    </article>
  )
}

// A card under text-heavy previews, so they read well over the dot grid.
// It is an @container, for the blocks' @sm / @md details.
export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('bg-card @container w-full min-w-0 rounded-lg border p-4 shadow-xs', className)}>{children}</div>
}

// Light JSX colouring: tags, attribute names and strings. Enough to read, no parser.
function highlight(code: string) {
  // split() with a capture group puts the matches at the odd indexes.
  const parts = code.split(/("[^"]*"|'[^']*'|<\/?[A-Za-z][\w.]*|\b[a-zA-Z-]+(?==)|\{[^{}]*\})/g)
  return parts.map((part, i) => {
    if (!part) return null
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
    if (part.startsWith('"') || part.startsWith("'")) return <span key={i} className="text-status-done">{part}</span>
    if (part.startsWith('<')) return <span key={i} className="text-brand">{part}</span>
    if (part.startsWith('{')) return <span key={i} className="text-status-progress">{part}</span>
    return <span key={i} className="text-muted-foreground">{part}</span>
  })
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, flagCopied] = useCopied()

  // The tick on the button says it worked, so no toast unless it fails.
  async function copy() {
    if (await copyText(code, { success: false })) flagCopied()
  }

  return (
    <div className={cn('bg-card relative min-w-0 rounded-lg border', className)}>
      <pre className="overflow-x-auto p-3.5 pr-12 font-mono text-[11.5px] leading-5"><code>{highlight(code)}</code></pre>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground absolute top-2 right-2"
        aria-label={copied ? 'Copied' : 'Copy code'}
        onClick={copy}
      >
        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} />
      </Button>
    </div>
  )
}

// Builds a JSX string: props equal to undefined, false or their default are
// left out, true becomes a bare attribute, a string written as "{…}" is an
// expression (defaultValue: "{['a']}"), and children indent on new lines.
export function jsx(tag: string, props: Record<string, string | number | boolean | undefined>, children?: string | string[]) {
  const attrs = Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== false && value !== '')
    .map(([key, value]) => {
      if (value === true) return key
      if (typeof value === 'number') return `${key}={${value}}`
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) return `${key}=${value}`
      return `${key}="${value}"`
    })
  const open = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`
  const kids = (Array.isArray(children) ? children : children ? [children] : []).filter(Boolean)
  if (!kids.length) return `${open} />`
  if (kids.length === 1 && !kids[0].includes('\n') && kids[0].length < 40) return `${open}>${kids[0]}</${tag}>`
  return `${open}>\n${kids.map((k) => k.replace(/^/gm, '  ')).join('\n')}\n</${tag}>`
}

// A prop equal to its default stays out of the snippet: unless(size, 'sm').
export const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)

// The names that are set, for imports and prop lists: pick('a', on && 'b').
export const pick = (...names: (string | false | undefined)[]) => names.filter((n): n is string => Boolean(n))

// Indents every non-empty line.
export const indent = (text: string, by = '  ') => text.replace(/^(?=.)/gm, by)

// A value as a JavaScript literal, single-quoted: { status: 'overdue' }.
export function lit(value: unknown): string {
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  if (Array.isArray(value)) return `[${value.map(lit).join(', ')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : lit(k)}: ${lit(v)}`)
    return entries.length ? `{ ${entries.join(', ')} }` : '{}'
  }
  return String(value)
}

// A JSX element with one prop per line, for props too long for jsx().
export function element(tag: string, attrs: (string | false | undefined)[], children?: string) {
  const open = `<${tag}\n${pick(...attrs).map((a) => indent(a)).join('\n')}\n`
  return children ? `${open}>\n${indent(children)}\n</${tag}>` : `${open}/>`
}

// A snippet that needs state, wrapped in a small component; without state it
// is the body alone.
export function component(name: string, state: string[], body: string) {
  if (!state.length) return body
  return `function ${name}() {\n${indent(state.join('\n'))}\n  return (\n${indent(body, '    ')}\n  )\n}`
}

// Lists the imports a snippet needs, one line per module.
export function imports(lines: Record<string, string[]>) {
  return Object.entries(lines)
    .filter(([, names]) => names.length)
    .map(([from, names]) => `import { ${names.join(', ')} } from '${from}'`)
    .join('\n')
}

// Colour options for a playground's colour prop: the theme accent and the
// five chart colours, by name. colourOf(values) reads the "colour" control.
export const COLOURS = {
  brand: 'var(--brand)',
  'chart-1': 'var(--chart-1)',
  'chart-2': 'var(--chart-2)',
  'chart-3': 'var(--chart-3)',
  'chart-4': 'var(--chart-4)',
  'chart-5': 'var(--chart-5)',
  muted: 'var(--muted-foreground)',
} as const

export type ColourName = keyof typeof COLOURS
export const COLOUR_NAMES = Object.keys(COLOURS) as ColourName[]
export const colourOf = (v: Values) => COLOURS[str(v, 'colour') as ColourName]

// A page's playgrounds and variant grids, stacked.
export function Demos({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3">{children}</div>
}
