import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Heading02Icon, LeftToRightListBulletIcon, LeftToRightListNumberIcon, Link01Icon, QuoteDownIcon, SourceCodeIcon,
  TextBoldIcon, TextItalicIcon, TextStrikethroughIcon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { plural } from '@/lib/text'
import { IconAction } from '@/components/icon-action'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Markdown } from '@/blocks/markdown'
import { Panel, Section } from './shared'

/* ---------- Writing editor ---------- */

type Edit = { value: string; start: number; end: number }

type Apply = (value: string, start: number, end: number) => Edit

// Wraps the selection in markers, or removes them when it is already wrapped.
function wrap(before: string, after: string, placeholder: string): Apply {
  return (v, s, e) => {
    if (s >= before.length && v.slice(s - before.length, s) === before && v.slice(e, e + after.length) === after) {
      return {
        value: v.slice(0, s - before.length) + v.slice(s, e) + v.slice(e + after.length),
        start: s - before.length,
        end: e - before.length,
      }
    }
    const inner = v.slice(s, e) || placeholder
    return {
      value: v.slice(0, s) + before + inner + after + v.slice(e),
      start: s + before.length,
      end: s + before.length + inner.length,
    }
  }
}

// Adds a prefix to every line the selection touches, or removes it from all of them.
function prefixLines(make: (i: number) => string, has: RegExp): Apply {
  return (v, s, e) => {
    const lineStart = v.lastIndexOf('\n', s - 1) + 1
    const endAt = e > s && v[e - 1] === '\n' ? e - 1 : e
    const found = v.indexOf('\n', endAt)
    const lineEnd = found === -1 ? v.length : found
    const lines = v.slice(lineStart, lineEnd).split('\n')
    const on = lines.every((l) => has.test(l))
    const next = lines.map((l, i) => (on ? '' : make(i)) + l.replace(has, ''))
    const block = next.join('\n')
    const value = v.slice(0, lineStart) + block + v.slice(lineEnd)
    if (s === e) {
      const caret = Math.max(lineStart, s + next[0].length - lines[0].length)
      return { value, start: caret, end: caret }
    }
    return { value, start: lineStart, end: lineStart + block.length }
  }
}

const code: Apply = (v, s, e) => {
  if (!v.slice(s, e).includes('\n')) return wrap('`', '`', 'code')(v, s, e)
  const lead = s === 0 || v[s - 1] === '\n' ? '' : '\n'
  return wrap(`${lead}\`\`\`\n`, '\n```', '')(v, s, e)
}

const link: Apply = (v, s, e) => {
  const selected = v.slice(s, e)
  const isUrl = /^https?:\/\//i.test(selected)
  const text = isUrl ? 'link text' : selected || 'link text'
  const url = isUrl ? selected : 'https://'
  const value = `${v.slice(0, s)}[${text}](${url})${v.slice(e)}`
  // Select whatever still needs typing: the address after wrapping text, the text otherwise.
  if (selected && !isUrl) {
    const at = s + text.length + 3
    return { value, start: at, end: at + url.length }
  }
  return { value, start: s + 1, end: s + 1 + text.length }
}

type Tool = { id: string; label: string; icon: IconSvgElement; apply: Apply; key?: string }

