import { useCallback, useSyncExternalStore } from 'react'

// Whether a CSS media query matches, kept up to date as the window changes:
// useMediaQuery('(min-width: 1024px)'). False on the server.
export function useMediaQuery(query: string) {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
