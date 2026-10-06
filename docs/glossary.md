# Glossary

The words this kit uses, and what they mean. Each is the industry term:
what design systems (shadcn/ui, Material, Fiori) and ERPs (SAP, Oracle
NetSuite, Microsoft Dynamics, Odoo) call it. Use these words in the UI, in
file names and when talking about the work. Add a term here before using a
new one.

## The kit's five levels
How the levels fit together, and where each part goes: `docs/architecture.md`.
Each level is built only from the level below it, so a fix at one level
shows up everywhere above. This is **atomic design** (Brad Frost's term,
used by most design systems).

| Term | Meaning | In this kit |
|---|---|---|
| Design tokens | Named values for colour, radius, type and spacing that everything else reads | `styles.css`, the Theme page |
| Theme | One set of values for the design tokens. A preset is a saved theme | The Theme page and its 12 presets |
| Default theme (shadcn) | The token values shadcn ships before you change anything: neutral greys, solid borders, black or white buttons, 10px corners | `shadcn-default.css`, the right side of the theme comparison |
| Theme comparison | The same screen shown side by side in two themes, to see what the tokens alone change | Theme comparison (`#/compare/<page>`) |
| Style preset (shadcn) | shadcn's starting set of component styles, icons and font, chosen at `shadcn init` (Nova, Mira…). Not the same as a theme preset | `radix-mira` in `components.json` |
| Type scale | The fixed set of text sizes a design uses | 13px body text in `styles.css`, and the sizes in the components |
| Components | Single building blocks with props and variants | shadcn primitives in `src/components/ui` (Button, Input, Badge…), our own small ones in `src/components/` (status badge, person chip…) |
| Blocks | A section or screen built from components that does one task | `src/blocks/`: board, data table, folding breadcrumb… |
| Layouts | The frame pages sit in: navigation, header, content area. Also called the app shell | App shells |
| Templates | A whole app: a layout, blocks and data, ready to run | ERP app, AI chat app |
| Kitchen sink | One page that shows every component, to check they look right together | All components |
| Component family | A component and its close relatives, documented on one page | Badges and labels: Badge, StatusBadge, DeltaBadge, LabelChip |
| Component category | A heading that groups component pages by what they do, as Ant Design and Material group theirs | Actions, Inputs, Data display, Feedback, Overlays, Navigation, Layout, Charts, AI |
| Registry | shadcn's list of installable parts, served as JSON, so another project can copy them in with `npx shadcn add` | `registry.json`, built to `public/r/` by `npm run registry` |
| Registry item | One installable entry in a registry: its files, the npm packages it needs, and the other items it needs (its registry dependencies) | One per component, block and lib file, plus `tokens` |
| Registry namespace | The short prefix a project uses to name a registry, set once in its `components.json` | `@kit`, as in `@kit/kanban-board` |

