import { useRef, type ReactNode, type RefObject } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// The "are you sure?" step before deleting (or any action that can't be
// undone): a title, a line saying what goes, Cancel and the action. Pass the
// button that opens it as children, or drive it with open / onOpenChange.
// Destructive by default (red action, trash icon); `destructive={false}` is
// for a milder action such as Archive. `icon={null}` leaves the icon out.
export function DeleteConfirm({
  title, description, onConfirm, open, onOpenChange, confirmLabel = 'Delete', cancelLabel = 'Cancel',
  destructive = true, icon = Delete02Icon, size, returnFocusRef, afterConfirm, children,
}: {
  title: ReactNode
  description: ReactNode
  onConfirm: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  destructive?: boolean
  icon?: IconSvgElement | null
  // sm: a narrow dialog with the buttons side by side.
  size?: 'default' | 'sm'
  // When it was opened from a menu item (so there is no trigger to go back
  // to), the element to focus once it closes, such as the menu's button.
  returnFocusRef?: RefObject<HTMLElement | null>
  // Runs once the dialog has closed after a confirm, in place of the usual
  // focus return: the row that opened it is gone, so move focus somewhere
  // that still exists (such as New chat).
  afterConfirm?: () => void
  children?: ReactNode
}) {
  const confirmed = useRef(false)
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent
        size={size}
        onCloseAutoFocus={(e) => {
          const done = confirmed.current
          confirmed.current = false
          if (done && afterConfirm) {
            e.preventDefault()
            afterConfirm()
          } else if (returnFocusRef) {
            e.preventDefault()
            returnFocusRef.current?.focus()
          }
        }}
      >
        <AlertDialogHeader>
          {icon && (
            <AlertDialogMedia className={cn(destructive && 'bg-destructive/10 text-destructive')}>
              <HugeiconsIcon icon={icon} strokeWidth={2} />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => {
              confirmed.current = true
              onConfirm()
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
