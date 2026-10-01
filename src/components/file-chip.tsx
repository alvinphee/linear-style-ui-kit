import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Cancel01Icon, Csv01Icon, Doc01Icon, File01Icon, Image01Icon, Pdf01Icon, SourceCodeIcon, Txt01Icon, Xls01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'

// An attached file: its type icon, name and size, with a remove button
// while it can still be taken off (in a prompt box, before sending).

const EXTENSION_ICONS: [string[], IconSvgElement][] = [
  [['pdf'], Pdf01Icon],
  [['xls', 'xlsx', 'numbers', 'ods'], Xls01Icon],
  [['doc', 'docx', 'pages', 'odt', 'rtf'], Doc01Icon],
  [['csv', 'tsv'], Csv01Icon],
  [['txt', 'md', 'log'], Txt01Icon],
  [['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'], Image01Icon],
  [['ts', 'tsx', 'js', 'jsx', 'json', 'sql', 'py', 'css', 'html'], SourceCodeIcon],
]

// The icon for a file name, by its extension: a PDF, a sheet, an image…
export function fileIcon(name: string): IconSvgElement {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_ICONS.find(([list]) => list.includes(ext))?.[1] ?? File01Icon
}

// "820 B", "48 KB", "2.4 MB".
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

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
