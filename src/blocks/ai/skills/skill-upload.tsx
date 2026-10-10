import { useId, useRef, useState, type DragEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CloudUploadIcon, FileZipIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { FileChip } from '@/components/file-chip'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { humanise, parseSkillMd } from './skill-card'
import type { SkillDraft } from './skill-editor'

// The dialog that brings in a skill someone already has: a .zip with a
// SKILL.md at its root, or a single .md file. Drop it on the zone or pick
// it. A .md is read in the browser, so its front matter fills the name and
// description and its body the instructions; a .zip is only named here (no
// unpacking), and travels with the skill as its file. Continue hands the
// caller a draft to open in the skill editor, so it can be checked first.

const ACCEPT = ['.zip', '.md']
const MAX_BYTES = 10 * 1024 * 1024

export function SkillUploadDialog({ open, onOpenChange, onUpload }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (draft: SkillDraft, file: { name: string; size: number }) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <UploadForm onUpload={onUpload} />}
      </DialogContent>
    </Dialog>
  )
}

function UploadForm({ onUpload }: { onUpload: (draft: SkillDraft, file: { name: string; size: number }) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()

  const choose = (f: File | undefined) => {
    if (!f) return
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!ACCEPT.includes(ext)) {
      setFile(null)
      return setError(`${f.name} is not a .zip or .md file.`)
    }
    if (f.size > MAX_BYTES) {
      setFile(null)
      return setError(`${f.name} is larger than 10 MB.`)
    }
    setError(null)
    setFile(f)
  }

  const drop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    choose(e.dataTransfer.files[0])
  }

  const upload = async () => {
    if (!file) return
    setBusy(true)
    const meta = { name: file.name, size: file.size }
    try {
      if (file.name.toLowerCase().endsWith('.md')) {
        const parsed = parseSkillMd(await file.text())
        const fromName = /^skill\.md$/i.test(file.name) ? '' : humanise(file.name)
        onUpload({
          name: parsed.name ?? fromName,
          description: parsed.description ?? '',
          instructions: parsed.instructions,
          files: [],
        }, meta)
      } else {
        onUpload({ name: humanise(file.name), description: '', instructions: '', files: [meta] }, meta)
      }
    } catch {
      setError(`${file.name} could not be read.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload skill</DialogTitle>
        <DialogDescription>A .zip with a SKILL.md at its root, or a single .md file. You can check it before it is saved.</DialogDescription>
      </DialogHeader>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        data-over={over || undefined}
        className={cn(
          'flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
          'data-over:border-ring data-over:bg-accent/40',
          error && 'border-destructive/60',
        )}
      >
        <span className="bg-muted grid size-9 place-items-center rounded-lg">
          <HugeiconsIcon icon={over ? FileZipIcon : CloudUploadIcon} strokeWidth={2} className="size-4.5" />
        </span>
        <p className="text-xs">
          Drop a file here, or{' '}
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="text-brand focus-visible:ring-ring/40 rounded font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2"
          >
            choose one
          </button>
        </p>
        <p id={`${id}-hint`} className="text-muted-foreground text-[11px]">.zip or .md, up to 10 MB</p>
        <input
          ref={input}
          type="file"
          accept={ACCEPT.join(',')}
          aria-describedby={`${id}-hint`}
          aria-label="Skill file"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            choose(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <div aria-live="polite" className="grid min-w-0 gap-2 empty:hidden">
        {file && <FileChip name={file.name} size={file.size} onRemove={() => setFile(null)} className="w-fit" />}
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button disabled={!file || busy} onClick={upload}>Continue</Button>
      </DialogFooter>
    </>
  )
}
