import { useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Upload04Icon } from '@hugeicons/core-free-icons'
import { SkillDetailSheet } from '@/blocks/ai/skills/skill-detail'
import { SkillEditor, type SkillDraft } from '@/blocks/ai/skills/skill-editor'
import { SkillList } from '@/blocks/ai/skills/skill-list'
import { SkillUploadDialog } from '@/blocks/ai/skills/skill-upload'
import { toSkillMd, type Skill } from '@/blocks/ai/skills/skill-card'
import { SettingsHeader } from '@/blocks/settings-page'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Button } from '@/components/ui/button'
import { downloadText } from '@/lib/download'
import { formatShortDate } from '@/lib/format'
import { plural, slug } from '@/lib/text'
import { now } from '../data'
import { useSkills, type StoredSkill } from './skills-data'

// Settings › Skills: every skill the assistant can load, with the editor,
// the detail sheet and the upload dialog wired to the skills kept in this
// browser.

// The editor: closed, a new skill (maybe from a duplicate or an upload), or
// one of yours being changed.
type EditorState = { open: false } | { open: true; id: string | null; draft?: Partial<SkillDraft> }

const metaOf = (s: Skill) =>
  s.files?.length ? plural(s.files.length, 'file') : s.updatedAt ? `Updated ${formatShortDate(s.updatedAt)}` : undefined

export function SkillsTab() {
  const { stored, skills, setStored } = useSkills()
  const [editor, setEditor] = useState<EditorState>({ open: false })
  const [viewId, setViewId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const find = (id: string | null) => skills.find((s) => s.id === id) ?? null
  const viewed = find(viewId)
  const toDelete = find(deleteId)

  const patch = (id: string, change: Partial<StoredSkill>) =>
    setStored((list) => list.map((s) => (s.id === id ? { ...s, ...change } : s)))

  const toggle = (id: string, enabled: boolean) => {
    patch(id, { enabled })
    const name = find(id)?.name
    toast(`${name} turned ${enabled ? 'on' : 'off'}`)
  }

  const view = (id: string) => {
    setViewId(id)
    setViewOpen(true)
  }

  // Takes the skill itself, so a toast's Edit works on a copy made a moment ago.
  const editSkill = (s: Pick<StoredSkill, 'id' | 'name' | 'description' | 'instructions' | 'files'>) => {
    setViewOpen(false)
    setEditor({ open: true, id: s.id, draft: { name: s.name, description: s.description, instructions: s.instructions, files: s.files ?? [] } })
  }
  const edit = (id: string) => {
    const s = find(id)
    if (s) editSkill(s)
  }

  const duplicate = (id: string) => {
    const s = stored.find((x) => x.id === id)
    if (!s) return
    const copy: StoredSkill = {
      ...s,
      id: `sk-${Date.now().toString(36)}`,
      name: `${s.name} (copy)`,
      source: 'yours',
      author: undefined,
      usedIn: undefined,
      updatedAt: now(),
    }
    setStored((list) => {
      const at = list.findIndex((x) => x.id === id)
      return [...list.slice(0, at + 1), copy, ...list.slice(at + 1)]
    })
    toast(`Duplicated as ${copy.name}`, { action: { label: 'Edit', onClick: () => editSkill(copy) } })
  }

  const download = (id: string) => {
    const s = find(id)
    if (!s) return
    downloadText(`${slug(s.name, { fallback: 'skill' })}.md`, toSkillMd(s), 'text/markdown')
    toast(`Downloaded ${s.name}`, { description: s.files?.length ? 'The SKILL.md only; its files stay here.' : undefined })
  }

  const remove = () => {
    const at = stored.findIndex((s) => s.id === deleteId)
    const gone = stored[at]
    if (!gone) return
    setStored((list) => list.filter((s) => s.id !== gone.id))
    if (viewId === gone.id) setViewOpen(false)
    toast(`Deleted ${gone.name}`, {
      action: {
        label: 'Undo',
        onClick: () => setStored((list) => [...list.slice(0, at), gone, ...list.slice(at)]),
      },
    })
  }

  const save = (draft: SkillDraft) => {
    if (!editor.open) return
    if (editor.id) {
      patch(editor.id, { ...draft, updatedAt: now() })
      toast(`Saved ${draft.name}`)
    } else {
      const skill: StoredSkill = { id: `sk-${Date.now().toString(36)}`, ...draft, source: 'yours', enabled: true, icon: 'puzzle', updatedAt: now() }
      setStored((list) => [skill, ...list])
      toast(`Created ${draft.name}`, { description: 'It is on, so the assistant can load it in any chat.', action: { label: 'View', onClick: () => view(skill.id) } })
    }
    setEditor({ open: false })
  }

  const create = () => setEditor({ open: true, id: null })
  const upload = () => setUploadOpen(true)

  return (
    <div className="grid min-w-0 gap-5">
      <SettingsHeader
        title="Skills"
        description="Instructions and files the assistant loads when a task calls for them. Turn on the ones you want; it reads each description to decide when."
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={upload}>
              <HugeiconsIcon icon={Upload04Icon} strokeWidth={2} data-icon="inline-start" />
              Upload
            </Button>
            <Button size="sm" onClick={create}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create skill
            </Button>
          </div>
        }
      />

      <SkillList
        skills={skills}
        actionsIn="empty"
        metaOf={metaOf}
        onToggle={toggle}
        onView={view}
        onEdit={edit}
        onDuplicate={duplicate}
        onDownload={download}
        onDelete={(id) => {
          setDeleteId(id)
          setDeleteOpen(true)
        }}
        onCreate={create}
        onUpload={upload}
      />

      <SkillDetailSheet
        skill={viewed}
        open={viewOpen && !!viewed}
        onOpenChange={setViewOpen}
        onToggle={viewed ? (on) => toggle(viewed.id, on) : undefined}
        onEdit={viewed ? () => edit(viewed.id) : undefined}
        onDownload={viewed ? () => download(viewed.id) : undefined}
      />

      <SkillEditor
        open={editor.open}
        onOpenChange={(open) => !open && setEditor({ open: false })}
        skill={editor.open ? editor.draft : undefined}
        editing={editor.open && !!editor.id}
        onSave={save}
      />

      <SkillUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(draft, file) => {
          setUploadOpen(false)
          setEditor({ open: true, id: null, draft })
          toast(`Read ${file.name}`, { description: 'Check the details, then create the skill.' })
        }}
      />

      <DeleteConfirm
        open={deleteOpen && !!toDelete}
        onOpenChange={setDeleteOpen}
        title={`Delete ${toDelete?.name ?? 'skill'}?`}
        description="The assistant stops using it in every chat and project. You can undo this for a moment afterwards."
        size="sm"
        onConfirm={remove}
      />
    </div>
  )
}
