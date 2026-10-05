import type { ComponentProps } from 'react'
import { cn } from 'cn'

// An @mention of a person or record inside text, as a brand-tinted pill:
// "@meiling can you check bay 4?". Also used for a leading /command in a
// prompt. Plain text by default; give it `href` to make it a link, which can
// be a hover card's trigger (extra props and the ref go onto the link).
export function Mention({ href, className, ...props }: ComponentProps<'a'>) {
  const pill = 'bg-brand/10 text-brand rounded px-1 py-px font-medium'
  if (href !== undefined) {
    return (
      <a
        href={href}
        className={cn(pill, 'hover:bg-brand/15 focus-visible:ring-ring/30 outline-none focus-visible:ring-2', className)}
        {...props}
      />
    )
  }
  const { ref: _ref, ...rest } = props
  return <span className={cn(pill, className)} {...rest} />
}
