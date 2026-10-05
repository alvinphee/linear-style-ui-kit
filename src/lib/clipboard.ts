import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// Copying text, and the brief "Copied" state on a Copy button.

export type CopyTextOptions = {
  // The toast after a good copy. Defaults to "Copied to clipboard". Pass false
  // for none, when the button shows its own tick instead (see useCopied).
  success?: string | false
  // A second line under the success toast.
  description?: string
  // The toast when the page has no clipboard or the browser blocks it.
  // Defaults to "Copy failed". Pass false for none.
  error?: string | false
  // A second line under the error toast. Left out, it is "Your browser blocked
  // the clipboard." under the default error, and nothing under your own.
  errorDescription?: string
}

// Writes text to the clipboard and says so in a toast. Resolves to true when
// the text is on the clipboard, false when it could not be copied.
export async function copyText(text: string, options: CopyTextOptions = {}): Promise<boolean> {
  const { success = 'Copied to clipboard', description, error = 'Copy failed' } = options
  const errorDescription = options.errorDescription
    ?? (options.error === undefined ? 'Your browser blocked the clipboard.' : undefined)
  try {
    // No clipboard on an insecure (http) page or in an old browser.
    if (!navigator.clipboard) throw new Error('Clipboard not available')
    await navigator.clipboard.writeText(text)
  } catch {
    if (error !== false) toast.error(error, { description: errorDescription })
    return false
  }
  if (success !== false) toast.success(success, { description })
  return true
}

// Briefly true after a copy, for the tick on a Copy button. Call the second
// item after copying; the flag drops back after `ms`.
export function useCopied(ms = 1500) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const flagCopied = useCallback(() => {
    clearTimeout(timer.current)
    setCopied(true)
    timer.current = setTimeout(() => setCopied(false), ms)
  }, [ms])

  return [copied, flagCopied] as const
}
