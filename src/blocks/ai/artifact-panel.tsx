import { useState, type ReactNode, type Ref } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowDown01Icon, Cancel01Icon, Copy01Icon, Download01Icon, EyeIcon, SourceCodeIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// The artifact panel: one artifact (a document, table or piece of code the
// assistant made) opened beside the chat. A header with its kind icon, title,
// kind and version, a version pager (a button per version up to four, a menu
// past that), Copy, Download and Close; then Preview and Code tabs with the
// line count and when the version was made. Preview shows what you render in
// `preview` (Markdown, a table, highlighted code); Code shows `source` with
// line numbers. Leave `preview` out for the code view alone, without tabs.
//
// It fills its parent, so put it in an aside or a sheet. Give it a `key` per
// artifact so each one opens on Preview. Escape is the host's to handle;
// `headingRef` lets the host move focus to the title when the panel opens.

export type ArtifactPanelVersion = {
  // When the version was made, as it should read: "Today, 14:05".
  when?: string
}

// Splits CSV text into rows of cells: quoted cells, "" for a quote, CRLF.
export function parseCsv(text: string) {
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

// Text with line numbers, scrolling sideways rather than wrapping.
export function CodeLines({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n')
  return (
    <pre className={cn('min-w-max py-3 font-mono text-xs leading-5', className)}>
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

function copyText(text: string) {
  try {
    navigator.clipboard?.writeText(text).catch(() => {})
  } catch {
    // No clipboard here (an insecure page, an old browser): nothing to do.
  }
}

function saveText(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ArtifactPanel({
  title, icon, kind, source, preview, versions, version, onVersionChange, fileName, fileType = 'text/plain',
  onDownload, onClose, actions, headingRef, className,
}: {
  title: string
  icon?: IconSvgElement
  // "Document", "Table", "Code": shown under the title, with the version.
  kind?: string
  // The text of the version on screen: the Code tab, Copy, the line count and Download.
  source: string
  preview?: ReactNode
  // One per version, oldest first. Two or more show the pager.
  versions?: ArtifactPanelVersion[]
  // The version on screen, from 1. Defaults to the latest.
  version?: number
  onVersionChange?: (version: number) => void
  // Turns on Download: saves `source` under this name, and says so in a toast.
  fileName?: string
  fileType?: string
  // Download your own way instead (another format, a server file).
  onDownload?: () => void
  onClose?: () => void
  // More buttons in the header, before Copy.
  actions?: ReactNode
  headingRef?: Ref<HTMLHeadingElement>
  className?: string
}) {
  const [tab, setTab] = useState('preview')
  const [copied, setCopied] = useState(false)
  const count = versions?.length ?? 0
  const index = count ? Math.min(Math.max(version ?? count, 1), count) - 1 : 0
  const when = versions?.[index]?.when
  const lines = source.split('\n').length
  const many = count > 4

  function copy() {
    copyText(source)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  function download() {
    if (onDownload) {
      onDownload()
      return
    }
    if (!fileName) return
    saveText(fileName, source, fileType)
    toast(`Downloaded ${fileName}`, count ? { description: `Version ${index + 1}` } : undefined)
  }

  const meta = (
    <span className="text-muted-foreground ml-auto truncate text-[11px] tabular-nums">
      {lines} {lines === 1 ? 'line' : 'lines'}{when && ` · ${when}`}
    </span>
  )

  return (
    <div className={cn('@container flex h-full min-h-0 min-w-0 flex-col', className)}>
      <header className="flex h-11 shrink-0 items-center gap-1 border-b pr-1.5 pl-3">
        {icon && <HugeiconsIcon icon={icon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />}
        <div className="ml-1 min-w-0 flex-1 leading-4">
          <h3 ref={headingRef} tabIndex={-1} className="truncate text-xs font-medium outline-none">{title}</h3>
          {(kind || count > 0) && (
            <p className="text-muted-foreground truncate text-[11px]">
              {kind}{kind && count > 0 && ' · '}{count > 0 && `v${index + 1}`}
            </p>
          )}
        </div>
        {count > 1 && (many ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label={`Version ${index + 1} of ${count}`}>
                v{index + 1}
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuRadioGroup value={String(index + 1)} onValueChange={(v) => onVersionChange?.(Number(v))}>
                {versions!.map((v, i) => (
                  <DropdownMenuRadioItem key={i} value={String(i + 1)}>
                    Version {i + 1}
                    {v.when && <span className="text-muted-foreground ml-auto text-[11px]">{v.when}</span>}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div role="group" aria-label="Versions" className="bg-muted flex items-center gap-0.5 rounded-md p-0.5">
            {versions!.map((v, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={i === index}
                aria-label={v.when ? `Version ${i + 1}, ${v.when}` : `Version ${i + 1}`}
                onClick={() => onVersionChange?.(i + 1)}
                className="text-muted-foreground hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground focus-visible:ring-ring/30 h-5 min-w-6 rounded-sm px-1 text-[11px] font-medium tabular-nums outline-none focus-visible:ring-2 aria-pressed:shadow-xs"
              >
                v{i + 1}
              </button>
            ))}
          </div>
        ))}
        {actions}
        <IconAction label={copied ? 'Copied' : 'Copy'} icon={copied ? Tick02Icon : Copy01Icon} onClick={copy} />
        {(onDownload || fileName) && <IconAction label="Download" icon={Download01Icon} onClick={download} />}
        {onClose && <IconAction label="Close" icon={Cancel01Icon} onClick={onClose} />}
      </header>

      {preview === undefined ? (
        <>
          <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">{meta}</div>
          <div className="min-h-0 flex-1 overflow-auto">
            <CodeLines text={source} />
          </div>
        </>
      ) : (
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
            {meta}
          </div>
          <TabsContent value="preview" className="min-h-0 overflow-y-auto">
            <div className="min-w-0 p-4">{preview}</div>
          </TabsContent>
          <TabsContent value="code" className="min-h-0 overflow-auto">
            <CodeLines text={source} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
