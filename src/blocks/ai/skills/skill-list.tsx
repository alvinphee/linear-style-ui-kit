import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PuzzleIcon, Upload04Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { plural } from '@/lib/text'
import { SKILL_SOURCES, SkillCard, type Skill, type SkillSource } from './skill-card'

// Every skill on one page: a search over names and descriptions, filter
// chips (All, On, then each source, with counts that follow the search) and
// the skill cards, one column when narrow and two once its own box is wide
// enough (@container). Create and Upload are the caller's: a dialog each.
// With no skills at all it says so and offers them; with no match, a way
// back to every skill.

export type SkillFilter = 'all' | 'on' | SkillSource

const FILTERS: { value: SkillFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'on', label: 'On' },
  ...(Object.keys(SKILL_SOURCES) as SkillSource[]).map((s) => ({ value: s, label: SKILL_SOURCES[s].label })),
]

const matches = (skill: Skill, filter: SkillFilter) =>
  filter === 'all' || (filter === 'on' ? skill.enabled : skill.source === filter)

export function SkillList({
  skills, onToggle, onView, onEdit, onDuplicate, onDownload, onDelete, onCreate, onUpload, actionsIn = 'toolbar',
  metaOf, emptyText = 'Skills teach the assistant how to do a task your way. Create one, or upload a SKILL.md.', className,
}: {
  skills: Skill[]
  onToggle?: (id: string, enabled: boolean) => void
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDownload?: (id: string) => void
  onDelete?: (id: string) => void
  onCreate?: () => void
  onUpload?: () => void
  // Where Create and Upload show: in the toolbar and the empty state, or
  // only in the empty state when the page header already has them.
  actionsIn?: 'toolbar' | 'empty'
  // A short note on each card, such as "2 files".
  metaOf?: (skill: Skill) => string | undefined
  emptyText?: ReactNode
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SkillFilter>('all')

  const q = query.trim().toLowerCase()
  const found = q
    ? skills.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    : skills
  const shown = found.filter((s) => matches(s, filter))
  const count = (f: SkillFilter) => found.filter((s) => matches(s, f)).length

  const actions = (onCreate || onUpload) && (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      {onUpload && (
        <Button variant="outline" size="sm" onClick={onUpload}>
          <HugeiconsIcon icon={Upload04Icon} strokeWidth={2} data-icon="inline-start" />
          Upload skill
        </Button>
      )}
      {onCreate && (
        <Button size="sm" onClick={onCreate}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Create skill
        </Button>
      )}
    </div>
  )

  if (skills.length === 0) {
    return (
      <Empty className={cn('border', className)}>
        <EmptyHeader>
          <EmptyMedia variant="icon"><HugeiconsIcon icon={PuzzleIcon} strokeWidth={2} /></EmptyMedia>
          <EmptyTitle>No skills yet</EmptyTitle>
          <EmptyDescription>{emptyText}</EmptyDescription>
        </EmptyHeader>
        {actions && <EmptyContent>{actions}</EmptyContent>}
      </Empty>
    )
  }

  return (
    <div className={cn('@container grid min-w-0 gap-3', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SearchField value={query} onChange={setQuery} placeholder="Search skills" className="h-7 min-w-0 flex-1 basis-48" />
        {actionsIn === 'toolbar' && actions}
      </div>
      <div role="group" aria-label="Filter skills" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
        {FILTERS.map((f) => {
          const active = filter === f.value
          return (
            <Button
              key={f.value}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={active}
              onClick={() => setFilter(f.value)}
              className={cn('shrink-0 rounded-full', !active && 'text-muted-foreground')}
            >
              {f.value !== 'all' && f.value !== 'on' && (
                <HugeiconsIcon icon={SKILL_SOURCES[f.value].icon} strokeWidth={2} data-icon="inline-start" />
              )}
              {f.label}
              <span className="text-muted-foreground tabular-nums">{count(f.value)}</span>
            </Button>
          )
        })}
      </div>

      {shown.length > 0 ? (
        <ul aria-label="Skills" className="grid grid-cols-1 gap-2 @xl:grid-cols-2">
          {shown.map((s) => (
            <li key={s.id} className="grid min-w-0">
              <SkillCard
                skill={s}
                meta={metaOf?.(s)}
                onToggle={onToggle && ((on) => onToggle(s.id, on))}
                onView={onView && (() => onView(s.id))}
                onEdit={onEdit && (() => onEdit(s.id))}
                onDuplicate={onDuplicate && (() => onDuplicate(s.id))}
                onDownload={onDownload && (() => onDownload(s.id))}
                onDelete={onDelete && (() => onDelete(s.id))}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="border py-10">
          <EmptyHeader>
            <EmptyTitle>No skills match</EmptyTitle>
            <EmptyDescription>
              {q ? `Nothing ${filter === 'all' ? '' : `under ${FILTERS.find((f) => f.value === filter)?.label} `}matches “${query.trim()}”.` : `No skills under ${FILTERS.find((f) => f.value === filter)?.label} yet.`}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => { setQuery(''); setFilter('all') }}>
              Show all {plural(skills.length, 'skill')}
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
