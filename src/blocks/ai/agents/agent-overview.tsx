import { useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AiBrain02Icon, ArrowRight01Icon, BubbleChatIcon, Database01Icon, Plug01Icon, PuzzleIcon, TextAlignLeftIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Markdown } from '@/blocks/markdown'
import { fileIcon } from '@/components/file-chip'
import { IconMark } from '@/components/mark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/format'
import { describeTrigger, TRIGGER_ICONS } from './agent-card'
import type { Agent, ToolPermission } from './agent-types'

// An agent's Overview tab: what it is for, its conversation starters as
// cards (one click starts a chat), what starts it (its triggers), and a
// "What it uses" panel: the instructions (an excerpt, Show all for the
// rest), its knowledge (files and knowledge bases), its connectors with how
// many tools each and whether any asks first, its skills and its model. The
// app puts recent runs in the `recent` slot.
//
// Names come from the app (`connectors`, `skills`, `bases`), so the block
// holds no sample data; an id the app does not know shows as unavailable.

type Named = { id: string; name: string }

export type AgentOverviewProps = {
  agent: Agent
  // A conversation starter was picked: start a chat with it.
  onStarter: (text: string) => void
  // Start an empty chat with the agent.
  onChat: () => void
  connectors?: (Named & { icon?: IconSvgElement; colour?: string })[]
  skills?: Named[]
  bases?: Named[]
  // The model's name. "Your default model" when left out.
  modelName?: string
  // Recent runs, from the app. Left out: no Recent runs section.
  recent?: ReactNode
  recentTitle?: string
  className?: string
}

