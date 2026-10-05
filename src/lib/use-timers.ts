import { useCallback, useEffect, useRef } from 'react'

// setTimeout that is cleared when the component unmounts. `later(fn, ms)`
// schedules and returns the timer's id; `clearAll()` cancels every pending one.
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
