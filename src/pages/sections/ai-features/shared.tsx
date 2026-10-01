import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

// The AI pieces every panel uses are the kit's components, so AI in the
// product looks like the AI workspace.
export { AiLabel } from '@/components/ai-label'
export { IconAction } from '@/components/icon-action'
export { StreamCaret, Thinking } from '@/components/thinking-indicator'

// setTimeout that is cleared when the component unmounts.
export function useTimers() {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach(clearTimeout)
      set.clear()
    }
  }, [])

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
    return id
  }, [])

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
  }, [])

  return { later, clearAll }
}

export function copyText(text: string, message: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
  toast.success(message)
}

export type DiffPart = { type: 'same' | 'del' | 'add'; text: string }

// Word-level diff (longest common subsequence). Removals come before additions
// inside a changed run, so "cause because" reads as a replacement.
export function diffWords(before: string, after: string): DiffPart[] {
  const a = before.split(/\s+/).filter(Boolean)
  const b = after.split(/\s+/).filter(Boolean)
  const n = a.length
  const m = b.length
  const lcs = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const parts: DiffPart[] = []
  const push = (type: DiffPart['type'], word: string) => {
    const last = parts[parts.length - 1]
    if (last?.type === type) last.text += ` ${word}`
    else parts.push({ type, text: word })
  }

  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('same', a[i])
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('del', a[i++])
    } else {
      push('add', b[j++])
    }
  }
  while (i < n) push('del', a[i++])
  while (j < m) push('add', b[j++])
  return parts
}

export function DiffText({ parts }: { parts: DiffPart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        const gap = index > 0 ? ' ' : ''
        if (part.type === 'same') return <span key={index}>{gap}{part.text}</span>
        if (part.type === 'del') {
          return (
            <span key={index}>
              {gap}
              <del className="text-muted-foreground decoration-muted-foreground/70 line-through">
                <span className="sr-only">removed: </span>
                {part.text}
              </del>
            </span>
          )
        }
        return (
          <span key={index}>
            {gap}
            <ins className="bg-brand/15 text-foreground rounded-[3px] px-0.5 no-underline">
              <span className="sr-only">added: </span>
              {part.text}
            </ins>
          </span>
        )
      })}
    </>
  )
}
