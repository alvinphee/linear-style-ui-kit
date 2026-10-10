import { useId, useRef, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Attachment01Icon } from '@hugeicons/core-free-icons'
import { Markdown } from '@/blocks/markdown'
import { FileChip } from '@/components/file-chip'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { SkillFile } from './skill-card'

// The dialog that creates or edits a skill: its name, the description the
// assistant reads to decide when to load it, the instructions in Markdown
// (Write, or Preview as the assistant's replies render it), and the files
// packaged with it. The form starts afresh from `skill` each time it opens;
// Save hands back the draft and the caller stores it and closes the dialog.

// What the editor edits: a skill without its id, source or switch.
export type SkillDraft = {
  name: string
  description: string
  instructions: string
  files: SkillFile[]
}

export const EMPTY_SKILL_DRAFT: SkillDraft = { name: '', description: '', instructions: '', files: [] }

export const SKILL_NAME_MAX = 64
export const SKILL_DESCRIPTION_MAX = 300

const PLACEHOLDER = `# Meeting minutes

1. Start with the date, who attended and who sent apologies.
2. List each decision on its own line, with the owner.
3. End with actions as a table: action, owner, due date.`

export function SkillEditor({ open, onOpenChange, skill, editing = false, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // What the form starts with. Left out: an empty skill.
  skill?: Partial<SkillDraft>
  // True when `skill` is an existing skill being changed; false when it is
  // the start of a new one (blank, a duplicate, an upload).
  editing?: boolean
  onSave: (draft: SkillDraft) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {open && <EditorForm skill={skill} editing={editing} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function EditorForm({ skill, editing, onSave }: { skill?: Partial<SkillDraft>; editing: boolean; onSave: (draft: SkillDraft) => void }) {
  const [draft, setDraft] = useState<SkillDraft>({ ...EMPTY_SKILL_DRAFT, ...skill, files: skill?.files ?? [] })
  const [tried, setTried] = useState(false)
  const [tab, setTab] = useState('write')
  const fileInput = useRef<HTMLInputElement>(null)
  const id = useId()
  const set = <K extends keyof SkillDraft>(key: K, value: SkillDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const nameError = !draft.name.trim() ? 'Give the skill a name.' : undefined
  const descriptionError = !draft.description.trim() ? 'Say when to use it, so the assistant knows when to load it.' : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (nameError) return document.getElementById(`${id}-name`)?.focus()
    if (descriptionError) return document.getElementById(`${id}-description`)?.focus()
    onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() })
  }

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    const added = Array.from(list, (f) => ({ name: f.name, size: f.size }))
    // A file with the same name replaces the old one, as a folder would.
    setDraft((d) => ({ ...d, files: [...d.files.filter((f) => !added.some((a) => a.name === f.name)), ...added] }))
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b p-4 pr-10">
        <DialogTitle>{editing ? 'Edit skill' : 'Create skill'}</DialogTitle>
        <DialogDescription>
          A skill is a set of instructions the assistant loads when a task calls for it. It is saved as a SKILL.md.
        </DialogDescription>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4">
        <Field data-invalid={tried && !!nameError}>
          <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
          <Input
            id={`${id}-name`}
            value={draft.name}
            maxLength={SKILL_NAME_MAX}
            placeholder="Meeting minutes"
            autoFocus={!editing}
            aria-invalid={tried && !!nameError}
            onChange={(e) => set('name', e.target.value)}
          />
          {tried && nameError && <FieldError>{nameError}</FieldError>}
        </Field>

        <Field data-invalid={tried && !!descriptionError}>
          <FieldLabel htmlFor={`${id}-description`}>When to use it</FieldLabel>
          <FieldDescription id={`${id}-description-hint`}>
            The assistant reads only this line to decide whether to load the skill, so say what it does and when it applies.
          </FieldDescription>
          <Textarea
            id={`${id}-description`}
            value={draft.description}
            maxLength={SKILL_DESCRIPTION_MAX}
            rows={2}
            placeholder="Writes up meeting minutes from notes or a transcript. Use when someone asks for minutes, a meeting summary or a list of actions."
            aria-invalid={tried && !!descriptionError}
            aria-describedby={`${id}-description-hint`}
            className="min-h-14"
            onChange={(e) => set('description', e.target.value)}
          />
          <div className="flex items-start justify-between gap-3">
            {tried && descriptionError ? <FieldError>{descriptionError}</FieldError> : <span />}
            <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
              {draft.description.length} / {SKILL_DESCRIPTION_MAX}
            </span>
          </div>
        </Field>

        <Field>
          <Tabs value={tab} onValueChange={setTab} className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel htmlFor={`${id}-instructions`} onClick={() => setTab('write')}>Instructions</FieldLabel>
              <TabsList className="h-7">
                <TabsTrigger value="write" className="px-2.5">Write</TabsTrigger>
                <TabsTrigger value="preview" className="px-2.5">Preview</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="write" forceMount className="data-[state=inactive]:hidden">
              <Textarea
                id={`${id}-instructions`}
                value={draft.instructions}
                placeholder={PLACEHOLDER}
                spellCheck
                className="max-h-80 min-h-48 font-mono text-xs/relaxed md:text-xs/relaxed"
                onChange={(e) => set('instructions', e.target.value)}
              />
            </TabsContent>
            <TabsContent value="preview" className="bg-card max-h-80 min-h-48 overflow-y-auto rounded-md border px-3 py-2">
              {draft.instructions.trim()
                ? <Markdown text={draft.instructions} />
                : <p className="text-muted-foreground text-xs">Nothing to preview yet.</p>}
            </TabsContent>
          </Tabs>
          <FieldDescription className="text-[11px]">Markdown: headings, lists, tables and code blocks.</FieldDescription>
        </Field>

        <Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FieldLabel htmlFor={`${id}-files`}>Files</FieldLabel>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} data-icon="inline-start" />
              Add files
            </Button>
          </div>
          <input
            ref={fileInput}
            id={`${id}-files`}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          {draft.files.length > 0 ? (
            <ul aria-label="Files" className="flex min-w-0 flex-wrap gap-1.5">
              {draft.files.map((f) => (
                <li key={f.name} className="min-w-0 max-w-full">
                  <FileChip name={f.name} size={f.size} onRemove={() => set('files', draft.files.filter((x) => x.name !== f.name))} />
                </li>
              ))}
            </ul>
          ) : (
            <FieldDescription className="text-[11px]">Templates, examples or reference files the instructions mention.</FieldDescription>
          )}
        </Field>
      </div>

      <DialogFooter className="border-t p-3">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">{editing ? 'Save changes' : 'Create skill'}</Button>
      </DialogFooter>
    </form>
  )
}
