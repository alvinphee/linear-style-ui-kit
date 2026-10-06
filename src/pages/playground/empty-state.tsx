import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, CloudAlertIcon, FolderAddIcon, InboxCheckIcon, RefreshIcon, Search01Icon, SquareLock02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const EMPTY_MEDIA = ['icon', 'default', 'none'] as const

const EMPTY_MEDIA_VARIANTS = ['icon', 'default'] as const

const EMPTY_CONTENT = ['text only', 'with button'] as const

type EmptyMediaKind = (typeof EMPTY_MEDIA)[number]

const demoOnly = (title: string) => toast(title, { description: 'Demo only. Nothing was changed.' })

// --- Empty ---------------------------------------------------------------

function DemoEmpty({ media = 'icon', title, description, action = true, border = true, className }: {
  media?: EmptyMediaKind
  title?: string
  description?: string
  action?: boolean
  border?: boolean
  className?: string
}) {
  return (
    <Empty className={cn(border && 'border', className)}>
      <EmptyHeader>
        {media === 'icon' && (
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
          </EmptyMedia>
        )}
        {/* A large display icon keeps the default stroke; 2 is for small icons. */}
        {media === 'default' && (
          <EmptyMedia>
            <HugeiconsIcon icon={FolderAddIcon} className="text-muted-foreground size-8" />
          </EmptyMedia>
        )}
        {title && <EmptyTitle>{title}</EmptyTitle>}
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && (
        <EmptyContent>
          <Button onClick={() => toast.success('Project created', { description: 'Demo only. Nothing was saved.' })}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            New project
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

function emptyCode(v: Values) {
  const media = str(v, 'media')
  const title = str(v, 'title')
  const description = str(v, 'description')
  const action = bool(v, 'action')
  const icons = [media === 'none' ? '' : 'FolderAddIcon', action ? 'Add01Icon' : ''].filter(Boolean)
  const head = imports({
    '@hugeicons/react': icons.length ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': icons,
    '@/components/ui/button': action ? ['Button'] : [],
    '@/components/ui/empty': [
      'Empty', action ? 'EmptyContent' : '', description ? 'EmptyDescription' : '', 'EmptyHeader',
      media === 'none' ? '' : 'EmptyMedia', title ? 'EmptyTitle' : '',
    ].filter(Boolean),
  })
  const mediaTag = media === 'icon'
    ? jsx('EmptyMedia', { variant: 'icon' }, '<HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />')
    : media === 'default'
      ? jsx('EmptyMedia', {}, '<HugeiconsIcon icon={FolderAddIcon} className="text-muted-foreground size-8" />')
      : ''
  const body = jsx('Empty', { className: bool(v, 'border') ? 'border' : undefined }, [
    jsx('EmptyHeader', {}, [
      mediaTag,
      title ? jsx('EmptyTitle', {}, title) : '',
      description ? jsx('EmptyDescription', {}, description) : '',
    ]),
    action
      ? jsx('EmptyContent', {}, jsx('Button', {}, ['<HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />', 'New project']))
      : '',
  ])
  return `${head}\n\n${body}`
}

export default function EmptyStateDemos() {
  return (
    <Demos>
      <Playground
        title="Empty"
        description="media, text and an optional action"
        controls={[
          { kind: 'select', name: 'media', label: 'Media', options: EMPTY_MEDIA, initial: 'icon' },
          { kind: 'text', name: 'title', label: 'Title', initial: 'No projects yet' },
          { kind: 'text', name: 'description', label: 'Description', initial: 'Projects group related issues around one goal.' },
          { kind: 'switch', name: 'action', label: 'Action button', initial: true },
          { kind: 'switch', name: 'border', label: 'Dashed border', initial: true },
        ]}
        render={(v) => (
          <div className="bg-card w-full max-w-md rounded-xl">
            <DemoEmpty
              media={str(v, 'media') as EmptyMediaKind}
              title={str(v, 'title')}
              description={str(v, 'description')}
              action={bool(v, 'action')}
              border={bool(v, 'border')}
            />
          </div>
        )}
        code={emptyCode}
      />

      <Variants
        title="Empty layouts"
        note="EmptyMedia variant × content"
        rows={{ name: 'media', values: EMPTY_MEDIA_VARIANTS }}
        cols={{ name: 'content', values: EMPTY_CONTENT }}
        render={(media, content) => (
          <DemoEmpty
            media={media}
            title="No projects yet"
            description="Create one to get started."
            action={content === 'with button'}
            className="w-56 p-4"
          />
        )}
      />

      <Gallery
        title="Empty states"
        note="Same parts, different jobs"
        items={[
          {
            label: 'no results',
            node: (
              <Empty className="w-64 border p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} /></EmptyMedia>
                  <EmptyTitle>No results</EmptyTitle>
                  <EmptyDescription>Nothing matches “billing”. Try another word or clear the filters.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={() => demoOnly('Filters cleared')}>Clear filters</Button>
                </EmptyContent>
              </Empty>
            ),
          },
          {
            label: 'all caught up',
            node: (
              <Empty className="w-64 border p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><HugeiconsIcon icon={InboxCheckIcon} strokeWidth={2} /></EmptyMedia>
                  <EmptyTitle>You're all caught up</EmptyTitle>
                  <EmptyDescription>New mentions and updates show up here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ),
          },
          {
            label: 'load failed',
            node: (
              <Empty className="w-64 border p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
                    <HugeiconsIcon icon={CloudAlertIcon} strokeWidth={2} />
                  </EmptyMedia>
                  <EmptyTitle>Couldn't load issues</EmptyTitle>
                  <EmptyDescription>Check your connection and try again.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={() => demoOnly('Retrying')}>
                    <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                    Retry
                  </Button>
                </EmptyContent>
              </Empty>
            ),
          },
          {
            label: 'no access',
            node: (
              <Empty className="w-64 border p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} /></EmptyMedia>
                  <EmptyTitle>You need access</EmptyTitle>
                  <EmptyDescription>Ask a workspace admin to add you to this team.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button size="sm" onClick={() => demoOnly('Access requested')}>Request access</Button>
                </EmptyContent>
              </Empty>
            ),
          },
        ]}
      />
    </Demos>
  )
}
