import { useEffect, useId, useRef, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { ConnectorMark } from '@/blocks/ai/connectors/connector-card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'

// The first-run welcome of an AI chat app (onboarding): a few short steps
// in a modal, with progress dots, Back and Next, and Skip at any point.
//   about       "What should I call you?" and what you do (chips)
//   style       how replies should sound: the response styles as cards
//   connectors  apps to connect, each with a Connect switch (only recorded)
//   starter     "Try one of these": a starter prompt for the first chat
// Finish returns every answer; nothing is saved here. A step with nothing
// to show (no connectors passed in, say) is left out. Escape or a click
// outside counts as Skip.

export type OnboardingStep = 'about' | 'style' | 'connectors' | 'starter'

export type OnboardingStyle = { id: string; label: string; description: string; example?: string; icon?: IconSvgElement }

export type OnboardingConnector = {
  id: string
  name: string
  description: string
  icon?: IconSvgElement
  // A CSS colour from theme tokens, such as var(--chart-2).
  colour?: string
  // Already connected: shown as such, not offered again.
  connected?: boolean
}

export type OnboardingStarter = { title: string; prompt: string; hint?: string; icon?: IconSvgElement }

export type OnboardingAnswers = {
  name: string
  // One of `roles`, or '' for none.
  role: string
  // A style id.
  style: string
  // Connectors switched on in the welcome, by id (not ones already connected).
  connectors: string[]
  // The chosen starter's prompt.
  starter?: string
}

const ALL_STEPS: OnboardingStep[] = ['about', 'style', 'connectors', 'starter']

const COPY: Record<OnboardingStep, { title: string; description: string }> = {
  about: {
    title: 'Welcome. What should I call you?',
    description: 'So replies sound like they’re meant for you. You can change this later in Settings.',
  },
  style: {
    title: 'How should replies sound?',
    description: 'Pick a response style. You can still ask for something different in any chat.',
  },
  connectors: {
    title: 'Connect your apps',
    description: 'Let the assistant look things up in the tools you already use. Nothing connects until you finish.',
  },
  starter: {
    title: 'Try one of these',
    description: 'Pick a prompt to start your first chat, or finish and write your own.',
  },
}

export function OnboardingDialog({
  open, onFinish, onSkip, steps = ALL_STEPS, roles = [], styles = [], connectors = [], starters = [], initial,
}: {
  open: boolean
  onFinish: (answers: OnboardingAnswers) => void
  // Closing without finishing: the Skip button, Escape or a click outside.
  onSkip: () => void
  // Which steps, in order.
  steps?: OnboardingStep[]
  // What you do, as chips: "Designer", "Founder"…
  roles?: string[]
  styles?: OnboardingStyle[]
  connectors?: OnboardingConnector[]
  starters?: OnboardingStarter[]
  // Answers to start from, such as the name already on the account.
  initial?: Partial<OnboardingAnswers>
}) {
  const id = useId()
  const fresh = (): OnboardingAnswers => ({
    name: initial?.name ?? '',
    role: initial?.role ?? '',
    style: initial?.style ?? styles[0]?.id ?? '',
    connectors: initial?.connectors ?? [],
    starter: initial?.starter,
  })

  const shown = steps.filter((s) =>
    s === 'style' ? styles.length > 0 : s === 'connectors' ? connectors.length > 0 : s === 'starter' ? starters.length > 0 : true)

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(fresh)
  const [wasOpen, setWasOpen] = useState(open)
  // Each time it opens, it starts again from the first step.
  if (wasOpen !== open) {
    setWasOpen(open)
    if (open) {
      setIndex(0)
      setAnswers(fresh())
    }
  }

  const step = shown[Math.min(index, shown.length - 1)]
  const last = index >= shown.length - 1
  const patch = (p: Partial<OnboardingAnswers>) => setAnswers((a) => ({ ...a, ...p }))

  // A new step moves focus to its title, so a screen reader reads it out.
  const titleRef = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)
  useEffect(() => {
    if (!moved.current) return
    titleRef.current?.focus()
  }, [index])

  const go = (to: number) => {
    moved.current = true
    setIndex(to)
  }
  const next = () => (last ? onFinish({ ...answers, name: answers.name.trim() }) : go(index + 1))

  if (!step) return null
  const copy = COPY[step]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSkip()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90svh,42rem)] flex-col gap-0 p-0 sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          if (step !== 'about') return
          e.preventDefault()
          document.getElementById(`${id}-name`)?.focus()
        }}
      >
        <DialogHeader className="gap-3 p-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div aria-hidden className="flex items-center gap-1">
                {shown.map((s, i) => (
                  <span
                    key={s}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === index ? 'bg-brand w-4' : i < index ? 'bg-foreground/40 w-1.5' : 'bg-muted-foreground/25 w-1.5',
                    )}
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-[11px] tabular-nums">
                Step {index + 1} of {shown.length}
              </span>
            </div>
            <Button variant="ghost" size="xs" onClick={onSkip} className="text-muted-foreground -mr-2">
              Skip
            </Button>
          </div>
          <DialogTitle ref={titleRef} tabIndex={-1} className="outline-none">{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 pb-5">
          {step === 'about' && (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-name`}>Your name</Label>
                <Input
                  id={`${id}-name`}
                  value={answers.name}
                  maxLength={40}
                  autoComplete="given-name"
                  placeholder="A first name or a nickname"
                  onChange={(e) => patch({ name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      next()
                    }
                  }}
                />
              </div>
              {roles.length > 0 && (
                <div className="grid gap-1.5">
                  <span id={`${id}-roles`} className="text-xs font-medium">What do you do?</span>
                  <div role="group" aria-labelledby={`${id}-roles`} className="flex min-w-0 flex-wrap gap-1.5">
                    {roles.map((r) => {
                      const on = answers.role === r
                      return (
                        <Button
                          key={r}
                          variant={on ? 'secondary' : 'outline'}
                          size="xs"
                          aria-pressed={on}
                          className={cn('rounded-full', on && 'ring-brand/40 ring-1')}
                          onClick={() => patch({ role: on ? '' : r })}
                        >
                          {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />}
                          {r}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'style' && (
            <RadioGroup
              value={answers.style}
              onValueChange={(v) => patch({ style: v })}
              aria-label="Response style"
              className="grid-cols-[minmax(0,1fr)] gap-2"
            >
              {styles.map((s) => (
                <FieldLabel key={s.id} htmlFor={`${id}-style-${s.id}`} className="min-w-0">
                  <Field orientation="horizontal" className="items-start">
                    {s.icon && <HugeiconsIcon icon={s.icon} strokeWidth={2} className="text-muted-foreground mt-0.5 size-4 shrink-0" />}
                    <FieldContent className="min-w-0">
                      <FieldTitle>{s.label}</FieldTitle>
                      <FieldDescription className="text-[11px] leading-4">{s.description}</FieldDescription>
                      {s.example && (
                        <span className="bg-muted text-muted-foreground mt-1 block truncate rounded px-1.5 py-1 text-[11px] italic">
                          “{s.example}”
                        </span>
                      )}
                    </FieldContent>
                    <RadioGroupItem value={s.id} id={`${id}-style-${s.id}`} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          )}

          {step === 'connectors' && (
            <div className="grid gap-2">
              <ul className="divide-y rounded-lg border">
                {connectors.map((c) => {
                  const on = c.connected || answers.connectors.includes(c.id)
                  return (
                    <li key={c.id} className="flex min-w-0 items-center gap-3 px-3 py-2.5">
                      <ConnectorMark connector={c} size="sm" />
                      <label htmlFor={`${id}-c-${c.id}`} className="grid min-w-0 flex-1 gap-0.5">
                        <span className="truncate text-xs font-medium">{c.name}</span>
                        <span className="text-muted-foreground line-clamp-2 text-[11px] leading-4">{c.description}</span>
                      </label>
                      {c.connected ? (
                        <span className="text-status-done flex shrink-0 items-center gap-1 text-[11px]">
                          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5" />
                          Connected
                        </span>
                      ) : (
                        <Switch
                          id={`${id}-c-${c.id}`}
                          checked={on}
                          aria-label={`Connect ${c.name}`}
                          onCheckedChange={(checked) => patch({
                            connectors: checked
                              ? [...answers.connectors, c.id]
                              : answers.connectors.filter((x) => x !== c.id),
                          })}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
              <p className="text-muted-foreground text-[11px]">More apps, and what each may do, are in Settings › Connectors.</p>
            </div>
          )}

          {step === 'starter' && (
            <div role="group" aria-label="Starter prompts" className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
              {starters.map((s) => {
                const on = answers.starter === s.prompt
                return (
                  <button
                    key={s.prompt}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch({ starter: on ? undefined : s.prompt })}
                    className={cn(
                      'hover:bg-accent focus-visible:ring-ring/50 flex min-w-0 items-start gap-2.5 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-[3px]',
                      on && 'border-brand/50 bg-brand/5 hover:bg-brand/10',
                    )}
                  >
                    {s.icon && (
                      <HugeiconsIcon icon={s.icon} strokeWidth={2} className={cn('mt-0.5 size-4 shrink-0', on ? 'text-brand' : 'text-muted-foreground')} />
                    )}
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="text-xs font-medium">{s.title}</span>
                      {s.hint && <span className="text-muted-foreground text-[11px] leading-4">{s.hint}</span>}
                    </span>
                    {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-brand mt-0.5 size-3.5 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t px-5 py-3 sm:justify-between">
          {index > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => go(index - 1)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
              Back
            </Button>
          ) : <span />}
          <Button size="sm" onClick={next}>
            {last ? (answers.starter ? 'Start chatting' : 'Finish') : 'Next'}
            {!last && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
