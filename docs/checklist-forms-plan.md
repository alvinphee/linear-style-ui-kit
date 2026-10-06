# Forms and checklists: the plan

Status: built, 6 October 2026. What changed from the proposal:
- The parts are named for what they are, not for checklists: `form-fields`
  (the schema), `form-renderer`, `forms-catalogue`, `check-item`. A
  checklist, an expense claim and a survey are sample definitions only.
- Two more components: `rating` (stars) and `signature-pad`; and
  `qr-scanner`, the in-app camera reader, was built now rather than later.
- The ERP deep link is `/forms/catalogue/<form-id>?context=…` (the
  catalogue page opens the form named after it), not a separate fill page.
  Module Forms pages do the same under their own module.
- Two generic forms joined the samples: an expense claim and a customer
  satisfaction survey (ratings).
- The Components page is "Check, rating and signature" (`#/check-item`);
  the Blocks page is "Forms catalogue" (`#/forms-catalogue`).
- Added on 7 October: the form builder (`form-builder`, New form and the
  catalogue's Edit in both apps) and the submission feed (`submission-feed`,
  cards with a score bar and the day's numbers, switched with the table).

## The idea

A user reaches a form in one of two ways:

1. **Scan a QR code** stuck on a thing (a forklift, a dock door, a meeting
   room) or printed on a poster. The phone's camera opens a deep link that
   lands straight on that form, with the thing already filled in.
2. **Browse the app**: module › Forms page › pick a form from the catalogue.

Either way the same form opens. The user fills it in on a phone or a desk,
submits it, and the submission is kept as a record with a result (passed,
failed, completed). A manager sees submissions in a list, filters to the
failed ones, and opens any one to read the filled form.

Forms come in two shapes. A **checklist** is a form of check items, each
answered Pass / Fail / N/A, with a note and photo asked for on a fail. A
plain **form** is fields (text, date, select…) as the kit's forms are today.
One form can mix both: a section of checks followed by a sign-off section.

## Terms (to add to the glossary)

| Term | Meaning |
|---|---|
| Form (form template) | The definition: name, sections, fields. What the catalogue lists |
| Submission | One filled-in form, kept as a record with who, when and the result |
| Checklist | A form whose items are checks |
| Check item | One line of a checklist: a statement answered Pass / Fail / N/A, with a note and a photo when it fails |
| Forms catalogue | The page listing the forms a user can fill in, searchable and grouped by category |
| Deep link | A link that opens one form directly, such as the link a QR code carries |
| Asset tag | A QR code fixed to a thing. Scanning it opens that thing's form with the thing filled in |
| Sign-off | The last section of a form: name, date and a confirmation (later a signature) |

## Data model

```ts
type FormDefinition = {
  id: string                  // 'forklift-pre-use', the id in the deep link
  name: string
  description: string
  category: string            // 'Safety', 'Warehouse', 'Fleet', 'HR', 'Facilities'
  module?: string             // the ERP module it belongs to, for its Forms page
  icon: IconSvgElement
  version: number             // kept on each submission
  estimatedMinutes: number
  context?: { label: string; key: string }   // 'Forklift' → the asset the QR names
  sections: FormSection[]
}
type FormSection = { id: string; title: string; description?: string; fields: FormField[] }

// FormField is the kit's existing field schema (blocks/form-dialog.tsx)
// with new types: 'check' (pass / fail / na), 'yes-no', 'rating', 'photo', 'signature'

type Submission = {
  id: string                  // 'SUB-0042'
  formId: string; formVersion: number
  context?: string            // 'FL-07'
  submittedBy: string; submittedAt: string
  values: FormValues
  result: 'passed' | 'failed' | 'completed'   // completed: a plain form, no checks
  score?: { passed: number; failed: number; na: number }
}
```

## Where each part lives (one home per part)

**Components** (`src/components/`)
- `check-item.tsx`: one check item. Statement, a Pass / Fail / N/A toggle
  group, and when Fail is picked a note box and a photo chip. Playground on
  the Selection controls page.
- `form-progress.tsx`: "12 of 20 answered" with the kit's progress bar, for
  the form's sticky header. (Or the existing Progress, if it is enough.)

**Blocks** (`src/blocks/`)
- `form-fields.tsx`: the field schema and the field renderer, moved out of
  `form-dialog.tsx` so a dialog and a page render the same fields. The new
  field types join here. `form-dialog.tsx` imports it; nothing else changes.
- `checklist-form.tsx`: renders a `FormDefinition`. Sections with headers,
  the progress header, required checks, validation, a draft kept in the
  browser (per form and asset, so a phone refresh loses nothing), and on
  submit a summary (18 passed, 2 failed) before it hands the submission back
  through `onSubmit`. Read-only mode shows a past submission.
- `forms-catalogue.tsx`: the list of forms. Search, group by category, each
  row with its icon, name, description, estimated time and item count, an
  Open button and a QR button. The QR button opens a dialog with the kit's
  `QrCode` (the company's mark in the middle), the deep link under it, an
  optional asset field that changes the link, and Copy link and Print.

Every block takes its data as props and holds no sample data.

**Kit page** (Blocks group): "Forms and checklists" (`#/checklists`)
- The catalogue with five sample forms: Forklift pre-use inspection
  (checklist, asset), Warehouse opening checklist, Delivery vehicle check
  (checklist, asset), Incident report (plain form), Visitor sign-in (plain
  form).
- One form being filled, on the page and in a phone-width frame beside it.
- The QR dialog, with a live code that encodes the page's own deep link, and
  a "Simulate scan" button that opens that link so the story works without
  a phone.
- A submissions list from the sample data, with Failed / Today / All views.

**ERP template**
- A **Forms** module (`#/templates/erp/forms`): Catalogue, My submissions,
  All submissions (a `ListSpec`: number, form, asset, result as a status
  badge, by, date; views Failed, Today, All; a submission opens in the
  record peek showing the filled form read-only).
- Every module that owns forms gets a **Forms** page listing only its own
  (Inventory › Forms: forklift inspection, stock count sheet; Sales › Forms:
  delivery vehicle check; HR › Forms: onboarding checklist). Same catalogue
  block, filtered.
- Deep link: `#/templates/erp/forms/fill/<form-id>?asset=FL-07`. The route
  parser gains an optional third segment, which later also gives records a
  link of their own (`/accounting/invoices/INV-1042`).
- Signed out: the sign-in page keeps the intended link and returns to it
  after signing in, so a scan still lands on the form.
- Launchpad tile for Forms, with "3 failed today" as its metric. The command
  palette finds forms by name.
- Phone: the form page is the main case. Sticky progress header, sticky
  Submit footer, 40px tap targets on the Pass / Fail / N/A group, one
  column, no sideways scroll at 375px.

**Later, if wanted**
- A camera scanner inside the app (the browser's BarcodeDetector where it
  exists, a paste-a-link fallback elsewhere).
- A signature pad for the sign-off.
- ERP + AI: Ask AI answers "which inspections failed this week?" from the
  submissions.

## Build order

1. Foundations: `form-fields.tsx` split out, new field types, `check-item`
   with its playground, glossary terms.
2. Blocks: `checklist-form`, `forms-catalogue` with the QR dialog, and the
   kit's Forms and checklists page with sample data and the simulated scan.
3. ERP: the Forms module, per-module Forms pages, the deep link and the
   third route segment, return after sign-in, the launchpad tile, the
   submissions list and peek.
4. Checks: light and dark, 375px, `npm run check`, registry rebuilt.

## Decisions to confirm

- A Forms module plus a Forms page in each module (recommended), or forms
  only inside their modules.
- One scrolling page with section headers (recommended), or one section per
  step like the wizard.
- The five sample forms above, or different ones.
