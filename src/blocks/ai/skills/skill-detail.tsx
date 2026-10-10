import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, Folder01Icon, PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { Markdown } from '@/blocks/markdown'
import { FileChip } from '@/components/file-chip'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { formatShortDate } from '@/lib/format'
import { slug } from '@/lib/text'
import { SKILL_SOURCES, SkillMark, SkillSourceBadge, canEditSkill, type Skill } from './skill-card'

// One skill in a panel from the right: its mark, name and source, the
// on/off switch, then its SKILL.md as the assistant gets it (the front
// matter, then the instructions rendered), the files packaged with it and
// where it is turned on. Edit shows for your own skills; Download saves it.

export function SkillDetailSheet({ skill, open, onOpenChange, onToggle, onEdit, onDownload }: {
  // The skill shown. Kept by the caller while the sheet slides closed.
  skill: Skill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggle?: (enabled: boolean) => void
  onEdit?: () => void
  onDownload?: () => void
}) {
  const edit = skill && canEditSkill(skill) ? onEdit : undefined
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:w-[calc(100%-2.5rem)] data-[side=right]:sm:max-w-lg">
        {!skill ? (
          <SheetHeader className="sr-only">
            <SheetTitle>Skill</SheetTitle>
            <SheetDescription>No skill chosen.</SheetDescription>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader className="gap-3 border-b p-4 pr-12">
              <div className="flex min-w-0 items-start gap-3">
                <SkillMark skill={skill} size="lg" />
                <div className="grid min-w-0 gap-1">
                  <SheetTitle className="truncate">{skill.name}</SheetTitle>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <SkillSourceBadge source={skill.source} />
                    {skill.author && <span>{skill.author}</span>}
                    {skill.updatedAt && <span>Updated {formatShortDate(skill.updatedAt, { year: true })}</span>}
                  </div>
                </div>
              </div>
              <SheetDescription>{skill.description}</SheetDescription>
              {onToggle && (
                <label className="bg-card flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="grid gap-0.5">
                    <span className="text-xs font-medium">{skill.enabled ? 'On' : 'Off'}</span>
                    <span className="text-muted-foreground text-[11px]">
                      {skill.enabled ? 'The assistant can load it in any chat.' : 'The assistant will not load it.'}
                    </span>
                  </span>
                  <Switch checked={skill.enabled} onCheckedChange={onToggle} aria-label={`Use ${skill.name}`} />
                </label>
              )}
            </SheetHeader>

            <div className="grid min-h-0 flex-1 content-start gap-5 overflow-y-auto p-4">
              <DetailSection title="SKILL.md">
                <div className="bg-card min-w-0 rounded-md border">
                  <pre className="text-muted-foreground overflow-x-auto border-b px-3 py-2 font-mono text-[11px] leading-relaxed">
                    {`---\nname: ${slug(skill.name, { fallback: 'skill' })}\ndescription: ${skill.description}\n---`}
                  </pre>
                  <div className="min-w-0 px-3 py-2">
                    {skill.instructions.trim()
                      ? <Markdown text={skill.instructions} />
                      : <p className="text-muted-foreground text-xs">No instructions yet.</p>}
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Files">
                {skill.files?.length ? (
                  <ul aria-label="Files" className="flex min-w-0 flex-wrap gap-1.5">
                    {skill.files.map((f) => <li key={f.name} className="min-w-0 max-w-full"><FileChip name={f.name} size={f.size} /></li>)}
                  </ul>
                ) : <p className="text-muted-foreground text-xs">Instructions only, no files.</p>}
              </DetailSection>

              <DetailSection title="Where it's used">
                <p className="text-muted-foreground text-xs">
                  {skill.enabled
                    ? `Every chat, when a task matches its description${skill.source === 'organisation' ? ', for everyone in your organisation who has it on' : ''}.`
                    : 'Nowhere while it is off.'}
                </p>
                {skill.usedIn && skill.usedIn.length > 0 && (
                  <ul aria-label="Also turned on in" className="grid gap-1">
                    {skill.usedIn.map((place) => (
                      <li key={place} className="flex min-w-0 items-center gap-2 text-xs">
                        <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                        <span className="truncate">{place}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailSection>
            </div>

            {!edit && skill.source !== 'yours' && (
              <p className="text-muted-foreground border-t px-4 py-2 text-[11px]">
                {skill.source === 'builtin'
                  ? `${SKILL_SOURCES.builtin.label} skills come with the assistant. Duplicate one to make your own version.`
                  : 'Your organisation manages this skill. Duplicate it to make your own version.'}
              </p>
            )}
            {(edit || onDownload) && (
              <SheetFooter className="mt-0 flex-row flex-wrap justify-end border-t p-3">
                {onDownload && (
                  <Button variant="outline" onClick={onDownload}>
                    <HugeiconsIcon icon={Download04Icon} strokeWidth={2} data-icon="inline-start" />
                    Download
                  </Button>
                )}
                {edit && (
                  <Button onClick={edit}>
                    <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
                    Edit
                  </Button>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-2">
      <h3 className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  )
}