function Block({ title, hint, children, className }: {
  title: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('grid min-w-0 content-start gap-2', className)}>
      <div className="min-w-0">
        <h3 className="text-xs font-medium">{title}</h3>
        {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

// One part of "What it uses": a label with an icon over its list.
function Uses({ icon, label, children }: { icon: IconSvgElement; label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5 px-3 py-2.5">
      <h4 className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 shrink-0" />
        {label}
      </h4>
      {children}
    </div>
  )
}

const None = ({ children }: { children: ReactNode }) => <p className="text-muted-foreground text-xs">{children}</p>

// The tools a connector may use, and the strictest permission among them.
export function connectorAccess(tools: Record<string, ToolPermission>) {
  const on = Object.values(tools).filter((p) => p !== 'off')
  const asks = on.filter((p) => p === 'ask').length
  return { tools: on.length, asks, strictest: (asks ? 'ask' : on.length ? 'always' : 'off') as ToolPermission }
}

export function AgentOverview({
  agent, onStarter, onChat, connectors = [], skills = [], bases = [], modelName, recent, recentTitle = 'Recent runs',
  className,
}: AgentOverviewProps) {
  const [showAll, setShowAll] = useState(false)
  const instructionsId = useId()
  const long = agent.instructions.length > 280
  const connectorIds = Object.keys(agent.connectors)
  const connectorName = (id: string) => connectors.find((c) => c.id === id)?.name

  return (
    <div className={cn('@container min-w-0', className)}>
      <div className="grid grid-cols-1 gap-7 @3xl:grid-cols-[minmax(0,1fr)_18rem] @3xl:gap-6">
        <div className="grid min-w-0 content-start gap-7">
          <p className="text-muted-foreground text-[13px] leading-relaxed">{agent.description}</p>

          <Block title="Conversation starters" hint="Pick one to start a chat with this agent.">
            {agent.starters.length ? (
              <ul className="grid grid-cols-1 gap-2 @md:grid-cols-2">
                {agent.starters.map((text) => (
                  <li key={text} className="grid min-w-0">
                    <button
                      type="button"
                      onClick={() => onStarter(text)}
                      className="bg-card hover:bg-accent/40 hover:border-foreground/15 focus-visible:ring-ring/40 group/starter flex min-w-0 items-start gap-2.5 rounded-lg border p-3 text-left text-xs leading-relaxed outline-none transition-colors focus-visible:ring-2"
                    >
                      <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                      <span className="min-w-0 flex-1">{text}</span>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                        aria-hidden
                        className="text-muted-foreground mt-0.5 size-3.5 shrink-0 opacity-0 transition-opacity group-hover/starter:opacity-100 group-focus-visible/starter:opacity-100"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-3">
                <None>No conversation starters.</None>
                <Button variant="outline" size="sm" onClick={onChat} className="ml-auto">
                  <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} data-icon="inline-start" />
                  Start a chat
                </Button>
              </div>
            )}
          </Block>

          <Block title="Triggers" hint="What starts a run. Each run can stop to ask before it acts.">
            <ul className="divide-y rounded-lg border">
              {(agent.triggers.length ? agent.triggers : [{ id: 'manual', kind: 'manual' as const, enabled: true }]).map((t) => (
                <li key={t.id} className="flex min-w-0 items-center gap-2.5 px-3 py-2.5 text-xs">
                  <span className="bg-muted grid size-6 shrink-0 place-items-center rounded">
                    <HugeiconsIcon icon={TRIGGER_ICONS[t.kind]} strokeWidth={2} className="size-3.5" />
                  </span>
                  <span className={cn('min-w-0 flex-1', !t.enabled && 'text-muted-foreground')}>
                    {describeTrigger(t, t.kind === 'event' ? connectorName(t.connectorId) : undefined, { long: true })}
                  </span>
                  {!t.enabled && <Badge variant="outline" className="text-muted-foreground">Paused</Badge>}
                </li>
              ))}
            </ul>
          </Block>

          {recent && <Block title={recentTitle}>{recent}</Block>}
        </div>

        <aside aria-label="What it uses" className="grid min-w-0 content-start gap-2">
          <h3 className="text-xs font-medium">What it uses</h3>
          <div className="bg-card divide-y rounded-lg border">
            <Uses icon={TextAlignLeftIcon} label="Instructions">
              {agent.instructions.trim() ? (
                <>
                  <div
                    id={instructionsId}
                    className={cn(
                      'min-w-0 text-xs [&_h1]:text-xs [&_h2]:text-xs [&_h3]:text-xs',
                      long && !showAll && 'max-h-28 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]',
                    )}
                  >
                    <Markdown text={agent.instructions} />
                  </div>
                  {long && (
                    <Button
                      variant="link"
                      size="xs"
                      aria-expanded={showAll}
                      aria-controls={instructionsId}
                      onClick={() => setShowAll((v) => !v)}
                      className="h-auto justify-self-start p-0 text-[11px]"
                    >
                      {showAll ? 'Show less' : 'Show all'}
                    </Button>
                  )}
                </>
              ) : (
                <None>No instructions yet.</None>
              )}
            </Uses>

            <Uses icon={Database01Icon} label="Knowledge">
              {agent.files.length || agent.knowledgeBases.length ? (
                <ul className="grid min-w-0 gap-1">
                  {agent.knowledgeBases.map((id) => {
                    const base = bases.find((b) => b.id === id)
                    return (
                      <li key={id} className="flex min-w-0 items-center gap-2 text-xs">
                        <HugeiconsIcon icon={Database01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                        <span className={cn('min-w-0 flex-1 truncate', !base && 'text-muted-foreground')}>
                          {base?.name ?? 'Knowledge base not available'}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-[11px]">Knowledge base</span>
                      </li>
                    )
                  })}
                  {agent.files.map((file) => (
                    <li key={file.id} className="flex min-w-0 items-center gap-2 text-xs">
                      <HugeiconsIcon icon={fileIcon(file.name)} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{file.name}</span>
                      <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{formatFileSize(file.size)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <None>No files or knowledge bases.</None>
              )}
            </Uses>

            <Uses icon={Plug01Icon} label="Connectors">
              {connectorIds.length ? (
                <ul className="grid min-w-0 gap-1.5">
                  {connectorIds.map((id) => {
                    const connector = connectors.find((c) => c.id === id)
                    const use = connectorAccess(agent.connectors[id])
                    return (
                      <li key={id} className="flex min-w-0 items-center gap-2 text-xs">
                        {connector?.icon ? (
                          <IconMark icon={connector.icon} colour={connector.colour ?? 'var(--muted-foreground)'} size="sm" />
                        ) : (
                          <HugeiconsIcon icon={Plug01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                        )}
                        <span className={cn('min-w-0 flex-1 truncate', !connector && 'text-muted-foreground')}>
                          {connector?.name ?? 'Connector not available'}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                          {use.tools} {use.tools === 1 ? 'tool' : 'tools'}
                        </span>
                        {use.strictest === 'ask' && (
                          <Badge variant="outline" title={`${use.asks} of its tools ask before they act`}>Asks first</Badge>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <None>No connectors.</None>
              )}
            </Uses>

            <Uses icon={PuzzleIcon} label="Skills">
              {agent.skills.length ? (
                <ul className="flex min-w-0 flex-wrap gap-1">
                  {agent.skills.map((id) => (
                    <li key={id} className="min-w-0">
                      <Badge variant="secondary" className="max-w-full">
                        <span className="truncate">{skills.find((s) => s.id === id)?.name ?? 'Skill not available'}</span>
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <None>No skills.</None>
              )}
            </Uses>

            <Uses icon={AiBrain02Icon} label="Model">
              <p className="text-xs">{modelName ?? 'Your default model'}</p>
            </Uses>
          </div>
        </aside>
      </div>
    </div>
  )
}
