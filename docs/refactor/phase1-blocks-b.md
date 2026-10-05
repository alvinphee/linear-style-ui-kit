# Phase 1 report: display menu, grouped list, kanban card, Markdown

## DisplayMenu (`@/blocks/display-menu`)
Props: `layout?: { value, onChange, options? }` (options default `LIST_AND_BOARD`);
`selects?: { id, label, value, options, onChange }[]`; `switches?: { id, label, checked, onChange }[]`;
`properties?: { label?, options, value: Record<string, boolean>, onChange(id, shown) }`;
`changed?` (dot on the button, enables Reset); `onReset?`; `label`, `labelClassName`, `align`, `className`.
Options are `{ id, label }`. Section order: layout, selects, switches, properties, reset.
- App shell (app-shell/DisplayMenu.tsx): grouping (filter out "No grouping" on a board) and ordering in
  `selects`; empty and completed in `switches`; `properties`; `changed={!sameDisplay(...)}`; `onReset`;
  `labelClassName="hidden @md:inline"`. Same look.
- FilterBar.tsx: ordering in `selects`, `properties={{ label: 'Card properties', … }}`, the two "Show…"
  switches. Small visible changes: popover w-72 (was 64), selects w-32 (was 28), switches above chips,
  aria-label "Display options".

## GroupedList, GroupedListRow (`@/blocks/grouped-list`)
GroupedList props: `groups: { id, title, visual?, items }[]` (extra fields come back in `onAdd`);
`renderRow(item, row)`; `onAdd?`, `addLabel?`; `headers`, `collapsible`, `stickyHeaders`, `framed`;
selection `selected?: string[]`, `onSelectedChange?` (checkbox column, X toggles, Shift for a range);
`itemLabel`, `itemName`, `emptyLabel`, `inset` (e.g. "pr-2 pl-3 @lg:pl-5"), `aria-label`.
Up/Down/Home/End move between rows.
GroupedListRow props: `row`, `onOpen`, `active?` (row open in the side panel), `children` (cells); other
props and ref go on the row (so it can sit inside JobContextMenu).
- IssueList (app-shell/IssueView.tsx): groups → `{ ...g, id: g.key, title: g.label, items: g.jobs }`,
  `headers={grouping !== 'none'}`, `stickyHeaders`, the app-shell `inset`, `itemName="issue"`. IssueRow →
  `<JobContextMenu><GroupedListRow …>cells</GroupedListRow></JobContextMenu>`. Hover bg-accent/60 (was /50).
- JobListSection.tsx: `framed`, `selected={[...checked]}`, `onSelectedChange={ids => setChecked(new Set(ids))}`;
  drop the row's checkbox, X key, toggle and anchor. Select-all, Escape and the bulk toolbar stay in the page.
  Headers gain the fold chevron (`collapsible={false}` to avoid), 32px high, muted + button, a line above each group.
- NlSearchPanel.tsx ResultRow: `headers={false}`, `framed`, one group; row becomes a role=button div.

## KanbanCard (in `@/blocks/kanban-board`)
Props: `card`, `onOpen`, `selected?`, `menu?`, `menuClassName?`, `className?`, `children`; other props and
ref go on the card. Menu sits at the card's top right. `KanbanCardState` has `variant`.
- BoardSection.tsx: `<JobContextMenu><KanbanCard … menu={<JobDropdownMenu …/>}>…</KanbanCard></JobContextMenu>`.
- erp/pages/Pipeline.tsx: `className="gap-1"`, `menu={<KanbanCardMenu …>}`.
- app-shell/IssueView.tsx: `menuClassName="right-8"`; the menu moves out of the card (fixes a button in a button).

## Markdown (`@/blocks/markdown`)
Moved from blocks/ai/markdown.tsx (now a temporary `export *` re-export). Added `~~strikethrough~~`,
links to paths like `/docs`, healing for an unclosed `~~`.
- ContentSection.tsx: replace `renderMarkdown(value)` with `<Markdown text={value} />`; keep the "Nothing to
  preview yet." check; delete the hand-made renderer (INLINE … renderMarkdown); update the panel note
  ("hand-written preview"). Visible: code gets a header (Text + Copy), quotes use the block's style, headings
  h3–h5 (same sizes), a fade-in, single line breaks kept.
- Importers still on the old path (move to `@/blocks/markdown`): playground/ai-features.tsx (and its
  generated-code strings), playground/ai-workspace.tsx, pages/sections/ai/markdown.tsx,
  templates/erp/assistant/LaunchpadAi.tsx, Turns.tsx.

## Glossary to add
Display menu, display properties, grouped list (group header).
