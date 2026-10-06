import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Copy01Icon, MoreHorizontalIcon, RefreshIcon, Share08Icon, ThumbsDownIcon, ThumbsUpIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AiLabel } from '@/components/ai-label'
import { FileChip } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { IncognitoToggle } from '@/components/incognito-toggle'
import {
  ActivityLine, Elapsed, PulseDot, ShimmerText, StreamCaret, Thinking, TypingDots, type ThinkingIndicator,
} from '@/components/thinking-indicator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { CodeBlock, Demos, Gallery, Playground, Variants, bool, component, imports, jsx, lit, str, unless } from './Playground'

// The small AI components: the AI label, the thinking indicator and its
// working signs, icon actions and file chips. The blocks they make up are on
// the AI in the product page. All content is made up.

/* ---------- Preview helpers ---------- */

// The time a preview mounted, for timers that count from "now".
const useSince = () => useState(Date.now)[0]

const demo = (label: string) => () => toast(label, { description: 'Demo only.' })

/* ---------- AI label ---------- */

function AiLabelDemos() {
  return (
    <Gallery
      title="AI label"
      note="Put it on anything a model wrote or proposed"
      items={[
        { label: 'default', node: <AiLabel /> },
        { label: 'AI suggests', node: <AiLabel>AI suggests</AiLabel> },
        { label: 'Understood as', node: <AiLabel>Understood as</AiLabel> },
        {
          label: 'beside a heading',
          node: <span className="flex items-center gap-1.5 text-xs font-medium">Summary <AiLabel /></span>,
        },
        {
          label: 'on a suggestion',
          node: (
            <span className="bg-card flex h-7 items-center gap-2 rounded-md border px-2 text-xs">
              <AiLabel>AI suggests</AiLabel>
              <span className="text-muted-foreground">Priority</span>
              <span className="font-medium">High</span>
            </span>
          ),
        },
      ]}
    />
  )
}

/* ---------- Thinking indicator ---------- */

const INDICATORS = ['sparkle', 'dot', 'spinner', 'dots', 'none'] as const satisfies readonly ThinkingIndicator[]

function ThinkingPreview({ indicator, label, elapsed }: { indicator: ThinkingIndicator; label?: string; elapsed: boolean }) {
  const since = useSince()
  return <Thinking indicator={indicator} label={label} since={elapsed ? since : undefined} />
}

function ActivityPreview() {
  const since = useSince()
  return <ActivityLine text="Reading INV-2026-0409" since={since} className="max-w-60" />
}

function ElapsedPreview() {
  const since = useSince()
  return <span className="text-muted-foreground text-xs"><Elapsed since={since} /></span>
}

