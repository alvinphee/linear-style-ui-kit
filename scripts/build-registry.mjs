// Writes registry.json: one shadcn registry item per kit part, so another
// project can install it with `npx shadcn add @kit/<name>`. Each item's files,
// npm dependencies and kit dependencies are read from its imports, so the
// registry cannot drift from the code. `npm run registry` runs this, then
// `shadcn build`, which writes public/r/<name>.json (served at /r/ by Vite).
// The dev server reruns both when a part changes (vite.config.ts), and
// `--check` (part of `npm run check`) fails if registry.json is out of date.
//
//   src/components/ui/*   registry:ui         one item per file
//   src/components/*      registry:component  one item per file
//   src/components/ai/*   registry:component  one item per file, category "ai"
//   src/blocks/*          registry:block      one per file, or per folder (data-table/…)
//   src/blocks/ai/**      registry:block      one per file, in any subfolder, category "ai"
//   src/lib/*             registry:lib        one item per file, except KIT_ONLY
//   src/styles.css        registry:theme      "tokens": colours, radius, type
//   (no files)            registry:item       "ai-kit": every "ai" item at once
//
// Blocks install into components/blocks/, where the shadcn CLI points their
// `@/blocks/…` imports. AI is a domain, not a level: its parts sit in an ai/
// folder inside their level, and the "ai" category and the ai-kit bundle let
// another project find and install them together.
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'

const NAMESPACE = '@kit'
const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..')
const src = join(root, 'src')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const versions = { ...pkg.devDependencies, ...pkg.dependencies }
// Every project that installs a shadcn component already has these.
const PROVIDED = new Set(['react', 'react-dom'])
// lib files that only make sense inside this kit: cn comes from the "cn"
// package, the hash router runs the kit's pages, seededRandom makes sample data.
const KIT_ONLY = new Set(['utils', 'router', 'random'])

const posix = (p) => p.split(sep).join('/')
const rel = (p) => posix(relative(root, p))
const fail = (msg) => {
  console.error(`Registry: ${msg}`)
  process.exit(1)
}

// One-line descriptions, from the layout map in CLAUDE.md.
const DESCRIPTIONS = Object.fromEntries(
  [...readFileSync(join(root, 'CLAUDE.md'), 'utf8').matchAll(/[├└]── ([\w.-]+?)(?:\.tsx?|\/)?\s{2,}(.+)/g)]
    .map(([, name, text]) => [name, text.trim()])
    .reverse(),
)
Object.assign(DESCRIPTIONS, {
  'ai-summary-card': "AI summary card: a few points the AI wrote about a record or a day, labelled as AI",
  'artifact-panel': 'Artifact panel: a document, table or code the assistant made, opened beside the chat',
  'chat-history': 'Chat history: the sidebar of an AI chat app, with search, projects and pinned chats',
  'chat-message': "Chat message: the person's message, the assistant's reply and its actions bar",
  'chat-thread': 'Chat thread: the scrolling messages, and the welcome screen with prompt starters',
  'project-page': "Project page: a project's instructions, knowledge (files) and chats, on a page of its own",
  'prompt-box': 'Prompt box (composer): growing text area, attached files, toolbar and send',
  'thinking-trail': 'Thinking trail: what an agent did on the way to its answer, in one quiet line',
  'use-timers': 'setTimeout that is cleared when the component unmounts',
  'use-svg-id': 'A unique id that is safe in SVG gradient and clip path references',
})
const ACRONYMS = { ai: 'AI', kpi: 'KPI', csv: 'CSV', otp: 'OTP', qr: 'QR', svg: 'SVG' }
const titleOf = (name) =>
  name
    .split('-')
    .map((w, i) => ACRONYMS[w] ?? (i === 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

const items = new Map()
const owners = new Map() // absolute file path → item name

function addItem(name, type, files, description) {
  if (items.has(name)) fail(`two parts are both called "${name}". Rename one.`)
  items.set(name, { name, type, files, description, dependencies: new Set(), registryDependencies: new Set() })
  for (const f of files) owners.set(f.abs, name)
}
const filesIn = (dir) =>
  readdirSync(dir)
    .map((n) => join(dir, n))
    .filter((p) => statSync(p).isFile() && /\.tsx?$/.test(p))
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]))
const nameOf = (file) => basename(file, extname(file))

