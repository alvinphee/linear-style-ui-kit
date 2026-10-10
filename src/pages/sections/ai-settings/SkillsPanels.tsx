import { useState } from 'react'
import { toast } from 'sonner'
import { MemoryManager, type Memory } from '@/blocks/ai/memory/memory-manager'
import { SkillCard, type Skill } from '@/blocks/ai/skills/skill-card'
import { SkillDetailSheet } from '@/blocks/ai/skills/skill-detail'
import { SkillEditor, type SkillDraft } from '@/blocks/ai/skills/skill-editor'
import { SkillList } from '@/blocks/ai/skills/skill-list'
import { SkillUploadDialog } from '@/blocks/ai/skills/skill-upload'
import { Button } from '@/components/ui/button'
import { Row, Panel } from '../shared'
import { now } from '../ai/data'
import { SAMPLE_MEMORIES } from '../ai/settings/memory-data'
import { SAMPLE_SKILLS, toSkill } from '../ai/settings/skills-data'

// The skills and memory blocks on their own, on local state (nothing here
// touches the AI chat app's saved skills or memories): the skill card for
// each source and both switch positions, the skill list live, the editor
// and upload dialogs, and the memory manager live, switched off and empty.

const demo = () => toast('Demo only', { description: 'Nothing is saved here.' })

const sample = (id: string, change: Partial<Skill> = {}) => ({ ...toSkill(SAMPLE_SKILLS.find((s) => s.id === id)!), ...change })

export function SkillsPanels() {
  const base = now()
  const [skills, setSkills] = useState<Skill[]>(() => SAMPLE_SKILLS.map(toSkill))
  const [viewId, setViewId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editor, setEditor] = useState<{ open: boolean; editing: boolean; draft?: Partial<SkillDraft> }>({ open: false, editing: false })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [memories, setMemories] = useState<Memory[]>(SAMPLE_MEMORIES)

  const viewed = skills.find((s) => s.id === viewId) ?? null
  const toggle = (id: string, enabled: boolean) => setSkills((list) => list.map((s) => (s.id === id ? { ...s, enabled } : s)))
  const editDraft = (s: Skill) => ({ name: s.name, description: s.description, instructions: s.instructions, files: s.files ?? [] })

  return (
    <>
      <Panel title="Skill card" note="Each source, on and off">
        <div className="grid grid-cols-1 gap-2">
          <SkillCard skill={sample('sk-slides')} onToggle={demo} onView={demo} onDuplicate={demo} onDownload={demo} />
          <SkillCard skill={sample('sk-minutes')} meta="1 file" onToggle={demo} onView={demo} onEdit={demo} onDuplicate={demo} onDownload={demo} onDelete={demo} />
          <SkillCard skill={sample('sk-invoices')} meta="Updated 9 Sep" onToggle={demo} onView={demo} onDuplicate={demo} onDownload={demo} />
          <SkillCard skill={sample('sk-shipping')} onToggle={demo} onView={demo} onEdit={demo} onDelete={demo} />
        </div>
      </Panel>

      <Panel title="Dialogs" note="Create, edit, upload, view">
        <div className="grid gap-3">
          <p className="text-muted-foreground text-xs">
            The editor checks the name and description before saving; Preview renders the instructions as replies do.
            Upload reads a .md in the browser and opens the editor with what it found.
          </p>
          <Row>
            <Button size="sm" onClick={() => setEditor({ open: true, editing: false })}>Create skill</Button>
            <Button size="sm" variant="outline" onClick={() => setEditor({ open: true, editing: true, draft: editDraft(sample('sk-minutes')) })}>
              Edit a skill
            </Button>
            <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>Upload skill</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setViewId('sk-brand')
                setViewOpen(true)
              }}
            >
              View a skill
            </Button>
          </Row>
        </div>
      </Panel>

      <Panel title="Skill list" note="Search, filter, switch, menu" wide>
        <SkillList
          skills={skills}
          onToggle={toggle}
          onView={(id) => {
            setViewId(id)
            setViewOpen(true)
          }}
          onEdit={(id) => {
            const s = skills.find((x) => x.id === id)
            if (s) setEditor({ open: true, editing: true, draft: editDraft(s) })
          }}
          onDuplicate={demo}
          onDownload={demo}
          onDelete={(id) => setSkills((list) => list.filter((s) => s.id !== id))}
          onCreate={() => setEditor({ open: true, editing: false })}
          onUpload={() => setUploadOpen(true)}
        />
        {skills.length < SAMPLE_SKILLS.length && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSkills(SAMPLE_SKILLS.map(toSkill))}>
            Bring the skills back
          </Button>
        )}
      </Panel>

      <Panel title="Skill list, empty" note="No skills yet">
        <SkillList skills={[]} onCreate={demo} onUpload={demo} />
      </Panel>

      <Panel title="Memory manager, empty" note="Nothing remembered yet">
        <MemoryManager memories={[]} now={base} />
      </Panel>

      <Panel title="Memory manager" note="Search, edit inline, delete, clear all" wide>
        <div className="grid gap-2">
          <MemoryManager
            memories={memories}
            now={base}
            onEdit={(id, text) => setMemories((list) => list.map((m) => (m.id === id ? { ...m, text, updatedAt: now() } : m)))}
            onDelete={(id) => {
              const at = memories.findIndex((m) => m.id === id)
              const gone = memories[at]
              setMemories((list) => list.filter((m) => m.id !== id))
              toast('Memory deleted', {
                action: { label: 'Undo', onClick: () => setMemories((list) => [...list.slice(0, at), gone, ...list.slice(at)]) },
              })
            }}
            onClearAll={() => setMemories([])}
            onOpenSource={(m) => toast(`Opens “${m.source}”`, { description: 'Demo only.' })}
          />
          {memories.length < SAMPLE_MEMORIES.length && (
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => setMemories(SAMPLE_MEMORIES)}>
              Bring the memories back
            </Button>
          )}
        </div>
      </Panel>

      <Panel title="Memory manager, memory off" note="Greyed, with a note; still editable" wide>
        <MemoryManager memories={SAMPLE_MEMORIES.slice(-4)} enabled={false} now={base} onEdit={demo} onDelete={demo} onClearAll={demo} />
      </Panel>

      <SkillDetailSheet
        skill={viewed}
        open={viewOpen && !!viewed}
        onOpenChange={setViewOpen}
        onToggle={viewed ? (on) => toggle(viewed.id, on) : undefined}
        onEdit={viewed ? () => {
          setViewOpen(false)
          setEditor({ open: true, editing: true, draft: editDraft(viewed) })
        } : undefined}
        onDownload={demo}
      />
      <SkillEditor
        open={editor.open}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        skill={editor.draft}
        editing={editor.editing}
        onSave={(draft) => {
          setEditor((e) => ({ ...e, open: false }))
          toast(`Saved ${draft.name}`, { description: 'Demo only.' })
        }}
      />
      <SkillUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(draft) => {
          setUploadOpen(false)
          setEditor({ open: true, editing: false, draft })
        }}
      />
    </>
  )
}
