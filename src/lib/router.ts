import { useSyncExternalStore } from 'react'

// A tiny hash router: "#/buttons" is the Buttons page, "#/templates/erp" a
// full-page template. Hash URLs need no server setup and survive a reload.
// Old anchors like "#board" still work: the leading slash is optional.

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function readPath() {
  const path = window.location.hash.replace(/^#\/?/, '')
  return '/' + path
}

export function usePath() {
  return useSyncExternalStore(subscribe, readPath)
}

export function navigate(path: string) {
  if (readPath() !== path) window.location.hash = path
  window.scrollTo({ top: 0 })
}
