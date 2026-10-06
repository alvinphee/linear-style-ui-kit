import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SentIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { LabelChip } from '@/components/label-dot'
import { Person, UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Textarea } from '@/components/ui/textarea'
import { LABEL_BY_ID, PRIORITY, STATUS, type Priority, type Status } from '../data'
import { Panel, Section } from './shared'

const INBOX: {
  id: string
  from: string
  title: string
  preview: string
  time: string
  unread: boolean
  status: Status
  priority: Priority
  labels: string[]
}[] = [
  {
    id: 'ORB-214', from: 'Mei Ling', title: 'Review the onboarding emails', time: '2m', unread: true,
    preview: 'Can you look at the welcome email copy before Friday? The second email feels long.',
    status: 'progress', priority: 'high', labels: ['key'],
  },
  {
    id: 'ORB-209', from: 'Daniel', title: 'Billing page crashes on Safari', time: '1h', unread: true,
    preview: 'Stack trace attached. It only happens when the card form loads twice.',
    status: 'todo', priority: 'urgent', labels: ['fragile'],
  },
  {
    id: 'ORB-198', from: 'Siti', title: 'Q4 roadmap draft', time: '3h', unread: false,
    preview: 'First pass is in the doc. Comments welcome, especially on the analytics theme.',
    status: 'todo', priority: 'medium', labels: ['export'],
  },
  {
    id: 'ORB-190', from: 'Ravi', title: 'Raise API rate limits for teams', time: 'Mon', unread: false,
    preview: 'Two customers hit the limit during imports. Proposal: 600 requests a minute.',
    status: 'backlog', priority: 'low', labels: [],
  },
  {
    id: 'ORB-176', from: 'Ali', title: 'Design review notes', time: 'Fri', unread: false,
    preview: 'Notes from Thursday. The settings layout is approved, the sidebar needs another pass.',
    status: 'done', priority: 'none', labels: ['oversize'],
  },
]

function ResizablePanesPanel() {
  const [selectedId, setSelectedId] = useState(INBOX[0].id)
  const item = INBOX.find((i) => i.id === selectedId) ?? INBOX[0]

  return (
    <Panel title="Resizable panes" note="ResizablePanelGroup, drag or use arrow keys on a handle" wide>
      <div className="h-72 overflow-hidden rounded-md border">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="30%" minSize="18%">
            <div className="flex h-full min-w-0 flex-col">
              <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b px-2.5">
                <span className="text-xs font-medium">Inbox</span>
                <span className="text-muted-foreground text-[11px] tabular-nums">{INBOX.filter((i) => i.unread).length} new</span>
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {INBOX.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      aria-current={i.id === selectedId ? 'true' : undefined}
                      onClick={() => setSelectedId(i.id)}
                      className={cn(
                        'hover:bg-accent focus-visible:ring-ring/30 grid w-full min-w-0 gap-0.5 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2',
                        i.id === selectedId && 'bg-accent',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        {i.unread && <span aria-label="Unread" className="bg-brand size-1.5 shrink-0 rounded-full" />}
                        <span className="truncate text-xs font-medium">{i.from}</span>
                        <span className="text-muted-foreground ml-auto shrink-0 text-[10px]">{i.time}</span>
                      </span>
                      <span className="text-muted-foreground truncate text-[11px]">{i.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="45%" minSize="25%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="68%" minSize="30%">
                <article className="h-full min-w-0 overflow-y-auto p-3">
                  <div className="text-muted-foreground mb-1 flex min-w-0 items-center gap-1.5 text-[11px]">
                    <UserAvatar name={item.from} className="size-4" />
                    <span className="truncate">{item.from} · {item.time}</span>
                  </div>
                  <h4 className="mb-2 text-sm font-medium tracking-tight">{item.title}</h4>
                  <p className="text-muted-foreground text-xs/relaxed">{item.preview}</p>
                  <p className="text-muted-foreground mt-2 text-xs/relaxed">
                    Reply here or open the issue to see the full thread, linked pull requests and activity.
                  </p>
                </article>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="32%" minSize="22%">
                <form
                  className="flex h-full min-w-0 flex-col gap-2 p-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    toast('Reply sent', { description: 'Demo only.' })
                  }}
                >
                  <Textarea aria-label="Reply" placeholder="Write a reply…" className="min-h-0 flex-1 field-sizing-fixed" />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm">
                      <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" />
                      Reply
                    </Button>
                  </div>
                </form>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="25%" minSize="18%">
            <aside className="h-full min-w-0 overflow-y-auto p-3">
              <p className="text-muted-foreground mb-2 text-[11px] font-medium tabular-nums">{item.id}</p>
              <dl className="grid gap-2.5 text-xs">
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-[11px]">Status</dt>
                  <dd className="flex min-w-0 items-center gap-1.5">
                    <StatusIcon status={item.status} />
                    <span className="truncate">{STATUS[item.status].label}</span>
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-[11px]">Priority</dt>
                  <dd className="flex min-w-0 items-center gap-1.5">
                    <PriorityIcon priority={item.priority} />
                    <span className="truncate">{PRIORITY[item.priority].label}</span>
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-[11px]">Reporter</dt>
                  <dd className="min-w-0">
                    <Person name={item.from} className="gap-1.5" avatarClassName="size-4" />
                  </dd>
                </div>
                {item.labels.length > 0 && (
                  <div className="grid gap-1">
                    <dt className="text-muted-foreground text-[11px]">Labels</dt>
                    <dd className="flex min-w-0 flex-wrap gap-1">
                      {item.labels.map((id) => (
                        <LabelChip key={id} name={LABEL_BY_ID[id].name} colour={LABEL_BY_ID[id].colour} className="text-foreground" />
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Panel>
  )
}

export default function ResizableSection() {
  return (
    <Section id="resizable" title="Resizable panes" description="Panes side by side, with a handle to drag between them">
      <ResizablePanesPanel />
    </Section>
  )
}
