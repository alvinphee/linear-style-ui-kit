import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// A person, drawn from their name: an initials avatar, or the avatar with the
// name beside it (a person chip) for tables, lists and activity rows. And the
// empty avatar that stands for nobody (no assignee).

// First and last name's first letters ("Maya Ross" → MR); a one-word name
// gives its first two letters.
function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length > 1) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

// Sized with a plain size-* class rather than size="sm": the avatar's own
// data-[size=sm] rule would otherwise beat a size passed in by the caller.
export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn('size-6', className)}>
      <AvatarFallback className="text-[10px]">{initialsOf(name)}</AvatarFallback>
    </Avatar>
  )
}

// The empty avatar for "no assignee": a dashed circle with a person icon.
// Sized like UserAvatar, with a size-* class (size-4 by default).
export function NoAssignee({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex size-4 shrink-0 items-center justify-center rounded-full border border-dashed', className)}>
      <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="text-muted-foreground size-2.5" />
    </span>
  )
}

// The avatar and the name. With no name, a dash, so empty cells line up.
export function Person({ name, className, avatarClassName }: {
  name: string
  className?: string
  avatarClassName?: string
}) {
  if (!name) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <UserAvatar name={name} className={cn('size-5', avatarClassName)} />
      <span className="truncate">{name}</span>
    </span>
  )
}
