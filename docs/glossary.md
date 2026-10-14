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
| Layouts | The empty frame an app's pages sit in: navigation, header, content area. Also called the app shell. Three tests: it holds a page, not a thing (put the inbox in it, then the calendar, and the frame does not change); it has no data of its own (sample data belongs to the content, never to the frame); an app has one or two of them, not twenty. A calendar, an inbox, a dock schedule or a form page is a block, not a layout, however it is arranged inside; "all with sample data" is the giveaway. shadcn calls whole pages blocks and Tailwind UI calls frames application shells; the kit keeps frame and content apart so a fix to a block reaches every page | App shells |
| Templates | A whole app: a layout, blocks and data, ready to run | ERP app, AI chat app |
| Component explorer (component workshop) | A site that shows every component on its own page, with a sidebar to find them, so each is built and checked before an app uses it. Storybook is the best-known one | This kit's whole site: `KitchenSink.tsx`, `ShowcaseSidebar.tsx`, `nav.ts` |
| Kitchen sink | One page that shows every component, to check they look right together. Often said loosely of a whole component explorer | All components |
| Component page | One page of a component explorer, for one component family: its playgrounds, variant grids, states, then examples | `#/buttons`, `#/badges`… |
| Component family | A component and its close relatives, documented on one page | Badges and labels: Badge, StatusBadge, DeltaBadge, LabelChip |
| Component category | A heading that groups component pages by what they do, as Ant Design and Material group theirs | Actions, Inputs, Data display, Feedback, Overlays, Navigation, Layout, Charts |
| Playground | A live preview of a component with a props pane and the generated code to copy. Storybook calls these the canvas and the controls | The first panels on a component page (`Playground` in `playground/Playground.tsx`) |
| Props pane (controls) | The selects and switches beside a playground, one per prop, that change the preview | The right side of each playground |
| Variant grid | Every value of one prop side by side, often crossed with another (variant × size). In Storybook each variant is a story | `Variants` in `playground/Playground.tsx` |
| States | How a component looks in each condition: default, hover, focus, disabled, loading, error, empty | After the variant grids on a component page |
| Examples | The component in real use, made by hand rather than generated from props | The last panels on a component page |
| Registry | shadcn's list of installable parts, served as JSON, so another project can copy them in with `npx shadcn add` | `registry.json`, built to `public/r/` by `npm run registry` |
| Registry item | One installable entry in a registry: its files, the npm packages it needs, and the other items it needs (its registry dependencies) | One per component, block and lib file, plus `tokens` |
| Registry namespace | The short prefix a project uses to name a registry, set once in its `components.json` | `@kit`, as in `@kit/kanban-board` |
| Registry category | A tag on a registry item (its `categories` field) that groups items across types | `ai` on every AI component and block |
| Registry bundle | A registry item with no files of its own that installs a set of other items (`registry:item`) | `ai-kit`: `npx shadcn add @kit/ai-kit` |
| Domain | A group of parts for one kind of product that cuts across the levels without being a level: each level keeps an `ai/` folder for it. Vercel's AI Elements is the same idea | The AI kit |
| AI kit | The AI domain: `components/ai/`, `blocks/ai/`, the AI group in the sidebar and the `ai-kit` bundle. A part belongs only if it makes sense only in an AI product | `#/ai-overview` |

