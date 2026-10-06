import { HugeiconsIcon } from '@hugeicons/react'
import { Attachment01Icon, Clock01Icon, Message01Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { Panel } from '@/components/panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const CARD_SIZES = ['default', 'sm'] as const

const CARD_LAYOUTS = ['plain', 'divided'] as const

const PANEL_TRAILING = ['note', 'action', 'none'] as const

type CardSize = (typeof CARD_SIZES)[number]

type PanelTrailing = (typeof PANEL_TRAILING)[number]

const orDefault = (value: string) => (value === 'default' ? undefined : value)

const demoOnly = (title: string) => toast(title, { description: 'Demo only. Nothing was changed.' })

// --- Card ----------------------------------------------------------------

const CARD_BODY = 'Seats are billed monthly. Removing a member frees their seat straight away.'

function DemoCard({ size = 'default', header = true, action = true, footer = true, divided = false, className }: {
  size?: CardSize
  header?: boolean
  action?: boolean
  footer?: boolean
  divided?: boolean
  className?: string
}) {
  return (
    <Card size={size} className={className}>
      {header && (
        <CardHeader className={divided ? 'border-b' : undefined}>
          <CardTitle>Seats</CardTitle>
          <CardDescription>12 of 20 seats in use</CardDescription>
          {action && (
            <CardAction>
              <Button variant="ghost" size="icon-sm" aria-label="More options" onClick={() => demoOnly('More options')}>
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </Button>
            </CardAction>
          )}
        </CardHeader>
      )}
      <CardContent>
        <p className="text-muted-foreground">{CARD_BODY}</p>
      </CardContent>
      {footer && (
        <CardFooter className={cn('gap-2', divided && 'border-t')}>
          <Button size="sm" onClick={() => demoOnly('Invite people')}>Invite people</Button>
          <Button size="sm" variant="ghost" onClick={() => demoOnly('Manage seats')}>Manage</Button>
        </CardFooter>
      )}
    </Card>
  )
}

function cardCode(v: Values) {
  const header = bool(v, 'header')
  const action = header && bool(v, 'action')
  const footer = bool(v, 'footer')
  const divided = bool(v, 'divided')
  const head = imports({
    '@hugeicons/react': action ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': action ? ['MoreHorizontalIcon'] : [],
    '@/components/ui/button': action || footer ? ['Button'] : [],
    '@/components/ui/card': [
      'Card', action ? 'CardAction' : '', 'CardContent', header ? 'CardDescription' : '', footer ? 'CardFooter' : '',
      header ? 'CardHeader' : '', header ? 'CardTitle' : '',
    ].filter(Boolean),
  })
  const body = jsx('Card', { size: orDefault(str(v, 'size')) }, [
    header
      ? jsx('CardHeader', { className: divided ? 'border-b' : undefined }, [
        jsx('CardTitle', {}, 'Seats'),
        jsx('CardDescription', {}, '12 of 20 seats in use'),
        action
          ? jsx('CardAction', {}, jsx('Button', { variant: 'ghost', size: 'icon-sm', 'aria-label': 'More options' }, '<HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />'))
          : '',
      ])
      : '',
    jsx('CardContent', {}, `<p className="text-muted-foreground">${CARD_BODY}</p>`),
    footer
      ? jsx('CardFooter', { className: divided ? 'gap-2 border-t' : 'gap-2' }, [
        jsx('Button', { size: 'sm' }, 'Invite people'),
        jsx('Button', { size: 'sm', variant: 'ghost' }, 'Manage'),
      ])
      : '',
  ])
  return `${head}\n\n${body}`
}

// --- Panel ---------------------------------------------------------------

const PANEL_NOTE = 'Last 7 days'

// -my-0.5 keeps the title bar as tall as it is with a note.
function PanelAction() {
  return <Button variant="ghost" size="xs" className="-my-0.5" onClick={() => demoOnly('View all')}>View all</Button>
}

function panelCode(v: Values) {
  const title = str(v, 'title')
  const trailing = title ? (str(v, 'trailing') as PanelTrailing) : 'none'
  const head = imports({
    '@/components/panel': ['Panel'],
    '@/components/ui/button': trailing === 'action' ? ['Button'] : [],
  })
  const body = jsx('Panel', {
    title: title || undefined,
    note: trailing === 'note' ? PANEL_NOTE : undefined,
    action: trailing === 'action' ? '{<Button variant="ghost" size="xs" className="-my-0.5">View all</Button>}' : undefined,
  }, `<p className="text-muted-foreground">${str(v, 'body') || 'Body'}</p>`)
  return `${head}\n\n${body}`
}

export default function CardsDemos() {
  return (
    <Demos>
      <Playground
        title="Card"
        description="size, header, action and footer"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: CARD_SIZES, initial: 'default' },
          { kind: 'switch', name: 'header', label: 'Header', initial: true },
          { kind: 'switch', name: 'action', label: 'Header action', initial: true },
          { kind: 'switch', name: 'footer', label: 'Footer', initial: true },
          { kind: 'switch', name: 'divided', label: 'Divided header and footer', initial: false },
        ]}
        render={(v) => (
          <DemoCard
            size={str(v, 'size') as CardSize}
            header={bool(v, 'header')}
            action={bool(v, 'action')}
            footer={bool(v, 'footer')}
            divided={bool(v, 'divided')}
            className="w-full max-w-sm"
          />
        )}
        code={cardCode}
      />

      <Variants
        title="Card sizes"
        note="size × layout, sm tightens the spacing"
        rows={{ name: 'size', values: CARD_SIZES }}
        cols={{ name: 'layout', values: CARD_LAYOUTS }}
        render={(size, layout) => <DemoCard size={size} divided={layout === 'divided'} action={false} className="w-60" />}
      />

      <Gallery
        title="Card in use"
        items={[
          {
            label: 'stat',
            node: (
              <Card size="sm" className="w-48">
                <CardHeader>
                  <CardDescription>Issues closed</CardDescription>
                  <CardTitle className="text-xl tabular-nums">128</CardTitle>
                  <CardAction><Badge variant="secondary">+12%</Badge></CardAction>
                </CardHeader>
              </Card>
            ),
          },
          {
            label: 'setting',
            node: (
              <Card size="sm" className="w-64">
                <CardHeader>
                  <CardTitle>Weekly digest</CardTitle>
                  <CardDescription>A summary of your team's work every Monday.</CardDescription>
                  <CardAction><Switch defaultChecked aria-label="Weekly digest" /></CardAction>
                </CardHeader>
              </Card>
            ),
          },
          {
            label: 'activity',
            node: (
              <Card size="sm" className="w-64">
                <CardHeader className="border-b">
                  <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {[
                    { icon: Message01Icon, text: '4 new comments', time: '2m' },
                    { icon: Attachment01Icon, text: '2 files added', time: '1h' },
                    { icon: Clock01Icon, text: 'Due date moved', time: '3h' },
                  ].map((row) => (
                    <div key={row.text} className="flex items-center gap-2">
                      <HugeiconsIcon icon={row.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                      <span className="flex-1 truncate">{row.text}</span>
                      <span className="text-muted-foreground text-[11px] tabular-nums">{row.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ),
          },
        ]}
      />

      <Playground
        title="Panel"
        description="the kit's titled card. Clear the title for a plain box."
        controls={[
          { kind: 'text', name: 'title', label: 'Title', initial: 'Recent activity' },
          { kind: 'select', name: 'trailing', label: 'Right of the title', options: PANEL_TRAILING, initial: 'note' },
          { kind: 'text', name: 'body', label: 'Body', initial: '4 new comments and 2 files added since Monday.' },
        ]}
        render={(v) => {
          const trailing = str(v, 'trailing') as PanelTrailing
          return (
            <Panel
              title={str(v, 'title') || undefined}
              note={trailing === 'note' ? PANEL_NOTE : undefined}
              action={trailing === 'action' ? <PanelAction /> : undefined}
              className="w-full max-w-sm"
            >
              <p className="text-muted-foreground">{str(v, 'body') || 'Body'}</p>
            </Panel>
          )
        }}
        code={panelCode}
      />
    </Demos>
  )
}
