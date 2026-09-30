import { useMemo, useState, type Ref } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Cancel01Icon, Copy01Icon, Download01Icon, EyeIcon, SourceCodeIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatWhen } from './data'
import { artifactFileName, copyToClipboard, downloadText } from './helpers'
import { CodeBlock, Markdown, MdTable } from './markdown'
import { IconAction } from './Message'
import { KIND_ICONS, KIND_LABELS } from './parts'
import type { Artifact } from './types'

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (ch !== '\r') cell += ch
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

const heading = (key: string) => {
  const text = key.replace(/_/g, ' ')
  return text[0]?.toUpperCase() + text.slice(1)
}

function WithLines({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <pre className="min-w-max py-3 font-mono text-xs leading-5">
      <code>
        {lines.map((line, i) => (
          <span key={i} className="flex">
            <span aria-hidden="true" className="text-muted-foreground/60 w-11 shrink-0 pr-4 text-right tabular-nums select-none">{i + 1}</span>
            <span className="pr-4 whitespace-pre">{line || ' '}</span>
          </span>
        ))}
      </code>
    </pre>
  )
}

export function ArtifactPanel({ artifact, version, onVersion, onClose, headingRef }: {
  artifact: Artifact
  version: number
  onVersion: (version: number) => void
  onClose: () => void
  // Lets the workspace move focus here when someone opens the panel.
  headingRef?: Ref<HTMLHeadingElement>
}) {
  const [tab, setTab] = useState('preview')
  const [copied, setCopied] = useState(false)
  const index = Math.min(Math.max(version, 1), artifact.versions.length) - 1
  const current = artifact.versions[index]
  const content = current.content
  const lines = content.split('\n').length
  const table = useMemo(() => (artifact.kind === 'table' ? parseCsv(content) : null), [artifact.kind, content])

  function copy() {
    copyToClipboard(content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  function download() {
    const { name, type } = artifactFileName(artifact)
    downloadText(name, content, type)
    toast(`Downloaded ${name}`, { description: `Version ${index + 1}` })
  }

  const many = artifact.versions.length > 4

  return (
    <div className="@container flex h-full min-h-0 min-w-0 flex-col">
      <header className="flex h-11 shrink-0 items-center gap-1 border-b pr-1.5 pl-3">
        <HugeiconsIcon icon={KIND_ICONS[artifact.kind]} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />
        <div className="ml-1 min-w-0 flex-1 leading-4">
          <h3 ref={headingRef} tabIndex={-1} className="truncate text-xs font-medium outline-none">{artifact.title}</h3>
          <p className="text-muted-foreground truncate text-[11px]">{KIND_LABELS[artifact.kind]} · v{index + 1}</p>
        </div>
        {artifact.versions.length > 1 && (many ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label={`Version ${index + 1} of ${artifact.versions.length}`}>
                v{index + 1}
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuRadioGroup value={String(index + 1)} onValueChange={(v) => onVersion(Number(v))}>
                {artifact.versions.map((v, i) => (
                  <DropdownMenuRadioItem key={i} value={String(i + 1)}>
                    Version {i + 1}
                    <span className="text-muted-foreground ml-auto text-[11px]">{formatWhen(v.at)}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div role="group" aria-label="Versions" className="bg-muted flex items-center gap-0.5 rounded-md p-0.5">
            {artifact.versions.map((v, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={i === index}
                aria-label={`Version ${i + 1}, ${formatWhen(v.at)}`}
                onClick={() => onVersion(i + 1)}
                className="text-muted-foreground hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground focus-visible:ring-ring/30 h-5 min-w-6 rounded-sm px-1 text-[11px] font-medium tabular-nums outline-none focus-visible:ring-2 aria-pressed:shadow-xs"
              >
                v{i + 1}
              </button>
            ))}
          </div>
        ))}
        <IconAction label={copied ? 'Copied' : 'Copy'} icon={copied ? Tick02Icon : Copy01Icon} onClick={copy} />
        <IconAction label="Download" icon={Download01Icon} onClick={download} />
        <IconAction label="Close" icon={Cancel01Icon} onClick={onClose} />
      </header>

      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
          <TabsList>
            <TabsTrigger value="preview">
              <HugeiconsIcon icon={EyeIcon} strokeWidth={2} data-icon="inline-start" /> Preview
            </TabsTrigger>
            <TabsTrigger value="code">
              <HugeiconsIcon icon={SourceCodeIcon} strokeWidth={2} data-icon="inline-start" /> Code
            </TabsTrigger>
          </TabsList>
          <span className="text-muted-foreground ml-auto truncate text-[11px] tabular-nums">
            {lines} {lines === 1 ? 'line' : 'lines'} · {formatWhen(current.at)}
          </span>
        </div>
        <TabsContent value="preview" className="min-h-0 overflow-y-auto">
          <div className="min-w-0 p-4">
            {artifact.kind === 'document' && <Markdown text={content} />}
            {artifact.kind === 'table' && table && table.length > 0 && (
              <MdTable header={table[0].map(heading)} rows={table.slice(1)} />
            )}
            {artifact.kind === 'code' && <CodeBlock lang={artifact.language} code={content} />}
          </div>
        </TabsContent>
        <TabsContent value="code" className="min-h-0 overflow-auto">
          <WithLines text={content} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
