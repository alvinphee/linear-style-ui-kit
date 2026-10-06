// Checks the kit's rules on every file in src, so they hold even when nobody
// remembers them. Run with `npm run check`; `npm run build` runs it too.
// The rules themselves are in CLAUDE.md and docs/architecture.md.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, dirname, sep } from 'node:path'

const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..')
const src = join(root, 'src')

// What each level may import (atomic design: only from the levels below).
const MAY_IMPORT = {
  lib: ['lib'],
  components: ['lib', 'components'],
  blocks: ['lib', 'components', 'blocks'],
  templates: ['lib', 'components', 'blocks', 'templates'],
}
// Known exceptions, from docs/architecture.md.
const ALLOWED_IMPORTS = [
  ['templates/ai-chat/AiChatApp.tsx', 'pages/sections/AiWorkspaceSection'],
]

const PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|decoration|accent|caret|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/

const problems = []
const report = (file, line, rule) => problems.push(`${relative(root, file).split(sep).join('/')}:${line}  ${rule}`)

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  )
}

// "components", "blocks"… for a path under src; null for App.tsx, main.tsx, styles.
function levelOf(file) {
  const top = relative(src, file).split(sep)[0]
  return top in MAY_IMPORT || top === 'pages' ? top : null
}

function importTarget(file, spec) {
  if (spec.startsWith('@/')) return join(src, spec.slice(2))
  if (spec.startsWith('.')) return resolve(dirname(file), spec)
  return null
}

// A comment line, or the comment at the end of a code line, is not on screen.
const codeOnly = (line) => (/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line) ? '' : line.replace(/\s\/\/\s.*$/, ''))

const files = walk(src).filter((f) => /\.(tsx?|css)$/.test(f))
for (const file of files) {
  const level = levelOf(file)
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((text, i) => {
    const n = i + 1
    if (/['"](lucide-react|@hugeicons-pro\/[^'"]*)['"]/.test(text)) {
      report(file, n, 'Icons: free Hugeicons only (no lucide-react, no @hugeicons-pro).')
    }
    if (PALETTE.test(codeOnly(text))) {
      report(file, n, `Colours: use a token (text-muted-foreground, text-status-done, bg-subtle…), not "${text.match(PALETTE)[0]}".`)
    }
    if (file.endsWith('.css')) return
    if (/\bLinear\b/.test(codeOnly(text))) {
      report(file, n, 'Brand: no Linear name on screen (comments are fine).')
    }
    const spec = text.match(/\bfrom\s+['"]([^'"]+)['"]/)?.[1]
    const target = spec && importTarget(file, spec)
    if (!target || !level || level === 'pages') return
    const targetLevel = levelOf(target)
    if (!targetLevel || MAY_IMPORT[level].includes(targetLevel)) return
    const from = relative(src, file).split(sep).join('/')
    const to = relative(src, target).split(sep).join('/')
    if (ALLOWED_IMPORTS.some(([f, t]) => from === f && to === t)) return
    report(file, n, `Levels: ${level} may not import from ${targetLevel} ("${spec}"). See docs/architecture.md.`)
  })
}

const html = join(root, 'index.html')
readFileSync(html, 'utf8').split('\n').forEach((text, i) => {
  if (/\bLinear\b/.test(text)) report(html, i + 1, 'Brand: no Linear name on screen.')
})

if (problems.length) {
  console.error(`Kit rules: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n\n${problems.join('\n')}\n`)
  process.exit(1)
}
console.log(`Kit rules: all passed (${files.length} files).`)
