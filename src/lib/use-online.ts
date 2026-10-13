import { useSyncExternalStore } from 'react'

// Whether the browser thinks it is online: navigator.onLine, kept current by
// the window's online and offline events. It only knows about the network
// link (a captive portal still reads as online), so treat false as certain
// and true as likely. On the server it reads as online.

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

export function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}
