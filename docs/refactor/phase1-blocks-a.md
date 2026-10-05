# Phase 1 report: menu kit, usage meter, account menu, workspace switcher, sign-in

1. Menu kit (`@/components/menu-kit`): `DROPDOWN_MENU_KIT`, `CONTEXT_MENU_KIT`, `type MenuKit` (a `kit` prop's
   type). Parts: Item, CheckboxItem, RadioGroup, RadioItem, Label, Separator, Shortcut, Group, Sub, SubTrigger,
   SubContent. JobActions.tsx: use these, drop its own Kit type and kits. chat-history re-exports the old names
   (DROPDOWN_MENU_KIT, CONTEXT_MENU_KIT, ChatMenuKit) for now.
2. `UsageMeter` (`@/components/usage-meter`): `value` (%), `label`, `count` (top right), `amount` (large figure),
   `note`, `noteEnd`, `barLabel`, `warnAt`/`dangerAt` (amber, then red), `size` ('sm' | 'md'), `children`
   (e.g. Upgrade), `className` (no padding/border of its own). chat-history's `CreditsMeter` is an alias for now.
   - ai/Sidebar.tsx: `value={credits} label={`${Math.round(credits)}% of monthly credits`} count="Resets 1 Oct" className="px-1.5 pt-1"`.
   - AppShell meter (:638): `count="180 / 250" barLabel="Issues used" className="bg-background/60 gap-2 rounded-lg border p-2.5"`,
     Upgrade button as children, label `<span className="text-foreground font-medium">Issues used</span>`.
   - Settings meter (:419): `count={`${pct}%`}`, `amount`, `note`, `className="gap-2 rounded-lg border p-3"`.
   - UsagePanel: `size="md" warnAt={75} dangerAt={90}`, `count` wrapped in aria-live, `note`, `noteEnd` (calendar icon + text).
3. `AccountMenu` (`@/blocks/account-menu`, moved from chat-history): `name`, `detail`, `email` (heading: name,
   email, line), `label` (one-line heading), `size` ('sm' 36px | 'md' 40px), `side`, `align`, `menuClassName`
   (w-56 default), `children` (menu items), `className` (trigger). chat-history re-exports it for now.
   - ERP Shell: `size="md" detail={title} email={email} menuClassName="w-60" className="hover:bg-sidebar-accent focus-visible:ring-ring/40 aria-expanded:bg-sidebar-accent mt-1"`, sub-menus as children.
   - AppShell (:646): `size="md" detail={email} menuClassName="w-52"` + sidebar hover colours.
4. `WorkspaceSwitcher`, `type WorkspaceOption = { id, name, short?, colour }` (`@/blocks/workspace-switcher`):
   `workspaces`, `currentId`, `onSelect(id)` (only when a different one is picked), `detail`, `label`
   ("Workspaces"), `variant` ('default' | 'compact' | 'icon'), `side`, `badgeClassName`, `menuClassName`,
   `children` (extra items under a line), `className`. Returns null if currentId isn't in the list.
   - ERP CompanySwitcher: `label="Companies" detail={`${role} · ${country}`} menuClassName="w-64"`, "All companies" as child.
   - ShowcaseSidebar: give workspaces ids, `menuClassName="w-60"`, its 3 extra items as children.
   - AppShell Teams trigger (:426): default; Inset (:593): `detail={plan}`; TopNav (:731):
     `variant="compact" detail={plan.replace(' plan', '')} badgeClassName="hidden @md:inline"`.
5. Sign-in parts (`@/blocks/sign-in`): `SignInLayout({ aside, from: 'md' | 'lg' })`, `SignInMain({ brand, footer, size, as })`,
   `SignInBrand({ name, letters, colour, mark })`, `SignInHeading({ title, description, size, as })`,
   `SignInForm` (`onSubmit`, `password`, `remember`, `rememberLabel`, `onForgotPassword`, labels, `errorText`,
   `autoComplete`, `children`, `busy`, `disabled`, `values`/`onValuesChange`), `AuthSeparator`,
   `SignInMethods({ methods: { id, label, icon, onClick, busy? }[], disabled })`, `SignInNote`,
   `SignInFooter({ start, end })`, `SignInAside({ variant: 'brand' | 'muted' })`,
   `SignInTestimonial({ eyebrow, quote, name, role })`, `SignInPitch({ title, description, points, children })`.
   - ERP Login: `values`, `onValuesChange`, `remember`, `onForgotPassword`, `busy={busy === 'password'}`,
     `disabled={!!busy}`, its email label/placeholder, `errorText`, `SignInPitch` in a muted `SignInAside`;
     demo accounts as children of SignInMain; `<SignInBrand name="Acme ERP" />` on Login and Companies.
     AuthSeparator: `className="my-0"` keeps the old spacing.
   - SignInSection: `from="md"` with `className="min-h-0 flex-1 grid-rows-1"`; `size="sm"` on SignInMain;
     `as="h4"`; `password={false} autoComplete={false} submitLabel="Send magic link"`; testimonial in a brand
     SignInAside; pass `mark` to keep the diamond logo.

Temporary re-exports in chat-history (phase 3 removes): the two kits, ChatMenuKit, AccountMenu, CreditsMeter.
Glossary to add: usage meter, account menu, workspace switcher, sign-in page, single sign-on, passkey, menu kit.