const TOOL_GROUPS: Tool[][] = [
  [
    { id: 'bold', label: 'Bold', icon: TextBoldIcon, apply: wrap('**', '**', 'bold text'), key: 'b' },
    { id: 'italic', label: 'Italic', icon: TextItalicIcon, apply: wrap('_', '_', 'italic text'), key: 'i' },
    { id: 'strike', label: 'Strikethrough', icon: TextStrikethroughIcon, apply: wrap('~~', '~~', 'struck text') },
  ],
  [
    { id: 'heading', label: 'Heading', icon: Heading02Icon, apply: prefixLines(() => '## ', /^#{1,6}\s+/) },
    { id: 'bullets', label: 'Bulleted list', icon: LeftToRightListBulletIcon, apply: prefixLines(() => '- ', /^[-*+]\s+/) },
    { id: 'numbers', label: 'Numbered list', icon: LeftToRightListNumberIcon, apply: prefixLines((i) => `${i + 1}. `, /^\d+[.)]\s+/) },
    { id: 'quote', label: 'Quote', icon: QuoteDownIcon, apply: prefixLines(() => '> ', /^>\s?/) },
  ],
  [
    { id: 'code', label: 'Code', icon: SourceCodeIcon, apply: code },
    { id: 'link', label: 'Link', icon: Link01Icon, apply: link, key: 'k' },
  ],
]

const TOOLS = TOOL_GROUPS.flat()

const DRAFT = [
  '## Release notes: version 2.4',
  '',
  'This release makes **search faster** and adds _saved views_ to every list.',
  '',
  '- Filters remember your last choice',
  '- Press `Ctrl K` to open the command menu',
  '- ~~Legacy CSV export~~ is replaced by the new export dialog',
  '',
  '> Saved views are shared with everyone in the workspace.',
  '',
  '### Turn on webhooks',
  '',
  '1. Open **Settings**, then [Integrations](https://example.com/docs/webhooks)',
  '2. Choose the events to send',
  '3. Paste your endpoint and save',
  '',
  '```',
  'curl -X POST https://example.com/hooks/demo',
  '```',
].join('\n')

function EditorPanel() {
  const [value, setValue] = useState(DRAFT)
  const [tab, setTab] = useState('write')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const selection = useRef<[number, number] | null>(null)
  const saveTimer = useRef(0)

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  // Put the selection back after React has written the new value.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !selection.current) return
    el.focus()
    el.setSelectionRange(...selection.current)
    selection.current = null
  }, [value])

  function change(next: string) {
    setValue(next)
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => setSaving(false), 700)
  }

  function run(tool: Tool) {
    const el = ref.current
    if (!el) return
    const edit = tool.apply(el.value, el.selectionStart, el.selectionEnd)
    selection.current = [edit.start, edit.end]
    change(edit.value)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
    const tool = TOOLS.find((t) => t.key === e.key.toLowerCase())
    if (!tool) return
    e.preventDefault()
    // The page opens its command menu on Ctrl+K; inside the editor it makes a link.
    e.stopPropagation()
    run(tool)
  }

  const trimmed = value.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0

  return (
    <Panel title="Writing editor" note="Markdown, previewed with the Markdown block" wide>
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-ring/30 bg-background min-w-0 overflow-hidden rounded-lg border transition-[border-color,box-shadow] has-[textarea:focus-visible]:ring-2">
          <div className="flex flex-wrap items-center gap-2 border-b px-2 py-1.5">
            <TabsList>
              <TabsTrigger value="write" className="px-2.5">Write</TabsTrigger>
              <TabsTrigger value="preview" className="px-2.5">Preview</TabsTrigger>
            </TabsList>
            {tab === 'write' && (
              <div role="toolbar" aria-label="Formatting" className="ml-auto flex flex-wrap items-center gap-0.5">
                {TOOL_GROUPS.map((group, g) => (
                  <div key={g} className="flex items-center gap-0.5">
                    {g > 0 && <span aria-hidden className="bg-border mx-1 h-4 w-px" />}
                    {group.map((tool) => (
                      <IconAction
                        key={tool.id}
                        label={tool.label}
                        icon={tool.icon}
                        shortcut={tool.key ? ['mod', tool.key.toUpperCase()] : undefined}
                        // Keeps the textarea focused, so its selection stays visible.
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => run(tool)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <TabsContent value="write">
            <Textarea
              ref={ref}
              value={value}
              onChange={(e) => change(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Release notes, in Markdown"
              spellCheck
              className="max-h-[28rem] min-h-72 rounded-none border-0 bg-transparent px-3.5 py-3 font-mono focus-visible:ring-0 dark:bg-transparent"
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="min-h-72 min-w-0 px-4 py-3">
              {trimmed ? <Markdown text={value} /> : <p className="text-muted-foreground text-[13px]">Nothing to preview yet.</p>}
            </div>
          </TabsContent>

          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-3 py-1.5 text-[11px]">
            <span className="tabular-nums">
              {plural(words, 'word')} · {Math.max(1, Math.round(words / 200))} min read
            </span>
            {saving ? (
              <span className="flex items-center gap-1">
                <Spinner aria-hidden className="size-3 motion-reduce:animate-none" /> Saving…
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-3" /> Saved
              </span>
            )}
          </div>
        </div>
      </Tabs>
    </Panel>
  )
}

export default function MarkdownSection() {
  return (
    <Section id="markdown" title="Markdown and editor" description="Markdown shown as formatted text, and a writing editor with a preview">
      <EditorPanel />
    </Section>
  )
}
