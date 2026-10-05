import { useState } from 'react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Markdown } from '@/blocks/markdown'
import { Demos, Example, Playground, Surface, bool, imports, jsx, str } from './Playground'

// Markdown as the preview of what people write: a description, a comment,
// release notes. (The AI in the product page shows it streaming an AI reply.)
// All content is made up.

const SAMPLES = {
  'release notes': `## What's new in 4.2

**Saved views** are here. Save any filter as a view and share it with your team.

- Bulk edit up to 500 issues at once
- Keyboard shortcuts are ~~in beta~~ on for everyone
- Search is about *twice* as fast on large workspaces

Read the full notes in [the changelog](https://example.com/changelog).`,
  'task list': `### Launch checklist

- [x] Write the announcement post
- [x] Record the walkthrough video
- [ ] Update the pricing page
- [ ] Email existing customers

Owner: **Maya**. Due Friday.`,
  table: `Plans at a glance:

| Plan | Seats | Price a year |
|---|---:|---:|
| Starter | 5 | $0 |
| Team | 25 | $240 |
| Business | Unlimited | $960 |`,
  code: `Call the API with your token:

\`\`\`bash
curl https://api.example.com/v1/issues \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

It returns the **first 50** issues. Pass \`?cursor=\` for the next page.`,
  'links and quotes': `> Small, frequent releases beat big ones.

See [the roadmap](#roadmap) for what is next, or write to [support@example.com](mailto:support@example.com).
A line break inside a paragraph
stays where it was typed.`,
} as const

type SampleName = keyof typeof SAMPLES
const SAMPLE_NAMES = Object.keys(SAMPLES) as SampleName[]

const routeLink = (href: string) => toast(`onLink got “${href}”`, { description: 'Route it yourself. Without onLink the hash changes, and #roadmap opens the Roadmap page.' })

// A template literal holding the sample, with its backticks and ${ escaped.
const templateOf = (text: string) => '`' + text.replace(/[`\\]/g, '\\$&').replace(/\$\{/g, '\\${') + '`'

/* ---------- Write and preview ---------- */

const DRAFT = `Customers on the **Team** plan can't export more than 1,000 rows.

- Raise the limit to 10,000
- Show a progress bar for big exports

Blocked by ~~ENG-120~~ ENG-142.`

function WriteAndPreview() {
  const [text, setText] = useState(DRAFT)
  return (
    <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
      <Textarea
        aria-label="Description, in Markdown"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-48 font-mono text-xs"
      />
      <div aria-label="Preview" className="bg-subtle min-w-0 rounded-lg border p-3">
        {text.trim() ? <Markdown text={text} /> : <p className="text-muted-foreground text-xs">Nothing to preview yet.</p>}
      </div>
    </div>
  )
}

const WRITE_CODE = `${imports({
  react: ['useState'],
  '@/components/ui/textarea': ['Textarea'],
  '@/blocks/markdown': ['Markdown'],
})}

function DescriptionEditor() {
  const [text, setText] = useState('')
  return (
    <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
      <Textarea
        aria-label="Description, in Markdown"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-48 font-mono text-xs"
      />
      <div aria-label="Preview" className="rounded-lg border p-3">
        {text.trim() ? <Markdown text={text} /> : <p className="text-muted-foreground text-xs">Nothing to preview yet.</p>}
      </div>
    </div>
  )
}`

export default function ContentDemos() {
  return (
    <Demos>
      <Playground
        title="Markdown"
        description="Headings, lists, task lists, tables, code, quotes and links, without injecting HTML"
        controls={[
          { kind: 'select', name: 'sample', label: 'Sample', options: SAMPLE_NAMES, initial: 'release notes' },
          { kind: 'switch', name: 'onLink', label: 'Route # links (onLink)', initial: true },
        ]}
        render={(v) => (
          <Surface className="max-w-lg">
            <Markdown text={SAMPLES[str(v, 'sample') as SampleName]} onLink={bool(v, 'onLink') ? routeLink : undefined} />
          </Surface>
        )}
        code={(v) => {
          const head = imports({ '@/blocks/markdown': ['Markdown'] })
          const text = `const notes = ${templateOf(SAMPLES[str(v, 'sample') as SampleName])}`
          const body = jsx('Markdown', { text: '{notes}', onLink: bool(v, 'onLink') ? '{(href) => navigate(href)}' : undefined })
          return `${head}\n\n${text}\n\n${body}`
        }}
      />

      <Example title="Write and preview" note="Type Markdown on the left" code={WRITE_CODE}>
        <WriteAndPreview />
      </Example>
    </Demos>
  )
}
