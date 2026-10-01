import { createContext, useContext, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowUp01Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { UserAvatar } from '@/components/person'
import { MOD } from '@/components/shortcut'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

// The side panel ("peek"): one record opened beside a list or board, without
// leaving it. A header with the record's number, a status badge, previous /
// next through the list, the title (editable in place if you like) and a row
// of property pills and actions; then details as label–value rows, your own
// sections, and an activity timeline with an optional comment box; and a
// footer whose Delete asks first.
//
// Two parts, so the panel can slide out after its record is gone:
//   <RecordSheet open={!!record} onOpenChange={…}>
//     {record && <RecordSheetContent number={…} title={…} … />}
//   </RecordSheet>
// Give RecordSheetContent a `key` per record to start each one with an
// empty comment box.

export type RecordDetail = { label: string; value: ReactNode }

export type RecordActivity = {
  id: string | number
  // Who did it. Shown bold, with their initials unless `avatar` is given.
  actor?: string
  avatar?: ReactNode
  // What they did: "moved this to Done", "commented: “…”".
  text: ReactNode
  // When, as it should read: "2h ago", "1 Oct, 14:05".
  at?: string
}

export type RecordNavigation = {
  // Where the record sits in the list (-1 when it is not in it), and the list's length.
  index: number
  total: number
  // Left out at either end of the list: that button is then disabled.
  onPrevious?: () => void
  onNext?: () => void
}

const CloseContext = createContext<() => void>(() => {})

export function RecordSheet({ open, onOpenChange, onCloseAutoFocus, className, children }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Prevent it to stop focus going back to the row, e.g. when leaving for another page.
  onCloseAutoFocus?: (event: Event) => void
  className?: string
  children?: ReactNode
}) {
  return (
    <CloseContext.Provider value={() => onOpenChange(false)}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={cn('gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md', className)}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          {children}
        </SheetContent>
      </Sheet>
    </CloseContext.Provider>
  )
}

