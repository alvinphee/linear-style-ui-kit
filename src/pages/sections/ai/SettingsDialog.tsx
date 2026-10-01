import { useEffect, useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon, ComputerIcon, Database01Icon, Download01Icon, Logout01Icon, Moon02Icon, RefreshIcon,
  Settings01Icon, Sun03Icon, Tick02Icon, UserAccountIcon, UserEdit01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme } from '@/lib/theme'
import { Initials } from '../StatusSection'
import { useActions } from './context'
import { MODELS, USER } from './data'
import type { ModelId } from './types'

// ChatGPT- and Claude-style settings: sections down the left, changes apply
// as you make them. Theme and default model are real; the rest is kept in
// this browser so the mockup feels lived in.

type Prefs = {
  language: string
  enterToSend: boolean
  showThinking: boolean
  nickname: string
  role: string
  instructions: string
  memory: boolean
  improve: boolean
}

const KEY = 'linear-kit:ai-settings:v1'
const DEFAULTS: Prefs = {
  language: 'English',
  enterToSend: true,
  showThinking: true,
  nickname: USER.first,
  role: '',
  instructions: '',
  memory: true,
  improve: false,
}
const MAX_INSTRUCTIONS = 1500

function loadPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

type Tab = 'general' | 'personal' | 'models' | 'data' | 'account'
const TABS: { id: Tab; label: string; icon: IconSvgElement }[] = [
  { id: 'general', label: 'General', icon: Settings01Icon },
  { id: 'personal', label: 'Personalisation', icon: UserEdit01Icon },
  { id: 'models', label: 'Models', icon: AiBrain01Icon },
  { id: 'data', label: 'Data controls', icon: Database01Icon },
  { id: 'account', label: 'Account', icon: UserAccountIcon },
]

