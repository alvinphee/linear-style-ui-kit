import { useId } from 'react'

// A unique id that is safe in SVG: React's useId can hold colons and other
// marks that url(#…) does not accept. Use it for gradient and clip path ids.
export function useSvgId() {
  return useId().replace(/[^a-zA-Z0-9_-]/g, '')
}
