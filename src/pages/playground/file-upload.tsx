import { toast } from 'sonner'
import { FileChip } from '@/components/file-chip'
import { Demos, Gallery, Variants } from './Playground'

const demo = (label: string) => () => toast(label, { description: 'Demo only.' })

/* ---------- File chip ---------- */

const FILE_NAMES = ['report.pdf', 'sales.xlsx', 'notes.md', 'photo.png', 'app.tsx'] as const

const FILE_SIZES: Record<(typeof FILE_NAMES)[number], number> = {
  'report.pdf': 2_516_582,
  'sales.xlsx': 49_152,
  'notes.md': 820,
  'photo.png': 1_258_291,
  'app.tsx': 6_144,
}

function FileChipDemos() {
  return (
    <>
      <Variants
        title="File chip"
        note="name × removable · the icon follows the extension"
        rows={{ name: 'name', values: FILE_NAMES }}
        cols={{ name: 'removable', values: ['off', 'on'] as const }}
        render={(name, removable) => (
          <FileChip
            name={name}
            size={FILE_SIZES[name]}
            onRemove={removable === 'on' ? demo(`Removed ${name}`) : undefined}
          />
        )}
      />

      <Gallery
        title="File chip details"
        items={[
          { label: 'no size', node: <FileChip name="contract.docx" /> },
          { label: 'long name truncates', node: <FileChip name="q3-board-meeting-notes-final-v2.md" size={14_336} className="max-w-48" /> },
          { label: 'unknown type', node: <FileChip name="backup.bin" size={8_912_896} /> },
        ]}
      />
    </>
  )
}

export default function FileUploadDemos() {
  return (
    <Demos>
      <FileChipDemos />
    </Demos>
  )
}
