# Hugeicons Playground

## What this folder is
A standalone showcase app: how to use **Hugeicons** with **shadcn/ui** to
build a sleek, Linear-style SaaS interface. It is its own project, not a
copy of another app. Keep its content generic SaaS: no another app modules,
screens or data structures. Nothing here ships.

## Stack
- React + Vite + TypeScript
- Tailwind v4 + shadcn/ui, style **radix-mira** (the compact "Mira" preset)
- Icons: `@hugeicons/react` + `@hugeicons/core-free-icons` (free set only).
  `components.json` has `"iconLibrary": "hugeicons"`, so every component
  shadcn adds already uses `HugeiconsIcon`. Lucide is not installed.
- Font: Inter (`@fontsource-variable/inter`)
- Toasts: sonner. Command menu: cmdk.

## Run
```bash
npm install
npm run dev
```
It opens on http://localhost:5180. That is not 5173, so it never clashes
with another app's client.

Add a shadcn component (it arrives with Hugeicons already):
```bash
npx shadcn@latest add <name>
```

## Layout
```
hugeicons-playground/
├── .claude/
│   ├── launch.json            dev server config for the Claude app's preview
│   ├── settings.json          turns on the MCP server without asking
│   └── skills/
│       └── hugeicons/         the Hugeicons skill (see below)
├── .mcp.json                  the Hugeicons MCP server
├── CLAUDE.md
├── components.json            shadcn settings (style, icon library, paths)
├── docs/
│   └── findings.md            what we have learned so far
└── src/
    ├── main.tsx
    ├── App.tsx                theme, tooltip and toast providers
    ├── styles.css             Tailwind + the Linear-style colour tokens
    ├── components/
    │   └── ui/                shadcn components (ours to edit)
    ├── lib/
    │   ├── theme.tsx          light / dark / system switch
    │   └── utils.ts
    └── pages/
        ├── KitchenSink.tsx    sidebar, header, Ctrl+K menu, all sections
        ├── data.ts            icon groups, job statuses, sample jobs
        └── sections/
            ├── shared.tsx         Section and Panel wrappers
            ├── ThemeSection.tsx   presets and the theme mixer
            ├── ButtonsSection.tsx
            ├── FormsSection.tsx
            ├── StatusSection.tsx
            ├── OverlaysSection.tsx
            ├── JobListSection.tsx
            └── IconsSection.tsx
```

## The kitchen sink page
A Linear-style app frame (sidebar, slim header, Ctrl+K command menu) with
one section per kind of component:
1. **Buttons**: variants, sizes, icons with shortcut hints, tooltips,
   a segmented control.
2. **Forms**: a full "Create job" form plus input states.
3. **Status**: badges, Linear-style status and priority icons, avatars,
   progress, skeletons.
4. **Menus and overlays**: dropdown with shortcuts and a submenu, filter
   popover, dialog, command menu, toasts.
5. **Job list**: a Linear-style list grouped by status.
6. **Icons**, **Icon props**, **All free icons**: the Hugeicons test.
   Search also matches Lucide names (try "trash"). Click an icon to copy
   its import.

## The Linear look, and where it lives
All of it is in `src/styles.css`, so it can be moved as one piece:
- Near-neutral greys with a faint cool tint, and one indigo accent (`--brand`)
- Borders drawn at 7–9% opacity instead of solid greys
- 13px Inter body text, 28px controls, 8px corner radius
- Dark by default. The switch in the header (or Ctrl+K) changes it.
- Status colours as tokens: `--status-todo`, `--status-progress`,
  `--status-done`, `--status-blocked`

## Themes
Every colour is worked out from five variables on `<html>`:

| Variable | Controls |
|---|---|
| `--brand-h`, `--brand-c` | accent hue and strength (buttons, focus, "done") |
| `--grey-h`, `--grey-t` | tint of all greys: hue, and strength (0 = pure grey) |
| `--radius` | corner rounding |

Plus `data-mono` on `<html>` for black/white buttons, and the `dark` class.
So any accent works with any greys, corners and mode. `src/lib/theme.tsx`
holds the 12 presets and saves the viewer's mix in their browser. The Theme
section (and the Theme button in the header) is the mixer. "Copy as CSS"
gives the five variables for the current mix.

Do not name `--brand-*` / `--grey-*` after shadcn's tokens: shadcn already
uses `--accent` for hover backgrounds.

This copies Linear's *style*, not its code or brand. Keep it that way: no
Linear name, logo or assets in the app.

## Tools in this folder
- **Hugeicons MCP server** (`.mcp.json`): search for an icon with
  `search_icons` before using it. Never guess an icon name.
- **Hugeicons skill** (`.claude/skills/hugeicons/`): follow it for
  imports and props.
- The skill's icon list is older than the package. It lists 5,471 icons
  (v4.2.1), and the installed v4.3.5 has 6,025. If the skill list lacks a
  name, check the package itself:
  ```bash
  node -e "import('@hugeicons/core-free-icons').then(m => console.log(Object.keys(m).filter(n => n.includes('Truck'))))"
  ```

## Rules
- Free icons only. Do not install `@hugeicons-pro/*`; we have no licence.
- Leave out props that match the defaults (`size` 24, `strokeWidth` 1.5,
  `color` currentColor). One exception: `absoluteStrokeWidth` does nothing
  unless `strokeWidth` is also passed, so pass both.
- Inside shadcn components, icons use `strokeWidth={2}` (shadcn's own
  choice for small 14–16px icons). Keep that so everything matches.
- Never install `lucide-react`. If a copied shadcn example imports Lucide,
  swap each icon for its Hugeicons name (see the table in findings).
- Import each icon by name so only the icons we use end up in the bundle.
  The one exception is the "All free icons" section, which loads the whole
  package on purpose. That is why this build is about 7 MB.
- `CommandDialog` does not wrap its children in `<Command>` in this shadcn
  version. Put `<Command>` inside it yourself, or the page crashes when the
  menu opens.
- Do not change another app from here. This folder is separate.
- Local only: no git branches, no deploys, no AWS.

## Reinstalling the skill on Windows
`npx skills add https://github.com/hugeicons/hugeicons --skill hugeicons`
fails on Windows. The repository has a file named `icons/re:.svg`, and
Windows does not allow `:` in file names. The skill was copied straight
from git instead:
```bash
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/hugeicons/hugeicons.git hi
cd hi
git show HEAD:skills/hugeicons/SKILL.md > SKILL.md
git show HEAD:skills/hugeicons/references/icon-list.md > icon-list.md
git show HEAD:skills/hugeicons/references/icon-list-flutter.md > icon-list-flutter.md
```
Put `SKILL.md` in `.claude/skills/hugeicons/`, and put the two lists in
`.claude/skills/hugeicons/references/`.

## Findings
Record what we learn in `docs/findings.md` as we go. That file becomes the
starting point for a another app spec if we adopt Hugeicons.
