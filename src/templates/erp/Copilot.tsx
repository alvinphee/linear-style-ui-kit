import { useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowExpand01Icon, Cancel01Icon, PencilEdit02Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { ChatThread, ChatWelcome, PromptStarters } from '@/blocks/ai/chat-thread'
import { DockedPanel } from '@/blocks/docked-panel'
import { IconAction } from '@/components/icon-action'
import { IconMark } from '@/components/mark'
import { Shortcut } from '@/components/shortcut'
import { usePath } from '@/lib/router'
import { useMediaQuery } from '@/lib/use-media-query'
import { firstName, suggestions } from './assistant/answers'
import { parseRecordHref, useAssistant } from './assistant/store'
import { Composer, Turns } from './assistant/Turns'
import { ROLE_LABEL } from './data'
import { edition } from './edition'
import { MODULES, moduleById, pagesOf } from './modules'
import { go, parseRoute } from './route'
import { useErp } from './store'
import type { EntityId, Role } from './types'

// Docks beside the page from this window width; narrower, it is a sheet over it.
const DOCK_AT = 1024

// The "Ask AI" copilot: answers questions about the company's records, from
// any page (Ctrl+J / ⌘J, or the Ask AI button, which also closes it). The
// kit's docked panel: beside the page, which narrows to make room, so the
// records it mentions stay in view; drag its edge to resize it (the width
// is kept). Built from the kit's AI blocks, with the answers and chats in
// ./assistant. In the ERP + AI edition its chat is the same one the
// full-page Assistant shows, and "Open full page" carries it there.
export function CopilotPanel() {
  const { copilotOpen, setCopilotOpen, copilotWidth, setCopilotWidth, session, company, openPeek } = useErp()
  const { active, busy, send, newChat, focusComposer } = useAssistant()
  const docked = useMediaQuery(`(min-width: ${DOCK_AT}px)`)
  const route = parseRoute(usePath())
  const module = (route.screen === 'app' ? moduleById(route.module) : undefined) ?? MODULES[0]
  const pages = pagesOf(module)
  const page = (route.screen === 'app' ? pages.find((pg) => pg.id === route.page) : undefined) ?? pages[0]
  const role: Role = session?.role ?? 'admin'
  const prompts = suggestions(module, role)
  const suggestedFor = `Suggested for ${module.id === 'home' ? 'you' : module.name}`
  const openingRecord = useRef(false)
  const messages = active?.messages ?? []

  // Docked, the panel stays open beside a record or a page it links to; as a
  // sheet it makes way for them.
  function openLink(href: string) {
    const target = parseRecordHref(href)
    if (!target) return
    if (!docked) {
      openingRecord.current = true
      setCopilotOpen(false)
    }
    openPeek(target.entity as EntityId, target.id)
  }

  return (
    <DockedPanel
      open={copilotOpen}
      onOpenChange={setCopilotOpen}
      title="Ask AI"
      description={`Ask questions about the records in ${company?.name ?? 'your company'}. Answers come from the live data.`}
      width={copilotWidth}
      defaultWidth={400}
      minWidth={340}
      maxWidth={760}
      onWidthChange={setCopilotWidth}
      dockAt={DOCK_AT}
      showCloseButton={false}
      onOpenFocus={focusComposer}
      onCloseAutoFocus={(e) => {
        // The record's peek takes focus; don't pull it back to the trigger.
        if (openingRecord.current) e.preventDefault()
        openingRecord.current = false
      }}
    >
      {/* As tall as the breadcrumb bar beside it, so their lines meet. */}
      <header className="flex h-10 min-w-0 shrink-0 items-center gap-1 border-b pr-1.5 pl-3">
        <IconMark icon={SparklesIcon} colour="var(--brand)" size="sm" className="mr-1" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="shrink-0 text-xs font-medium">Ask AI</h2>
          <span
            title="The page Ask AI is looking at"
            className="text-muted-foreground inline-flex h-5 min-w-0 items-center gap-1 rounded-md border px-1.5 text-[11px]"
          >
            <HugeiconsIcon icon={module.icon} strokeWidth={2} className="size-3 shrink-0" style={{ color: module.colour }} />
            <span className="truncate">
              <span className="sr-only">Context: </span>
              {module.id === 'home' ? page.label : `${module.name} › ${page.label}`}
            </span>
          </span>
        </div>
        {messages.length > 0 && <IconAction label="New chat" icon={PencilEdit02Icon} onClick={() => newChat()} />}
        {edition().assistant && (
          <IconAction
            label="Open full page"
            icon={ArrowExpand01Icon}
            onClick={() => {
              setCopilotOpen(false)
              go('home', 'assistant')
            }}
          />
        )}
        <IconAction label="Close" icon={Cancel01Icon} shortcut={['Esc']} onClick={() => setCopilotOpen(false)} />
      </header>

      {active && messages.length > 0 ? (
        <ChatThread
          resetKey={active.id}
          count={messages.length}
          follow={messages}
          label="Conversation"
          busy={busy}
          columnClassName="max-w-none p-4"
        >
          <Turns
            chat={active}
            onLink={openLink}
            onOpenPage={(link) => {
              if (!docked) setCopilotOpen(false)
              go(link.module, link.page)
            }}
          />
        </ChatThread>
      ) : (
        // The kit's welcome screen; the prompt box stays at the panel's foot.
        <ChatWelcome
          headingAs="h3"
          title={`How can I help, ${firstName(session?.name ?? '')}?`}
          description={
            <>
              I answer from the live records in {company?.name ?? 'your company'}, within what the {ROLE_LABEL[role]} role can open.
              Open me from anywhere with <Shortcut keys={['mod', 'J']} className="align-middle" />.
            </>
          }
          starters={
            <div className="grid gap-1.5">
              <p className="text-muted-foreground text-[11px] font-medium">{suggestedFor}</p>
              <PromptStarters label={suggestedFor} items={prompts.map((q) => ({ id: q, icon: SparklesIcon, title: q, onSelect: () => send(q) }))} />
            </div>
          }
        />
      )}

      <div className="border-t p-3">
        <Composer placeholder={`Ask about ${module.id === 'home' ? 'your company' : module.name}…`} autoFocus />
      </div>
    </DockedPanel>
  )
}
