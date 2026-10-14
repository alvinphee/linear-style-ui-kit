import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { copyText, useCopied } from '@/lib/clipboard'

// A read-only value with a copy button: a URL, a DNS record, a token.
export function CopyField({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, flagCopied] = useCopied()
  return (
    <span className={cn('bg-card flex min-w-0 items-center gap-1 rounded-md border py-0.5 pr-0.5 pl-2', className)}>
      <code className="min-w-0 flex-1 truncate font-mono text-[11px]" title={value}>{value}</code>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          if (await copyText(value, { success: false })) flagCopied()
        }}
      >
        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} />
      </Button>
    </span>
  )
}
