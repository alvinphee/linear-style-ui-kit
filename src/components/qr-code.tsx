import { useMemo, type ReactNode } from 'react'
import { encode } from 'uqr'
import { cn } from 'cn'
import { initials } from '@/lib/text'
import { LetterMark } from '@/components/mark'

// A QR code for a link or a reference: pay an invoice, open a record on a
// phone, set up an authenticator app. It can carry a company's name: printed
// under the code with an optional caption ("Scan to pay"), and as a mark in
// the middle (the company's initials or name, or your own logo).
//
// The code sits on a white plate in light and dark mode alike, with dark
// modules: not every scanner reads a light-on-dark code. So its colours are
// fixed rather than theme tokens. Only the mark takes a colour.
//
// A mark hides the modules under it, so with a mark the code always uses
// error correction level H (30% of it can be lost) and is at least version 4,
// which leaves room in the middle. Without one, `level` applies. Either way
// the level is raised when that fits in the same number of modules.

export type QrCodeLevel = 'L' | 'M' | 'Q' | 'H'
export type QrCodeShape = 'square' | 'rounded' | 'dots'
export type QrCodeMark = 'none' | 'initials' | 'name'

// The quiet zone: the blank margin scanners need around the code, in modules.
const QUIET = 2
// Module types from the encoder: finder patterns (the three corner squares,
// with the separator around them) and alignment patterns (the small squares
// that help a scanner with a bent or tilted code).
const POSITION = 2
const ALIGNMENT = 4

const f = (n: number) => +n.toFixed(3)

// A rounded rectangle as a path; r = 0 gives square corners.
function rect(x: number, y: number, w: number, h: number, r = 0) {
  if (!r) return `M${x} ${y}h${w}v${h}h${-w}z`
  return `M${f(x + r)} ${y}h${f(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${f(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}`
    + `h${f(2 * r - w)}a${r} ${r} 0 0 1 ${-r} ${-r}v${f(2 * r - h)}a${r} ${r} 0 0 1 ${r} ${-r}z`
}

// The corner radii of each pattern's ring, hole and centre. Patterns are
// drawn whole rather than module by module: as loose dots, scanners miss them.
const FINDER: Record<QrCodeShape, [number, number, number]> = {
  square: [0, 0, 0],
  rounded: [2, 1.2, 0.9],
  dots: [2.5, 1.6, 1.5],
}
const ALIGN: Record<QrCodeShape, [number, number, number]> = {
  square: [0, 0, 0],
  rounded: [1.4, 0.7, 0.3],
  dots: [1.8, 1, 0.5],
}

// A pattern of rings: `size` modules wide, its hole one module in, its
// centre two modules in.
function pattern(x: number, y: number, size: number, [ring, hole, centre]: [number, number, number]) {
  return rect(x, y, size, size, ring) + rect(x + 1, y + 1, size - 2, size - 2, hole) + rect(x + 2, y + 2, size - 4, size - 4, centre)
}

// The modules in the middle that a mark covers, as a box. Odd sides on an
// odd grid keep it centred on whole modules.
function markBox(n: number, mark: 'square' | 'wide' | null) {
  if (!mark) return null
  const odd = (v: number) => { const r = Math.floor(v); return r % 2 ? r : r - 1 }
  const w = odd(n * (mark === 'wide' ? 0.52 : 0.24))
  const h = odd(n * (mark === 'wide' ? 0.17 : 0.24))
  return { x: (n - w) / 2, y: (n - h) / 2, w, h }
}

function draw(value: string, level: QrCodeLevel, shape: QrCodeShape, mark: 'square' | 'wide' | null) {
  const qr = encode(value, { ecc: mark ? 'H' : level, border: 0, boostEcc: true, minVersion: mark ? 4 : 1 })
  const n = qr.size
  const box = markBox(n, mark)
  const covered = (x: number, y: number, size = 1) =>
    !!box && x < box.x + box.w && x + size > box.x && y < box.y + box.h && y + size > box.y
  const type = (x: number, y: number) => qr.types[y]?.[x]
  const on = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < n && y < n && qr.data[y][x] && type(x, y) !== POSITION && type(x, y) !== ALIGNMENT && !covered(x, y)

  let modules = ''
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!on(x, y)) continue
      if (shape === 'square') {
        // One rectangle per run along the row.
        let end = x
        while (on(end + 1, y)) end++
        modules += `M${x} ${y}h${end - x + 1}v1h${x - end - 1}z`
        x = end
      } else if (shape === 'dots') {
        modules += `M${f(x + 0.08)} ${y + 0.5}a.42 .42 0 1 0 .84 0a.42 .42 0 1 0 -.84 0`
      } else {
        // A corner is round where neither side touches a neighbour, so
        // modules that touch join into one shape.
        const up = on(x, y - 1), down = on(x, y + 1), left = on(x - 1, y), right = on(x + 1, y)
        const tl = up || left ? 0 : 0.5, tr = up || right ? 0 : 0.5
        const br = down || right ? 0 : 0.5, bl = down || left ? 0 : 0.5
        modules += `M${x + tl} ${y}H${x + 1 - tr}${tr ? 'a.5 .5 0 0 1 .5 .5' : ''}V${y + 1 - br}${br ? 'a.5 .5 0 0 1 -.5 .5' : ''}`
          + `H${x + bl}${bl ? 'a.5 .5 0 0 1 -.5 -.5' : ''}V${y + tl}${tl ? 'a.5 .5 0 0 1 .5 -.5' : ''}z`
      }
    }
  }

  let eyes = [[0, 0], [n - 7, 0], [0, n - 7]].map(([x, y]) => pattern(x, y, 7, FINDER[shape])).join('')
  // An alignment pattern's centre is the dark module with light pattern
  // modules on all four sides. One the mark would touch is left out.
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const centre = qr.data[y][x] && type(x, y) === ALIGNMENT
        && [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].every(([ax, ay]) => type(ax, ay) === ALIGNMENT && !qr.data[ay][ax])
      if (centre && !covered(x - 2, y - 2, 5)) eyes += pattern(x - 2, y - 2, 5, ALIGN[shape])
    }
  }

  return { n, modules, eyes, box }
}

