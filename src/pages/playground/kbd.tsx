import { Fragment } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowTurnBackwardIcon, CommandIcon, InboxIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { MOD, Shortcut } from '@/components/shortcut'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Demos, Gallery, Playground, bool, imports, jsx, str, type Values, lit } from './Playground'

const KBD_JOINERS = ['none', 'plus', 'then'] as const

// --- Kbd -----------------------------------------------------------------

const JOINER_TEXT: Record<string, string> = { plus: '+', then: 'then' }

const splitKeys = (keys: string) => keys.split(/[\s+]+/).filter(Boolean)

function KeyCombo({ keys, joiner }: { keys: string[]; joiner: string }) {
  if (keys.length < 2) return <Kbd>{keys[0] ?? 'K'}</Kbd>
  const sep = JOINER_TEXT[joiner]
  return (
    <KbdGroup>
      {keys.map((key, i) => (
        <Fragment key={i}>
          {i > 0 && sep && <span className="text-muted-foreground text-[11px]">{sep}</span>}
          <Kbd>{key}</Kbd>
        </Fragment>
      ))}
    </KbdGroup>
  )
}

function kbdCode(v: Values) {
  const keys = splitKeys(str(v, 'keys'))
  if (keys.length < 2) return `${imports({ '@/components/ui/kbd': ['Kbd'] })}\n\n${jsx('Kbd', {}, keys[0] ?? 'K')}`
  const sep = JOINER_TEXT[str(v, 'joiner')]
  const kids = keys.flatMap((key, i) => [
    i > 0 && sep ? `<span className="text-muted-foreground text-[11px]">${sep}</span>` : '',
    `<Kbd>${key}</Kbd>`,
  ])
  return `${imports({ '@/components/ui/kbd': ['Kbd', 'KbdGroup'] })}\n\n${jsx('KbdGroup', {}, kids)}`
}

// The demo rows go nowhere.
const noop = () => {}

// The Keys control as Shortcut takes them: "mod K" or "mod+K" → ['mod', 'K'].
const shortcutKeys = (v: Values) => {
  const keys = str(v, 'keys').split(/[\s+]+/).filter(Boolean)
  return keys.length ? keys : ['K']
}

function ShortcutDemos() {
  return (
    <>
      <Playground
        title="Shortcut"
        description="Keys split on spaces or +. With then, pressed one after another."
        controls={[
          { kind: 'text', name: 'keys', label: 'Keys', initial: 'mod K' },
          { kind: 'switch', name: 'then', label: 'One after another (then)', initial: false },
        ]}
        render={(v) => <Shortcut keys={shortcutKeys(v)} then={bool(v, 'then')} />}
        code={(v) => `${imports({ '@/components/shortcut': ['Shortcut'] })}\n\n${jsx('Shortcut', {
          keys: `{${lit(shortcutKeys(v))}}`,
          then: bool(v, 'then'),
        })}`}
      />

      <Gallery
        title="Shortcut keys"
        note={`mod reads ${MOD} here: ⌘ on a Mac, Ctrl elsewhere`}
        items={[
          { label: "['mod', 'K']", node: <Shortcut keys={['mod', 'K']} /> },
          { label: "['mod', 'J']", node: <Shortcut keys={['mod', 'J']} /> },
          { label: "['mod', 'enter']", node: <Shortcut keys={['mod', 'enter']} /> },
          { label: "['shift', '?']", node: <Shortcut keys={['shift', '?']} /> },
          { label: "['esc']", node: <Shortcut keys={['esc']} /> },
          { label: "['G', 'B'] then", node: <Shortcut keys={['G', 'B']} then /> },
          {
            label: 'then, in a tooltip',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={noop}>Board</Button>
                </TooltipTrigger>
                <TooltipContent>
                  Go to board
                  <Shortcut keys={['G', 'B']} then />
                </TooltipContent>
              </Tooltip>
            ),
          },
        ]}
      />
    </>
  )
}

export default function KbdDemos() {
  return (
    <Demos>
      <Playground
        title="Kbd"
        description="keys split on + or space"
        controls={[
          { kind: 'text', name: 'keys', label: 'Keys', initial: 'Ctrl+K' },
          { kind: 'select', name: 'joiner', label: 'Between keys', options: KBD_JOINERS, initial: 'none' },
        ]}
        render={(v) => <KeyCombo keys={splitKeys(str(v, 'keys'))} joiner={str(v, 'joiner')} />}
        code={kbdCode}
      />

      <Gallery
        title="Kbd in use"
        note="Hover or focus the inbox button for the tooltip"
        items={[
          { label: 'single key', node: <Kbd>C</Kbd> },
          {
            label: 'modifier icon',
            node: (
              <KbdGroup>
                <Kbd>
                  <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />
                  <span className="sr-only">Command</span>
                </Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            ),
          },
          {
            label: 'icon and text',
            node: (
              <Kbd>
                <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
                Enter
              </Kbd>
            ),
          },
          {
            label: 'sequence',
            node: (
              <KbdGroup>
                <Kbd>G</Kbd>
                <span className="text-muted-foreground text-[11px]">then</span>
                <Kbd>I</Kbd>
              </KbdGroup>
            ),
          },
          {
            label: 'in a button',
            node: (
              <Button variant="outline" aria-keyshortcuts="Control+K">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} data-icon="inline-start" />
                Search
                <Kbd className="ml-1">Ctrl K</Kbd>
              </Button>
            ),
          },
          {
            label: 'in a tooltip',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Inbox">
                    <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Go to inbox
                  <KbdGroup>
                    <Kbd>G</Kbd>
                    <Kbd>I</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
            ),
          },
        ]}
      />

      <ShortcutDemos />
    </Demos>
  )
}
