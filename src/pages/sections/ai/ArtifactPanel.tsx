import { useMemo, type Ref } from 'react'
import { ArtifactPanel as ArtifactPanelBlock, parseCsv } from '@/blocks/ai/artifact-panel'
import { CodeBlock } from '@/blocks/markdown'
import { formatWhen } from './data'
import { artifactFileName } from './helpers'
import { Markdown, MdTable } from './markdown'
import { KIND_ICONS, KIND_LABELS } from './parts'
import type { Artifact } from './types'

// The workspace's artifact panel: the artifact-panel block showing one of the
// workspace's artifacts, previewed with the chat's own Markdown, table and
// code views.

const heading = (key: string) => {
  const text = key.replace(/_/g, ' ')
  return text[0]?.toUpperCase() + text.slice(1)
}

export function ArtifactPanel({ artifact, version, onVersion, onClose, headingRef }: {
  artifact: Artifact
  version: number
  onVersion: (version: number) => void
  onClose: () => void
  // Lets the workspace move focus here when someone opens the panel.
  headingRef?: Ref<HTMLHeadingElement>
}) {
  const index = Math.min(Math.max(version, 1), artifact.versions.length) - 1
  const content = artifact.versions[index].content
  const table = useMemo(() => (artifact.kind === 'table' ? parseCsv(content) : null), [artifact.kind, content])
  const file = artifactFileName(artifact)

  return (
    <ArtifactPanelBlock
      title={artifact.title}
      icon={KIND_ICONS[artifact.kind]}
      kind={KIND_LABELS[artifact.kind]}
      source={content}
      versions={artifact.versions.map((v) => ({ when: formatWhen(v.at) }))}
      version={index + 1}
      onVersionChange={onVersion}
      fileName={file.name}
      fileType={file.type}
      onClose={onClose}
      headingRef={headingRef}
      preview={(
        <>
          {artifact.kind === 'document' && <Markdown text={content} />}
          {artifact.kind === 'table' && table && table.length > 0 && (
            <MdTable header={table[0].map(heading)} rows={table.slice(1)} />
          )}
          {artifact.kind === 'code' && <CodeBlock lang={artifact.language} code={content} />}
        </>
      )}
    />
  )
}
