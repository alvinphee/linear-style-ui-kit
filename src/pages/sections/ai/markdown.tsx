import { Markdown as MarkdownView, MdTable as MdTableView, type Align } from '@/blocks/markdown'
import { goTo } from '../../nav'
import type { Source } from './types'

// The workspace's side of the Markdown block (src/blocks/markdown.tsx):
// links to "#board" in a reply open that kit page.

const openKitPage = (href: string) => goTo(href.slice(1))

export function MdTable({ header, rows, align, ctx = {}, cursor }: {
  header: string[]
  rows: string[][]
  align?: Align[]
  ctx?: { sources?: Source[] }
  cursor?: boolean
}) {
  return <MdTableView header={header} rows={rows} align={align} sources={ctx.sources} onLink={openKitPage} cursor={cursor} />
}

export function Markdown({ text, streaming, sources, className }: {
  text: string
  streaming?: boolean
  sources?: Source[]
  className?: string
}) {
  return <MarkdownView text={text} streaming={streaming} sources={sources} onLink={openKitPage} className={className} />
}