for (const abs of filesIn(join(src, 'components', 'ui'))) {
  const name = nameOf(abs)
  addItem(name, 'registry:ui', [{ abs, type: 'registry:ui' }], `shadcn/ui ${titleOf(name).toLowerCase()}, in the kit's compact style`)
}
for (const abs of [...filesIn(join(src, 'components')), ...filesIn(join(src, 'components', 'ai'))]) {
  addItem(nameOf(abs), 'registry:component', [{ abs, type: 'registry:component' }])
}
const blockFile = (abs) => ({ abs, type: 'registry:component', target: `@components/blocks/${posix(relative(join(src, 'blocks'), abs))}` })
for (const entry of readdirSync(join(src, 'blocks'))) {
  const abs = join(src, 'blocks', entry)
  if (statSync(abs).isFile()) addItem(nameOf(abs), 'registry:block', [blockFile(abs)])
  else if (entry === 'ai') for (const f of walk(abs).filter((p) => /\.tsx?$/.test(p))) addItem(nameOf(f), 'registry:block', [blockFile(f)])
  else addItem(entry, 'registry:block', walk(abs).map(blockFile))
}
for (const abs of filesIn(join(src, 'lib'))) {
  if (!KIT_ONLY.has(nameOf(abs))) addItem(nameOf(abs), 'registry:lib', [{ abs, type: 'registry:lib' }])
}