export function SettingsDialog({ open, onOpenChange, model, onExportAll }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: ModelId
  onExportAll: () => void
}) {
  const [tab, setTab] = useState<Tab>('general')
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => setPrefs((p) => ({ ...p, [key]: value }))

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      // Private windows can refuse storage; the settings still work for this visit.
    }
  }, [prefs])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[min(34rem,calc(100svh-2rem))] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="border-b px-4 py-3">
          <DialogTitle className="text-sm">Settings</DialogTitle>
          <DialogDescription className="sr-only">Appearance, personalisation, models, data and account.</DialogDescription>
        </div>
        <div className="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-cols-[11rem_minmax(0,1fr)] sm:grid-rows-1">
          <nav aria-label="Settings sections" className="flex gap-0.5 overflow-x-auto border-b p-2 [scrollbar-width:none] sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => setTab(t.id)}
                className="text-muted-foreground hover:bg-accent/60 hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground focus-visible:ring-ring/40 flex h-7 shrink-0 items-center gap-2 rounded-md px-2 text-xs whitespace-nowrap outline-none focus-visible:ring-2"
              >
                <HugeiconsIcon icon={t.icon} strokeWidth={2} className="size-3.5" />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="min-h-0 overflow-y-auto px-4 py-1">
            {tab === 'general' && <General prefs={prefs} set={set} />}
            {tab === 'personal' && <Personal prefs={prefs} set={set} />}
            {tab === 'models' && <Models model={model} prefs={prefs} set={set} />}
            {tab === 'data' && <Data prefs={prefs} set={set} onExportAll={onExportAll} onReset={() => setPrefs(DEFAULTS)} />}
            {tab === 'account' && <Account />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type Section = { prefs: Prefs; set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void }

// One setting: the label and hint on the left, the control on the right.
function Row({ label, hint, htmlFor, children, stacked }: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
  stacked?: boolean
}) {
  return (
    <div className={cn('flex gap-x-4 gap-y-2 border-b py-3 last:border-b-0', stacked ? 'flex-col' : 'flex-wrap items-center justify-between')}>
      <div className="grid min-w-0 gap-0.5">
        <Label htmlFor={htmlFor} className="font-normal">{label}</Label>
        {hint && <p className="text-muted-foreground text-[11px] leading-4">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function General({ prefs, set }: Section) {
  const id = useId()
  const { theme, setTheme } = useTheme()
  return (
    <>
      <Row label="Theme" hint="System follows your device.">
        <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={theme} onValueChange={(v) => v && setTheme(v as typeof theme)} aria-label="Theme">
          <ToggleGroupItem value="light" aria-label="Light"><HugeiconsIcon icon={Sun03Icon} strokeWidth={2} /></ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark"><HugeiconsIcon icon={Moon02Icon} strokeWidth={2} /></ToggleGroupItem>
          <ToggleGroupItem value="system" aria-label="System"><HugeiconsIcon icon={ComputerIcon} strokeWidth={2} /></ToggleGroupItem>
        </ToggleGroup>
      </Row>
      <Row label="Language" htmlFor={`${id}-lang`}>
        <Select value={prefs.language} onValueChange={(v) => set('language', v)}>
          <SelectTrigger id={`${id}-lang`} size="sm" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent position="popper" align="end">
            {['English', 'Bahasa Melayu', '中文 (简体)', 'தமிழ்'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </Row>
      <Row label="Send with Enter" hint="When off, Enter adds a new line and Ctrl+Enter sends." htmlFor={`${id}-enter`}>
        <Switch id={`${id}-enter`} checked={prefs.enterToSend} onCheckedChange={(on) => set('enterToSend', on)} />
      </Row>
      <Row label="Show thinking" hint="Open the steps the assistant took under each reply." htmlFor={`${id}-thinking`}>
        <Switch id={`${id}-thinking`} checked={prefs.showThinking} onCheckedChange={(on) => set('showThinking', on)} />
      </Row>
    </>
  )
}

function Personal({ prefs, set }: Section) {
  const id = useId()
  const left = MAX_INSTRUCTIONS - prefs.instructions.length
  return (
    <>
      <Row label="What should the assistant call you?" htmlFor={`${id}-nick`} stacked>
        <Input id={`${id}-nick`} value={prefs.nickname} onChange={(e) => set('nickname', e.target.value)} placeholder="Alex" />
      </Row>
      <Row label="What do you do?" htmlFor={`${id}-role`} stacked>
        <Input id={`${id}-role`} value={prefs.role} onChange={(e) => set('role', e.target.value)} placeholder="Operations lead at a logistics firm" />
      </Row>
      <Row label="Custom instructions" hint="How replies should sound, and anything to always keep in mind." htmlFor={`${id}-ins`} stacked>
        <Textarea
          id={`${id}-ins`}
          rows={4}
          value={prefs.instructions}
          maxLength={MAX_INSTRUCTIONS}
          onChange={(e) => set('instructions', e.target.value)}
          placeholder="Keep answers short. Use tables for numbers. British spelling."
          aria-describedby={`${id}-ins-count`}
        />
        <span id={`${id}-ins-count`} className={cn('text-muted-foreground justify-self-end text-[11px] tabular-nums', left < 100 && 'text-destructive')}>
          {left.toLocaleString()} characters left
        </span>
      </Row>
      <Row label="Memory" hint="Let the assistant remember useful details across chats." htmlFor={`${id}-mem`}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast('Manage memory', { description: 'Demo only. See "AI in the product" for the memory panel.' })}>Manage</Button>
          <Switch id={`${id}-mem`} checked={prefs.memory} onCheckedChange={(on) => set('memory', on)} />
        </div>
      </Row>
    </>
  )
}

function Models({ model }: Section & { model: ModelId }) {
  const actions = useActions()
  return (
    <Row label="Default model" hint="New chats start with this one. You can switch in any chat." stacked>
      <div role="radiogroup" aria-label="Default model" className="grid gap-1.5">
        {MODELS.map((m) => {
          const on = m.id === model
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => actions.setDefaultModel(m.id)}
              className="hover:bg-accent/50 aria-checked:border-primary/50 aria-checked:bg-accent/40 focus-visible:ring-ring/40 flex items-start gap-2.5 rounded-lg border p-2.5 text-left outline-none focus-visible:ring-2"
            >
              <HugeiconsIcon icon={m.icon} strokeWidth={2} className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="text-xs font-medium">{m.name}</span>
                <span className="text-muted-foreground text-[11px] leading-4">{m.description}</span>
              </span>
              {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-primary size-4 shrink-0" />}
            </button>
          )
        })}
      </div>
    </Row>
  )
}

function Data({ prefs, set, onExportAll, onReset }: Section & { onExportAll: () => void; onReset: () => void }) {
  const id = useId()
  const actions = useActions()
  return (
    <>
      <Row label="Improve the model for everyone" hint="Allow your chats to be used for training. Off by default." htmlFor={`${id}-improve`}>
        <Switch id={`${id}-improve`} checked={prefs.improve} onCheckedChange={(on) => set('improve', on)} />
      </Row>
      <Row label="Export data" hint="All your chats as one Markdown file.">
        <Button variant="outline" size="sm" onClick={onExportAll}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" /> Export
        </Button>
      </Row>
      <Row label="Reset demo chats" hint="Bring back the sample chats and projects. Your own chats are removed.">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" /> Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset the demo chats?</AlertDialogTitle>
              <AlertDialogDescription>Chats you started are deleted and the sample chats come back. This can't be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={actions.resetDemo}>Reset chats</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Row>
      <Row label="Reset settings" hint="Put every setting here back to its default.">
        <Button variant="ghost" size="sm" onClick={() => {
          onReset()
          toast('Settings reset')
        }}>
          Reset settings
        </Button>
      </Row>
    </>
  )
}

function Account() {
  return (
    <>
      <div className="flex items-center gap-3 border-b py-3">
        <Initials name={USER.name} className="size-10" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-xs font-medium">{USER.name}</span>
          <span className="text-muted-foreground truncate text-[11px]">{USER.email}</span>
        </div>
        <Badge variant="secondary">{USER.plan}</Badge>
      </div>
      <Row label="Plan" hint="Monthly credits reset on the 1st.">
        <Button variant="outline" size="sm" onClick={() => toast('Manage plan', { description: 'Demo only.' })}>Manage plan</Button>
      </Row>
      <Row label="Sign out on this device">
        <Button variant="outline" size="sm" onClick={() => toast('Signed out', { description: 'Demo only. You are still signed in.' })}>
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} data-icon="inline-start" /> Sign out
        </Button>
      </Row>
      <Row label="Sign out on all devices" hint="Ends every other session, including the mobile app.">
        <Button variant="destructive" size="sm" onClick={() => toast('Signed out everywhere else', { description: 'Demo only.' })}>Sign out all</Button>
      </Row>
    </>
  )
}
