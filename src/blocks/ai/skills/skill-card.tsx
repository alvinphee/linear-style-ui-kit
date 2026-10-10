import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Building03Icon, Copy01Icon, Delete02Icon, Download04Icon, MoreHorizontalIcon, PencilEdit02Icon, PuzzleIcon,
  SparklesIcon, UserIcon, ViewIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { IconMark } from '@/components/mark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { slug } from '@/lib/text'

// A skill as an assistant's settings show one: its mark, name, the line that
// says when to use it, where it comes from, an on/off switch and a menu.
// A skill is a packaged set of instructions (and files) the assistant loads
// only when a task needs it; the description is what it reads to decide.
// Built-in skills come with the product and organisation skills from an
// admin, so only your own can be edited or deleted. The whole card opens
// the skill (onView); the switch and menu sit above that.

// Where a skill comes from.
export type SkillSource = 'builtin' | 'yours' | 'organisation'

// A file packaged with a skill: a template, an example, a reference.
export type SkillFile = { name: string; size: number }

export type Skill = {
  id: string
  name: string
  // When to use it, in a line. The assistant reads this to decide whether to load it.
  description: string
  // The body of its SKILL.md, in Markdown.
  instructions: string
  source: SkillSource
  enabled: boolean
  icon?: IconSvgElement
  // A CSS colour for the mark. Defaults to one per source.
  colour?: string
  files?: SkillFile[]
  // Who wrote it, for an organisation skill: "Operations team".
  author?: string
  updatedAt?: number
  // Where it is turned on beyond every chat: projects, agents.
  usedIn?: string[]
}

export const SKILL_SOURCES: Record<SkillSource, { label: string; icon: IconSvgElement; colour: string }> = {
  builtin: { label: 'Built-in', icon: SparklesIcon, colour: 'var(--brand)' },
  yours: { label: 'Yours', icon: UserIcon, colour: 'var(--chart-2)' },
  organisation: { label: 'Organisation', icon: Building03Icon, colour: 'var(--chart-4)' },
}

// Only your own skills can be changed.
export const canEditSkill = (skill: Pick<Skill, 'source'>) => skill.source === 'yours'

// A skill as its SKILL.md: YAML front matter with its name and description,
// then the instructions. What Download saves.
export function toSkillMd(skill: Pick<Skill, 'name' | 'description' | 'instructions'>) {
  const description = skill.description.replace(/\s+/g, ' ').trim()
  return `---\nname: ${slug(skill.name, { fallback: 'skill' })}\ndescription: ${description}\n---\n\n${skill.instructions.trim()}\n`
}

// The other way: a SKILL.md's name, description and body. A name written as
// "meeting-minutes" comes back as "Meeting minutes". No front matter: all body.
export function parseSkillMd(text: string): { name?: string; description?: string; instructions: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!match) return { instructions: text.trim() }
  const fields: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(':')
    if (at > 0) fields[line.slice(0, at).trim().toLowerCase()] = line.slice(at + 1).trim().replace(/^["']|["']$/g, '')
  }
  return {
    name: fields.name ? humanise(fields.name) : undefined,
    description: fields.description || undefined,
    instructions: text.slice(match[0].length).trim(),
  }
}

// "meeting-minutes.md" → "Meeting minutes".
export function humanise(name: string) {
  const words = name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim()
  return words ? words[0].toUpperCase() + words.slice(1) : ''
}

export function SkillSourceBadge({ source, className }: { source: SkillSource; className?: string }) {
  const s = SKILL_SOURCES[source]
  return (
    <Badge variant="outline" className={cn('text-muted-foreground font-normal', className)}>
      <HugeiconsIcon icon={s.icon} strokeWidth={2} data-icon="inline-start" />
      {s.label}
    </Badge>
  )
}

// The skill's mark: its icon on a tint of its colour, greyed while it is off.
export function SkillMark({ skill, size = 'md', className }: {
  skill: Pick<Skill, 'icon' | 'colour' | 'source' | 'enabled'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <IconMark
      icon={skill.icon ?? PuzzleIcon}
      colour={skill.colour ?? SKILL_SOURCES[skill.source].colour}
      size={size}
      className={cn(!skill.enabled && 'opacity-50 grayscale', className)}
    />
  )
}

export function SkillCard({ skill, onToggle, onView, onEdit, onDuplicate, onDownload, onDelete, meta, className }: {
  skill: Skill
  onToggle?: (enabled: boolean) => void
  onView?: () => void
  // Edit and Delete show for your own skills only.
  onEdit?: () => void
  onDuplicate?: () => void
  onDownload?: () => void
  onDelete?: () => void
  // Beside the source badge, such as "3 files" or "Updated 5 Oct".
  meta?: string
  className?: string
}) {
  const own = canEditSkill(skill)
  const edit = own ? onEdit : undefined
  const remove = own ? onDelete : undefined
  const hasMenu = onView || edit || onDuplicate || onDownload || remove

  return (
    <article
      data-enabled={skill.enabled || undefined}
      className={cn(
        'bg-card relative flex min-w-0 flex-col gap-2.5 rounded-lg border p-3 transition-colors',
        onView && 'hover:bg-accent/40 has-[[data-view]:focus-visible]:ring-ring/40 has-[[data-view]:focus-visible]:ring-2',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <SkillMark skill={skill} />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h3 className="min-w-0 truncate text-[13px] font-medium">
            {onView ? (
              <button type="button" data-view onClick={onView} className="outline-none after:absolute after:inset-0 after:rounded-lg">
                {skill.name}
              </button>
            ) : skill.name}
          </h3>
          <p className={cn('text-muted-foreground line-clamp-2 text-xs', !skill.enabled && 'opacity-80')}>{skill.description}</p>
        </div>
        {(onToggle || hasMenu) && (
          <div className="relative z-10 -mt-0.5 -mr-1 flex shrink-0 items-center gap-1">
            {onToggle && (
              <Switch size="sm" checked={skill.enabled} onCheckedChange={onToggle} aria-label={`Use ${skill.name}`} className="mx-1.5" />
            )}
            {hasMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs" aria-label={`More actions for ${skill.name}`} className="text-muted-foreground">
                    <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {onView && <DropdownMenuItem onSelect={onView}><HugeiconsIcon icon={ViewIcon} strokeWidth={2} />View</DropdownMenuItem>}
                  {edit && <DropdownMenuItem onSelect={edit}><HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />Edit</DropdownMenuItem>}
                  {onDuplicate && <DropdownMenuItem onSelect={onDuplicate}><HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />Duplicate</DropdownMenuItem>}
                  {onDownload && <DropdownMenuItem onSelect={onDownload}><HugeiconsIcon icon={Download04Icon} strokeWidth={2} />Download</DropdownMenuItem>}
                  {remove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={remove}><HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />Delete</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
      <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        <SkillSourceBadge source={skill.source} />
        {skill.source === 'organisation' && skill.author && <span className="min-w-0 truncate">{skill.author}</span>}
        {meta && <span className="min-w-0 truncate">{meta}</span>}
      </div>
    </article>
  )
}
