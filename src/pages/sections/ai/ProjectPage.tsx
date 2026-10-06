import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, BubbleChatIcon, Cancel01Icon, Delete02Icon, Edit02Icon, Folder01Icon, MoreHorizontalIcon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons'
import { DeleteConfirm } from '@/components/delete-confirm'
import { fileIcon } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription } from '@/components/ui/empty'
import { Textarea } from '@/components/ui/textarea'
import { formatFileSize } from '@/lib/format'
import { useActions } from './context'
import { formatWhen, toFileRef } from './data'
import type { ChatSummary } from './Sidebar'
import type { Project } from './types'

const MAX_INSTRUCTIONS = 1000

function Block({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-2">
      <div className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-xs font-medium">{title}</h4>
          {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ProjectPage({ project, chats, sidebarToggle }: {
  project: Project
  chats: ChatSummary[]
  sidebarToggle: ReactNode
}) {
  const actions = useActions()
  const [confirm, setConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const renaming = useRef(false)
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="@container flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {sidebarToggle}
        <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="ml-1 size-4 shrink-0" style={{ color: project.colour }} />
        <span className="min-w-0 flex-1 truncate px-1 text-xs font-medium">{project.name || 'Untitled project'}</span>
        <Button size="sm" onClick={() => actions.newChat(project.id)}>
          <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
          New chat
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Project options" className="text-muted-foreground">
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            onCloseAutoFocus={(e) => {
              if (!renaming.current) return
              renaming.current = false
              e.preventDefault()
              nameRef.current?.select()
            }}
          >
            <DropdownMenuItem onSelect={() => { renaming.current = true }}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-2xl min-w-0 gap-7 px-4 py-6">
          <div className="grid gap-1">
            <input
              ref={nameRef}
              aria-label="Project name"
              placeholder="Project name"
              value={project.name}
              onChange={(e) => actions.patchProject(project.id, { name: e.target.value })}
              className="placeholder:text-muted-foreground w-full min-w-0 bg-transparent text-lg font-semibold tracking-tight outline-none"
            />
            <textarea
              rows={1}
              aria-label="Description"
              placeholder="Add a description…"
              value={project.description}
              onChange={(e) => actions.patchProject(project.id, { description: e.target.value })}
              className="placeholder:text-muted-foreground text-muted-foreground field-sizing-content block w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none"
            />
          </div>

          <Block title="Custom instructions" hint="The assistant follows these in every chat in this project.">
            <Textarea
              aria-label="Custom instructions"
              placeholder="For example: keep answers short, and use tables for numbers."
              maxLength={MAX_INSTRUCTIONS}
              value={project.instructions}
              onChange={(e) => actions.patchProject(project.id, { instructions: e.target.value })}
              className="min-h-24 text-[13px]"
            />
            <span className="text-muted-foreground justify-self-end text-[11px] tabular-nums">
              {project.instructions.length} / {MAX_INSTRUCTIONS}
            </span>
          </Block>

          <Block
            title="Knowledge"
            hint="Files the assistant can search here. They stay in this browser only."
            action={(
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                Add files
              </Button>
            )}
          >
            {project.files.length ? (
              <ul className="divide-y rounded-lg border">
                {project.files.map((file) => (
                  <li key={file.id} className="flex h-10 min-w-0 items-center gap-2.5 pr-1.5 pl-3 text-xs">
                    <span className="bg-muted grid size-6 shrink-0 place-items-center rounded">
                      <HugeiconsIcon icon={fileIcon(file.name)} strokeWidth={2} className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{formatFileSize(file.size)}</span>
                    <IconAction
                      label={`Remove ${file.name}`}
                      icon={Cancel01Icon}
                      onClick={() => actions.removeProjectFile(project.id, file.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty className="gap-2 rounded-lg border px-3 py-5">
                <EmptyDescription>No files yet. Add PDFs, sheets or notes for the assistant to search.</EmptyDescription>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                    Add files
                  </Button>
                </EmptyContent>
              </Empty>
            )}
            <input
              ref={fileRef}
              type="file"
              multiple
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) actions.addProjectFiles(project.id, Array.from(e.target.files).map(toFileRef))
                e.target.value = ''
              }}
            />
          </Block>

          <Block title={`Chats · ${sorted.length}`}>
            {sorted.length ? (
              <ul className="divide-y rounded-lg border">
                {sorted.map((chat) => (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => actions.openChat(chat.id)}
                      className="hover:bg-accent/60 focus-visible:bg-accent flex h-10 w-full min-w-0 items-center gap-2.5 px-3 text-left text-xs outline-none"
                    >
                      <HugeiconsIcon
                        icon={chat.icon ?? BubbleChatIcon}
                        strokeWidth={2}
                        className="text-muted-foreground size-3.5 shrink-0"
                        style={{ color: chat.iconColour }}
                      />
                      <span className="min-w-0 flex-1 truncate">{chat.title}</span>
                      <span className="text-muted-foreground shrink-0 text-[11px]">{formatWhen(chat.updatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty className="gap-2 rounded-lg border px-3 py-5">
                <EmptyDescription>No chats in this project yet.</EmptyDescription>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={() => actions.newChat(project.id)}>
                    <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
                    Start one
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </Block>
        </div>
      </div>

      <DeleteConfirm
        open={confirm}
        onOpenChange={setConfirm}
        icon={null}
        title={`Delete “${project.name || 'Untitled project'}”?`}
        description={`Its instructions and files are removed. Its ${chats.length === 1 ? 'chat moves' : `${chats.length} chats move`} to your history.`}
        onConfirm={() => actions.deleteProject(project.id)}
      />
    </div>
  )
}
