import { useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AiMotion, StreamCaret } from '@/components/thinking-indicator'

// AI replies as Markdown: headings, paragraphs, lists and task lists, quotes,
// code blocks with a Copy button, tables (numbers right-aligned) and
// citations. A citation is "[2]" in the text and opens sources[1].
//
// It builds React elements and never injects HTML: anything it does not
// understand is shown as plain text. While `streaming`, half-written syntax
// is held back so it never flashes as raw characters, each new block fades
// in, and a caret follows the text.
//
// Links to "#…" stay in the app: give `onLink` to route them yourself
// (it gets the href, "#board"); without it they change the hash. Other links
// open in a new tab.

export type Citation = { title: string; url: string; domain: string; snippet?: string }

export type Align = 'left' | 'right' | 'center'
type ListItem = { text: string; checked?: boolean }

export type MdBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; start: number; items: ListItem[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'table'; header: string[]; align: Align[]; rows: string[][] }
  | { type: 'quote'; text: string }
  | { type: 'rule' }

const FENCE = /^\s*```\s*([\w+#-]*)\s*$/
const HEADING = /^(#{1,6})\s+(.*)$/
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/
const BULLET = /^\s*[-*+]\s+(.*)$/
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/
const QUOTE = /^\s*>/
const SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-*:?\s*)*\|?\s*$/

const isTableStart = (line: string, next?: string) => line.trimStart().startsWith('|') && next !== undefined && SEPARATOR.test(next)

function startsBlock(line: string, next?: string) {
  return FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line)
    || BULLET.test(line) || NUMBERED.test(line) || isTableStart(line, next)
}

function splitRow(line: string) {
  let row = line.trim()
  if (row.startsWith('|')) row = row.slice(1)
  if (row.endsWith('|')) row = row.slice(0, -1)
  return row.split('|').map((c) => c.trim())
}

export function parseBlocks(src: string): MdBlock[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: MdBlock[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    const fence = line.match(FENCE)
    if (fence) {
      const body: string[] = []
      i++
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) body.push(lines[i++])
      i++
      blocks.push({ type: 'code', lang: fence[1] || 'text', code: body.join('\n') })
      continue
    }
    const heading = line.match(HEADING)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() })
      i++
      continue
    }
    if (RULE.test(line)) {
      blocks.push({ type: 'rule' })
      i++
      continue
    }
    if (isTableStart(line, lines[i + 1])) {
      const header = splitRow(line)
      const align = splitRow(lines[i + 1]).map((c): Align => (c.endsWith(':') ? (c.startsWith(':') ? 'center' : 'right') : 'left'))
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trimStart().startsWith('|')) rows.push(splitRow(lines[i++]))
      blocks.push({ type: 'table', header, align, rows })
      continue
    }
    if (QUOTE.test(line)) {
      const body: string[] = []
      while (i < lines.length && QUOTE.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ''))
      blocks.push({ type: 'quote', text: body.join('\n') })
      continue
    }
    if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = NUMBERED.test(line)
      const pattern = ordered ? NUMBERED : BULLET
      const start = ordered ? Number(line.match(NUMBERED)![1]) : 1
      const items: ListItem[] = []
      while (i < lines.length) {
        const m = lines[i].match(pattern)
        if (m) {
          const text = ordered ? m[2] : m[1]
          const task = text.match(/^\[( |x|X)\]\s+(.*)$/)
          items.push(task ? { text: task[2], checked: task[1] !== ' ' } : { text })
          i++
        } else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) {
          items[items.length - 1].text += ` ${lines[i++].trim()}`
        } else break
      }
      blocks.push({ type: 'list', ordered, start, items })
      continue
    }
    const body = [line]
    i++
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i], lines[i + 1])) body.push(lines[i++])
    blocks.push({ type: 'paragraph', text: body.join('\n') })
  }
  return blocks
}

// While text streams in, hide half-written syntax: a table header without its
// separator yet, an open link, unclosed bold or code.
function heal(src: string) {
  const lines = src.split('\n')
  const fences = lines.filter((l) => FENCE.test(l) || /^\s*```\s*$/.test(l)).length
  if (fences % 2) return src
  let end = lines.length
  while (end > 0 && lines[end - 1].trimStart().startsWith('|')) end--
  const run = lines.slice(end)
  if (run.length === 1 || (run.length === 2 && !SEPARATOR.test(run[1]) && /^[\s|:-]*$/.test(run[1]))) {
    return lines.slice(0, end).join('\n')
  }
  let line = lines[lines.length - 1]
  const open = line.lastIndexOf('[')
  if (open !== -1) {
    const rest = line.slice(open)
    const complete = /^\[[^\]]*\]\([^)]*\)/.test(rest) || /^\[\d+\]/.test(rest) || /^\[( |x|X)\]/.test(rest)
    if (!complete) line = line.slice(0, open)
  }
  if ((line.match(/\*\*/g) ?? []).length % 2) line += '**'
  if ((line.match(/`/g) ?? []).length % 2) line += '`'
  lines[lines.length - 1] = line
  return lines.join('\n')
}

// Order matters: code first, so nothing inside backticks is parsed.
const INLINE = /(`[^`\n]+`)|(\*\*(?=\S)[\s\S]*?\S\*\*)|(\[[^\]\n]+\]\((?:https?:\/\/|mailto:|#)[^)\s]*\))|(\[\d{1,2}\])|((?<![*\w])\*(?=\S)[^*\n]*?\S\*(?![*\w]))|((?<![\w_])_(?=\S)[^_\n]*?\S_(?![\w_]))/g

type Ctx = { sources?: Citation[]; onLink?: (href: string) => void }

function withBreaks(text: string, key: string): ReactNode[] {
  const parts = text.split('\n')
  return parts.flatMap((part, i) => (i === 0 ? [part] : [<br key={`${key}-br${i}`} />, part]))
}

function renderInline(text: string, ctx: Ctx, prefix = 'i'): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let n = 0
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0
    const key = `${prefix}-${n++}`
    if (index > last) out.push(...withBreaks(text.slice(last, index), key))
    const token = m[0]
    if (m[1]) {
      out.push(<code key={key} className="bg-muted rounded px-1 py-px font-mono text-[0.9em]">{token.slice(1, -1)}</code>)
    } else if (m[2]) {
      out.push(<strong key={key} className="font-semibold">{renderInline(token.slice(2, -2), ctx, key)}</strong>)
    } else if (m[3]) {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)\s]*)\)$/) ?? []
      out.push(<MdLink key={key} href={href ?? '#'} onLink={ctx.onLink}>{renderInline(label ?? token, ctx, key)}</MdLink>)
    } else if (m[4]) {
      const number = Number(token.slice(1, -1))
      const source = ctx.sources?.[number - 1]
      out.push(source ? <Cite key={key} n={number} source={source} /> : token)
    } else {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), ctx, key)}</em>)
    }
    last = index + token.length
  }
  if (last < text.length) out.push(...withBreaks(text.slice(last), `${prefix}-end`))
  return out
}

function MdLink({ href, onLink, children }: { href: string; onLink?: (href: string) => void; children: ReactNode }) {
  const internal = href.startsWith('#')
  return (
    <a
      href={href}
      target={internal ? undefined : '_blank'}
      rel={internal ? undefined : 'noreferrer noopener'}
      onClick={internal && onLink ? (e) => {
        e.preventDefault()
        onLink(href)
      } : undefined}
      className="text-brand underline decoration-current/30 underline-offset-2 hover:decoration-current"
    >
      {children}
    </a>
  )
}

// A numbered citation chip; the tooltip names the source.
export function Cite({ n, source }: { n: number; source: Citation }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Source ${n}: ${source.title}`}
          className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded px-1 align-[1px] text-[10px] leading-none font-medium tabular-nums no-underline"
        >
          {n}
        </a>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <span className="grid gap-0.5">
          <span className="font-medium">{source.title}</span>
          <span className="opacity-70">{source.domain}</span>
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

const LANG_LABEL: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript', typescript: 'TypeScript', js: 'JavaScript', javascript: 'JavaScript',
  sql: 'SQL', json: 'JSON', csv: 'CSV', bash: 'Shell', sh: 'Shell', text: 'Text', md: 'Markdown', markdown: 'Markdown',
}

