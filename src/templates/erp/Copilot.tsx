import { useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowExpand01Icon, PencilEdit02Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { ChatThread, ChatWelcome, PromptStarters } from '@/blocks/ai/chat-thread'
import { IconAction } from '@/components/icon-action'
import { IconMark } from '@/components/mark'
import { Shortcut } from '@/components/shortcut'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { usePath } from '@/lib/router'
import { firstName, suggestions } from './assistant/answers'
import { parseRecordHref, useAssistant } from './assistant/store'
import { Composer, Turns } from './assistant/Turns'
import { ROLE_LABEL } from './data'
import { edition } from './edition'
import { MODULES, moduleById, pagesOf } from './modules'
import { go, parseRoute } from './route'
import { useErp } from './store'
import type { EntityId, Role } from './types'

// The "Ask AI" copilot: a side panel that answers questions about the
// company's records, from any page (Ctrl+J / ⌘J). Built from the kit's AI
// blocks, with the answers and chats in ./assistant. In the ERP + AI edition
// its chat is the same one the full-page Assistant shows, and "Open full
// page" carries it there.
export function CopilotPanel() {
  const { copilotOpen, setCopilotOpen, session, company, openPeek } = useErp()
  const { active, busy, send, newChat, focusComposer } = useAssistant()
  const route = parseRoute(usePath())
  const module = (route.screen === 'app' ? moduleById(route.module) : undefined) ?? MODULES[0]
  const pages = pagesOf(module)
  const page = (route.screen === 'app' ? pages.find((pg) => pg.id === route.page) : undefined) ?? pages[0]
  const role: Role = session?.role ?? 'admin'
  const prompts = suggestions(module, role)
  const suggestedFor = `Suggested for ${module.id === 'home' ? 'you' : module.name}`
  const openingRecord = useRef(false)
  const messages = active?.messages ?? []

  function openLink(href: string) {
    const target = parseRecordHref(href)
    if (!target) return
    openingRecord.current = true
    setCopilotOpen(false)
    openPeek(target.entity as EntityId, target.id)
  }

  return (
    <Sheet open={copilotOpen} onOpenChange={setCopilotOpen}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        onOpenAutoFocus={(e) => {
          // The prompt box takes focus itself, once it has mounted.
          e.preventDefault()
          focusComposer()
        }}
        onCloseAutoFocus={(e) => {
          // The record's side panel takes focus; don't pull it back to the trigger.
          if (openingRecord.current) e.preventDefault()
          openingRecord.current = false
        }}
      >
        <header className="flex min-w-0 items-center gap-1.5 border-b py-3 pr-12 pl-4">
          <IconMark icon={SparklesIcon} colour="var(--brand)" className="mr-1" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <SheetTitle className="shrink-0">Ask AI</SheetTitle>
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
          {messages.length > 0 && <IconAction label="New chat" icon={PencilEdit02Icon} onClick={newChat} />}
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
          <SheetDescription className="sr-only">
            Ask questions about the records in {company?.name ?? 'your company'}. Answers come from the live data.
          </SheetDescription>
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
                setCopilotOpen(false)
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
      </SheetContent>
    </Sheet>
  )
}