## Interface patterns
| Term | Meaning |
|---|---|
| Avatar | A person's picture, or their initials in a circle when there is none |
| Person chip | An avatar with the person's name beside it |
| Status badge | A small pill showing a record's status, coloured by tone (success, warning, danger…) |
| Tone | The meaning a colour carries: neutral, info, in progress, success, warning, danger |
| Workflow status | Where an item is in its process: backlog, todo, in progress, done, cancelled. Shown as a status icon |
| Priority | How urgent an item is: no priority, low, medium, high, urgent. Shown as a priority icon (signal bars) |
| Label (tag) | A coloured keyword on an item, such as Fragile; shown as a label dot or a label chip |
| Empty avatar (no assignee) | The dashed circle shown where an item has nobody assigned |
| Label chip | A label as a small pill: its colour dot and name, with an × when it can be removed |
| Mention | An @name or /command shown as a tinted pill inside text |
| Progress ring | A circle that fills to show progress, with the number in the middle |
| Chart legend | The key under a chart: a short line or swatch in each series' colour, and its name |
| Bar list | A ranked breakdown: each row's name with a bar sized by its value (top customers, spend by vendor) |
| Gantt chart | Items as bars on a timeline, one row each, from start to end, with progress, milestones and a today line |
| Roadmap | Where projects stand over the coming months, shown as a Gantt chart |
| Gantt bar | One item on a Gantt chart: a bar from its first day to its last, filled in as far as it has got |
| Milestone | A key date in a project, such as a beta or a release. Shown as a diamond, the standard symbol for a single date |
| Time marker (today line) | A line across a timeline at one moment, today or now, with its label at the top |
| Timescale | The header over a timeline: months, with the weeks (or hours) under them |
| Zoom (timeline) | How much time a timeline shows at once: weeks (scrolls sideways) or months (fits the whole range) |
| Resource schedule (resource timeline) | A timeline with one row per resource (a dock, a room, a vehicle) and each booking as a bar in its row. The dock schedule's horizontal layout |
| Resource calendar | The same turned on its side: a column per resource and time running down, like a calendar's day view. The dock schedule's vertical layout |
| Heatmap | A grid whose cells are shaded by a value, darker for more, such as how booked each dock is each day |
| Slot picker | The grid of start times to book from, each showing how much is still free, as in a booking portal |
| Double booking | Two bookings on one resource at the same time. The dock schedule stacks them in lanes and marks them |
| View switch | The icon toggle between ways of showing the same items: list, board, calendar |
| Nav group | A sidebar heading that folds its rows away (Teams, Favourites) |
| Search field | A text box with a search icon, a clear button, and room for a shortcut hint |
| Delete confirmation | The dialog that asks before something is removed for good |
| Comment box | Where you write a comment on a record: text, attach, Send (Ctrl/⌘ Enter) |
| Usage meter | How much of an allowance is used: a label, the count, a bar that turns amber then red |
| Account menu | Who is signed in, opening your profile, settings, theme and sign out: the avatar and name at the foot of a sidebar, or just the avatar at the right of a header |
| Global header | The top row for what belongs to the whole app, not the page: search, the assistant, notifications and the account. It sits over the page only, beside a full-height sidebar, or across the whole app with the workspace in it (SAP calls that the shell bar). The App shells page's Two rows header |
| Breadcrumb bar | A row of its own for the breadcrumb, under the global header, with the page's own buttons at its right |
| Theme toggle | The header button that switches between light and dark mode (a sun that turns into a moon) |
| Workspace switcher | The control at the top of a sidebar that switches workspace or company |
| Display menu (display options) | The popover that sets how items show: layout, grouping, ordering, which properties appear |
| Display properties | The fields a list row or board card shows, switched on and off in the display menu |
| Grouped list | A list split into groups, each under a group header that shows its count and can fold |
| Sign-in page | Where you sign in: email and password, single sign-on or a passkey, often beside a marketing panel |
| Single sign-on (SSO) | Signing in with your company's identity provider (Google Workspace, Okta…) instead of a password |
| Passkey | Signing in with your device (fingerprint, face, PIN) instead of a password |
| Menu kit | One list of menu items written once and shown both as a dropdown and as a right-click menu |
| Letter mark / icon mark | A small square standing for a company or team (letters) or a module (an icon) |
| Delta badge | The change on the period before, with an up or down arrow |
| Sparkline | A tiny line chart without axes, showing a trend at a glance |
| Page header | The title row of a page: title, a line of context, actions |
| Panel | A boxed card with a title bar, grouping one thing on a page |
| Nav item | One row of sidebar navigation: icon, label, count |
| Search trigger | A button that looks like a search field and opens the command palette |
| Keyboard shortcut | Keys that run an action, shown as key caps: ⌘K on a Mac, Ctrl K elsewhere |
| Navigation rail | A narrow column of icons for the top-level areas (modules) |
| Sidebar | The wider column listing the pages inside the current area |
| Inset | The content sits in a card that floats inside the sidebar's background |
| Breadcrumb | The path to the current page, such as Accounting › Customer invoices |
| Command palette | The Ctrl+K / ⌘K box for jumping anywhere, searching and running actions |
| Text field | A box for typing: an input, a text area, or an input group with addons such as a unit or a button |
| Combobox | A select you can type into to narrow its options. A multi-select one shows what you picked as tags |
| Toggle group (segmented control) | A row of toggle buttons where one, or several, stay pressed, such as List / Board |
| Hover card | A card that appears while the pointer rests on a name or link, with more about it |
| Sortable list | A list whose rows you drag into a new order, with the mouse or the keyboard |
| Launchpad | The home screen of tiles, one per module (SAP Fiori's term) |
| Worklist | Records that need you to act, one row each with its actions, such as Approve and Reject (SAP Fiori's term) |
| App switcher (module switcher) | The control that moves between modules or apps. In the ERP template it sits at the top of the sidebar |
| Start page | The page you land on after signing in. The ERP + AI template lets each user pick the launchpad or the Assistant |
| Edition | One app shipped in versions that share their code and differ in features: the ERP and ERP + AI templates |
| KPI (key performance indicator) | A headline number on a dashboard, such as open pipeline or overdue receivables |
| Record peek (record sheet) | A record opened over its list, without leaving it. The block is `record-sheet` |
| Center peek | A record peek in a centred modal over the list (the kit's default) |
| Side peek (side panel) | A record peek that slides in from the right edge |
| Docked panel (push panel) | A side panel that sits beside the page and narrows it instead of covering it, such as Ask AI. Resized by dragging its edge. The block is `docked-panel` |
| Resize handle | The edge you drag to change a panel's width; it also takes the arrow keys |
| Quick create | A light dialog for adding a record fast: a title, a description and property pills |
| Property pill | A small button showing one field of a record (status, assignee, due date) that opens a picker to change it |
| Notifications menu | The bell's popover: what needs you, newest first, with unread markers and "Mark all read" |
| Kanban board | Records as cards in columns (one per status or stage); drag a card to move it |
| Saved views | Named filters on a list, shown as tabs or pills |
| Faceted filter | A filter listing a column's values with how many rows have each; pick one or several |
| Filter chip | One active filter shown as a removable chip, such as "Status is Overdue" |
| Row density | How tightly table rows are packed: compact or comfortable |
| Column visibility (View menu) | Choosing which table columns show |
| Bulk actions | Actions applied to every selected row |
| Empty state | What a page shows when it has nothing to list |
| Toast | A short message that appears and fades, such as "Invoice sent" |
| Sheet / drawer | A panel that slides in from an edge |
| Skeleton | Grey shapes shown while content loads |
| QR code | A square barcode a phone camera reads: a payment link, a record's address, an authenticator set-up. The component is `QrCode` |
| Module (QR) | One of the small squares a QR code is made of. Its shape can change (square, rounded, dots) as long as it stays dark on light |
| Quiet zone | The blank margin a scanner needs around a QR code |
| Error correction level | How much of a QR code can be lost or covered and still scan: L 7%, M 15%, Q 25%, H 30% |
| Finder pattern | The three big squares in a QR code's corners that a scanner looks for first. The small ones are alignment patterns |
| Branded QR code | A QR code with a company's mark (logo, initials or name) in the middle and its name printed under it |

## AI interface
| Term | Meaning |
|---|---|
| Copilot | An AI assistant inside an app, opened beside the work (the ERP's Ask AI) |
| Assistant (full-page chat) | The AI chat as a page of its own, for longer questions; its chats are the copilot's too (the ERP + AI template's Home › Assistant) |
| Chat thread | The scrolling list of messages in a chat; it follows a streaming reply, and "Jump to latest" brings you back after scrolling up |
| Welcome screen | What a new chat opens on: a greeting, the prompt box and prompt starters |
| Prompt starters | Cards that start a chat with one click, each with a question and a hint |
| AI summary card | A few points the AI wrote about a record, labelled AI, with Regenerate, Copy and thumbs |
| Stale summary | An AI summary written before the record changed; it says so and offers Regenerate |
| AI briefing | An AI summary of what needs you today, at the top of the launchpad |
| Prompt box (composer) | Where you type to the AI: attachments, modes, model, Send or Stop |
| Model picker | Chooses which AI model answers |
| Mode toggle | Turns on a way of answering, such as web search or deep thinking |
| Slash command | A "/" shortcut in the prompt box, such as /summarise |
| Mention | An "@" reference to a person or record in the prompt |
| Dictation | Speaking a prompt instead of typing it |
| Thinking trail | The steps the AI took, shown under its reply: thinking, plan, tool calls ("Worked for 6s · 3 steps · 3 tools") |
| Tool call | One action the AI ran, such as searching jobs or reading a record, with its input and output |
| Approval card | A step the AI won't take without your yes, with Approve and Deny |
| Streaming | The reply appearing word by word as it's written |
| Follow-up suggestions | Next questions offered under a reply, one click to ask |
| AI label | A small "AI" tag on content the AI wrote, so people know to check it |
| File chip | An attached file shown as a small pill: type icon, name, size |
| Citation | A numbered link from a sentence to the source it came from |
| Artifact | A document, table or code the AI made, opened in its own panel with versions |
| Chat history | The list of past chats: projects, pinned, then the rest grouped by date (Today, Yesterday, Previous 7 days) or as one list |
| Project (AI chat) | A folder of related chats with its own instructions, which the assistant follows in each of them |
| Instructions (custom instructions) | Standing directions for the assistant: who you are, what to focus on, how to answer |
| Chat library (All chats) | A page of every chat, with a search and filters by type |
| Incognito chat (temporary chat) | A chat that is not kept in the history and is deleted when you leave it |
| Credits meter | How much of the plan's AI usage is left this month |

## Forms and checklists
The vocabulary of the form blocks (`src/blocks/form-fields.tsx`,
`form-renderer.tsx`, `forms-catalogue.tsx`). The blocks are generic: a
checklist, an expense claim and a survey are all forms to them.

| Term | Meaning |
|---|---|
| Form (form template, form definition) | What a form asks: its name, sections and fields, as data. What the catalogue lists. The type is `FormDefinition` |
| Field schema | The kit's one list of field kinds and how each is drawn and checked, shared by the form dialog and the form renderer (`form-fields.tsx`) |
| Form renderer | Draws a whole form from its definition: sections, progress, validation, review, submit. The block is `form-renderer` |
| Submission | One filled-in form, kept as a record: who, when, the answers and the result |
| Result | How a submission came out: passed or failed (a form with checks), or completed (one without) |
| Score | A submission's checks counted: passed, failed, N/A |
| Checklist | A form whose items are checks |
| Check item | One line of a checklist: a statement answered with an outcome (Pass / Fail / N/A, or Yes / No), with a note and a photo when it fails. The component is `CheckItem` |
| Outcome | The answer to a check. The bad one (Fail, No) carries the danger tone and asks for a note |
| Rating | Stars to pick from, 1 to 5 by default. The component is `Rating` |
| Signature pad | A box to sign in by hand; the strokes are kept as a picture. The component is `SignaturePad` |
| Forms catalogue | The page listing the forms a person can fill in, searched and grouped by category. The block is `forms-catalogue` |
| Context (of a form) | What one filling-in is about: the thing named by the link that opened the form, or asked for at the top (a vehicle, a bin, a new starter) |
| Deep link | A link that opens one form directly, with its context: what a QR code carries |
| Asset tag | A QR code fixed to a thing. Scanning it opens that thing's form with the thing filled in |
| QR scanner | Reads a QR code with the device's camera in the page (the browser's BarcodeDetector), or takes the code typed. The component is `QrScanner` |
| Review step | The dialog before a submission goes: the score and the failed checks, then Submit |
| Draft (form) | What has been entered so far, kept in this browser under the form and its context until submitted |
| Sign-off | The last section of a form: a name and a signature |

## ERP modules
| Module | Covers |
|---|---|
| CRM (customer relationship management) | Leads, opportunities, accounts, contacts, activities |
| Sales | Quotations, sales orders, deliveries, price lists |
| Inventory | Items, stock on hand, stock transfers, stock adjustments, warehouses |
| Purchasing (procurement) | Purchase requisitions, purchase orders, goods receipts, vendors |
| Accounting (finance) | Customer invoices, vendor bills, payments, journal entries, chart of accounts, financial reports |
| Human resources (HR) | Employees, leave requests, payroll |
| Administration | Users, roles and permissions, company settings, audit trail, integrations |

## ERP records and documents
| Term | Meaning | Number |
|---|---|---|
| Lead | A possible customer not yet qualified | L-1001 |
| Opportunity | A qualified lead with a value and a stage in the pipeline | OPP-2001 |
| Pipeline | Opportunities grouped by stage, from first contact to won or lost | |
| Weighted pipeline | Each open opportunity's amount times its probability, added up | |
| Win rate | Opportunities won as a share of those closed (won plus lost) | |
| Conversion rate | Quotations accepted as a share of those sent | |
| Account | A company you sell to (CRM). Once it buys, it is also a customer | ACC-101 |
| Contact | A person at an account | |
| Activity | A call, email, meeting or task logged against a record | |
| Quotation | A priced offer sent to a customer | QT-3001 |
| Sales order | A confirmed order from a customer | SO-5001 |
| Delivery | The goods leaving the warehouse for a sales order (delivery order) | DO-7001 |
| Price list | The prices a group of customers pays | |
| Item | Something you buy, stock or sell (a product or service), identified by its SKU | SKU-1001 |
| Stock on hand | How many of an item each warehouse holds | |
| Available | Stock on hand less what is reserved for open sales orders | |
| Reorder point | The level at which an item should be bought again | |
| Stock value | Stock on hand times unit cost | |
| Stock transfer | Stock moved between warehouses | ST-401 |
| Stock adjustment | A correction to stock on hand after a count, damage or loss | ADJ-501 |
| Purchase requisition | An internal request to buy, before a purchase order | PR-601 |
| Purchase order | A confirmed order to a vendor | PO-8001 |
| Goods receipt | Recording goods delivered against a purchase order (GRN) | GRN-901 |
| Vendor | A company you buy from (also called a supplier) | V-101 |
| Customer invoice | A bill you send a customer. Part of accounts receivable | INV-2026-0001 |
| Vendor bill | A bill a vendor sends you. Part of accounts payable | BILL-1001 |
| Accounts receivable (AR) | Money customers owe you | |
| Accounts payable (AP) | Money you owe vendors | |
| Receivables ageing | Unpaid customer invoices grouped by how long they are overdue: current, 1–30, 31–60 and 60+ days | |
| Payment | Money received from a customer or paid to a vendor | PAY-1001 |
| Journal entry | A posting of debits and credits to the general ledger | JE-1001 |
| General ledger (GL) | The record of every posting, account by account | |
| Chart of accounts | The list of ledger accounts, grouped into assets, liabilities, equity, income and expenses | 1000–5999 |
| Profit and loss (P&L) | Income less expenses over a period | |
| Balance sheet | Assets, liabilities and equity on a date | |
| Current year earnings | Net income so far this year, shown in equity until the year is closed into retained earnings | |
| Opening balance equity | A balancing equity line used when opening balances don't yet agree | |
| Cash flow | Cash coming in and going out over a period, and the change in cash | |
| Leave request | An employee asking for time off | LR-101 |
| Payroll run | Paying all employees for one period | PAY-RUN-2026-09 |
| Role | A set of permissions given to users, such as Finance or Sales | |
| Audit trail | Who changed what, and when | |
| Multi-company | One system holding several legal companies (entities), each with its own books | |

## Yard management
The vocabulary of the dock schedule block (`src/blocks/dock-schedule/`), as
yard management systems (YMS) and dock appointment scheduling tools use it.

| Term | Meaning | Number |
|---|---|---|
| Yard management system (YMS) | Software that runs a site's gate, yard and dock doors: who is booked, who has arrived, which door they use | |
| Dock door (dock, loading bay) | A door where a trailer backs up to load or unload. Each takes inbound, outbound or both | Dock 01 |
| Dock schedule | Every dock door by time of day, with each dock appointment as a bar in its dock's row | |
| Dock appointment (booking) | A carrier's booked time slot at a dock door, for one trailer | APT-1001 |
| Time slot | A fixed block of time (15, 30 or 60 minutes) that appointments are booked in | |
| Inbound (receiving) / outbound (shipping) | Goods coming in against a purchase order, or going out against a delivery order | |
| Carrier | The haulage company that brings or collects the trailer | |
| Trailer | The unit that docks; identified by its trailer number | TRL-4821 |
| Gate check-in | Recording a trailer's arrival at the gate; it then waits in the yard | |
| Yard queue | Trailers checked in and waiting for a door, oldest first | |
| Appointment status | Scheduled → Checked in → At door (loading or unloading) → Completed; or Late (past its start, not arrived) and No-show (never came; frees the dock) | |
| Live load / live unload | The driver waits while the trailer is loaded or unloaded | |
| Drop trailer | The trailer is left at the dock (or in the yard) and collected later | |
| Reefer | A refrigerated trailer, which needs a dock that can keep the cold chain | |
| Dock leveller | The plate that bridges the dock and the trailer bed, so forklifts can drive on | |
| Dock closure (blocked time) | Time a dock can't be booked: maintenance, cleaning, a shift change | |
| Out of service | A dock taken out of use for a while, such as for a repair | |
| Dock utilisation | The share of a dock's open time that is booked | |
| Dwell time | How long a trailer stays on site, from check-in to departure. Long waits can bring detention charges from the carrier | |
| Carrier booking portal | Where carriers book their own appointments from the free time slots | |