export function QrCode({
  value, size = 160, level = 'M', shape = 'square', company, showName = true, caption, mark = 'none', markColour = 'var(--brand)',
  logo, label, className,
}: {
  // The text or link to encode.
  value: string
  // The code's width and height in pixels, quiet zone included.
  size?: number
  // Error correction when there is no mark: L 7%, M 15%, Q 25%, H 30%.
  level?: QrCodeLevel
  // The modules' shape. The finder patterns follow it.
  shape?: QrCodeShape
  // The company's name: printed under the code, and used by `mark`.
  company?: string
  // Print the name under the code. Turn off for a mark alone.
  showName?: boolean
  // A short line under the name: "Scan to pay".
  caption?: string
  // What sits in the middle: the company's initials, or its name (best for a
  // short one; a long name shrinks, then truncates). `logo` wins.
  mark?: QrCodeMark
  // The mark's colour, any CSS colour: the company's own, or var(--brand).
  markColour?: string
  // Your own mark for the middle, such as an IconMark or an <img>. It is
  // stretched to fill the space.
  logo?: ReactNode
  // The accessible name. By default "QR code", with the company's name.
  label?: string
  className?: string
}) {
  const name = company?.trim()
  const centre = logo ? 'square' : mark === 'initials' && name ? 'square' : mark === 'name' && name ? 'wide' : null
  const code = useMemo(() => {
    if (!value) return { error: 'Nothing to encode' } as const
    try {
      return draw(value, level, shape, centre)
    } catch {
      return { error: 'Too long for a QR code' } as const
    }
  }, [value, level, shape, centre])

  const total = 'n' in code ? code.n + QUIET * 2 : 1
  const unit = size / total
  // The mark is inset half a module from the cleared box, as a margin.
  const inset = 0.5
  const box = 'box' in code && code.box
  // Type sized to the mark's height; a long name shrinks to fit its width
  // (about 0.6em a letter, less its padding), down to 7px, then truncates.
  const markText = (w: number, h: number) =>
    centre === 'wide' ? Math.min(h * 0.55, (w * 0.85) / (name!.length * 0.6)) : h * 0.4
  const markStyle = box
    ? {
        left: `${((box.x + QUIET + inset) / total) * 100}%`,
        top: `${((box.y + QUIET + inset) / total) * 100}%`,
        width: `${((box.w - inset * 2) / total) * 100}%`,
        height: `${((box.h - inset * 2) / total) * 100}%`,
        fontSize: Math.max(7, Math.floor(markText((box.w - inset * 2) * unit, (box.h - inset * 2) * unit))),
      }
    : undefined

  return (
    <figure
      className={cn('inline-grid shrink-0 justify-items-center rounded-xl bg-white p-1 text-black shadow-xs ring-1 ring-border', className)}
      style={{ gridTemplateColumns: `${size}px` }}
    >
      {'error' in code ? (
        <div
          role="img"
          aria-label={code.error}
          className="m-2 grid place-items-center rounded-md border border-dashed border-black/15 p-3 text-center text-[11px] text-black/50"
          style={{ width: size - 16, height: size - 16 }}
        >
          {code.error}
        </div>
      ) : (
        <div role="img" aria-label={label ?? (name ? `QR code for ${name}` : 'QR code')} className="relative" style={{ width: size, height: size }}>
          <svg viewBox={`${-QUIET} ${-QUIET} ${total} ${total}`} className="block size-full" aria-hidden>
            <path d={code.modules} fill="currentColor" shapeRendering={shape === 'square' ? 'crispEdges' : undefined} />
            <path d={code.eyes} fill="currentColor" fillRule="evenodd" />
          </svg>
          {markStyle && (
            <div className={cn('absolute grid place-items-center', logo && '*:size-full')} style={markStyle}>
              {logo ?? (centre === 'square' ? (
                <LetterMark text={initials(name!)} colour={markColour} className="size-full rounded-[22%] text-[1em]" />
              ) : (
                <span
                  className="flex size-full min-w-0 items-center justify-center rounded-[0.4em] px-[0.5em] font-semibold tracking-tight text-white"
                  style={{ background: markColour }}
                >
                  <span className="truncate">{name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {((name && showName) || caption) && (
        <figcaption className="grid w-full min-w-0 justify-items-center px-2 pt-0.5 pb-2 text-center">
          {name && showName && (
            <span className={cn('w-full truncate font-semibold tracking-tight', size < 144 ? 'text-xs' : 'text-[13px]')}>{name}</span>
          )}
          {caption && <span className="w-full truncate text-[11px] text-black/55">{caption}</span>}
        </figcaption>
      )}
    </figure>
  )
}