export function RecordSheetContent({
  number, badge, title, onTitleChange, description, noun = 'record', navigation, properties, actions,
  details, detailsTitle = 'Details', children, activity, activityTitle = 'Activity', onComment,
  commentPlaceholder = 'Leave a comment…', commentLabel = 'Comment', footer, onDelete, deleteTitle,
  deleteDescription,
}: {
  // The record's number, first in the header: "J-104", "Customer invoice · INV-2026-0001".
  number?: ReactNode
  // Beside the number, such as a status badge.
  badge?: ReactNode
  title: string
  // Makes the title editable in place; called as the person types.
  onTitleChange?: (title: string) => void
  // For screen readers: what the panel holds.
  description: string
  // Names the previous / next buttons: "Previous invoice".
  noun?: string
  navigation?: RecordNavigation
  // A row under the title: property pills, badges.
  properties?: ReactNode
  // Buttons at the end of that row.
  actions?: ReactNode
  details?: RecordDetail[]
  detailsTitle?: string
  // Your own sections, between the details and the activity.
  children?: ReactNode
  // Newest first, as the list reads.
  activity?: RecordActivity[]
  activityTitle?: string
  // Adds a comment box above the activity.
  onComment?: (text: string) => void
  commentPlaceholder?: string
  commentLabel?: string
  // Footer buttons, before Delete.
  footer?: ReactNode
  // Adds Delete to the footer, after a confirm. Return false to keep the panel open.
  onDelete?: () => boolean | void
  deleteTitle?: ReactNode
  deleteDescription?: ReactNode
}) {
  const close = useContext(CloseContext)
  const [confirming, setConfirming] = useState(false)
  const items = activity ?? []

  return (
    <>
      <SheetHeader className="gap-3 border-b pr-12">
        <div className="flex items-center gap-1">
          {number && <span className="text-muted-foreground min-w-0 truncate text-xs tabular-nums">{number}</span>}
          {badge && <span className="ml-1 flex shrink-0">{badge}</span>}
          {navigation && (
            <>
              {navigation.index >= 0 && (
                <span className="text-muted-foreground ml-auto shrink-0 text-[11px] tabular-nums">
                  {navigation.index + 1} / {navigation.total}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                className={navigation.index < 0 ? 'ml-auto' : undefined}
                aria-label={`Previous ${noun}`}
                disabled={!navigation.onPrevious}
                onClick={navigation.onPrevious}
              >
                <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Next ${noun}`}
                disabled={!navigation.onNext}
                onClick={navigation.onNext}
              >
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
              </Button>
            </>
          )}
        </div>
        {onTitleChange ? (
          <>
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <SheetDescription className="sr-only">{description}</SheetDescription>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              aria-label="Title"
              className="w-full bg-transparent text-base font-semibold outline-none"
            />
          </>
        ) : (
          <>
            <SheetTitle className="text-base font-semibold break-words">{title}</SheetTitle>
            <SheetDescription className="sr-only">{description}</SheetDescription>
          </>
        )}
        {(properties || actions) && (
          <div className="flex flex-wrap gap-1.5">
            {properties}
            {actions && <div className={cn('flex flex-wrap items-center gap-1.5', properties && 'ml-auto')}>{actions}</div>}
          </div>
        )}
      </SheetHeader>

      <div className="grid flex-1 content-start gap-5 overflow-y-auto p-4 text-xs">
        {details && details.length > 0 && (
          <section aria-label={detailsTitle} className="grid gap-1">
            <h3 className="font-medium">{detailsTitle}</h3>
            <dl className="grid">
              {details.map((d, i) => (
                <div key={`${i}-${d.label}`} className="flex min-h-7 items-center gap-2">
                  <dt className="text-muted-foreground w-28 shrink-0 truncate">{d.label}</dt>
                  <dd className="flex min-w-0 flex-1 items-center">{d.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {children}

        {(items.length > 0 || onComment) && (
          <section aria-label={activityTitle} className="grid gap-2">
            <h3 className="font-medium">{activityTitle}</h3>
            {onComment && <CommentBox onComment={onComment} placeholder={commentPlaceholder} label={commentLabel} />}
            {items.length > 0 && (
              <ul className="grid gap-2">
                {items.map((a) => (
                  <li key={a.id} className="text-muted-foreground flex gap-2">
                    {a.avatar ?? (a.actor ? (
                      <UserAvatar name={a.actor} className="size-4" />
                    ) : (
                      <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
                        <span className="bg-muted-foreground/50 size-1.5 rounded-full" />
                      </span>
                    ))}
                    <span className="min-w-0 break-words">
                      {a.actor && <><b className="text-foreground font-medium">{a.actor}</b>{' '}</>}
                      {a.text}
                      {a.at && ` · ${a.at}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {(footer || onDelete) && (
        <SheetFooter className="flex-row flex-wrap border-t">
          {footer}
          {onDelete && (
            <Button variant="destructive" size="sm" className="ml-auto" onClick={() => setConfirming(true)}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
              Delete
            </Button>
          )}
        </SheetFooter>
      )}

      {onDelete && (
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteTitle ?? `Delete this ${noun}?`}</AlertDialogTitle>
              <AlertDialogDescription>{deleteDescription ?? 'This cannot be undone.'}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  if (onDelete() !== false) close()
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

function CommentBox({ onComment, placeholder, label }: {
  onComment: (text: string) => void
  placeholder: string
  label: string
}) {
  const [text, setText] = useState('')
  const empty = !text.trim()

  function submit() {
    if (empty) return
    onComment(text.trim())
    setText('')
  }

  return (
    <div className="bg-input/20 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/30 rounded-lg border transition-colors focus-within:ring-2">
      <Textarea
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            submit()
          }
        }}
        className="min-h-14 border-0 bg-transparent px-3 py-2.5 focus-visible:ring-0 dark:bg-transparent"
      />
      <div className="flex items-center justify-end gap-1 px-2 pb-2">
        <span className="text-muted-foreground mr-auto hidden pl-1 text-[11px] sm:inline">
          {MOD} + Enter to send
        </span>
        <Button variant={empty ? 'secondary' : 'default'} disabled={empty} onClick={submit}>
          {label}
        </Button>
      </div>
    </div>
  )
}
