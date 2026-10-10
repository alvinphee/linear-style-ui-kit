import { memo, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Download01Icon, Folder01Icon, IncognitoIcon, MoreHorizontalIcon, PanelRightOpenIcon, Share08Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { RenameInput } from '@/blocks/ai/chat/chat-history'
import { ChatThread, ChatWelcome, PromptStarters } from '@/blocks/ai/chat/chat-thread'
import { ModelPicker, type PromptModel } from '@/blocks/ai/chat/prompt-box'
import { IconAction } from '@/components/icon-action'
import { IncognitoToggle } from '@/components/ai/incognito-toggle'
import { DROPDOWN_MENU_KIT } from '@/components/menu-kit'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { copyText } from '@/lib/clipboard'
import { greeting } from '@/lib/text'
import { useActions } from './context'
import { DEFAULT_MODEL, MODELS, STARTERS, USER } from './data'
import { AssistantMessageView, UserMessageView } from './Message'
import { PromptBox } from './PromptBox'
import { ChatMenuItems, DeleteChatDialog } from './Sidebar'
import type { Chat, ModelId, Modes, Project } from './types'

// Speed or quality as three short bars, in the model picker's details line.
function Meter({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1">
      {label}
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1 w-2 rounded-full', i <= value ? 'bg-foreground/70' : 'bg-muted-foreground/25')} />
        ))}
      </span>
      <span className="sr-only">{value} of 3</span>
    </span>
  )
}

// The made-up models in the prompt-box block's model picker.
const MODEL_OPTIONS: PromptModel[] = MODELS.map((m) => ({
  id: m.id,
  name: m.name,
  description: m.description,
  icon: m.icon,
  badge: m.badge,
  details: (
    <>
      <Meter label="Speed" value={m.speed} />
      <Meter label="Quality" value={m.quality} />
      <span>~{Math.round(m.thinkMs / 1000)}s thinking</span>
    </>
  ),
}))

function ProjectChip({ project }: { project: Project }) {
  const actions = useActions()
  return (
    <button
      type="button"
      onClick={() => actions.openProject(project.id)}
      className="hover:bg-accent/60 focus-visible:ring-ring/30 hidden h-5 max-w-36 shrink-0 items-center gap-1 rounded-full border px-2 text-[11px] outline-none focus-visible:ring-2 @lg:inline-flex"
      aria-label={`Project: ${project.name}. Open project`}
    >
      <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-3 shrink-0" style={{ color: project.colour }} />
      <span className="truncate">{project.name}</span>
    </button>
  )
}

// The chat's header row: its title (rename on click) and project, then the
// model, artifacts, share, its menu and, top right, the incognito toggle. An
// incognito chat has no title, share or menu: it is not kept.
function Header({ chat, project, projects, model, incognito, sidebarToggle, hasArtifacts, onOpenArtifacts, onDeleted }: {
  chat: Chat | null
  project: Project | null
  projects: Project[]
  model: ModelId
  incognito: boolean
  sidebarToggle: ReactNode
  hasArtifacts: boolean
  onOpenArtifacts: () => void
  onDeleted: () => void
}) {
  const actions = useActions()
  const [renaming, setRenaming] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const skipFocusReturn = useRef(false)
  const titleRef = useRef<HTMLButtonElement>(null)
  const kept = chat && !chat.temporary ? chat : null

  function share() {
    if (!chat) return
    copyText(`https://share.example.com/c/${chat.id}`, {
      success: 'Share link copied',
      description: `share.example.com/c/${chat.id} · demo only`,
    })
  }

  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
      {sidebarToggle}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {chat?.temporary ? (
          <span className="flex min-w-0 items-center gap-1.5 px-1.5 text-xs font-medium">
            <HugeiconsIcon icon={IncognitoIcon} strokeWidth={2} className="size-3.5 shrink-0" />
            <span className="truncate">Incognito chat</span>
          </span>
        ) : chat && renaming ? (
          <RenameInput
            initial={chat.title}
            label="Chat title"
            className="max-w-72"
            onDone={(title) => {
              setRenaming(false)
              if (title) actions.renameChat(chat.id, title)
              requestAnimationFrame(() => titleRef.current?.focus())
            }}
          />
        ) : chat ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                ref={titleRef}
                type="button"
                onClick={() => setRenaming(true)}
                className="hover:bg-accent/60 focus-visible:ring-ring/30 h-7 min-w-0 truncate rounded-md px-1.5 text-xs font-medium outline-none focus-visible:ring-2"
              >
                {chat.title}
              </button>
            </TooltipTrigger>
            <TooltipContent>Rename</TooltipContent>
          </Tooltip>
        ) : (
          <span className="truncate px-1.5 text-xs font-medium">New chat</span>
        )}
        {project && <ProjectChip project={project} />}
      </div>
      <ModelPicker
        models={MODEL_OPTIONS}
        value={model}
        onChange={(id) => actions.setModel(id as ModelId)}
        label="Model · made up for this demo"
        defaultId={DEFAULT_MODEL}
      />
      {hasArtifacts && <IconAction label="Artifacts" icon={PanelRightOpenIcon} onClick={onOpenArtifacts} />}
      {kept && <IconAction label="Share" icon={Share08Icon} onClick={share} className="hidden @sm:inline-flex" />}
      {kept && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Chat options" className="text-muted-foreground">
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            onCloseAutoFocus={(e) => {
              if (!skipFocusReturn.current) return
              e.preventDefault()
              skipFocusReturn.current = false
            }}
          >
            <ChatMenuItems
              kit={DROPDOWN_MENU_KIT}
              chat={kept}
              projects={projects}
              onRename={() => {
                skipFocusReturn.current = true
                setRenaming(true)
              }}
              onDelete={() => setConfirm(true)}
              extra={(
                <>
                  <DropdownMenuItem className="@sm:hidden" onSelect={share}>
                    <HugeiconsIcon icon={Share08Icon} strokeWidth={2} /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => actions.exportChat(kept.id)}>
                    <HugeiconsIcon icon={Download01Icon} strokeWidth={2} /> Export as Markdown
                  </DropdownMenuItem>
                </>
              )}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {/* The label goes in a narrow chat, leaving the icon. */}
      <IncognitoToggle pressed={incognito} onPressedChange={actions.setIncognito} className="ml-1 hidden @lg:inline-flex" />
      <IncognitoToggle pressed={incognito} onPressedChange={actions.setIncognito} label="" className="@lg:hidden" />
      <DeleteChatDialog chatId={confirm && kept ? kept.id : null} title={kept?.title ?? ''} onClose={() => setConfirm(false)} onDeleted={onDeleted} />
    </header>
  )
}

