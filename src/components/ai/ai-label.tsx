import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'

// The small sparkle pill that marks AI output: "AI", "AI suggests",
// "Understood as". Put it on anything a model wrote or proposed, so people
// can tell it apart from what a person entered.

export function AiLabel({ children = 'AI', className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'bg-brand/10 text-brand inline-flex h-4 shrink-0 items-center gap-0.5 rounded-full pr-1.5 pl-1 text-[10px] leading-none font-medium',
        className,
      )}
    >
      <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-2.5" aria-hidden />
      {children}
    </span>
  )
}
