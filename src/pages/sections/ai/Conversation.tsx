import { memo, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon, ArrowDown02Icon, Download01Icon, Folder01Icon, MoreHorizontalIcon, PanelRightOpenIcon,
  Share08Icon, SparklesIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useActions } from './context'
import { DEFAULT_MODEL, MODELS, STARTERS, USER, greeting, modelById } from './data'
import { copyToClipboard } from './helpers'
import { AssistantMessageView, IconAction, UserMessageView } from './Message'
import { PromptBox } from './PromptBox'
import { ChatMenuItems, DROPDOWN_KIT, DeleteChatDialog, RenameInput } from './Sidebar'
import type { Chat, ModelId, Modes, Project } from './types'

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

export function ModelPicker({ value, onChange }: { value: ModelId; onChange: (model: ModelId) => void }) {
  const model = modelById(value)
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={`Model: ${model.name}`} className="max-w-40 gap-1 px-1.5">
              <HugeiconsIcon icon={model.icon} strokeWidth={2} data-icon="inline-start" />
              <span className="hidden truncate @md:inline">{model.name}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Choose a model</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Model · made up for this demo</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as ModelId)}>
          {MODELS.map((m) => (
            <DropdownMenuRadioItem key={m.id} value={m.id} className="items-start py-2">
              <HugeiconsIcon icon={m.icon} strokeWidth={2} className="mt-0.5" />
              <span className="grid min-w-0 gap-1">
                <span className="flex items-center gap-1.5 font-medium">
                  {m.name}
                  {m.badge && <Badge className="h-4 px-1.5">{m.badge}</Badge>}
                  {m.id === DEFAULT_MODEL && <span className="text-muted-foreground text-[10px] font-normal">Default</span>}
                </span>
                <span className="text-muted-foreground text-[11px] leading-4">{m.description}</span>
                <span className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                  <Meter label="Speed" value={m.speed} />
                  <Meter label="Quality" value={m.quality} />
                  <span>~{Math.round(m.thinkMs / 1000)}s thinking</span>
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ProjectChip({ project }: { project: Project }) {
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

function Header({ chat, project, projects, model, sidebarToggle, hasArtifacts, onOpenArtifacts, onDeleted }: {
  chat: Chat | null
  project: Project | null
  projects: Project[]
  model: ModelId
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

  function share() {
    if (!chat) return
    copyToClipboard(`https://share.example.com/c/${chat.id}`)
    toast('Share link copied', { description: `share.example.com/c/${chat.id} · demo only` })
  }

  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
      {sidebarToggle}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {chat && renaming ? (
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
      <ModelPicker value={model} onChange={actions.setModel} />
      {hasArtifacts && <IconAction label="Artifacts" icon={PanelRightOpenIcon} onClick={onOpenArtifacts} />}
      {chat && <IconAction label="Share" icon={Share08Icon} onClick={share} className="hidden @sm:inline-flex" />}
      {chat && (
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
              kit={DROPDOWN_KIT}
              chat={chat}
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
                  <DropdownMenuItem onSelect={() => actions.exportChat(chat.id)}>
                    <HugeiconsIcon icon={Download01Icon} strokeWidth={2} /> Export as Markdown
                  </DropdownMenuItem>
                </>
              )}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <DeleteChatDialog chatId={confirm && chat ? chat.id : null} title={chat?.title ?? ''} onClose={() => setConfirm(false)} onDeleted={onDeleted} />
    </header>
  )
}

function MessageList({ chat, openArtifactId, mentions }: { chat: Chat; openArtifactId: string | null; mentions: RegExp | null }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const [atBottom, setAtBottom] = useState(true)
  const count = chat.messages.length

  const toBottom = () => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // A new chat, or a new message: go to the end.
  useLayoutEffect(() => {
    stick.current = true
    setAtBottom(true)
    toBottom()
  }, [chat.id, count])

  // Streaming: follow the text only while the reader is at the end.
  useLayoutEffect(() => {
    if (stick.current) toBottom()
  }, [chat.messages])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      if (stick.current) toBottom()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48
    stick.current = near
    setAtBottom(near)
  }

  const last = chat.messages.length - 1
  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto [overflow-anchor:none]">
        <div className="mx-auto grid max-w-3xl min-w-0 gap-6 px-4 pt-5 pb-8">
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
        </div>
      </div>
      {!atBottom && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            stick.current = true
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          }}
          className="bg-card hover:bg-accent animate-in fade-in-0 slide-in-from-bottom-1 absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
        >
          <HugeiconsIcon icon={ArrowDown02Icon} strokeWidth={2} data-icon="inline-start" />
          Jump to latest
        </Button>
      )}
    </div>
  )
}

function Greeting({ project, projects, modes, focusKey }: { project: Project | null; projects: Project[]; modes: Modes; focusKey: number }) {
  const actions = useActions()
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="m-auto grid w-full max-w-2xl min-w-0 gap-5 px-4 py-8">
        <div className="grid justify-items-center gap-2 text-center">
          <span className="bg-brand/10 text-brand grid size-10 place-items-center rounded-xl">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-5" />
          </span>
          <h3 className="text-xl font-semibold tracking-tight">{greeting()}, {USER.first}</h3>
          <p className="text-muted-foreground max-w-md text-[13px]">
            {project
              ? <>New chat in <span className="text-foreground font-medium">{project.name}</span>. Replies follow its instructions and files.</>
              : 'Ask about jobs, drivers and customers. Every reply is scripted in your browser, so start with a card below.'}
          </p>
        </div>
        <PromptBox running={false} modes={modes} projects={projects} focusKey={focusKey} />
        <div className="grid grid-cols-1 gap-2 @xl:grid-cols-2">
          {STARTERS.map((starter) => (
            <button
              key={starter.title}
              type="button"
              onClick={() => actions.send(starter.prompt, [])}
              className="hover:bg-accent/60 focus-visible:ring-ring/30 flex min-w-0 items-start gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-2"
            >
              <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-md">
                <HugeiconsIcon icon={starter.icon} strokeWidth={2} className="size-3.5" />
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="text-xs font-medium">{starter.title}</span>
                <span className="text-muted-foreground text-[11px]">{starter.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export const Conversation = memo(function Conversation({
  chat, project, projects, model, modes, running, openArtifactId, hasArtifacts, sidebarToggle, focusKey, mentions,
  onOpenArtifacts, onDeleted,
}: {
  chat: Chat | null
  project: Project | null
  projects: Project[]
  model: ModelId
  modes: Modes
  running: boolean
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
        sidebarToggle={sidebarToggle}
        hasArtifacts={hasArtifacts}
        onOpenArtifacts={onOpenArtifacts}
        onDeleted={onDeleted}
      />
      {chat && chat.messages.length ? (
        <>
          <MessageList chat={chat} openArtifactId={openArtifactId} mentions={mentions} />
          <div className="mx-auto w-full max-w-3xl min-w-0 px-4 pb-3">
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
        <Greeting project={project} projects={projects} modes={modes} focusKey={focusKey} />
      )}
    </div>
  )
})
