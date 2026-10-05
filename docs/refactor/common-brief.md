# Brief for the one-home-per-part refactor

You are one of several helpers working AT THE SAME TIME on this repo
(C:\Users\Alvin\Desktop\linear-style-ui-kit). Read first, in full:
CLAUDE.md, docs/architecture.md, docs/agent-brief.md, docs/glossary.md.
The audit you act on is docs/refactor/audit.md (file:line references may have
shifted a little; find the code by name).

## The rule you are applying
Every part used in more than one place has ONE home at its level:
small UI part → src/components/<name>.tsx; bigger composition → src/blocks/;
plain function or hook → src/lib/. Pages (src/pages/**) and templates
(src/templates/**) import them and never keep their own copy or re-draw them.

## How to work
- Only edit the files your task gives you. Other helpers own other files and
  are editing them right now. If you need a change in a file you don't own,
  don't make it: write it in your report.
- Keep the look and behaviour the same. When copies differ, keep the most
  polished one (usually the one in src/components or src/blocks), and say in
  your report what changed visibly, if anything.
- Components and blocks take data as props, hold no sample data, and never
  import from src/pages or src/templates.
- Match the surrounding code: short plain-English comments above each
  export saying what it is and when to use it, the same naming and Tailwind
  style, `cn` from 'cn', HugeiconsIcon with strokeWidth={2} inside UI,
  props equal to defaults left out. Use industry terms (docs/glossary.md).
- Icons: free Hugeicons only (@hugeicons/core-free-icons), never lucide.
  Check a name exists before using it:
  MSYS_NO_PATHCONV=1 node -e 'import("@hugeicons/core-free-icons").then(m => console.log(["NameIcon"].map(n => n + " " + (n in m))))'
- Type-check with `npx tsc --noEmit -p . --noUnusedLocals`. Others are
  mid-edit, so you may see errors in files you don't own: ignore those, fix
  every error in yours. Run it again at the end.
- Do not start a dev server, open a browser, install packages, or commit.
- Do not delete files. Do not touch docs/ except your report.

## Report (your final message)
Plain English, short. For each part you created or moved: its file, its
props/signature, and where it came from. List every file you changed. List
anything you skipped and why, and any change you need in a file you don't own.
