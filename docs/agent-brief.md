# Helper brief

The instructions given to each helper (a separate Claude working in
parallel) when this kitchen sink was built. A helper starts knowing nothing
about the conversation, so everything it needs is written down here.

**How to use it:** copy the "Shared rules" block as it is, then add a
"Your task" block for the specific job. One helper per set of files, so
two helpers never edit the same file.

---

## Shared rules

```text
You are building part of a showcase page. Work only in the files named below.

## Project
C:\Users\Alvin\Desktop\hugeicons-playground — a standalone showcase app:
Hugeicons (free set) + shadcn/ui (style radix-mira) for a sleek Linear-style
SaaS UI. React 19 + Vite + TypeScript 7 + Tailwind v4. Read CLAUDE.md first.
Keep content generic SaaS, no real brands.

## Design language (match it exactly)
- The page is built from Section (id, title, description; renders
  `grid grid-cols-1 lg:grid-cols-2 gap-3`) containing Panel cards (title,
  note?, wide?, className?) and Row, from src/pages/sections/shared.tsx.
  Read 2–3 existing sections close to your task to match the style
  (boxed cards with a title bar, compact rows, faint borders).
- Compact: 13px body, text-xs labels, default buttons h-7.
- Colours only through tokens: bg-card, bg-muted, bg-accent, bg-subtle,
  text-muted-foreground, border, text-brand / bg-brand,
  text-status-todo|progress|done|blocked, text-destructive,
  var(--chart-1..5). Use the accent sparingly.
- Must look right in light and dark mode.
- No horizontal page overflow at 375px: min-w-0, flex-wrap, inner
  overflow-x-auto, and grid-cols-1 before any sm:/lg:grid-cols-*
  (implicit grid columns caused overflow bugs before).

## Icons
- Only Hugeicons: HugeiconsIcon from '@hugeicons/react' + named icons from
  '@hugeicons/core-free-icons'. Inside components pass strokeWidth={2};
  size via className. In Buttons put data-icon="inline-start" / "inline-end"
  on the icon.
- NEVER guess icon names. Verify each one:
  MSYS_NO_PATHCONV=1 node -e 'import("@hugeicons/core-free-icons").then(m=>{for(const n of ["TruckIcon"]) console.log(n, !!m[n])})'
  Search: ...Object.keys(m).filter(n=>n.includes("Calendar")&&n.endsWith("Icon"))
- Never install or import lucide-react.

## Components
- shadcn components live in src/components/ui/. Read a component file before
  using it; this shadcn version differs from older docs:
  - Button sizes: xs / sm / default / lg / icon-xs / icon-sm / icon / icon-lg
  - cn is imported from 'cn'
  - CommandDialog does not wrap its children in <Command>: add it yourself
  - Checkbox has no indeterminate style (see the MIXED classes in
    JobListSection.tsx)
- Toasts: import { toast } from 'sonner'.
- Shared helpers: StatusIcon, PriorityIcon, Initials({ name, className })
  from src/pages/sections/StatusSection.tsx; sample data in src/pages/data.ts;
  shared job state via useJobs() from src/pages/jobs-store.tsx.

## Rules
- Do NOT edit shared files (KitchenSink.tsx, nav.ts, App.tsx, data.ts,
  jobs-store.tsx, styles.css, shared.tsx, lib/*, components/ui/*) or other
  sections. If you need a change there, put it in your final report.
  The lead wires sections into the page.
- Type-check with `npx tsc --noEmit`. Other helpers write other files at the
  same time: fix errors in YOUR files only.
- Don't start dev servers, don't use a browser, don't commit, don't run
  npm install or shadcn add.
- Code style: single quotes, no semicolons, 2-space indent, comments only
  where the why is non-obvious. Icon-only buttons need aria-label;
  everything keyboard reachable.
- Demo data is made up and deterministic; emails use @example.com.
  Demo forms send nothing: submit shows a "Demo only" toast.

Finish with a short report: files created, section ids, anything you need
changed in shared files, known issues.
```

---

## Your task (template)

```text
## Your task
`src/pages/sections/<Name>Section.tsx` (default export) →
<Section id="<id>" title="<Title>" description="<one line>">. Panels:
- **<Panel 1>:** what it shows, what each control does, edge states
  (empty, error, loading).
- **<Panel 2>:** …
Say which panels are wide (span both columns).
Say which shared data or store actions it may use.
```

The more concrete the task, the better the result: name every control,
every state (empty, loading, error, disabled) and every keyboard behaviour
you expect.

---

## After a helper finishes (the lead's checklist)

1. Read its report, especially "changes needed in shared files".
2. Add the section to `src/pages/nav.ts` (sidebar group, label, icon).
3. Import and place it in `src/pages/KitchenSink.tsx`.
4. `npx tsc --noEmit` for the whole project.
5. In the browser:
   - no console errors on a fresh load
   - no sideways scrolling at 375px (measure `scrollWidth` against
     `clientWidth`)
   - click through the main interactions
   - check light and dark mode
6. Fix what the helpers couldn't see; they never run a browser.
7. Update the layout list in `CLAUDE.md`.