// Kit-only tokens: an item using one needs the tokens item.
const KIT_TOKEN = /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|shadow)-(?:brand|subtle|status-(?:todo|progress|done|blocked))\b|var\(--(?:brand|subtle|status-)/

function resolveFile(base) {
  for (const p of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(p) && statSync(p).isFile()) return p
  }
  return null
}
const npmName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])
const IMPORT = /(?:\bimport|\bexport)\s[^'";]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]/g

for (const item of items.values()) {
  for (const file of item.files) {
    const code = readFileSync(file.abs, 'utf8')
    if (KIT_TOKEN.test(code)) item.registryDependencies.add(`${NAMESPACE}/tokens`)
    for (const m of code.matchAll(IMPORT)) {
      const spec = m[1] ?? m[2]
      const local = spec.startsWith('@/') ? join(src, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(file.abs), spec) : null
      if (!local) {
        const dep = npmName(spec)
        if (dep.startsWith('node:') || PROVIDED.has(dep)) continue
        if (!versions[dep]) fail(`${rel(file.abs)} imports "${dep}", which is not in package.json.`)
        item.dependencies.add(`${dep}@${versions[dep]}`)
        continue
      }
      const target = resolveFile(local)
      if (!target) fail(`${rel(file.abs)}: cannot find "${spec}".`)
      if (target === join(src, 'lib', 'utils.ts')) continue
      const owner = owners.get(target)
      if (!owner) fail(`${rel(file.abs)} imports ${rel(target)}, which is not published (pages, templates and KIT_ONLY lib files stay in the kit).`)
      if (owner !== item.name) item.registryDependencies.add(`${NAMESPACE}/${owner}`)
    }
  }
}

// The tokens item: the kit's colours, greys, radius and type from styles.css.
function parseBlocks(css) {
  const out = []
  let i = 0
  while (i < css.length) {
    const open = css.indexOf('{', i)
    const semi = css.indexOf(';', i)
    if (semi !== -1 && (open === -1 || semi < open)) {
      out.push({ statement: css.slice(i, semi).trim() })
      i = semi + 1
      continue
    }
    if (open === -1) break
    let depth = 1
    let j = open + 1
    while (depth && j < css.length) depth += css[j] === '{' ? 1 : css[j] === '}' ? -1 : 0, j++
    out.push({ selector: css.slice(i, open).trim(), body: css.slice(open + 1, j - 1) })
    i = j
  }
  return out.filter((b) => b.statement || b.selector)
}
function declarations(body) {
  const rules = {}
  for (const b of parseBlocks(body)) {
    if (b.statement) {
      const apply = b.statement.match(/^@apply\s+(.+)$/)
      if (apply) rules[`@apply ${apply[1]}`] = {}
      else {
        const k = b.statement.indexOf(':')
        rules[b.statement.slice(0, k).trim()] = b.statement.slice(k + 1).trim()
      }
    } else rules[b.selector] = { ...rules[b.selector], ...declarations(b.body) }
  }
  return rules
}
const cssVarsOf = (body) =>
  Object.fromEntries(Object.entries(declarations(body)).map(([k, v]) => [k.replace(/^--/, ''), v]))

const styles = readFileSync(join(src, 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const tokens = { cssVars: {}, css: {}, dependencies: new Set() }
for (const b of parseBlocks(styles)) {
  if (b.statement) {
    const font = b.statement.match(/^@import\s+["'](@fontsource[^"']+)["']$/)
    if (font) {
      tokens.css[`@import "${font[1]}"`] = {}
      tokens.dependencies.add(`${font[1]}@${versions[font[1]]}`)
    }
    continue
  }
  if (b.selector === '@theme inline') tokens.cssVars.theme = cssVarsOf(b.body)
  else if (b.selector === ':root') tokens.cssVars.light = cssVarsOf(b.body)
  else if (b.selector === '.dark') tokens.cssVars.dark = cssVarsOf(b.body)
  else tokens.css[b.selector] = declarations(b.body)
}

const AI_DIRS = [join(src, 'components', 'ai') + sep, join(src, 'blocks', 'ai') + sep]
const isAi = (item) => item.files.every((f) => AI_DIRS.some((d) => f.abs.startsWith(d)))
const aiNames = [...items.values()].filter(isAi).map((i) => i.name).sort()

const ORDER = ['registry:theme', 'registry:lib', 'registry:ui', 'registry:component', 'registry:block']
const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'kit',
  homepage: 'http://localhost:5180',
  items: [
    {
      name: 'tokens',
      type: 'registry:theme',
      title: 'Design tokens',
      description: "The kit's colours, tinted greys, accent, status colours, radius and Inter type, for light and dark mode",
      dependencies: [...tokens.dependencies],
      cssVars: tokens.cssVars,
      css: tokens.css,
    },
    ...[...items.values()]
      .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || a.name.localeCompare(b.name))
      .map((item) => ({
        name: item.name,
        type: item.type,
        title: titleOf(item.name),
        description: item.description ?? DESCRIPTIONS[item.name] ?? titleOf(item.name),
        ...(item.dependencies.size && { dependencies: [...item.dependencies].sort() }),
        ...(item.registryDependencies.size && { registryDependencies: [...item.registryDependencies].sort() }),
        ...(isAi(item) && { categories: ['ai'] }),
        files: item.files.map(({ abs, type, target }) => ({ path: rel(abs), type, ...(target && { target }) })),
      })),
    {
      name: 'ai-kit',
      type: 'registry:item',
      title: 'AI kit',
      description: 'Every AI component and block at once (every item in the "ai" category), with what they need',
      registryDependencies: aiNames.map((n) => `${NAMESPACE}/${n}`),
      categories: ['ai'],
    },
  ],
}
const json = JSON.stringify(registry, null, 2) + '\n'
const file = join(root, 'registry.json')

// Git may have checked the file out with CRLF line endings.
const saved = existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : ''

if (process.argv.includes('--check')) {
  if (saved !== json) fail('registry.json is out of date with the code. Run `npm run registry` and commit it.')
  console.log(`Registry: registry.json is up to date (${registry.items.length} items).`)
} else {
  // Only when it changed, so editing a part does not touch the file at all.
  if (saved !== json) writeFileSync(file, json)
  // shadcn build only writes files, so a deleted part's JSON would stay
  // installable. Remove it (public/r/registry.json is the build's own index).
  const built = join(root, 'public', 'r')
  const names = new Set([...registry.items.map((i) => i.name), 'registry'])
  if (existsSync(built)) {
    for (const f of readdirSync(built)) if (f.endsWith('.json') && !names.has(f.slice(0, -5))) unlinkSync(join(built, f))
  }
  const count = (type) => registry.items.filter((i) => i.type === type).length
  console.log(
    `Registry: ${registry.items.length} items (${count('registry:ui')} ui, ${count('registry:component')} components, ` +
      `${count('registry:block')} blocks, ${count('registry:lib')} lib, 1 theme, 1 bundle; ${aiNames.length} in "ai") → registry.json`,
  )
}
