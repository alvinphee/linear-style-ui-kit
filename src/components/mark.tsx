import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from 'cn'

// Small square marks that stand for a thing in lists, switchers and paths.
//   LetterMark: letters on a solid colour, for a workspace, company or team
//   IconMark:   an icon on a tint of a colour, for a module or app

const LETTER_SIZE = {
  xs: 'size-4 rounded-[4px] text-[8px]',
  sm: 'size-5 rounded text-[9px]',
  md: 'size-7 rounded-md text-[10px]',
  lg: 'size-9 rounded-lg text-xs',
} as const

export function LetterMark({ text, colour, size = 'sm', className }: {
  // One to three letters, such as "AT".
  text: string
  colour: string
  size?: keyof typeof LETTER_SIZE
  className?: string
}) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center font-semibold text-white', LETTER_SIZE[size], className)}
      style={{ background: colour }}
    >
      {text}
    </span>
  )
}

const ICON_SIZE = {
  sm: 'size-5 rounded-md [&_svg]:size-3',
  md: 'size-7 rounded-md [&_svg]:size-4',
  lg: 'size-9 rounded-lg [&_svg]:size-5',
} as const

export function IconMark({ icon, colour, size = 'md', className }: {
  icon: IconSvgElement
  colour: string
  size?: keyof typeof ICON_SIZE
  className?: string
}) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center', ICON_SIZE[size], className)}
      style={{ background: `color-mix(in oklch, ${colour} 16%, transparent)`, color: colour }}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </span>
  )
}