## Interface patterns
| Term | Meaning |
|---|---|
| Deep link | An address that opens one thing inside an app (a chat, a settings section), so it can be bookmarked, shared and reached with the back button |
| Two-step verification (2FA) | Signing in with a code from an authenticator app as well as the password. Set up by scanning a QR code or typing the setup key |
| Recovery codes | One-time codes that sign you in if you lose the authenticator app |
| Passkey | Signing in with the device's lock (fingerprint, face, PIN) instead of a password |
| Signed-in devices (active sessions) | Every device signed in to the account, with its last activity, each one able to be signed out |
| Quiet hours | A daily time when push notifications wait |
| Notification channel | Where a notification goes: in app, email or push |
| Danger zone | The settings group for actions that cannot be undone, such as deleting the account |
| Share dialog | Where you give people access to something: invite with a role, change or remove access, general access, copy link (Google Docs, Notion, Figma) |
| General access | Who can open something without being added: only people added (restricted), everyone in the organisation, or anyone with the link |
| Role (sharing) | What a person may do with what is shared: Can view, Can chat, Can edit |
| Pending invite | Someone invited who has not joined yet; the invite can be sent again or cancelled |
| Avatar stack | Overlapping avatars of the people something is shared with, then +N |
| Icon and colour picker | Chooses an item's icon and colour from fixed sets, as Notion and Linear do for pages and teams |
| Stat tile | A small box with one number and its label, for an overview |
| Typed confirmation | A destructive action enabled only once you type a word (DELETE) or the item's name |
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
| Bottom sheet | A sheet that rises from the bottom of a phone screen, with a grab handle: pickers, sort and filter, quick create. The kit's `SheetContent` with `side="bottom"`; `container` keeps it inside a framed screen |
| PWA (progressive web app) | A web app a phone can install: it gets a home-screen icon, opens full screen and can work offline. A web app manifest describes it; a service worker caches it and sends work made offline |
| Standalone (display mode) | How an installed PWA opens: full screen, with no browser address bar or toolbar. The opposite is opening in a browser tab |
| Install prompt | The offer to add a web app to the home screen, shown in a browser tab and never once installed |
| Tab bar (bottom navigation) | A row of three to five tabs at the foot of a phone screen, in place of a sidebar. Each tab keeps its own stack of screens |
| Stack navigation (push / pop) | Phone navigation one screen at a time: opening a record pushes a screen with a back arrow, Back pops it |
| Top bar (navigation bar) | A phone screen's header: a big title on a tab's first screen, a back arrow and a centred title on a pushed one, at most two actions |
| Menu screen (full-screen menu) | A phone's navigation behind a "Menu" button in the top bar: every destination full screen under the bar, in big type under small headings, in place of a tab bar or a slide-out drawer. shadcn's own site uses it on a phone. The block part is `MobileMenu` |
| Menu effect | How the menu screen opens: fade (blurred page), curtain (drops from the top bar), rise (from the foot), cascade (groups rise in one after another), drawer (a panel from the left edge over a dimmed page, closed by a tap outside). `MobileMenu`'s `effect` |
| Module switcher | The control that changes the module (workspace, team) you work in. Five designs in the phone shell: tiles, launcher (a home screen's icon grid), list, sheet (a bottom sheet from the top bar's name) and strip (chips under the top bar). `MobileSwitcherStyle` |
| Floating tab bar | A tab bar that floats over the page as a capsule, with search as a round button beside it; it shrinks to the current tab while you scroll down and comes back as you scroll up (iOS 26's behaviour). The block part is `MobileFloatingTabBar` |
| Large title | A page's big heading at the top of its content that stands for the title; the small title in the top bar appears once it scrolls away |
| Mobile shell | The phone app's frame: top bar, the screen, and the tab bar or the screen's own bottom action. The block is `mobile-shell` |
| Floating action button (FAB) | A round button floating over the bottom right of a phone screen for its main action, such as New issue |
| Safe area | The part of a phone screen clear of the status bar, notch and home indicator. CSS reads it as `env(safe-area-inset-*)` |
| Home indicator | The short bar at the bottom of a phone without a home button; swiping it goes home |
| Background sync | Sending changes made offline once the connection is back, done by the service worker |
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
| Project (AI chat) | A folder of related chats with its own instructions and knowledge, which the assistant follows in each of them. Opens on a page of its own (the project page block), as in ChatGPT, Claude and Gemini; a dialog only names it |
| Instructions (custom instructions) | Standing directions for the assistant: who you are, what to focus on, how to answer |
| Project knowledge (project files) | The files added to a project, such as PDFs, sheets or notes, that the assistant draws on in every chat in it. The product term in ChatGPT, Claude and Gemini; RAG and long context are the two ways to get them to the model, not the name of the feature |
| Long context (in-context, "context stuffing") | Putting the whole of a project's knowledge into the prompt on every turn. Exact and simple, but it stops working once the files outgrow the model's context window |
| RAG (retrieval-augmented generation) | Splitting the knowledge into chunks and indexing them, then putting only the few chunks that match each question into the prompt. Scales to big libraries; may miss the right passage. Products use long context while the knowledge is small and RAG once it is not |
| Chat library (All chats) | A page of every chat, with a search and filters by type |
| Incognito chat (temporary chat) | A chat that is not kept in the history and is deleted when you leave it |
| Credits meter | How much of the plan's AI usage is left this month |
| Settings page | Settings as a page of their own, sections down the left, as Claude and Linear lay theirs out (ChatGPT uses a dialog). On a phone, a list of sections that drills into one |
| Response style | How replies are written: Default, Concise, Explanatory or Formal |
| Memory (assistant memory) | Facts the assistant keeps about you across chats, each with the chat it came from; you can see, edit and delete them |
| Reference past chats | Lets the assistant search your earlier chats for context, as well as its saved memories |
| Connector | An outside app the assistant can use through tools (read files, search mail, file an issue). Claude's and ChatGPT's name for it |
| MCP server (Model Context Protocol) | The open standard a connector speaks: a server that offers tools to an AI app. A custom connector is a remote MCP server added by its URL |
| Tool permission | Per tool of a connector: Always allow, Ask first (an approval card each time) or Off. Read-only tools look; write tools change things |
| Scope (OAuth scope) | One thing an app asks to be allowed to do, listed on the consent step before you connect it |
| Consent step | The screen before connecting an app that lists what it will be able to do |
| Skill | A packaged set of instructions (and files) the assistant loads only when a task needs it, decided from its description. Built-in, yours or your organisation's |
| SKILL.md | The file that holds a skill: front matter (name, description) then the instructions in Markdown |
| Front matter | The name and description block at the top of a Markdown file, between `---` lines |
| Extended thinking | The model reasons for longer before it answers; slower, better on hard problems |
| Voice mode | Talking with the assistant out loud. The voice picker chooses its voice; auto-send (end-of-turn detection) sends when you pause |
| Shared link | A read-only link to a chat; it can be revoked |
| Archived chat | A chat taken out of the history without deleting it |
| Data retention | How long chats are kept before they are deleted |
| Project workspace | A project's page with tabs (Overview, Chats, Knowledge, Tools, Schedules, Sharing, Settings), as Claude and ChatGPT open a project |
| Project template | A starting point for a new project: its icon, colour and instructions (Research, Writing, Customer support…) |
| Starred project | A project pinned to the top of the Projects list |
| Archived project | A project hidden from the sidebar, kept with its chats; restored from its page |
| Shared with me | Projects other people shared with you, listed apart from your own |
| Project memory | What the assistant learns in one project, kept apart from your personal memory |
| Scheduled task | A prompt the assistant runs on its own on a schedule; each run's result arrives as a new chat in the project (ChatGPT Tasks, Claude's scheduled tasks) |
| Run (scheduled task) | One time a scheduled task ran: running, succeeded or failed, with its result. The list of them is the run history |
| Knowledge base | A library the assistant searches when a question needs it (policies, product documents, a support wiki), shared across projects and people |
| Knowledge source | Where a knowledge base gets its documents: uploaded files, a crawled website, a connected app's folder, pasted text. Synced sources stay current on a schedule |
| Indexing | Turning documents into searchable chunks: queued, processing, then indexed, or failed (with why) |
| Chunk | One piece of a document, a few hundred tokens long, that search returns. Chunk size and overlap set how documents are split |
| Embedding (embedding model) | Numbers that capture what a chunk means, so search can find it by meaning rather than exact words. Changing the model means re-indexing |
| Hybrid search | Keyword search alongside meaning (semantic) search, so exact names and numbers are found too |
| Reranking | A second, slower pass that reorders the best matches |
| Top-K | How many chunks go to the model for one question |
| Similarity score and cut-off | How well a chunk matches a question (0 to 1), and the score below which chunks are left out |
| Retrieval tester (test retrieval) | Ask a question and see which chunks would be fetched, ranked with scores and highlights, before anyone asks it in a chat |
| Context window | How much text the model can read at once, in tokens. A project's knowledge counts against it |
| Token | The unit models read text in, about four characters of English |
| Full context and Search mode | The product names for long context and RAG on a project's knowledge: every file read in full while it fits, searched once it does not. The context meter shows which, with the threshold where search starts |
| Linked knowledge base | A knowledge base a project searches; it never counts against the project's context |
| Document citation | A citation to a passage in a file or knowledge base, with its page; hover shows the passage |
| Source panel | The list of a reply's sources beside the chat, the active one showing the exact passage cited |
| Agent | A saved, named assistant (ChatGPT's GPTs, Gemini's Gems): instructions, knowledge, tools and a model, used from a chat or run on its own |
| Agent builder | Where an agent is made: Create (describe it in a chat; the builder fills it in and asks follow-ups), Configure (the same as a form) and a live Preview |
| Agent template | A ready-made agent to start from, in the gallery's Explore tab |
| Conversation starter | A prompt shown before a chat with an agent; one click sends it |
| Trigger | What starts an agent's run: manual (someone runs it), schedule (a recurrence), or event (something happens in a connected app, narrowed by a filter such as from:@supplier.com) |
| Run | One time an agent worked: queued, running, waiting for approval, then succeeded, failed or cancelled, with its steps and result |
| Runs inbox | Every agent's runs, what needs you first (waiting for approval, or failed and not opened) |
| Approval (human in the loop) | A run stops before a tool that sends or changes something and asks: Allow once, Always allow (it won't ask again for that tool), or Deny (the step is skipped) |
| Prompt library (saved prompts) | Prompts kept to reuse, yours and your team's; a prompt template holds variables such as {{customer}} that are filled in before it is sent |
| Queued message | A message written while a reply is still running; it sends when the reply ends (not while it waits for an approval) |
| Branch (message) | One version of an edited message with the replies after it; editing keeps the old branch, switched with ‹ 1 / 2 › |
| Branch in new chat (fork) | A new chat made from a conversation up to one message |
| Read aloud | The browser speaks a reply (text to speech) |
| Shared link (snapshot or live) | A read-only link to a chat: a snapshot shows it as it was, a live link follows new messages; it can be revoked |
| Deep research | A mode for one message: a research plan, many searches and page reads over a few minutes, then a report with citations |
| Voice mode | A spoken conversation, full screen: the orb shows listening, thinking and speaking, with captions, mute and end; tapping the orb interrupts (barge-in) |
| Usage limit and rate limit | How much a plan may use in a period (the banner offers a cheaper model or an upgrade), and a short "too many requests" pause with a countdown before retrying |
| Onboarding (first run) | The welcome on a first visit: name and role, reply style, apps to connect, a prompt to try |
| Command menu | Ctrl+K: search and run anything in the app (chats, projects, agents, knowledge, settings, actions) |
| Admin console | Where owners and admins run the organisation: members, roles, sign-in, policies, usage and the audit log |
| Seat | One person's place on the plan; invited and suspended members hold one too |
| Role and permission (RBAC) | What a role may do, set per permission in a matrix; Owner, Admin and Member are built in, custom roles can be added |
| Domain auto-join | People with the organisation's email domain join without an invite |
| SSO (SAML, OIDC) | Signing in through the organisation's identity provider. The service provider's entity ID and ACS URL go to the identity provider; its metadata or issuer comes back; a test sign-in shows the attributes received |
| SCIM provisioning | The identity provider creates, updates and removes members and groups automatically, with a bearer token shown once |
| Domain verification | Proving the organisation owns an email domain with a DNS TXT record |
| IP allowlist | The address ranges (CIDR) people may sign in from |
| Audit log | Who did what and when, with before and after for changes, filtered and exported |
| Allow list (connectors) | The connectors the organisation lets people use; a connector request asks an admin to allow a blocked one |
| Model access and feature policy | Which models and features (web search, research, voice…) the organisation allows; what is off leaves the app for everyone |
| Retention policy and legal hold | How long the organisation keeps chats; a legal hold pauses deletion |
| Recurrence | How often something repeats: once, daily, weekdays, weekly on some days, monthly on a day, at a time in a time zone |

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
| Form builder | Where a form is made or edited: its details, sections and fields, with a live preview. The block is `form-builder` |
| Field kind | What a field asks for: short text, number, date, dropdown, choice, tick box, check, yes / no, rating, photo, signature |
| Form version | Each save of a form's definition. A submission keeps the version it was filled in against |
| Submission feed | Submissions as cards grouped by day, newest first, instead of a table. The block is `submission-feed` |
| Score bar | A submission's checks as one bar in three colours: passed, failed, N/A |
| Stored form | A form definition as plain JSON, its icon named by id, ready for storage. `toStoredForm` / `fromStoredForm` |

## ERP modules
| Module | Covers |
|---|---|
| CRM (customer relationship management) | Leads, opportunities, accounts, contacts, activities |
| Sales | Quotations, sales orders, deliveries, price lists |
| Inventory | Items, stock on hand, stock transfers, stock adjustments, warehouses |
| Purchasing (procurement) | Purchase requisitions, purchase orders, goods receipts, vendors |
| Accounting (finance) | Customer invoices, vendor bills, payments, journal entries, chart of accounts, financial reports |
| Human resources (HR) | Employees, leave requests, payroll |
| Workplace safety and health (WSH) | Toolbox meetings, inspections and checklists, safety documents, training certificates, risk assessments. Singapore's term (the WSH Act); elsewhere EHS (environment, health and safety), HSE or OHS |
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

## Workplace safety and health
| Term | Meaning | Number |
|---|---|---|
| Toolbox meeting (toolbox talk) | A short safety briefing for a work crew at the start of a shift, on one topic, with attendance taken | TBM-1001 |
| Inspection | A checklist filled in on the spot for one area or piece of equipment and handed in: passed, or failed with the checks that failed. In the kit it is a form submission in the Inspections category | SUB-1080 |
| Finding | A check that failed on an inspection, to be put right (a corrective action) | |
| Safety document | A controlled document: a policy, safe work procedure (SWP), plan, procedure or standard, with a version, an owner, an effective date and a review date | DOC-1001 |
| Version (document control) | One approved issue of a document, numbered major.minor: a minor version for a small change (3.2 → 3.3), a major one for a rewrite (→ 4.0). Earlier versions stay in the history | |
| Review due | An approved document or assessment past its review date | |
| Training certificate | Proof that a person completed a safety course, valid until it expires; expiring means within 60 days | CERT-3001 |
| Training compliance | The share of required certificates that are still valid, by course | |
| Risk assessment | Hazards of one activity, each rated and controlled; reviewed yearly | RA-401 |
| Hazard | Something that could cause harm, with a control that lessens it | |
| Risk matrix | Severity × likelihood on a 5 × 5 grid, banded Low (1–4), Medium (5–12) and High (15–25) | |
| Permit to work | A signed form that allows dangerous work (hot work, confined space) once the precautions are checked | |
| Incident | An accident, near miss or damage, reported through a form | |

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