function writeClipboard(text: string) {
  try {
    navigator.clipboard?.writeText(text).catch(() => {})
  } catch {
    // No clipboard (an insecure page, an old browser): nothing to do.
  }
}

// A code block with its language and a Copy button. `onCopy` runs after the
// code is on the clipboard (for a toast or analytics).
export function CodeBlock({ lang, code, cursor, onCopy }: {
  lang: string
  code: string
  cursor?: boolean
  onCopy?: (code: string) => void
}) {
  const [copied, setCopied] = useState(false)
  function copy() {
    writeClipboard(code)
    onCopy?.(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="bg-subtle min-w-0 overflow-hidden rounded-lg border">
      <div className="text-muted-foreground flex h-8 items-center justify-between gap-2 border-b pr-1 pl-3 text-[11px]">
        <span className="font-mono">{LANG_LABEL[lang.toLowerCase()] ?? lang}</span>
        <Button variant="ghost" size="xs" onClick={copy} aria-label={copied ? 'Code copied' : 'Copy code'}>
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} data-icon="inline-start" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-5">
        <code>{code}{cursor && <StreamCaret />}</code>
      </pre>
    </div>
  )
}

const NUMERIC = /^[-+]?\d[\d,.]*\s?%?$/

function TableView({ header, rows, align, ctx, cursor }: {
  header: string[]
  rows: string[][]
  align?: Align[]
  ctx: Ctx
  cursor?: boolean
}) {
  const numeric = header.map((_, c) => rows.length > 0 && rows.every((r) => !r[c] || NUMERIC.test(r[c])))
  const alignOf = (c: number) => (numeric[c] ? 'right' : align?.[c] ?? 'left')
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-muted/50">
          <tr>
            {header.map((h, c) => (
              <th key={c} scope="col" style={{ textAlign: alignOf(c) }} className="h-8 px-3 font-medium whitespace-nowrap">
                {renderInline(h, ctx, `h${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t">
              {header.map((_, c) => (
                <td key={c} style={{ textAlign: alignOf(c) }} className={cn('px-3 py-1.5 align-top', numeric[c] && 'tabular-nums', c === 0 && 'whitespace-nowrap')}>
                  {renderInline(row[c] ?? '', ctx, `c${r}-${c}`)}
                  {cursor && r === rows.length - 1 && c === header.length - 1 && <StreamCaret />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// A table whose cells take inline Markdown. Columns of numbers align right.
export function MdTable({ header, rows, align, sources, onLink, cursor }: {
  header: string[]
  rows: string[][]
  align?: Align[]
  sources?: Citation[]
  onLink?: (href: string) => void
  cursor?: boolean
}) {
  return <TableView header={header} rows={rows} align={align} ctx={{ sources, onLink }} cursor={cursor} />
}

function BlockView({ block, ctx, cursor }: { block: MdBlock; ctx: Ctx; cursor: boolean }) {
  const caret = cursor ? <StreamCaret /> : null
  switch (block.type) {
    case 'heading': {
      const size = block.level === 1 ? 'text-base' : block.level === 2 ? 'text-sm' : 'text-[13px]'
      const Tag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5'
      return <Tag className={cn('mt-1 font-semibold tracking-tight', size)}>{renderInline(block.text, ctx)}{caret}</Tag>
    }
    case 'paragraph':
      return <p>{renderInline(block.text, ctx)}{caret}</p>
    case 'rule':
      return <hr className="border-border" />
    case 'code':
      return <CodeBlock lang={block.lang} code={block.code} cursor={cursor} />
    case 'table':
      return <TableView header={block.header} rows={block.rows} align={block.align} ctx={ctx} cursor={cursor} />
    case 'quote':
      return (
        <blockquote className="bg-subtle border-l-brand/60 min-w-0 rounded-md border border-l-2 px-3.5 py-3">
          <Blocks text={block.text} ctx={ctx} cursor={cursor} className="gap-2" />
        </blockquote>
      )
    case 'list': {
      const tasks = block.items.some((item) => item.checked !== undefined)
      const items = block.items.map((item, i) => (
        <li key={i} className={cn(tasks && 'flex items-start gap-2')}>
          {tasks && (
            <span
              aria-hidden="true"
              className={cn(
                'mt-[3px] grid size-3.5 shrink-0 place-items-center rounded-[4px] border',
                item.checked ? 'bg-brand border-brand text-primary-foreground' : 'border-input',
              )}
            >
              {item.checked && <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-2.5" />}
            </span>
          )}
          <span className={cn(tasks && 'min-w-0', item.checked && 'text-muted-foreground line-through')}>
            {tasks && <span className="sr-only">{item.checked ? 'Done: ' : 'To do: '}</span>}
            {renderInline(item.text, ctx, `l${i}`)}
            {cursor && i === block.items.length - 1 && caret}
          </span>
        </li>
      ))
      if (tasks) return <ul className="grid gap-1.5">{items}</ul>
      return block.ordered
        ? <ol start={block.start} className="marker:text-muted-foreground grid list-decimal gap-1 pl-5">{items}</ol>
        : <ul className="marker:text-muted-foreground grid list-disc gap-1 pl-5">{items}</ul>
    }
  }
}

function Blocks({ text, ctx, cursor, className }: { text: string; ctx: Ctx; cursor?: boolean; className?: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text])
  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      {/* Keyed by position, so each block fades in once, when it first appears while streaming. */}
      {blocks.map((block, i) => (
        <div key={i} className="ai-in min-w-0">
          <BlockView block={block} ctx={ctx} cursor={!!cursor && i === blocks.length - 1} />
        </div>
      ))}
      {cursor && !blocks.length && <span><StreamCaret /></span>}
    </div>
  )
}

export function Markdown({ text, streaming, sources, onLink, className }: {
  text: string
  streaming?: boolean
  // What "[1]", "[2]"… in the text point at.
  sources?: Citation[]
  onLink?: (href: string) => void
  className?: string
}) {
  const source = streaming ? heal(text) : text
  const ctx = useMemo(() => ({ sources, onLink }), [sources, onLink])
  return (
    <>
      <AiMotion />
      <Blocks text={source} ctx={ctx} cursor={streaming} className={cn('text-[13px] leading-relaxed break-words', className)} />
    </>
  )
}
