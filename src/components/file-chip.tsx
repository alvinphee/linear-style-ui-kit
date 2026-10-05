import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Cancel01Icon, Csv01Icon, Doc01Icon, File01Icon, Image01Icon, Pdf01Icon, SourceCodeIcon, Txt01Icon, Xls01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/format'

// An attached file: its type icon, name and size, with a remove button
// while it can still be taken off (in a prompt box, before sending).

// What a file holds, by its extension.
export type FileKind = 'pdf' | 'sheet' | 'doc' | 'csv' | 'text' | 'image' | 'code' | 'other'

const EXTENSIONS: [string[], Exclude<FileKind, 'other'>][] = [
  [['pdf'], 'pdf'],
  [['xls', 'xlsx', 'numbers', 'ods'], 'sheet'],
  [['doc', 'docx', 'pages', 'odt', 'rtf'], 'doc'],
  [['csv', 'tsv'], 'csv'],
  [['txt', 'md', 'log'], 'text'],
  [['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'], 'image'],
  [['ts', 'tsx', 'js', 'jsx', 'json', 'sql', 'py', 'css', 'html'], 'code'],
]

export const FILE_KIND_ICONS: Record<FileKind, IconSvgElement> = {
  pdf: Pdf01Icon, sheet: Xls01Icon, doc: Doc01Icon, csv: Csv01Icon, text: Txt01Icon, image: Image01Icon,
  code: SourceCodeIcon, other: File01Icon,
}

// A file's kind from its name: report.pdf → 'pdf', sales.xlsx → 'sheet'.
export function fileKind(name: string): FileKind {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSIONS.find(([list]) => list.includes(ext))?.[1] ?? 'other'
}

// The icon for a file name, by its extension: a PDF, a sheet, an image…
export const fileIcon = (name: string): IconSvgElement => FILE_KIND_ICONS[fileKind(name)]


export function FileChip({ name, size, icon, onRemove, className }: {
  name: string
  // In bytes.
  size?: number
  // Defaults to the icon for the file's extension.
  icon?: IconSvgElement
  onRemove?: () => void
  className?: string
}) {
  return (
    <span className={cn('bg-card inline-flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-md border pr-1 pl-2 text-xs', className)}>
      <HugeiconsIcon icon={icon ?? fileIcon(name)} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{name}</span>
      {size !== undefined && <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{formatFileSize(size)}</span>}
      {onRemove ? (
        <Button variant="ghost" size="icon-xs" aria-label={`Remove ${name}`} className="text-muted-foreground" onClick={onRemove}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      ) : <span className="w-1" />}
    </span>
  )
}
