import { useId, useState, type FormEvent } from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from 'cn'
import { IconColourPicker, type ColourOption, type IconOption } from '@/components/icon-colour-picker'
import { IconMark } from '@/components/mark'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// The dialog that creates a project in an AI chat app, all on one page. A
// project template first (Blank, Research, Writing…), which sets the icon,
// colour and custom instructions; then the name, the description, the icon
// and colour, and the instructions to edit. A template chosen after the
// instructions were edited leaves them alone and offers to replace them.
// In edit mode the same form changes an existing project's details, with no
// templates. The form starts afresh each time it opens; Create hands back
// the draft, and the caller stores it and closes the dialog.

// A starting point for a new project. `icon` and `colour` are ids from the
// dialog's `icons` and `colours`; `examples` are a few lines of what the
// instructions ask for, shown on its card.
export type ProjectTemplate = {
  id: string
  name: string
  description: string
  icon: string
  colour: string
  instructions: string
  examples?: string[]
}

// What the dialog hands back. Icon and colour by id, so it can be saved as JSON.
export type ProjectDraft = {
  name: string
  description: string
  instructions: string
  icon: string
  colour: string
  // The template it started from, when created from one.
  templateId?: string
}

export function NewProjectDialog({
  open, onOpenChange, templates = [], icons, colours, onCreate, mode = 'create', initial, maxInstructions = 1000,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // The first is chosen to begin with, so put Blank first. Not shown in edit mode.
  templates?: ProjectTemplate[]
  icons: IconOption[]
  colours: ColourOption[]
  onCreate: (draft: ProjectDraft) => void
  mode?: 'create' | 'edit'
  // What the form starts with: the project, in edit mode.
  initial?: Partial<ProjectDraft>
  maxInstructions?: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {open && (
          <ProjectForm
            templates={mode === 'create' ? templates : []}
            icons={icons}
            colours={colours}
            onCreate={onCreate}
            mode={mode}
            initial={initial}
            maxInstructions={maxInstructions}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProjectForm({ templates, icons, colours, onCreate, mode, initial, maxInstructions }: {
  templates: ProjectTemplate[]
  icons: IconOption[]
  colours: ColourOption[]
  onCreate: (draft: ProjectDraft) => void
  mode: 'create' | 'edit'
  initial?: Partial<ProjectDraft>
  maxInstructions: number
}) {
  const id = useId()
  const first = templates.find((t) => t.id === initial?.templateId) ?? templates[0]
  const [draft, setDraft] = useState<ProjectDraft>(() => ({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    instructions: initial?.instructions ?? first?.instructions ?? '',
    icon: initial?.icon ?? first?.icon ?? icons[0]?.id ?? '',
    colour: initial?.colour ?? first?.colour ?? colours[0]?.id ?? '',
    templateId: first?.id,
  }))
  // What the person has changed by hand, so a template does not overwrite it.
  const [touched, setTouched] = useState({ look: false, instructions: false })
  const [tried, setTried] = useState(false)
  const set = (patch: Partial<ProjectDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const template = templates.find((t) => t.id === draft.templateId)
  const nameError = !draft.name.trim() ? 'Give the project a name.' : undefined
  const editing = mode === 'edit'
  const differs = !!template && touched.instructions && draft.instructions !== template.instructions

  const pick = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId)
    if (!t) return
    set({
      templateId,
      ...(touched.look ? {} : { icon: t.icon, colour: t.colour }),
      ...(touched.instructions ? {} : { instructions: t.instructions }),
    })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (nameError) return document.getElementById(`${id}-name`)?.focus()
    onCreate({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      instructions: draft.instructions.trim(),
      templateId: editing ? initial?.templateId : draft.templateId,
    })
  }

  const markFor = (t: ProjectTemplate) => {
    const icon = icons.find((i) => i.id === t.icon) ?? icons[0]
    const colour = colours.find((c) => c.id === t.colour)?.value ?? 'currentColor'
    return icon ? <IconMark icon={icon.icon} colour={colour} size="sm" /> : null
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="shrink-0 border-b px-4 py-3 pr-10">
        <DialogTitle>{editing ? 'Edit project details' : 'New project'}</DialogTitle>
        <DialogDescription>
          {editing
            ? 'Change the name, description, icon and custom instructions. Chats and files stay as they are.'
            : 'Start from a template or a blank project. You can change all of it later.'}
        </DialogDescription>
      </DialogHeader>

      <div className="@container min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-w-0 gap-5 p-4">
          {templates.length > 0 && (
            <section className="grid min-w-0 gap-2" aria-labelledby={`${id}-templates`}>
              <h3 id={`${id}-templates`} className="text-xs font-medium">Start from</h3>
              <RadioGroupPrimitive.Root
                aria-labelledby={`${id}-templates`}
                value={draft.templateId}
                onValueChange={pick}
                className="grid grid-cols-1 gap-2 @md:grid-cols-2 @xl:grid-cols-3"
              >
                {templates.map((t) => (
                  <RadioGroupPrimitive.Item
                    key={t.id}
                    value={t.id}
                    className={cn(
                      'grid min-w-0 content-start gap-1.5 rounded-lg border p-2.5 text-left outline-none transition-colors',
                      'hover:bg-accent/50 focus-visible:ring-ring/50 focus-visible:ring-2',
                      'data-[state=checked]:border-brand/60 data-[state=checked]:bg-accent/40',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {markFor(t)}
                      <span className="truncate text-xs font-medium">{t.name}</span>
                    </span>
                    <span className="text-muted-foreground line-clamp-2 text-[11px] leading-snug">{t.description}</span>
                    {!!t.examples?.length && (
                      <ul className="text-muted-foreground grid gap-0.5 text-[11px]">
                        {t.examples.slice(0, 3).map((line) => (
                          <li key={line} className="flex min-w-0 gap-1.5">
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{line}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </RadioGroupPrimitive.Item>
                ))}
              </RadioGroupPrimitive.Root>
            </section>
          )}

          <Field data-invalid={tried && !!nameError}>
            <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
            <div className="flex min-w-0 items-center gap-2">
              <IconColourPicker
                icons={icons}
                colours={colours}
                icon={draft.icon}
                colour={draft.colour}
                label="Project icon"
                onChange={(change) => {
                  setTouched((t) => ({ ...t, look: true }))
                  set(change)
                }}
              />
              <Input
                id={`${id}-name`}
                autoFocus
                value={draft.name}
                maxLength={80}
                placeholder="For example: Product launch"
                aria-invalid={tried && !!nameError}
                aria-describedby={tried && nameError ? `${id}-name-error` : undefined}
                onChange={(e) => set({ name: e.target.value })}
                className="min-w-0 flex-1"
              />
            </div>
            {tried && nameError && <FieldError id={`${id}-name-error`}>{nameError}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor={`${id}-description`}>
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </FieldLabel>
            <Input
              id={`${id}-description`}
              value={draft.description}
              maxLength={200}
              placeholder="What the project is for"
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>

          <Field>
            <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1">
              <FieldLabel htmlFor={`${id}-instructions`}>Custom instructions</FieldLabel>
              {differs && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="h-auto px-0"
                  onClick={() => {
                    set({ instructions: template!.instructions })
                    setTouched((t) => ({ ...t, instructions: false }))
                  }}
                >
                  Use the {template!.name} template’s instructions
                </Button>
              )}
            </div>
            <Textarea
              id={`${id}-instructions`}
              aria-describedby={`${id}-instructions-hint`}
              value={draft.instructions}
              maxLength={maxInstructions}
              placeholder="For example: keep answers short, and use tables for numbers."
              onChange={(e) => {
                setTouched((t) => ({ ...t, instructions: true }))
                set({ instructions: e.target.value })
              }}
              className="max-h-64 min-h-28 text-[13px]"
            />
            <div className="flex min-w-0 justify-between gap-3">
              <FieldDescription id={`${id}-instructions-hint`}>
                The assistant follows these in every chat in this project.
              </FieldDescription>
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                {draft.instructions.length} / {maxInstructions}
              </span>
            </div>
          </Field>
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t px-4 py-3">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">{editing ? 'Save changes' : 'Create project'}</Button>
      </DialogFooter>
    </form>
  )
}