function ThinkingDemos() {
  return (
    <>
      <Playground
        title="Thinking indicator"
        description="One status line while the AI works"
        controls={[
          { kind: 'select', name: 'indicator', label: 'Indicator', options: INDICATORS, initial: 'sparkle' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Searching invoices…' },
          { kind: 'switch', name: 'elapsed', label: 'Show elapsed', initial: true },
        ]}
        render={(v) => (
          <ThinkingPreview
            // A fresh timer each time Show elapsed is turned on.
            key={String(bool(v, 'elapsed'))}
            indicator={str(v, 'indicator') as ThinkingIndicator}
            label={str(v, 'label') || undefined}
            elapsed={bool(v, 'elapsed')}
          />
        )}
        code={(v) => {
          const elapsed = bool(v, 'elapsed')
          const label = str(v, 'label')
          const head = imports({
            react: elapsed ? ['useState'] : [],
            '@/components/thinking-indicator': ['Thinking'],
          })
          const body = jsx('Thinking', {
            indicator: unless(str(v, 'indicator'), 'sparkle'),
            label: label === 'Thinking…' ? undefined : label,
            since: elapsed ? '{startedAt}' : undefined,
          })
          return `${head}\n\n${component('WorkingStatus', elapsed ? ['const [startedAt] = useState(Date.now)'] : [], body)}`
        }}
      />

      <Gallery
        title="Working signs"
        note="The pieces Thinking is made of, from @/components/thinking-indicator"
        items={[
          { label: 'ShimmerText', node: <ShimmerText className="text-xs font-medium">Searching customer invoices…</ShimmerText> },
          { label: 'PulseDot', node: <span className="flex h-5 items-center"><PulseDot /></span> },
          { label: 'TypingDots', node: <TypingDots /> },
          { label: 'StreamCaret line', node: <p className="text-[13px]">The overdue total is<StreamCaret /></p> },
          { label: 'StreamCaret block', node: <p className="text-xs">Suggested reply<StreamCaret variant="block" /></p> },
          { label: 'ActivityLine', node: <ActivityPreview /> },
          { label: 'Elapsed', node: <ElapsedPreview /> },
        ]}
      />
    </>
  )
}

/* ---------- Icon action ---------- */

const ACTIONS = ['copy', 'regenerate', 'thumbs up', 'thumbs down', 'share'] as const
type ActionName = (typeof ACTIONS)[number]

const ACTION_ICONS: Record<ActionName, { icon: IconSvgElement; name: string; label: string }> = {
  copy: { icon: Copy01Icon, name: 'Copy01Icon', label: 'Copy' },
  regenerate: { icon: RefreshIcon, name: 'RefreshIcon', label: 'Regenerate' },
  'thumbs up': { icon: ThumbsUpIcon, name: 'ThumbsUpIcon', label: 'Good reply' },
  'thumbs down': { icon: ThumbsDownIcon, name: 'ThumbsDownIcon', label: 'Bad reply' },
  share: { icon: Share08Icon, name: 'Share08Icon', label: 'Share' },
}

// Keys for the tooltip, written as Shortcut takes them: "mod" is ⌘ or Ctrl.
const ACTION_SHORTCUTS = {
  none: undefined,
  'mod C': ['mod', 'C'],
  'mod shift R': ['mod', 'shift', 'R'],
  R: ['R'],
} satisfies Record<string, string[] | undefined>

type ActionShortcut = keyof typeof ACTION_SHORTCUTS
const ACTION_SHORTCUT_NAMES = Object.keys(ACTION_SHORTCUTS) as ActionShortcut[]

// An IconAction as a menu's trigger: it passes the trigger's props and ref on.
function MoreActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconAction label="More actions" icon={MoreHorizontalIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={demo('Shared')}>
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={demo('Regenerating')}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          Regenerate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function IconActionDemos() {
  return (
    <>
      <Playground
        title="Icon action"
        description="Hover for the tooltip, which is also its name"
        controls={[
          { kind: 'select', name: 'icon', label: 'Icon', options: ACTIONS, initial: 'copy' },
          { kind: 'text', name: 'label', label: 'Label (blank: the icon’s)', initial: '' },
          { kind: 'select', name: 'shortcut', label: 'Shortcut', options: ACTION_SHORTCUT_NAMES, initial: 'none' },
          { kind: 'switch', name: 'pressed', label: 'Pressed', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => {
          const action = ACTION_ICONS[str(v, 'icon') as ActionName]
          const label = str(v, 'label') || action.label
          return (
            <IconAction
              label={label}
              icon={action.icon}
              shortcut={ACTION_SHORTCUTS[str(v, 'shortcut') as ActionShortcut]}
              pressed={bool(v, 'pressed') || undefined}
              disabled={bool(v, 'disabled')}
              onClick={demo(label)}
            />
          )
        }}
        code={(v) => {
          const action = ACTION_ICONS[str(v, 'icon') as ActionName]
          const shortcut = ACTION_SHORTCUTS[str(v, 'shortcut') as ActionShortcut]
          const head = imports({
            '@hugeicons/core-free-icons': [action.name],
            '@/components/icon-action': ['IconAction'],
          })
          const body = jsx('IconAction', {
            label: str(v, 'label') || action.label,
            icon: `{${action.name}}`,
            shortcut: shortcut && `{${lit(shortcut)}}`,
            onClick: '{handleClick}',
            pressed: bool(v, 'pressed'),
            disabled: bool(v, 'disabled'),
          })
          return `${head}\n\n${body}`
        }}
      />

      <Gallery
        title="Icon action states"
        note="Pass icon, or children for anything else"
        items={[
          { label: 'rest', node: <IconAction label="Copy" icon={Copy01Icon} onClick={demo('Copy')} /> },
          { label: 'pressed', node: <IconAction label="Good reply" icon={ThumbsUpIcon} pressed onClick={demo('Good reply')} /> },
          { label: 'disabled', node: <IconAction label="Regenerate" icon={RefreshIcon} disabled onClick={demo('Regenerate')} /> },
          { label: 'children', node: <IconAction label="Working" onClick={demo('Working')}><Spinner /></IconAction> },
          {
            label: 'shortcut in the tooltip',
            node: <IconAction label="Regenerate" icon={RefreshIcon} shortcut={['mod', 'shift', 'R']} onClick={demo('Regenerate')} />,
          },
          { label: 'as a menu trigger', node: <MoreActionsMenu /> },
          {
            label: 'a reply bar',
            node: (
              <div className="flex gap-0.5">
                <IconAction label="Copy" icon={Copy01Icon} onClick={demo('Copy')} />
                <IconAction label="Regenerate" icon={RefreshIcon} onClick={demo('Regenerate')} />
                <IconAction label="Good reply" icon={ThumbsUpIcon} onClick={demo('Good reply')} />
                <IconAction label="Bad reply" icon={ThumbsDownIcon} onClick={demo('Bad reply')} />
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

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

/* ---------- Incognito toggle ---------- */

function IncognitoPreview({ initial, label }: { initial: boolean; label?: string }) {
  const [on, setOn] = useState(initial)
  return <IncognitoToggle pressed={on} onPressedChange={setOn} label={label} />
}

function IncognitoDemos() {
  return (
    <Gallery
      title="Incognito toggle"
      note="IncognitoToggle: a chat that is not kept in the history (a temporary chat). Top right of the chat"
      items={[
        { label: 'off', node: <IncognitoPreview initial={false} /> },
        { label: 'on', node: <IncognitoPreview initial /> },
        { label: 'icon only (label="")', node: <IncognitoPreview initial={false} label="" /> },
        {
          label: 'code',
          node: (
            <CodeBlock
              code={"import { IncognitoToggle } from '@/components/incognito-toggle'\n\n<IncognitoToggle pressed={incognito} onPressedChange={setIncognito} />"}
              className="w-[min(30rem,80vw)]"
            />
          ),
        },
      ]}
    />
  )
}

export default function AiComponentsDemos() {
  return (
    <Demos>
      <AiLabelDemos />
      <ThinkingDemos />
      <IconActionDemos />
      <FileChipDemos />
      <IncognitoDemos />
    </Demos>
  )
}