function MessageList({ chat, openArtifactId, mentions }: { chat: Chat; openArtifactId: string | null; mentions: RegExp | null }) {
  const last = chat.messages.length - 1
  return (
    <ChatThread resetKey={chat.id} count={chat.messages.length} follow={chat.messages}>
      {chat.messages.map((message, i) => (message.role === 'user'
        ? <UserMessageView key={message.id} chatId={chat.id} message={message} mentions={mentions} />
        : (
          <AssistantMessageView
            key={message.id}
            chatId={chat.id}
            message={message}
            isLast={i === last}
            openArtifactId={openArtifactId}
          />
        )))}
    </ChatThread>
  )
}

function Greeting({ project, projects, modes, incognito, focusKey }: {
  project: Project | null
  projects: Project[]
  modes: Modes
  incognito: boolean
  focusKey: number
}) {
  const actions = useActions()
  return (
    <ChatWelcome
      icon={incognito ? IncognitoIcon : undefined}
      title={incognito ? 'Incognito chat' : <>{greeting()}, {USER.first}</>}
      headingAs="h3"
      description={incognito
        ? "This chat isn't saved to your chats, and it's deleted when you leave it."
        : project
          ? <>New chat in <span className="text-foreground font-medium">{project.name}</span>. Replies follow its instructions and files.</>
          : 'Ask about jobs, drivers and customers. Every reply is scripted in your browser, so start with a card below.'}
      starters={(
        <PromptStarters
          items={STARTERS.map((starter) => ({
            id: starter.title, icon: starter.icon, title: starter.title, hint: starter.hint,
            onSelect: () => actions.send(starter.prompt, []),
          }))}
        />
      )}
    >
      <PromptBox running={false} modes={modes} projects={projects} focusKey={focusKey} />
    </ChatWelcome>
  )
}

export const Conversation = memo(function Conversation({
  chat, project, projects, model, modes, running, incognito, openArtifactId, hasArtifacts, sidebarToggle, focusKey,
  mentions, onOpenArtifacts, onDeleted,
}: {
  chat: Chat | null
  project: Project | null
  projects: Project[]
  model: ModelId
  modes: Modes
  running: boolean
  incognito: boolean
  openArtifactId: string | null
  hasArtifacts: boolean
  sidebarToggle: ReactNode
  focusKey: number
  mentions: RegExp | null
  onOpenArtifacts: () => void
  onDeleted: () => void
}) {
  return (
    <div className="@container flex min-h-0 min-w-0 flex-1 flex-col">
      <Header
        chat={chat}
        project={project}
        projects={projects}
        model={model}
        incognito={incognito}
        sidebarToggle={sidebarToggle}
        hasArtifacts={hasArtifacts}
        onOpenArtifacts={onOpenArtifacts}
        onDeleted={onDeleted}
      />
      {chat && chat.messages.length ? (
        <>
          <MessageList chat={chat} openArtifactId={openArtifactId} mentions={mentions} />
          <div className="mx-auto w-full max-w-3xl min-w-0 px-4 pb-3">
            {chat.temporary && (
              <p className="text-muted-foreground mb-2 flex items-center justify-center gap-1.5 text-[11px]">
                <HugeiconsIcon icon={IncognitoIcon} strokeWidth={2} className="size-3" />
                Incognito: this chat isn't saved, and is deleted when you leave it.
              </p>
            )}
            <PromptBox
              key={chat.id}
              running={running}
              modes={modes}
              projects={projects}
              focusKey={focusKey}
              placeholder={running ? 'The agent is working. Press Stop to interrupt.' : 'Reply, @ to mention, / for commands'}
            />
          </div>
        </>
      ) : (
        <Greeting project={project} projects={projects} modes={modes} incognito={incognito} focusKey={focusKey} />
      )}
    </div>
  )
})
